"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "../../components/AppHeader";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../components/AuthGuard";
import { PushToggle } from "../../components/PushToggle";
import { logout, type Compte } from "../../lib/auth";
import { formatClasse, getPalier } from "../../lib/mockData";

export default function ProfilPage() {
  return <AuthGuard>{(compte) => <Contenu compte={compte} />}</AuthGuard>;
}

function Contenu({ compte }: { compte: Compte }) {
  const router = useRouter();
  const [modaleMdp, setModaleMdp] = useState(false);
  const [modaleCode, setModaleCode] = useState(false);
  const [codeActuel, setCodeActuel] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Charge le code d'accès actuel (parent uniquement)
  useEffect(() => {
    if (compte.role !== "parent") return;
    fetch("/api/auth/change-code-acces", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.codeAcces) setCodeActuel(d.codeAcces);
      });
  }, [compte.role]);

  function notifier(msg: string) {
    setInfo(msg);
    setTimeout(() => setInfo(null), 3500);
  }

  async function deconnexion() {
    await logout();
    router.replace("/login");
  }

  return (
    <>
      <AppHeader title="Mon profil" subtitle="Compte et préférences" />
      <AppShell>
        <div className="px-5 py-4 space-y-5">
          {info ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              ✓ {info}
            </div>
          ) : null}

          <section className="rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-dark)] p-5 text-white shadow-sm">
            <div className="text-xs opacity-80">Connecté en tant que</div>
            <div className="text-lg font-semibold">
              {compte.prenom} {compte.nom}
            </div>
            <div className="text-xs opacity-90">{compte.email}</div>
            {compte.telephone ? (
              <div className="text-xs opacity-90">{compte.telephone}</div>
            ) : null}
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-[var(--brand-primary-dark)]">
              Mes enfants ({compte.enfants.length})
            </h2>
            {compte.enfants.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-muted)]/40 p-4 text-center text-xs text-[var(--text-muted)]">
                Aucun enfant n&apos;est encore rattaché à votre compte. Contactez le
                secrétariat pour faire ajouter vos enfants.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {compte.enfants.map((e, i) => (
                  <li
                    key={`${e.prenom}-${e.niveauId}-${i}`}
                    className="flex items-center justify-between gap-2 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">
                        {e.prenom} {e.nom}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {getPalier(e.palierId)?.nom} ·{" "}
                        {formatClasse(e.palierId, e.niveauId, e.section)}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-primary-dark)]">
                      Inscrit
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {codeActuel ? (
            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-[var(--brand-primary-dark)]">
                Mon code d&apos;accès
              </h2>
              <div className="flex items-center justify-between gap-2">
                <div className="rounded-lg bg-[var(--brand-soft)] px-3 py-1.5 font-mono text-base font-bold tracking-widest text-[var(--brand-primary-dark)]">
                  {codeActuel}
                </div>
                <button
                  onClick={() => setModaleCode(true)}
                  className="rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold hover:bg-[var(--surface-muted)]"
                >
                  Modifier
                </button>
              </div>
              <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                Ce code peut être demandé par l&apos;école pour vérifier votre identité.
              </p>
            </section>
          ) : null}

          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
            <PushToggle userEmail={compte.email} />
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
            <Lien label="Modifier le mot de passe" onClick={() => setModaleMdp(true)} />
            <Lien label="Langue" valeur="Français" disabled />
          </section>

          <button
            onClick={deconnexion}
            className="w-full rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            Se déconnecter
          </button>

          <p className="text-center text-[10px] text-[var(--text-muted)] pt-2">
            Espace Parents · v0.1 (prototype)
          </p>
        </div>
      </AppShell>

      {modaleMdp ? (
        <ModalChangerMdp
          onClose={() => setModaleMdp(false)}
          onSuccess={() => {
            setModaleMdp(false);
            notifier("Mot de passe modifié avec succès.");
          }}
        />
      ) : null}

      {modaleCode ? (
        <ModalChangerCode
          codeActuel={codeActuel ?? ""}
          onClose={() => setModaleCode(false)}
          onSuccess={(nouveauCode) => {
            setCodeActuel(nouveauCode);
            setModaleCode(false);
            notifier("Code d'accès modifié.");
          }}
        />
      ) : null}
    </>
  );
}

function Lien({
  label,
  valeur,
  onClick,
  disabled = false,
}: {
  label: string;
  valeur?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-between border-b border-[var(--border)] px-4 py-3 text-left text-sm last:border-b-0 hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
    >
      <span>{label}</span>
      <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
        {valeur}
        {!disabled ? <span aria-hidden>›</span> : null}
      </span>
    </button>
  );
}

function ModalChangerMdp({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (nouveau.length < 8) {
      setErreur("Le nouveau mot de passe doit faire au moins 8 caractères.");
      return;
    }
    if (nouveau !== confirmation) {
      setErreur("Les deux nouveaux mots de passe ne correspondent pas.");
      return;
    }
    setEnCours(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motDePasseActuel: actuel, nouveauMotDePasse: nouveau }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error ?? "Erreur");
        return;
      }
      onSuccess();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Modal onClose={onClose} titre="Modifier mon mot de passe">
      <form onSubmit={soumettre} className="space-y-3">
        <ChampMdp
          label="Mot de passe actuel"
          value={actuel}
          onChange={setActuel}
          autoFocus
        />
        <ChampMdp
          label="Nouveau mot de passe"
          value={nouveau}
          onChange={setNouveau}
          hint="8 caractères minimum"
        />
        <ChampMdp
          label="Confirmer le nouveau mot de passe"
          value={confirmation}
          onChange={setConfirmation}
        />

        {erreur ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            ⚠ {erreur}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold hover:bg-[var(--surface-muted)]"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={enCours}
            className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-primary-dark)] disabled:opacity-50"
          >
            {enCours ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ModalChangerCode({
  codeActuel,
  onClose,
  onSuccess,
}: {
  codeActuel: string;
  onClose: () => void;
  onSuccess: (nouveauCode: string) => void;
}) {
  const [code, setCode] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (!/^\d{6}$/.test(code)) {
      setErreur("Le code doit être composé exactement de 6 chiffres.");
      return;
    }
    if (code === codeActuel) {
      setErreur("Le nouveau code doit être différent de l'actuel.");
      return;
    }
    setEnCours(true);
    try {
      const res = await fetch("/api/auth/change-code-acces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeAcces: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error ?? "Erreur");
        return;
      }
      onSuccess(data.codeAcces);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Modal onClose={onClose} titre="Modifier mon code d'accès">
      <form onSubmit={soumettre} className="space-y-3">
        <p className="text-xs text-[var(--text-muted)]">
          Choisissez un code à 6 chiffres facile à mémoriser. Évitez les codes trop
          simples comme 123456.
        </p>
        <div>
          <label className="block text-xs font-medium mb-1">Nouveau code (6 chiffres)</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-center font-mono text-xl tracking-[0.5em] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
          />
        </div>

        {erreur ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            ⚠ {erreur}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold hover:bg-[var(--surface-muted)]"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={enCours || code.length !== 6}
            className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-primary-dark)] disabled:opacity-50"
          >
            {enCours ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ChampMdp({
  label,
  value,
  onChange,
  hint,
  autoFocus = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1">{label}</label>
      <input
        type="password"
        required
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
      />
      {hint ? <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{hint}</p> : null}
    </div>
  );
}

function Modal({
  children,
  onClose,
  titre,
}: {
  children: React.ReactNode;
  onClose: () => void;
  titre: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-xl bg-white p-5 shadow-2xl sm:rounded-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--brand-primary-dark)]">{titre}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-lg text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
