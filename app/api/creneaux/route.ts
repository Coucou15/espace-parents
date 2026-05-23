import { NextResponse } from "next/server";
import { prisma } from "../../lib/db";
import {
  getCurrentUser,
  isErrorResponse,
  requireUser,
} from "../../lib/authServer";

/**
 * GET /api/creneaux?enseignantId=...&libresUniquement=true
 * - parent : voit uniquement les créneaux libres à venir
 * - enseignant : voit tous SES créneaux (passés et futurs, pris et libres)
 * - admin : voit tous les créneaux d'un enseignant donné
 */
export async function GET(req: Request) {
  const auth = await requireUser();
  if (isErrorResponse(auth)) return auth;

  const url = new URL(req.url);
  const enseignantId = url.searchParams.get("enseignantId");
  const libresUniquement = url.searchParams.get("libresUniquement") === "true";

  // Un enseignant ne peut voir que ses propres créneaux
  let where: Record<string, unknown> = {};
  if (auth.role === "enseignant") {
    where.enseignantId = auth.id;
  } else if (enseignantId) {
    where.enseignantId = enseignantId;
  } else {
    return NextResponse.json(
      { error: "Paramètre enseignantId requis" },
      { status: 400 }
    );
  }

  if (libresUniquement) {
    where = { ...where, pris: false, dateHeure: { gte: new Date() } };
  }

  const creneaux = await prisma.creneauDisponible.findMany({
    where,
    orderBy: { dateHeure: "asc" },
  });

  return NextResponse.json({
    creneaux: creneaux.map((c) => ({
      id: c.id,
      enseignantId: c.enseignantId,
      dateHeure: c.dateHeure.toISOString(),
      duree: c.duree,
      pris: c.pris,
    })),
  });
}

/**
 * POST /api/creneaux
 * Un enseignant déclare un nouveau créneau de disponibilité.
 * Body : { dateHeure, duree? }
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (user.role !== "enseignant") {
    return NextResponse.json(
      { error: "Seuls les enseignants peuvent créer des créneaux" },
      { status: 403 }
    );
  }

  let body: { dateHeure?: string; duree?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!body.dateHeure) {
    return NextResponse.json({ error: "dateHeure requise" }, { status: 400 });
  }

  const dateHeure = new Date(body.dateHeure);
  if (isNaN(dateHeure.getTime()) || dateHeure < new Date()) {
    return NextResponse.json(
      { error: "Date invalide ou dans le passé" },
      { status: 400 }
    );
  }

  const creneau = await prisma.creneauDisponible.create({
    data: {
      enseignantId: user.id,
      dateHeure,
      duree: body.duree ?? 15,
    },
  });

  return NextResponse.json({ ok: true, id: creneau.id });
}
