import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { isErrorResponse, requireAdmin } from "../../../lib/authServer";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/messages/[id]
 * Bascule le statut traité/non-traité. Body : { traite: boolean }
 */
export async function PATCH(req: Request, ctx: RouteContext) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await ctx.params;
  let body: { traite?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (typeof body.traite !== "boolean") {
    return NextResponse.json({ error: "Champ 'traite' requis" }, { status: 400 });
  }

  try {
    await prisma.messageContact.update({
      where: { id },
      data: { traite: body.traite },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
  }
}

/**
 * DELETE /api/messages/[id]
 * Supprime le message.
 */
export async function DELETE(_req: Request, ctx: RouteContext) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await ctx.params;
  try {
    await prisma.messageContact.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
  }
}
