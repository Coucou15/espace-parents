import { NextResponse } from "next/server";
import { prisma } from "../../lib/db";
import { isErrorResponse, requireAdmin } from "../../lib/authServer";

/**
 * GET /api/stats
 * Renvoie les compteurs en temps réel depuis la base.
 * Admin uniquement.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const [
    nbDemandes,
    nbMessages,
    nbMessagesNonTraites,
    nbParents,
    nbParentsActifs,
    nbEnseignants,
    nbRdvsAVenir,
    nbAbonnementsPush,
  ] = await Promise.all([
    prisma.demandeInscription.count(),
    prisma.messageContact.count(),
    prisma.messageContact.count({ where: { traite: false } }),
    prisma.user.count({ where: { role: "parent" } }),
    prisma.user.count({ where: { role: "parent", statut: "actif" } }),
    prisma.user.count({ where: { role: "enseignant" } }),
    prisma.rendezVous.count({ where: { dateHeure: { gte: new Date() } } }),
    prisma.pushSubscription.count(),
  ]);

  return NextResponse.json({
    demandesEnAttente: nbDemandes,
    messagesNonTraites: nbMessagesNonTraites,
    messagesTotal: nbMessages,
    parentsTotal: nbParents,
    parentsActifs: nbParentsActifs,
    enseignants: nbEnseignants,
    rdvsAVenir: nbRdvsAVenir,
    abonnementsPush: nbAbonnementsPush,
  });
}
