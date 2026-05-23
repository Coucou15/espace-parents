import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/authServer";

/**
 * GET /api/auth/me
 * Renvoie l'utilisateur connecté, ou 401 si pas de session.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  return NextResponse.json({ user });
}
