import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/authServer";

/**
 * GET /api/auth/change-code-acces
 * Renvoie le code d'accès actuel du parent connecté (pour affichage profil).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (user.role !== "parent") {
    return NextResponse.json(
      { error: "Réservé aux comptes parents" },
      { status: 403 }
    );
  }

  const u = await prisma.user.findUnique({
    where: { id: user.id },
    select: { codeAcces: true },
  });
  return NextResponse.json({ codeAcces: u?.codeAcces ?? null });
}

/**
 * POST /api/auth/change-code-acces
 * Le parent connecté change son code d'accès personnel.
 * Body : { codeAcces: string }  (6 chiffres recommandés)
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (user.role !== "parent") {
    return NextResponse.json(
      { error: "Le code d'accès n'est utilisé que par les parents" },
      { status: 403 }
    );
  }

  let body: { codeAcces?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const code = body.codeAcces?.trim() ?? "";
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: "Le code doit être composé de 6 chiffres exactement" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { codeAcces: code },
  });

  return NextResponse.json({ ok: true, codeAcces: code });
}
