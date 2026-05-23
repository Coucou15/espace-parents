import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { isErrorResponse, requireAdmin } from "../../../lib/authServer";
import { webpush } from "../../../lib/webPush";

/**
 * POST /api/push/send
 * Envoie une notification à tous les abonnés (ou à un sous-ensemble si emails fournis).
 * Body : { titre: string; texte: string; url?: string; urgent?: boolean; emails?: string[] }
 *
 * NB : en prod, il faudrait protéger cette route par une auth admin.
 * Ici on garde simple pour le prototype.
 */
export async function POST(req: Request) {
  // Seuls les admins peuvent envoyer des notifications de masse.
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  let body: {
    titre?: string;
    texte?: string;
    url?: string;
    urgent?: boolean;
    emails?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const titre = body.titre?.trim();
  const texte = body.texte?.trim();
  if (!titre || !texte) {
    return NextResponse.json({ error: "Titre et texte requis" }, { status: 400 });
  }

  const subs = await prisma.pushSubscription.findMany({
    where: body.emails && body.emails.length > 0 ? { userEmail: { in: body.emails } } : undefined,
  });

  if (subs.length === 0) {
    return NextResponse.json({ ok: true, envoyes: 0, message: "Aucun abonné" });
  }

  const payload = JSON.stringify({
    titre,
    texte,
    url: body.url ?? "/",
    urgent: body.urgent ?? false,
    tag: `annonce-${Date.now()}`,
  });

  // On envoie en parallèle ; on collecte les échecs pour supprimer les abonnements morts (410 Gone).
  const resultats = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      )
    )
  );

  let envoyes = 0;
  const endpointsMorts: string[] = [];
  resultats.forEach((r, i) => {
    if (r.status === "fulfilled") {
      envoyes++;
    } else {
      const err = r.reason as { statusCode?: number };
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        endpointsMorts.push(subs[i].endpoint);
      } else {
        console.error("Échec push :", err);
      }
    }
  });

  if (endpointsMorts.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: endpointsMorts } },
    });
  }

  return NextResponse.json({
    ok: true,
    envoyes,
    nettoyes: endpointsMorts.length,
    total: subs.length,
  });
}
