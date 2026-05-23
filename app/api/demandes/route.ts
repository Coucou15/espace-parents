import { NextResponse } from "next/server";
import { prisma } from "../../lib/db";
import {
  hashPassword,
  isErrorResponse,
  requireAdmin,
} from "../../lib/authServer";

/**
 * GET /api/demandes
 * Liste toutes les demandes en attente. Admin uniquement.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const demandes = await prisma.demandeInscription.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    demandes: demandes.map((d) => ({
      id: d.id,
      parentPrenom: d.parentPrenom,
      parentNom: d.parentNom,
      email: d.email,
      telephone: d.telephone,
      enfants: JSON.parse(d.enfants),
      date: d.createdAt.toISOString().slice(0, 10),
    })),
  });
}

/**
 * POST /api/demandes
 * Crée une nouvelle demande d'inscription. Pas d'auth requise.
 * Body : {
 *   parentPrenom, parentNom, email, telephone, motDePasse,
 *   enfants: [{prenom, nom, palierId, niveauId, section}]
 * }
 */
export async function POST(req: Request) {
  let body: {
    parentPrenom?: string;
    parentNom?: string;
    email?: string;
    telephone?: string;
    motDePasse?: string;
    enfants?: Array<{
      prenom: string;
      nom: string;
      palierId: string;
      niveauId: string;
      section: string;
    }>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const motDePasse = body.motDePasse;
  const enfants = body.enfants ?? [];

  if (
    !body.parentPrenom ||
    !body.parentNom ||
    !email ||
    !motDePasse ||
    enfants.length === 0
  ) {
    return NextResponse.json(
      { error: "Tous les champs obligatoires doivent être remplis" },
      { status: 400 }
    );
  }

  if (motDePasse.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit faire au moins 8 caractères" },
      { status: 400 }
    );
  }

  // L'email ne doit pas déjà être pris par un compte existant ou une demande
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "Un compte existe déjà pour cette adresse e-mail" },
      { status: 409 }
    );
  }
  const existingDemande = await prisma.demandeInscription.findUnique({
    where: { email },
  });
  if (existingDemande) {
    return NextResponse.json(
      { error: "Une demande est déjà en attente pour cette adresse e-mail" },
      { status: 409 }
    );
  }

  const motDePasseHash = await hashPassword(motDePasse);

  const demande = await prisma.demandeInscription.create({
    data: {
      parentPrenom: body.parentPrenom.trim(),
      parentNom: body.parentNom.trim(),
      email,
      telephone: body.telephone?.trim() ?? null,
      motDePasseHash,
      enfants: JSON.stringify(enfants),
    },
  });

  return NextResponse.json({ ok: true, id: demande.id });
}
