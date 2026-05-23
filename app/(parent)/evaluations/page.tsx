"use client";

import { useState } from "react";
import { AppHeader } from "../../components/AppHeader";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../components/AuthGuard";
import {
  bulletins as bulletinsInitiaux,
  formatClasse,
  getNiveau,
  type BulletinEnfant,
} from "../../lib/mockData";
import { useSharedStore } from "../../lib/store";

export default function EvaluationsPage() {
  const [bulletins] = useSharedStore<BulletinEnfant[]>("bulletins", bulletinsInitiaux);
  const [index, setIndex] = useState(0);
  const bulletin = bulletins[Math.min(index, bulletins.length - 1)] ?? bulletins[0];

  if (!bulletin) {
    return (
      <AuthGuard>
        {() => (
          <>
            <AppHeader title="Évaluations" />
            <AppShell>
              <div className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">
                Aucun bulletin disponible pour le moment.
              </div>
            </AppShell>
          </>
        )}
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      {() => (
        <>
          <AppHeader title="Évaluations" subtitle={bulletin.trimestre} />
          <AppShell>
            <div className="px-5 py-4 space-y-4">
              {bulletins.length > 1 ? (
                <div className="flex gap-2">
                  {bulletins.map((b, i) => {
                    const niveau = getNiveau(b.palierId, b.niveauId);
                    const courtNom = niveau?.nomDz ?? niveau?.nomFr ?? "";
                    return (
                      <button
                        key={b.enfant}
                        onClick={() => setIndex(i)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                          i === index
                            ? "border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--brand-primary-dark)]"
                            : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
                        }`}
                      >
                        {b.enfant} · {courtNom}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <section className="rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-dark)] p-5 text-white shadow-sm">
                <div className="text-xs opacity-80">Moyenne générale</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{bulletin.moyenne.toFixed(1)}</span>
                  <span className="text-sm opacity-80">/ 20</span>
                </div>
                <div className="text-xs opacity-90 mt-1">
                  {bulletin.enfant} ·{" "}
                  {formatClasse(bulletin.palierId, bulletin.niveauId, bulletin.section)}
                </div>
              </section>

              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--brand-primary)] bg-[var(--surface)] py-2.5 text-sm font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-soft)]">
                ⬇ Télécharger le bulletin (PDF)
              </button>

              <section>
                <h2 className="mb-3 text-sm font-semibold text-[var(--brand-primary-dark)]">
                  Notes par matière
                </h2>
                <ul className="space-y-2">
                  {bulletin.evaluations.map((e) => (
                    <li
                      key={e.matiere}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold">{e.matiere}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">
                            {new Date(e.date).toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                        <NoteBadge note={e.note} noteSur={e.noteSur} />
                      </div>
                      <p className="mt-2 text-xs italic text-[var(--text-muted)]">
                        « {e.appreciation} »
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </AppShell>
        </>
      )}
    </AuthGuard>
  );
}

function NoteBadge({ note, noteSur }: { note: number; noteSur: number }) {
  const ratio = note / noteSur;
  const couleur =
    ratio >= 0.8
      ? "bg-emerald-100 text-emerald-700"
      : ratio >= 0.6
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";
  return (
    <span className={`rounded-lg px-2.5 py-1 text-sm font-bold ${couleur}`}>
      {note}/{noteSur}
    </span>
  );
}
