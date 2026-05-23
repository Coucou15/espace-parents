"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../_components/AdminShell";
import { formatClasse, type PalierId, type SectionId } from "../../lib/mockData";

type Demande = {
  id: string;
  parentPrenom: string;
  parentNom: string;
  email: string;
  telephone: string | null;
  date: string;
  enfants: Array<{
    prenom: string;
    nom: string;
    palierId: PalierId;
    niveauId: string;
    section: SectionId;
  }>;
};

export default function DemandesPage() {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [chargement, setChargement] = useState(true);
  const [validee, setValidee] = useState<{ email: string; code: string } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function rafraichir() {
    try {
      const res = await fetch("/api/demandes", { cache: "no-store" });
      if (!res.ok) {
        setErreur(`Erreur de chargement (HTTP ${res.status})`);
        return;
      }
      const data = await res.json();
      setDemandes(data.demandes ?? []);
      setErreur(null);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    rafraichir();
  }, []);

  async function valider(id: string) {
    setErreur(null);
    const res = await fetch(`/api/demandes/${id}/valider`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setErreur(data.error ?? "Échec de la validation");
      return;
    }
    setValidee({ email: data.user.email, code: data.codeAcces });
    await rafraichir();
    setTimeout(() => setValidee(null), 8000);
  }

  async function refuser(id: string) {
    if (!confirm("Confirmer le refus de cette demande ?")) return;
    setErreur(null);
    const res = await fetch(`/api/demandes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setErreur("Échec du refus");
      return;
    }
    await rafraichir();
  }

  return (
    <AdminShell>
      {() => (
        <div className="space-y-5">
          <header className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[var(--brand-primary-dark)]">
                Demandes d&apos;inscription
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                {chargement
                  ? "Chargement…"
                  : `${demandes.length} demande${demandes.length > 1 ? "s" : ""} en attente de validation.`}
              </p>
            </div>
            <button
              onClick={rafraichir}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-muted)]"
            >
              ↻ Rafraîchir
            </button>
          </header>

          {erreur ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              ⚠ {erreur}
            </div>
          ) : null}

          {validee ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-semibold mb-1">✓ Compte créé pour {validee.email}</p>
              <p className="text-xs">
                Code d&apos;accès :{" "}
                <strong className="font-mono text-base bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {validee.code}
                </strong>
              </p>
              <p className="text-xs mt-2">
                Communiquez ce code au parent (par e-mail, SMS ou téléphone) — il en
                aura besoin à sa première connexion.
              </p>
            </div>
          ) : null}

          {!chargement && demandes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-10 text-center text-sm text-[var(--text-muted)]">
              Aucune demande en attente. 🎉
            </div>
          ) : (
            <ul className="space-y-3">
              {demandes.map((d) => (
                <li
                  key={d.id}
                  className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm lg:p-5"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[var(--foreground)]">
                          {d.parentPrenom} {d.parentNom}
                        </h3>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          · {new Date(d.date).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-[var(--text-muted)]">
                        {d.email}
                        {d.telephone ? ` · ${d.telephone}` : ""}
                      </div>

                      <div className="mt-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                          Enfants déclarés
                        </div>
                        <ul className="mt-1 space-y-1">
                          {d.enfants.map((enfant, i) => (
                            <li key={i} className="text-xs">
                              <span className="font-medium">
                                {enfant.prenom} {enfant.nom}
                              </span>{" "}
                              <span className="text-[var(--text-muted)]">
                                · {formatClasse(enfant.palierId, enfant.niveauId, enfant.section)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => refuser(d.id)}
                        className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Refuser
                      </button>
                      <button
                        onClick={() => valider(d.id)}
                        className="rounded-lg bg-[var(--brand-primary)] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[var(--brand-primary-dark)]"
                      >
                        Valider et créer le compte
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </AdminShell>
  );
}
