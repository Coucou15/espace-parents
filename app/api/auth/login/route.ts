import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import {
  createSession,
  setSessionCookie,
  verifyPassword,
} from "../../../lib/authServer";

/**
 * POST /api/auth/login
 * Body : { email, motDePasse }
 * Crée une session et pose le cookie HTTP-only.
 */
export async function POST(req: Request) {
  let body: { email?: string; motDePasse?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const motDePasse = body.motDePasse;

  if (!email || !motDePasse) {
    return NextResponse.json(
      { error: "Email et mot de passe requis" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { enfants: true },
  });
  // Même message d'erreur que email inconnu pour ne pas révéler l'existence du compte.
  if (!user || user.statut !== "actif") {
    return NextResponse.json(
      { error: "Identifiants invalides" },
      { status: 401 }
    );
  }

  const ok = await verifyPassword(motDePasse, user.motDePasseHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Identifiants invalides" },
      { status: 401 }
    );
  }

  const session = await createSession(user.id);
  await setSessionCookie(session.id, session.expires);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      prenom: user.prenom,
      nom: user.nom,
      role: user.role,
      telephone: user.telephone,
      enfants: user.enfants.map((e) => ({
        prenom: e.prenom,
        nom: e.nom,
        palierId: e.palierId,
        niveauId: e.niveauId,
        section: e.section,
      })),
    },
  });
}
