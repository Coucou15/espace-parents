import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { hashPassword } from "../../../lib/authServer";

/**
 * POST /api/auth/reset-password
 * Body : { token, motDePasse }
 * Valide le token, met à jour le mot de passe haché, supprime le token.
 */
export async function POST(req: Request) {
  let body: { token?: string; motDePasse?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { token, motDePasse } = body;
  if (!token || !motDePasse) {
    return NextResponse.json(
      { error: "Token et mot de passe requis" },
      { status: 400 }
    );
  }

  if (motDePasse.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit faire au moins 8 caractères" },
      { status: 400 }
    );
  }

  const reset = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!reset) {
    return NextResponse.json(
      { error: "Lien invalide ou déjà utilisé" },
      { status: 400 }
    );
  }
  if (reset.expires < new Date()) {
    await prisma.passwordResetToken.delete({ where: { token } });
    return NextResponse.json(
      { error: "Lien expiré. Refaites une demande de réinitialisation." },
      { status: 400 }
    );
  }

  const motDePasseHash = await hashPassword(motDePasse);

  // Transaction : modifier le mot de passe + supprimer le token + invalider
  // toutes les sessions existantes pour forcer une reconnexion.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: reset.userId },
      data: { motDePasseHash },
    }),
    prisma.passwordResetToken.delete({ where: { token } }),
    prisma.session.deleteMany({ where: { userId: reset.userId } }),
  ]);

  return NextResponse.json({ ok: true });
}
