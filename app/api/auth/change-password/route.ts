import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import {
  SESSION_COOKIE,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "../../../lib/authServer";
import { cookies } from "next/headers";

/**
 * POST /api/auth/change-password
 * Permet à un utilisateur connecté (parent ou admin) de changer son
 * propre mot de passe. Vérifie le mot de passe actuel d'abord.
 *
 * Body : { motDePasseActuel, nouveauMotDePasse }
 *
 * Toutes les sessions du user sont invalidées sauf la courante.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { motDePasseActuel?: string; nouveauMotDePasse?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { motDePasseActuel, nouveauMotDePasse } = body;
  if (!motDePasseActuel || !nouveauMotDePasse) {
    return NextResponse.json(
      { error: "Mot de passe actuel et nouveau requis" },
      { status: 400 }
    );
  }

  if (nouveauMotDePasse.length < 8) {
    return NextResponse.json(
      { error: "Le nouveau mot de passe doit faire au moins 8 caractères" },
      { status: 400 }
    );
  }

  // Récupère le user complet (avec hash) pour vérification
  const userComplet = await prisma.user.findUnique({ where: { id: user.id } });
  if (!userComplet) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const ok = await verifyPassword(motDePasseActuel, userComplet.motDePasseHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Le mot de passe actuel est incorrect" },
      { status: 401 }
    );
  }

  const nouveauHash = await hashPassword(nouveauMotDePasse);

  // Récupère la session courante pour ne pas la supprimer (sinon l'utilisateur
  // se déconnecte tout seul après changement).
  const store = await cookies();
  const sessionCourante = store.get(SESSION_COOKIE)?.value;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { motDePasseHash: nouveauHash },
    }),
    prisma.session.deleteMany({
      where: {
        userId: user.id,
        ...(sessionCourante ? { NOT: { id: sessionCourante } } : {}),
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
