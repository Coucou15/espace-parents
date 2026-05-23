"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "../lib/auth";

const ROLES_ADMIN = ["admin-ecole", "super-admin", "enseignant", "cantine"];
const EST_PROD = process.env.NODE_ENV === "production";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(EST_PROD ? "" : "directeur@racinesdufutur.dz");
  const [motDePasse, setMotDePasse] = useState(EST_PROD ? "" : "Admin2026!");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const compte = await login(email, motDePasse);
      if (!ROLES_ADMIN.includes(compte.role)) {
        setErreur("Ce compte n'a pas accès au back-office.");
        // On déconnecte côté serveur pour ne pas laisser une session ouverte
        await fetch("/api/auth/logout", { method: "POST" });
        return;
      }
      router.replace("/admin/dashboard");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--brand-primary-dark)] to-[var(--brand-primary)] px-6 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="" className="h-16 w-16 rounded-full object-contain" />
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
              Back-office
            </div>
            <h1 className="text-lg font-bold text-[var(--brand-primary-dark)]">
              Les Racines du Future
            </h1>
            <p className="text-xs text-[var(--text-muted)]">Espace administration</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="adminEmail">
              Adresse e-mail
            </label>
            <input
              id="adminEmail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" htmlFor="adminMdp">
              Mot de passe
            </label>
            <input
              id="adminMdp"
              type="password"
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
            />
          </div>

          {erreur ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {erreur}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={enCours}
            className="w-full rounded-lg bg-[var(--brand-primary)] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-primary-dark)] disabled:opacity-50"
          >
            {enCours ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        {!EST_PROD ? (
          <div className="mt-6 rounded-lg bg-[var(--brand-soft)] p-3 text-[11px] text-[var(--brand-primary-dark)]">
            <strong>Comptes démo :</strong>
            <ul className="mt-1 space-y-0.5">
              <li>· directeur@racinesdufutur.dz / Admin2026! (super-admin)</li>
              <li>· secretariat@racinesdufutur.dz / Secret2026! (admin école)</li>
              <li>· karim.belkadi@racinesdufutur.dz / Prof2026! (enseignant)</li>
            </ul>
          </div>
        ) : null}

        <div className="mt-4 text-center">
          <Link href="/" className="text-[11px] text-[var(--text-muted)] hover:underline">
            ← Retour à l&apos;application parents
          </Link>
        </div>
      </div>
    </div>
  );
}
