"use client";

import { useState } from "react";
import { AdminShell } from "../_components/AdminShell";
import {
  demandesInitiales,
  genererCodeAcces,
  type DemandeInscription,
} from "../_lib/adminMockData";
import { formatClasse } from "../../lib/mockData";

type DemandeAvecCode = DemandeInscription & { code?: string };

export default function DemandesPage() {
  const [demandes, setDemandes] = useState<DemandeAvecCode[]>(demandesInitiales);
  const [validee, setValidee] = useState<{ id: string; code: string } | null>(null);

  function valider(id: string) {
    const code = genererCodeAcces();
    setValidee({ id, code });
    setTimeout(() => {
      setDemandes((curr) => curr.filter((d) => d.id !== id));
      setValidee(null);
    }, 3000);
  }

  function refuser(id: string) {
    if (confirm("Confirmer le refus de cette demande ?")) {
      setDemandes((curr) => curr.filter((d) => d.id !== id));
    }
  }

  return (
    <AdminShell>
      {() => (
        <div className="space-y-5">
          <header>
            <h1 className="text-xl font-bold text-[var(--brand-primary-dark)]">
              Demandes d&apos;inscription
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              {demandes.length} demande{demandes.length > 1 ? "s" : ""} en attente de
              validation.
            </p>
          </header>

          {validee ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-semibold mb-1">✓ Demande validée</p>
              <p className="text-xs">
                Le code d&apos;accès <strong className="font-mono text-base">{validee.code}</strong>{" "}
                a été envoyé au parent par e-mail et SMS.
              </p>
            </div>
          ) : null}

          {demandes.length === 0 ? (
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
                        {d.email} · {d.telephone}
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
                        Valider et envoyer le code
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
