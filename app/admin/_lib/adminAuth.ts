"use client";

export type AdminRole = "super-admin" | "admin-ecole" | "enseignant" | "cantine";

export type AdminSession = {
  email: string;
  prenom: string;
  nom: string;
  role: AdminRole;
};

const STORAGE_KEY = "espace-parents:admin-session";

const comptesAdmins: { email: string; motDePasse: string; session: AdminSession }[] = [
  {
    email: "directeur@racinesdufutur.dz",
    motDePasse: "Admin2026!",
    session: {
      email: "directeur@racinesdufutur.dz",
      prenom: "Mehdi",
      nom: "Ouali",
      role: "super-admin",
    },
  },
  {
    email: "secretariat@racinesdufutur.dz",
    motDePasse: "Secret2026!",
    session: {
      email: "secretariat@racinesdufutur.dz",
      prenom: "Fatima",
      nom: "Cherif",
      role: "admin-ecole",
    },
  },
];

export function tryLogin(email: string, motDePasse: string): AdminSession | null {
  const trouve = comptesAdmins.find(
    (c) => c.email.toLowerCase() === email.toLowerCase() && c.motDePasse === motDePasse
  );
  return trouve ? trouve.session : null;
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearAdminSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  "super-admin": "Super-administrateur",
  "admin-ecole": "Administrateur école",
  enseignant: "Enseignant",
  cantine: "Personnel de cantine",
};
