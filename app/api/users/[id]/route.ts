import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import {
  hashPassword,
  isErrorResponse,
  requireAdmin,
} from "../../../lib/authServer";

type RouteContext = { params: Promise<{ id: string }> };

const ROLES_VALIDES = [
  "parent",
  "admin-ecole",
  "super-admin",
  "enseignant",
  "cantine",
] as const;

function estRoleValide(role: unknown): boolean {
  return typeof role === "string" && (ROLES_VALIDES as readonly string[]).includes(role);
}

/**
 * PATCH /api/users/[id]
 * Met à jour un utilisateur. Champs modifiables :
 * prenom, nom, role, telephone, matiere, statut, motDePasse (réinitialisation).
 */
export async function PATCH(req: Request, ctx: RouteContext) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await ctx.params;
  let body: {
    prenom?: string;
    nom?: string;
    role?: string;
    telephone?: string | null;
    matiere?: string | null;
    statut?: string;
    motDePasse?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.prenom !== undefined) data.prenom = body.prenom.trim();
  if (body.nom !== undefined) data.nom = body.nom.trim();
  if (body.role !== undefined) {
    if (!estRoleValide(body.role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }
    data.role = body.role;
    // Si on quitte le rôle enseignant, on efface la matière
    if (body.role !== "enseignant") data.matiere = null;
  }
  if (body.telephone !== undefined) data.telephone = body.telephone;
  if (body.matiere !== undefined) data.matiere = body.matiere;
  if (body.statut !== undefined) {
    if (body.statut !== "actif" && body.statut !== "suspendu") {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }
    data.statut = body.statut;
  }
  if (body.motDePasse !== undefined) {
    if (body.motDePasse.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit faire au moins 8 caractères" },
        { status: 400 }
      );
    }
    data.motDePasseHash = await hashPassword(body.motDePasse);
    // On invalide les sessions existantes pour forcer une reconnexion
    await prisma.session.deleteMany({ where: { userId: id } });
  }

  try {
    const user = await prisma.user.update({ where: { id }, data });
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
  } catch {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
}

/**
 * DELETE /api/users/[id]
 * Supprime un compte (et tout ce qui y est lié en cascade).
 * Garde-fou : on ne peut pas se supprimer soi-même.
 */
export async function DELETE(_req: Request, ctx: RouteContext) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await ctx.params;
  if (id === auth.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas supprimer votre propre compte" },
      { status: 400 }
    );
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
}
