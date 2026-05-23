"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "../../components/Logo";

type Etape = "demande" | "envoye" | "nouveau" | "succes";

export default function MotDePasseOubliePage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <Contenu />
    </Suspense>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-muted)]">
      Chargement…
    </div>
  );
}

function Contenu() {
  const params = useSearchParams();
  const tokenUrl = params.get("token");

  const [etape, setEtape] = useState<Etape>("demande");
  const [email, setEmail] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  // Si l'utilisateur arrive avec un token dans l'URL (lien d'e-mail),
  // on saute directement à l'étape "nouveau mot de passe".
  useEffect(() => {
    if (tokenUrl) setEtape("nouveau");
  }, [tokenUrl]);

  async function envoyerDemande(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) {
      setErreur("Adresse e-mail invalide.");
      return;
    }
    setErreur(null);
    setEnCours(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErreur(data.error ?? "Erreur lors de l'envoi");
        return;
      }
      setEtape("envoye");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setEnCours(false);
    }
  }

  async function definirNouveau(e: React.FormEvent) {
    e.preventDefault();
    if (nouveau.length < 8) {
      setErreur("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    if (!/[A-Z]/.test(nouveau) || !/[0-9]/.test(nouveau)) {
      setErreur("Le mot de passe doit contenir au moins une majuscule et un chiffre.");
      return;
    }
    if (nouveau !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setErreur(null);
    setEnCours(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenUrl, motDePasse: nouveau }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error ?? "Erreur");
        return;
      }
      setEtape("succes");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col px-6 pt-12 pb-8">
      <div className="flex flex-col items-center gap-3 mb-8">
        <Logo size={64} />
        <h1 className="text-lg font-semibold text-[var(--brand-primary-dark)]">
          Mot de passe oublié
        </h1>
      </div>

      {etape === "demande" ? (
        <form onSubmit={envoyerDemande} className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            Saisissez l&apos;adresse e-mail associée à votre compte. Nous vous
            enverrons un lien pour définir un nouveau mot de passe.
          </p>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="mdpEmail">
              Adresse e-mail
            </label>
            <input
              id="mdpEmail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@exemple.fr"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
            />
          </div>

          {erreur ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {erreur}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={enCours}
            className="w-full rounded-lg bg-[var(--brand-primary)] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-primary-dark)] disabled:opacity-50"
          >
            {enCours ? "Envoi…" : "Envoyer le lien"}
          </button>

          <Link href="/login" className="block text-center text-xs text-[var(--brand-secondary)] hover:underline">
            ← Retour à la connexion
          </Link>
        </form>
      ) : null}

      {etape === "envoye" ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-[var(--brand-soft)] border border-[var(--brand-primary)]/20 p-4 text-sm">
            <p className="font-semibold text-[var(--brand-primary-dark)] mb-1">
              ✉️ Vérifiez vos e-mails
            </p>
            <p className="text-[var(--text-muted)] text-xs">
              Si un compte est associé à <strong>{email}</strong>, un lien de
              réinitialisation vient d&apos;être envoyé. Pensez à vérifier vos spams.
              Le lien expire dans 1 heure.
            </p>
          </div>

          <Link
            href="/login"
            className="block w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-3 text-center text-sm font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-soft)]"
          >
            Retour à la connexion
          </Link>
        </div>
      ) : null}

      {etape === "nouveau" ? (
        <form onSubmit={definirNouveau} className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            Définissez votre nouveau mot de passe.
          </p>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="mdpNouveau">
              Nouveau mot de passe
            </label>
            <input
              id="mdpNouveau"
              type="password"
              required
              value={nouveau}
              onChange={(e) => setNouveau(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
            />
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              8 caractères min., 1 majuscule, 1 chiffre.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="mdpConfirm">
              Confirmer le mot de passe
            </label>
            <input
              id="mdpConfirm"
              type="password"
              required
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
            />
          </div>

          {erreur ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {erreur}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={enCours}
            className="w-full rounded-lg bg-[var(--brand-primary)] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-primary-dark)] disabled:opacity-50"
          >
            {enCours ? "Enregistrement…" : "Enregistrer le mot de passe"}
          </button>
        </form>
      ) : null}

      {etape === "succes" ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5 text-center text-sm">
            <div className="text-3xl mb-2">✓</div>
            <p className="font-semibold text-emerald-800 mb-1">
              Mot de passe modifié
            </p>
            <p className="text-xs text-emerald-700">
              Vous pouvez maintenant vous connecter avec votre nouveau mot de
              passe.
            </p>
          </div>

          <Link
            href="/login"
            className="block w-full rounded-lg bg-[var(--brand-primary)] py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-primary-dark)]"
          >
            Se connecter
          </Link>
        </div>
      ) : null}
    </div>
  );
}
