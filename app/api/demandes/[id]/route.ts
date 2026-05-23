import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { isErrorResponse, requireAdmin } from "../../../lib/authServer";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * DELETE /api/demandes/[id]
 * Refuse une demande : la supprime simplement.
 */
export async function DELETE(_req: Request, ctx: RouteContext) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await ctx.params;
  await prisma.demandeInscription.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
