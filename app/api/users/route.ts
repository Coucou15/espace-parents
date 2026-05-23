import { NextResponse } from "next/server";
import { prisma } from "../../lib/db";
import {
  hashPassword,
  isErrorResponse,
  requireAdmin,
} from "../../lib/authServer";

const ROLES_VALIDES = [
  "parent",
  "admin-ecole",
  "super-admin",
  "enseignant",
  "cantine",
] as const;

type RoleValide = (typeof ROLES_VALIDES)[number];

function estRoleValide(role: unknown): role is RoleValide {
  return typeof role === "string" && (ROLES_VALIDES as readonly string[]).includes(role);
}

/**
 * GET /api/users
 * Liste tous les comptes. Admin uniquement.
 * Filtres optionnels via query params : ?role=enseignant
 */
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const url = new URL(req.url);
  const role = url.searchParams.get("role");

  const users = await prisma.user.findMany({
    where: role && estRoleValide(role) ? { role } : undefined,
    orderBy: { createdAt: "desc" },
    include: { enfants: true },
  });

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      prenom: u.prenom,
      nom: u.nom,
      role: u.role,
      telephone: u.telephone,
      matiere: u.matiere,
      codeAcces: u.codeAcces,
      statut: u.statut,
      createdAt: u.createdAt.toISOString(),
      nbEnfants: u.enfants.length,
    })),
  });
}

/**
 * POST /api/users
 * Crée un nouveau compte (admin/enseignant/cantine/super-admin).
 * Body : { email, prenom, nom, role, motDePasse, telephone?, matiere? }
 */
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  let body: {
    email?: string;
    prenom?: string;
    nom?: string;
    role?: string;
    motDePasse?: string;
    telephone?: string;
    matiere?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !body.prenom || !body.nom || !body.role || !body.motDePasse) {
    return NextResponse.json(
      { error: "Tous les champs obligatoires doivent être remplis" },
      { status: 400 }
    );
  }
  if (!estRoleValide(body.role)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }
  if (body.motDePasse.length < 8) {
    return NextResponse.json(
      { error: "Le mot de passe doit faire au moins 8 caractères" },
      { status: 400 }
    );
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json(
      { error: "Un compte existe déjà pour cet e-mail" },
      { status: 409 }
    );
  }

  const motDePasseHash = await hashPassword(body.motDePasse);

  const user = await prisma.user.create({
    data: {
      email,
      prenom: body.prenom.trim(),
      nom: body.nom.trim(),
      motDePasseHash,
      role: body.role,
      telephone: body.telephone?.trim() ?? null,
      matiere: body.role === "enseignant" ? body.matiere?.trim() ?? null : null,
    },
  });

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      prenom: user.prenom,
      nom: user.nom,
      role: user.role,
    },
  });
}
