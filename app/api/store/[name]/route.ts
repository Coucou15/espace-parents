import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { isErrorResponse, requireAdmin } from "../../../lib/authServer";

type RouteContext = { params: Promise<{ name: string }> };

/**
 * GET /api/store/[name]
 * Renvoie le JSON stocké sous cette clé, ou 404 si inconnue.
 */
export async function GET(_req: Request, ctx: RouteContext) {
  const { name } = await ctx.params;
  const row = await prisma.store.findUnique({ where: { name } });
  if (!row) {
    return NextResponse.json({ error: `Ressource '${name}' introuvable` }, { status: 404 });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(row.value);
  } catch {
    return NextResponse.json({ error: "Données corrompues en base" }, { status: 500 });
  }
  return NextResponse.json({ value: parsed, updatedAt: row.updatedAt });
}

/**
 * PUT /api/store/[name]
 * Remplace intégralement la valeur stockée. Crée la ressource si absente.
 * Body : { value: any }
 */
export async function PUT(req: Request, ctx: RouteContext) {
  // Seuls les admins peuvent modifier les ressources partagées.
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { name } = await ctx.params;
  let body: { value?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  if (!("value" in body)) {
    return NextResponse.json({ error: "Le champ 'value' est requis" }, { status: 400 });
  }
  const json = JSON.stringify(body.value);
  const row = await prisma.store.upsert({
    where: { name },
    create: { name, value: json },
    update: { value: json },
  });
  return NextResponse.json({ ok: true, updatedAt: row.updatedAt });
}
