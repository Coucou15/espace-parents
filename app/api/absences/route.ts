import { NextResponse } from "next/server";
import { prisma } from "../../lib/db";
import { getCurrentUser, isErrorResponse, requireUser } from "../../lib/authServer";
import { envoyerEmail, templateAbsence } from "../../lib/email";
import { webpush } from "../../lib/webPush";

const PERIODES = ["journee", "matin", "apresmidi"] as const;
type Periode = (typeof PERIODES)[number];
const ROLES_STAFF = ["admin-ecole", "super-admin", "enseignant"];

function estPeriode(x: unknown): x is Periode {
  return typeof x === "string" && (PERIODES as readonly string[]).includes(x);
}

/**
 * GET /api/absences
 * - parent : absences de ses propres enfants
 * - staff (enseignant/admin) : toutes
 * Query optionnel : ?date=YYYY-MM-DD pour filtrer sur un jour.
 */
export async function GET(req: Request) {
  const auth = await requireUser();
  if (isErrorResponse(auth)) return auth;

  const url = new URL(req.url);
  const dateFiltre = url.searchParams.get("date");

  const where: Record<string, unknown> = {};
  if (auth.role === "parent") {
    const ids = auth.enfants.map((e) => e.id);
    if (ids.length === 0) return NextResponse.json({ absences: [] });
    where.enfantId = { in: ids };
  }
  if (dateFiltre) where.date = dateFiltre;

  const items = await prisma.absence.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: 500,
  });

  return NextResponse.json({
    absences: items.map((a) => ({
      id: a.id,
      enfantId: a.enfantId,
      enfantPrenom: a.enfantPrenom,
      enfantNom: a.enfantNom,
      date: a.date,
      periode: a.periode,
      motif: a.motif,
      justifiee: a.justifiee,
      signaleParNom: a.signaleParNom,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}

/**
 * POST /api/absences
 * Un enseignant/admin signale une absence. Envoie e-mail + push auto au parent.
 * Body : { enfantId, date (YYYY-MM-DD), periode, motif? }
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!ROLES_STAFF.includes(user.role)) {
    return NextResponse.json(
      { error: "Réservé au personnel de l'école" },
      { status: 403 }
    );
  }

  let body: {
    enfantId?: string;
    date?: string;
    periode?: string;
    motif?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!body.enfantId || !body.date || !estPeriode(body.periode)) {
    return NextResponse.json(
      { error: "Champs manquants (enfantId, date, periode)" },
      { status: 400 }
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return NextResponse.json({ error: "Format date attendu YYYY-MM-DD" }, { status: 400 });
  }

  const enfant = await prisma.enfant.findUnique({
    where: { id: body.enfantId },
    include: { user: true },
  });
  if (!enfant) {
    return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });
  }

  // Création idempotente : si déjà signalé pour ce jour/période, on renvoie l'existant
  let created;
  try {
    created = await prisma.absence.create({
      data: {
        enfantId: enfant.id,
        enfantPrenom: enfant.prenom,
        enfantNom: enfant.nom,
        date: body.date,
        periode: body.periode,
        motif: body.motif?.trim() || null,
        signaleParId: user.id,
        signaleParNom: `${user.prenom} ${user.nom}`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Cette absence a déjà été signalée pour ce jour et cette période." },
      { status: 409 }
    );
  }

  // Envoi e-mail + push (best-effort — on ne bloque pas la réponse)
  if (enfant.user) {
    const parent = enfant.user;
    // Email
    envoyerEmail({
      to: parent.email,
      ...templateAbsence({
        prenomParent: parent.prenom,
        prenomEleve: enfant.prenom,
        date: body.date,
        periode: body.periode,
        motif: body.motif ?? null,
        signataire: `${user.prenom} ${user.nom}`,
      }),
    }).catch(() => {});

    // Push notification
    const subs = await prisma.pushSubscription.findMany({
      where: { userEmail: parent.email },
    });
    if (subs.length > 0) {
      const payload = JSON.stringify({
        titre: `Absence signalée : ${enfant.prenom}`,
        texte: `${enfant.prenom} a été signalé·e absent·e le ${new Date(
          body.date + "T12:00:00"
        ).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })}.`,
        url: "/absences",
        urgent: true,
        tag: `absence-${created.id}`,
      });
      const morts: string[] = [];
      await Promise.all(
        subs.map((s, i) =>
          webpush
            .sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              payload
            )
            .catch((err: { statusCode?: number }) => {
              if (err?.statusCode === 404 || err?.statusCode === 410) {
                morts.push(subs[i].endpoint);
              }
            })
        )
      );
      if (morts.length > 0) {
        await prisma.pushSubscription
          .deleteMany({ where: { endpoint: { in: morts } } })
          .catch(() => {});
      }
    }
  }

  return NextResponse.json({ ok: true, id: created.id, parentPrevenu: !!enfant.user });
}
