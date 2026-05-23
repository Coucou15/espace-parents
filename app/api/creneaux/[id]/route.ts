import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/authServer";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * DELETE /api/creneaux/[id]
 * L'enseignant retire un créneau (uniquement s'il n'est pas déjà pris,
 * ou si c'est un admin).
 */
export async function DELETE(_req: Request, ctx: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const creneau = await prisma.creneauDisponible.findUnique({ where: { id } });
  if (!creneau) {
    return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });
  }

  const estProprietaire = user.id === creneau.enseignantId;
  const estAdmin = user.role === "admin-ecole" || user.role === "super-admin";
  if (!estProprietaire && !estAdmin) {
    return NextResponse.json({ error: "Action interdite" }, { status: 403 });
  }

  if (creneau.pris) {
    return NextResponse.json(
      { error: "Ce créneau est déjà réservé. Annulez d'abord le rendez-vous." },
      { status: 400 }
    );
  }

  await prisma.creneauDisponible.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
