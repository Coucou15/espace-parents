import { NextResponse } from "next/server";
import { prisma } from "../../lib/db";
import { isErrorResponse, requireUser } from "../../lib/authServer";

/**
 * GET /api/enfants
 * Liste tous les élèves (enfants) inscrits.
 * Réservé aux utilisateurs connectés non-parents (enseignants, admin).
 */
export async function GET() {
  const auth = await requireUser();
  if (isErrorResponse(auth)) return auth;
  if (auth.role === "parent") {
    return NextResponse.json({ error: "Réservé au personnel" }, { status: 403 });
  }

  const enfants = await prisma.enfant.findMany({
    orderBy: [{ palierId: "asc" }, { niveauId: "asc" }, { section: "asc" }, { prenom: "asc" }],
    include: {
      user: { select: { prenom: true, nom: true, email: true } },
    },
  });

  return NextResponse.json({
    enfants: enfants.map((e) => ({
      id: e.id,
      prenom: e.prenom,
      nom: e.nom,
      palierId: e.palierId,
      niveauId: e.niveauId,
      section: e.section,
      parent: e.user ? { prenom: e.user.prenom, nom: e.user.nom, email: e.user.email } : null,
    })),
  });
}
