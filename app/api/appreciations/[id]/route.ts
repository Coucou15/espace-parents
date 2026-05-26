import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/authServer";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * DELETE /api/appreciations/[id]
 * L'enseignant qui l'a écrite peut la supprimer, ou un admin.
 */
export async function DELETE(_req: Request, ctx: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const item = await prisma.appreciation.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Appréciation introuvable" }, { status: 404 });
  }

  const estAuteur = user.id === item.enseignantId;
  const estAdmin = user.role === "admin-ecole" || user.role === "super-admin";
  if (!estAuteur && !estAdmin) {
    return NextResponse.json({ error: "Action interdite" }, { status: 403 });
  }

  await prisma.appreciation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
