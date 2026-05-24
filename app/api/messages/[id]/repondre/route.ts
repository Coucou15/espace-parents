import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { isErrorResponse, requireAdmin } from "../../../../lib/authServer";
import { envoyerEmail, templateReponseMessage } from "../../../../lib/email";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/messages/[id]/repondre
 * Body : { reponse: string }
 * Envoie la réponse par e-mail au parent et marque le message comme traité.
 */
export async function POST(req: Request, ctx: RouteContext) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const { id } = await ctx.params;
  let body: { reponse?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const reponse = body.reponse?.trim();
  if (!reponse) {
    return NextResponse.json({ error: "Réponse vide" }, { status: 400 });
  }

  const message = await prisma.messageContact.findUnique({ where: { id } });
  if (!message) {
    return NextResponse.json({ error: "Message introuvable" }, { status: 404 });
  }

  const { sujet, html, texte } = templateReponseMessage({
    prenomParent: message.parentPrenom,
    sujetOriginal: message.sujet,
    messageOriginal: message.message,
    reponse,
    signataire: `${auth.prenom} ${auth.nom}`,
  });

  const result = await envoyerEmail({
    to: message.email,
    sujet,
    html,
    texte,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: `Échec de l'envoi : ${result.error}` },
      { status: 502 }
    );
  }

  // Marquer comme traité
  await prisma.messageContact.update({
    where: { id },
    data: { traite: true },
  });

  return NextResponse.json({ ok: true });
}
