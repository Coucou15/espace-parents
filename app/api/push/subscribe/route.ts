import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";

/**
 * POST /api/push/subscribe
 * Stocke (ou met à jour) un abonnement push.
 * Body : { subscription: PushSubscriptionJSON, userEmail?: string }
 */
export async function POST(req: Request) {
  let body: {
    subscription?: { endpoint: string; keys?: { p256dh?: string; auth?: string } };
    userEmail?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "Abonnement incomplet" }, { status: 400 });
  }

  const userAgent = req.headers.get("user-agent") ?? null;

  const row = await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userEmail: body.userEmail ?? null,
      userAgent,
    },
    update: {
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userEmail: body.userEmail ?? null,
      userAgent,
    },
  });

  return NextResponse.json({ ok: true, id: row.id });
}

/**
 * DELETE /api/push/subscribe
 * Supprime un abonnement par son endpoint.
 * Body : { endpoint: string }
 */
export async function DELETE(req: Request) {
  let body: { endpoint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!body.endpoint) {
    return NextResponse.json({ error: "Endpoint requis" }, { status: 400 });
  }
  await prisma.pushSubscription.deleteMany({ where: { endpoint: body.endpoint } });
  return NextResponse.json({ ok: true });
}
