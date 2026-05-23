"use client";

import type { PalierId, SectionId } from "./mockData";

export type EnfantInscrit = {
  prenom: string;
  nom: string;
  palierId: PalierId;
  niveauId: string;
  section: SectionId;
};

export type Role =
  | "parent"
  | "admin-ecole"
  | "super-admin"
  | "enseignant"
  | "cantine";

export type Compte = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string | null;
  role: Role;
  enfants: EnfantInscrit[];
};

/**
 * Connexion via l'API. Le serveur pose un cookie HTTP-only,
 * donc rien à stocker côté client.
 */
export async function login(email: string, motDePasse: string): Promise<Compte> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, motDePasse }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Échec de connexion");
  }
  const data = await res.json();
  return data.user as Compte;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

/**
 * Récupère l'utilisateur connecté, ou null si pas de session.
 * Côté serveur (composants RSC), utiliser plutôt getCurrentUser de authServer.ts.
 */
export async function fetchMe(): Promise<Compte | null> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user as Compte;
}
