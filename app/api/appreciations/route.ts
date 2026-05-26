import { NextResponse } from "next/server";
import { prisma } from "../../lib/db";
import { getCurrentUser, isErrorResponse, requireUser } from "../../lib/authServer";

const TYPES_VALIDES = ["positif", "neutre", "amelioration", "comportement"] as const;
type TypeAppreciation = (typeof TYPES_VALIDES)[number];

function estTypeValide(t: unknown): t is TypeAppreciation {
  return typeof t === "string" && (TYPES_VALIDES as readonly string[]).includes(t);
}

/**
 * GET /api/appreciations
 * - parent : appréciations concernant ses propres enfants
 * - enseignant : appréciations qu'il a écrites
 * - admin : toutes
 */
export async function GET() {
  const auth = await requireUser();
  if (isErrorResponse(auth)) return auth;

  let where: Record<string, unknown> = {};
  if (auth.role === "parent") {
    const ids = auth.enfants.map((e) => e.id);
    if (ids.length === 0) return NextResponse.json({ appreciations: [] });
    where = { enfantId: { in: ids } };
  } else if (auth.role === "enseignant") {
    where = { enseignantId: auth.id };
  }

  const items = await prisma.appreciation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    appreciations: items.map((a) => ({
      id: a.id,
      enseignantId: a.enseignantId,
      enseignantNom: a.enseignantNom,
      enfantId: a.enfantId,
      enfantPrenom: a.enfantPrenom,
      matiere: a.matiere,
      type: a.type,
      texte: a.texte,
      date: a.createdAt.toISOString(),
    })),
  });
}

/**
 * POST /api/appreciations
 * Un enseignant crée une appréciation pour un élève.
 * Body : { enfantId, type, texte, matiere? }
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (user.role !== "enseignant") {
    return NextResponse.json(
      { error: "Seuls les enseignants peuvent écrire des appréciations" },
      { status: 403 }
    );
  }

  let body: { enfantId?: string; type?: string; texte?: string; matiere?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  if (!body.enfantId || !body.texte?.trim() || !estTypeValide(body.type)) {
    return NextResponse.json(
      { error: "Élève, type et texte requis" },
      { status: 400 }
    );
  }

  const enfant = await prisma.enfant.findUnique({ where: { id: body.enfantId } });
  if (!enfant) {
    return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });
  }

  // Récupère la matière de l'enseignant si non fournie
  const enseignant = await prisma.user.findUnique({ where: { id: user.id } });
  const matiere = body.matiere?.trim() || enseignant?.matiere || null;

  const created = await prisma.appreciation.create({
    data: {
      enseignantId: user.id,
      enseignantNom: `${user.prenom} ${user.nom}`,
      enfantId: enfant.id,
      enfantPrenom: enfant.prenom,
      matiere,
      type: body.type,
      texte: body.texte.trim(),
    },
  });

  return NextResponse.json({ ok: true, id: created.id });
}
