import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  clearSessionCookie,
  destroySession,
} from "../../../lib/authServer";

/**
 * POST /api/auth/logout
 * Détruit la session côté DB et efface le cookie.
 */
export async function POST() {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await destroySession(sessionId);
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
