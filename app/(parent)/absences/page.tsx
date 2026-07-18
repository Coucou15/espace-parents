"use client";

import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "../../components/AppHeader";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../components/AuthGuard";
import type { EnfantInscrit } from "../../lib/auth";

type Absence = {
  id: string;
  enfantId: string;
  enfantPrenom: string;
  date: string;
  periode: "journee" | "matin" | "apresmidi";
  motif: string | null;
  justifiee: boolean;
  signaleParNom: string;
  createdAt: string;
};

const PERIODE_LABELS: Record<Absence["periode"], string> = {
  journee: "Journée entière",
  matin: "Matinée",
  apresmidi: "Après-midi",
};

export default function AbsencesParentPage() {
  return <AuthGuard>{(c) => <Contenu enfants={c.enfants} />}</AuthGuard>;
}

function Contenu({ enfants }: { enfants: EnfantInscrit[] }) {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [chargement, setChargement] = useState(true);
  const [filtreEnfant, setFiltreEnfant] = useState<string>("tous");

  useEffect(() => {
    fetch("/api/absences", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { absences: [] }))
      .then((d) => setAbsences(d.absences ?? []))
      .finally(() => setChargement(false));
  }, []);

  const liste = useMemo(() => {
    if (filtreEnfant === "tous") return absences;
    return absences.filter((a) => a.enfantId === filtreEnfant);
  }, [absences, filtreEnfant]);

  const compteurs = useMemo(() => {
    const m = new Map<string, { total: number; nonJustifiees: number }>();
    absences.forEach((a) => {
      const c = m.get(a.enfantId) ?? { total: 0, nonJustifiees: 0 };
      c.total += 1;
      if (!a.justifiee) c.nonJustifiees += 1;
      m.set(a.enfantId, c);
    });
    return m;
  }, [absences]);

  return (
    <>
      <AppHeader title="Absences" subtitle="Historique de vos enfants" />
      <AppShell>
        <div className="px-5 py-4 space-y-4">
          {enfants.length > 1 ? (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setFiltreEnfant("tous")}
                className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  filtreEnfant === "tous"
                    ? "border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--brand-primary-dark)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
                }`}
              >
                Tous ({absences.length})
              </button>
              {enfants.map((e) => {
                const c = compteurs.get(e.id ?? "") ?? { total: 0, nonJustifiees: 0 };
                return (
                  <button
                    key={e.id ?? e.prenom}
                    onClick={() => setFiltreEnfant(e.id ?? "")}
                    className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      filtreEnfant === e.id
                        ? "border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--brand-primary-dark)]"
                        : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
                    }`}
                  >
                    {e.prenom} ({c.total})
                    {c.nonJustifiees > 0 ? (
                      <span className="ml-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">
                        {c.nonJustifiees} non j.
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          {chargement ? (
            <p className="text-center text-xs text-[var(--text-muted)]">Chargement…</p>
          ) : liste.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-muted)]">
              🎉 Aucune absence enregistrée.
            </div>
          ) : (
            <ul className="space-y-2">
              {liste.map((a) => {
                const dateJolie = new Date(a.date + "T12:00:00").toLocaleDateString(
                  "fr-FR",
                  { weekday: "long", day: "2-digit", month: "long", year: "numeric" }
                );
                return (
                  <li
                    key={a.id}
                    className={`rounded-xl border p-3 shadow-sm ${
                      a.justifiee
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-amber-200 bg-amber-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold">
                            {a.enfantPrenom}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              a.justifiee
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {a.justifiee ? "✓ Justifiée" : "⚠ Non justifiée"}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {PERIODE_LABELS[a.periode]}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-[var(--brand-primary-dark)] font-medium capitalize">
                          {dateJolie}
                        </div>
                        {a.motif ? (
                          <p className="mt-1 text-xs italic text-[var(--text-muted)]">
                            « {a.motif} »
                          </p>
                        ) : null}
                        <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                          Signalé par {a.signaleParNom}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/40 p-3 text-[11px] text-[var(--text-muted)]">
            💡 Pour justifier une absence, contactez le secrétariat par téléphone ou
            depuis la page « Nous contacter » avec le justificatif approprié.
          </div>
        </div>
      </AppShell>
    </>
  );
}
