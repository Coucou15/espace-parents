import { NextResponse } from "next/server";
import { prisma } from "../../lib/db";
import {
  getCurrentUser,
  isErrorResponse,
  requireAdmin,
} from "../../lib/authServer";

/**
 * GET /api/messages
 * Liste tous les messages reçus. Admin uniquement.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const messages = await prisma.messageContact.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      parentPrenom: m.parentPrenom,
      parentNom: m.parentNom,
      email: m.email,
      sujet: m.sujet,
      message: m.message,
      traite: m.traite,
      date: m.createdAt.toISOString(),
    })),
  });
}

/**
 * POST /api/messages
 * Un parent connecté envoie un message à l'administration.
 * Body : { sujet, message }
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: { sujet?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const sujet = body.sujet?.trim();
  const message = body.message?.trim();
  if (!sujet || !message) {
    return NextResponse.json(
      { error: "Sujet et message requis" },
      { status: 400 }
    );
  }

  await prisma.messageContact.create({
    data: {
      parentId: user.id,
      parentPrenom: user.prenom,
      parentNom: user.nom,
      email: user.email,
      sujet,
      message,
    },
  });

  return NextResponse.json({ ok: true });
}
