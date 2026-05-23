import { NextResponse } from "next/server";
import { prisma } from "../../lib/db";
import {
  envoyerEmail,
  templateRdvConfirmation,
} from "../../lib/email";
import {
  getCurrentUser,
  isErrorResponse,
  requireUser,
} from "../../lib/authServer";

/**
 * GET /api/rdv
 * - parent : ses propres RDV
 * - enseignant : les RDV pris avec lui
 * - admin : tous les RDV
 *
 * Retourne les RDV enrichis avec les noms du parent et de l'enseignant.
 */
export async function GET() {
  const auth = await requireUser();
  if (isErrorResponse(auth)) return auth;

  let where: Record<string, unknown> = {};
  if (auth.role === "parent") where.parentId = auth.id;
  else if (auth.role === "enseignant") where.enseignantId = auth.id;
  // admin : pas de filtre

  const rdvs = await prisma.rendezVous.findMany({
    where,
    orderBy: { dateHeure: "asc" },
  });

  // Enrichissement : on récupère parents, enseignants, enfants concernés
  const userIds = [...new Set(rdvs.flatMap((r) => [r.parentId, r.enseignantId]))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, prenom: true, nom: true, matiere: true, email: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const enfantIds = rdvs.map((r) => r.enfantId).filter((x): x is string => !!x);
  const enfants =
    enfantIds.length > 0
      ? await prisma.enfant.findMany({
          where: { id: { in: enfantIds } },
          select: { id: true, prenom: true, nom: true },
        })
      : [];
  const enfantMap = new Map(enfants.map((e) => [e.id, e]));

  return NextResponse.json({
    rdvs: rdvs.map((r) => ({
      id: r.id,
      dateHeure: r.dateHeure.toISOString(),
      duree: r.duree,
      motif: r.motif,
      statut: r.statut,
      parent: userMap.get(r.parentId)
        ? {
            id: r.parentId,
            prenom: userMap.get(r.parentId)!.prenom,
            nom: userMap.get(r.parentId)!.nom,
          }
        : null,
      enseignant: userMap.get(r.enseignantId)
        ? {
            id: r.enseignantId,
            prenom: userMap.get(r.enseignantId)!.prenom,
            nom: userMap.get(r.enseignantId)!.nom,
            matiere: userMap.get(r.enseignantId)!.matiere,
          }
        : null,
      enfant: r.enfantId && enfantMap.get(r.enfantId)
        ? {
            id: r.enfantId,
            prenom: enfantMap.get(r.enfantId)!.prenom,
            nom: enfantMap.get(r.enfantId)!.nom,
          }
        : null,
    })),
  });
}

/**
 * POST /api/rdv
 * Un parent réserve un créneau auprès d'un enseignant.
 * Body : { creneauId, enfantId?, motif? }
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (user.role !== "parent") {
    return NextResponse.json(
      { error: "Seuls les parents peuvent prendre rendez-vous" },
      { status: 403 }
    );
  }

  let body: { creneauId?: string; enfantId?: string; motif?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!body.creneauId) {
    return NextResponse.json({ error: "creneauId requis" }, { status: 400 });
  }

  // Transaction : vérifier que le créneau est libre, le marquer pris,
  // créer le RDV. Tout cela en atomique.
  const result = await prisma.$transaction(async (tx) => {
    const creneau = await tx.creneauDisponible.findUnique({
      where: { id: body.creneauId },
    });
    if (!creneau) throw new Error("CRENEAU_INTROUVABLE");
    if (creneau.pris) throw new Error("CRENEAU_PRIS");
    if (creneau.dateHeure < new Date()) throw new Error("CRENEAU_PASSE");

    // Si un enfant est précisé, vérifier qu'il appartient bien au parent
    if (body.enfantId) {
      const enfant = await tx.enfant.findUnique({ where: { id: body.enfantId } });
      if (!enfant || enfant.userId !== user.id) {
        throw new Error("ENFANT_INVALIDE");
      }
    }

    const rdv = await tx.rendezVous.create({
      data: {
        parentId: user.id,
        enseignantId: creneau.enseignantId,
        enfantId: body.enfantId ?? null,
        creneauId: creneau.id,
        dateHeure: creneau.dateHeure,
        duree: creneau.duree,
        motif: body.motif?.trim() ?? null,
      },
    });

    await tx.creneauDisponible.update({
      where: { id: creneau.id },
      data: { pris: true, rdvId: rdv.id },
    });

    return rdv;
  }).catch((err) => {
    return { error: err instanceof Error ? err.message : "ERREUR" } as const;
  });

  if ("error" in result) {
    const errorMessages: Record<string, [string, number]> = {
      CRENEAU_INTROUVABLE: ["Créneau introuvable", 404],
      CRENEAU_PRIS: ["Ce créneau vient d'être réservé par quelqu'un d'autre.", 409],
      CRENEAU_PASSE: ["Ce créneau est dans le passé.", 400],
      ENFANT_INVALIDE: ["Cet enfant n'est pas rattaché à votre compte.", 400],
    };
    const [msg, status] = errorMessages[result.error] ?? ["Erreur", 500];
    return NextResponse.json({ error: msg }, { status });
  }

  // Récupère le parent et l'enseignant pour les e-mails
  const [parentData, enseignantData, enfantData] = await Promise.all([
    prisma.user.findUnique({ where: { id: result.parentId } }),
    prisma.user.findUnique({ where: { id: result.enseignantId } }),
    result.enfantId
      ? prisma.enfant.findUnique({ where: { id: result.enfantId } })
      : Promise.resolve(null),
  ]);

  // Envois en parallèle (best-effort)
  if (parentData && enseignantData) {
    Promise.all([
      envoyerEmail({
        to: parentData.email,
        ...templateRdvConfirmation({
          destinataire: "parent",
          prenomDestinataire: parentData.prenom,
          prenomAutrePartie: enseignantData.prenom,
          nomAutrePartie: enseignantData.nom,
          matiere: enseignantData.matiere,
          enfantPrenom: enfantData?.prenom,
          dateHeure: result.dateHeure.toISOString(),
          motif: result.motif,
        }),
      }),
      envoyerEmail({
        to: enseignantData.email,
        ...templateRdvConfirmation({
          destinataire: "enseignant",
          prenomDestinataire: enseignantData.prenom,
          prenomAutrePartie: parentData.prenom,
          nomAutrePartie: parentData.nom,
          enfantPrenom: enfantData?.prenom,
          dateHeure: result.dateHeure.toISOString(),
          motif: result.motif,
        }),
      }),
    ]).catch((err) => console.error("Erreur envoi e-mails RDV:", err));
  }

  return NextResponse.json({ ok: true, id: result.id });
}
