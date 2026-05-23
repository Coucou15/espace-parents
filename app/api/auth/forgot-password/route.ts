import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "../../../lib/db";
import { envoyerEmail, templateResetPassword } from "../../../lib/email";

const TOKEN_DURATION_MS = 60 * 60 * 1000; // 1 heure

/**
 * POST /api/auth/forgot-password
 * Body : { email }
 * Crée un token de reset et envoie l'e-mail. Renvoie toujours { ok: true }
 * même si l'email n'existe pas, pour ne pas révéler l'existence du compte.
 */
export async function POST(req: Request) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Si l'utilisateur n'existe pas, on simule un succès silencieusement.
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  // Génère un token aléatoire (32 octets = 64 caractères hex)
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_DURATION_MS);

  // Nettoie les anciens tokens du user (un seul actif à la fois)
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expires },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const lien = `${appUrl}/mot-de-passe-oublie?token=${token}`;

  const { sujet, html, texte } = templateResetPassword(user.prenom, lien);
  await envoyerEmail({ to: email, sujet, html, texte });

  return NextResponse.json({ ok: true });
}
