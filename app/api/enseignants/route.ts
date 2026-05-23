import { NextResponse } from "next/server";
import { prisma } from "../../lib/db";
import { isErrorResponse, requireUser } from "../../lib/authServer";

/**
 * GET /api/enseignants
 * Liste publique (utilisateurs connectés) des enseignants, avec le nombre
 * de créneaux libres à venir pour chacun. Sert au parent pour choisir
 * un enseignant lors de la prise de rendez-vous.
 */
export async function GET() {
  const auth = await requireUser();
  if (isErrorResponse(auth)) return auth;

  const enseignants = await prisma.user.findMany({
    where: { role: "enseignant", statut: "actif" },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });

  // Pour chacun, on compte les créneaux libres à venir
  const maintenant = new Date();
  const ids = enseignants.map((e) => e.id);
  const creneaux = await prisma.creneauDisponible.groupBy({
    by: ["enseignantId"],
    where: {
      enseignantId: { in: ids },
      pris: false,
      dateHeure: { gte: maintenant },
    },
    _count: true,
  });
  const map = new Map<string, number>(
    creneaux.map((c) => [c.enseignantId, c._count])
  );

  return NextResponse.json({
    enseignants: enseignants.map((e) => ({
      id: e.id,
      prenom: e.prenom,
      nom: e.nom,
      matiere: e.matiere,
      creneauxLibres: map.get(e.id) ?? 0,
    })),
  });
}
