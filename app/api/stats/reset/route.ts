import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { isErrorResponse, requireAdmin } from "../../../lib/authServer";

/**
 * POST /api/stats/reset
 * Permet à l'admin de "remettre à zéro" certaines listes en masse.
 * Body : { cible: "messages-traites" | "demandes-refusees" | "rdvs-passes" }
 *
 * NB : on ne supprime jamais d'utilisateurs ni de demandes en attente.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  let body: { cible?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  switch (body.cible) {
    case "messages-traites": {
      const r = await prisma.messageContact.deleteMany({ where: { traite: true } });
      return NextResponse.json({ ok: true, supprimes: r.count });
    }
    case "rdvs-passes": {
      const r = await prisma.rendezVous.deleteMany({
        where: { dateHeure: { lt: new Date() } },
      });
      return NextResponse.json({ ok: true, supprimes: r.count });
    }
    case "messages-tous": {
      const r = await prisma.messageContact.deleteMany({});
      return NextResponse.json({ ok: true, supprimes: r.count });
    }
    default:
      return NextResponse.json({ error: "Cible inconnue" }, { status: 400 });
  }
}
