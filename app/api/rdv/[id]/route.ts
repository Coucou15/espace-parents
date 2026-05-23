import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { envoyerEmail, templateRdvAnnulation } from "../../../lib/email";
import { getCurrentUser } from "../../../lib/authServer";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * DELETE /api/rdv/[id]
 * Annule un rendez-vous. Permis si :
 * - on est le parent ou l'enseignant impliqué
 * - ou on est admin
 * Le créneau est libéré (pris=false), un e-mail d'annulation est envoyé
 * à l'autre partie.
 */
export async function DELETE(_req: Request, ctx: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const rdv = await prisma.rendezVous.findUnique({ where: { id } });
  if (!rdv) {
    return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
  }

  const estImplique = user.id === rdv.parentId || user.id === rdv.enseignantId;
  const estAdmin = user.role === "admin-ecole" || user.role === "super-admin";
  if (!estImplique && !estAdmin) {
    return NextResponse.json({ error: "Action interdite" }, { status: 403 });
  }

  // Transaction : supprimer le RDV + libérer le créneau (si encore présent)
  await prisma.$transaction(async (tx) => {
    if (rdv.creneauId) {
      await tx.creneauDisponible
        .update({
          where: { id: rdv.creneauId },
          data: { pris: false, rdvId: null },
        })
        .catch(() => {
          /* le créneau a peut-être été supprimé entre temps */
        });
    }
    await tx.rendezVous.delete({ where: { id } });
  });

  // E-mail à l'autre partie (best-effort)
  const [parentData, enseignantData] = await Promise.all([
    prisma.user.findUnique({ where: { id: rdv.parentId } }),
    prisma.user.findUnique({ where: { id: rdv.enseignantId } }),
  ]);
  const aQuiEnvoyer =
    user.id === rdv.parentId
      ? enseignantData
      : user.id === rdv.enseignantId
      ? parentData
      : null;
  const autrePartie =
    user.id === rdv.parentId
      ? parentData
      : user.id === rdv.enseignantId
      ? enseignantData
      : null;

  if (aQuiEnvoyer && autrePartie) {
    envoyerEmail({
      to: aQuiEnvoyer.email,
      ...templateRdvAnnulation({
        destinataire: user.id === rdv.parentId ? "enseignant" : "parent",
        prenomDestinataire: aQuiEnvoyer.prenom,
        prenomAutrePartie: autrePartie.prenom,
        nomAutrePartie: autrePartie.nom,
        dateHeure: rdv.dateHeure.toISOString(),
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
