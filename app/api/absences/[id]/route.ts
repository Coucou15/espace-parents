import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { getCurrentUser } from "../../../lib/authServer";

type RouteContext = { params: Promise<{ id: string }> };
const ROLES_STAFF = ["admin-ecole", "super-admin", "enseignant"];

/**
 * PATCH /api/absences/[id]
 * Modifier motif ou marquer justifiée. Réservé au staff.
 * Body : { motif?, justifiee? }
 */
export async function PATCH(req: Request, ctx: RouteContext) {
  const user = await getCurrentUser();
  if (!user || !ROLES_STAFF.includes(user.role)) {
    return NextResponse.json({ error: "Réservé au personnel" }, { status: 403 });
  }
  const { id } = await ctx.params;
  let body: { motif?: string | null; justifiee?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const data: Record<string, unknown> = {};
  if ("motif" in body) data.motif = body.motif ?? null;
  if ("justifiee" in body && typeof body.justifiee === "boolean") data.justifiee = body.justifiee;

  try {
    await prisma.absence.update({ where: { id }, data });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Absence introuvable" }, { status: 404 });
  }
}

/**
 * DELETE /api/absences/[id]
 * Retirer une absence signalée par erreur. Réservé au staff.
 */
export async function DELETE(_req: Request, ctx: RouteContext) {
  const user = await getCurrentUser();
  if (!user || !ROLES_STAFF.includes(user.role)) {
    return NextResponse.json({ error: "Réservé au personnel" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    await prisma.absence.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Absence introuvable" }, { status: 404 });
  }
}
