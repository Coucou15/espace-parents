import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { isErrorResponse, requireAdmin } from "../../../../lib/authServer";

type RouteContext = { params: Promise<{ id: string }> };

function genererCodeAcces(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/demandes/[id]/valider
 * Crée le compte User à partir de la demande, génère un code d'accès,
 * supprime la demande. Renvoie le code à l'admin pour qu'il puisse le
 * communiquer au parent (à terme, ce sera envoyé par e-mail/SMS).
 */
export async function POST(_req: Request, ctx: RouteContext) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await ctx.params;
  const demande = await prisma.demandeInscription.findUnique({ where: { id } });
  if (!demande) {
    return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  }

  // Garde-fou : si l'email a été pris entre temps par un autre compte
  const existingUser = await prisma.user.findUnique({
    where: { email: demande.email },
  });
  if (existingUser) {
    await prisma.demandeInscription.delete({ where: { id } });
    return NextResponse.json(
      { error: "Un compte existe déjà pour cet e-mail. Demande nettoyée." },
      { status: 409 }
    );
  }

  const codeAcces = genererCodeAcces();
  const enfants = JSON.parse(demande.enfants) as Array<{
    prenom: string;
    nom: string;
    palierId: string;
    niveauId: string;
    section: string;
  }>;

  // Transaction : créer User + Enfants, puis supprimer la demande.
  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        email: demande.email,
        prenom: demande.parentPrenom,
        nom: demande.parentNom,
        motDePasseHash: demande.motDePasseHash,
        role: "parent",
        telephone: demande.telephone,
        codeAcces,
        enfants: { create: enfants },
      },
    });
    await tx.demandeInscription.delete({ where: { id } });
    return u;
  });

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email },
    codeAcces,
  });
}
