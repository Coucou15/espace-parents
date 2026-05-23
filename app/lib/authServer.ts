/**
 * Helpers serveur pour l'authentification.
 * - hash et vérification des mots de passe (bcrypt)
 * - création / lecture / destruction de sessions stockées en DB
 * - garde-fous pour les routes API (requireUser, requireAdmin)
 */
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { prisma } from "./db";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "espace-parents:session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

export type Role = "parent" | "admin-ecole" | "super-admin" | "enseignant" | "cantine";

export const ROLES_ADMIN: Role[] = ["admin-ecole", "super-admin"];

// --- Mots de passe ---

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// --- Sessions ---

function generateSessionId(): string {
  // 32 octets aléatoires → 64 caractères hex
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: string): Promise<{ id: string; expires: Date }> {
  const id = generateSessionId();
  const expires = new Date(Date.now() + SESSION_DURATION_MS);
  await prisma.session.create({ data: { id, userId, expires } });
  return { id, expires };
}

export async function destroySession(sessionId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id: sessionId } });
}

export async function setSessionCookie(sessionId: string, expires: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// --- Utilisateur courant ---

export type SafeUser = {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  role: Role;
  telephone: string | null;
  statut: string;
  enfants: Array<{
    id: string;
    prenom: string;
    nom: string;
    palierId: string;
    niveauId: string;
    section: string;
  }>;
};

export async function getCurrentUser(): Promise<SafeUser | null> {
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: { include: { enfants: true } } },
  });
  if (!session) return null;

  if (session.expires < new Date()) {
    await destroySession(sessionId);
    return null;
  }

  const u = session.user;
  return {
    id: u.id,
    email: u.email,
    prenom: u.prenom,
    nom: u.nom,
    role: u.role as Role,
    telephone: u.telephone,
    statut: u.statut,
    enfants: u.enfants.map((e) => ({
      id: e.id,
      prenom: e.prenom,
      nom: e.nom,
      palierId: e.palierId,
      niveauId: e.niveauId,
      section: e.section,
    })),
  };
}

// --- Garde-fous pour les routes API ---

export async function requireUser(): Promise<SafeUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  return user;
}

export async function requireAdmin(): Promise<SafeUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!ROLES_ADMIN.includes(user.role)) {
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });
  }
  return user;
}

// Helper qui dit si la réponse retournée par requireXxx est une erreur
export function isErrorResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse;
}
