"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "../../components/Logo";
import { login } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@parent.fr");
  const [motDePasse, setMotDePasse] = useState("Demo2026!");
  const [erreur, setErreur] = useState<string | null>(null);

  const [enCours, setEnCours] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await login(email, motDePasse);
      router.replace("/");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col px-6 pt-12 pb-8">
      <div className="flex flex-col items-center gap-3 mb-8">
        <Logo size={72} />
        <div className="text-center">
          <h1 className="text-xl font-semibold text-[var(--brand-primary-dark)]">
            Espace Parents
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Les Racines du Future
          </p>
          <p className="text-xs italic text-[var(--text-muted)] mt-1">
            « Plus proche de l&apos;école, à tout moment. »
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">
            Adresse e-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
            placeholder="parent@exemple.fr"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="mdp">
            Mot de passe
          </label>
          <input
            id="mdp"
            type="password"
            required
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
          />
        </div>

        {erreur ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
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

        <div className="flex items-center justify-between text-xs">
          <Link href="/mot-de-passe-oublie" className="text-[var(--brand-secondary)] hover:underline">
            Mot de passe oublié ?
          </Link>
          <Link href="/inscription" className="text-[var(--brand-secondary)] hover:underline">
            Créer un compte
          </Link>
        </div>
      </form>

      <div className="mt-auto pt-8">
        <p className="rounded-lg bg-[var(--brand-soft)] px-3 py-2 text-xs text-[var(--brand-primary-dark)]">
          <strong>Démo :</strong> les identifiants sont pré-remplis. Cliquez sur « Se
          connecter » pour explorer l&apos;application.
        </p>
      </div>
    </div>
  );
}
