"use client";

import { useEffect, useMemo, useState } from "react";
import { AmbianceBanner } from "../../components/AmbianceBanner";
import { AppHeader } from "../../components/AppHeader";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../components/AuthGuard";
import type { EnfantInscrit } from "../../lib/auth";

type Appreciation = {
  id: string;
  enseignantNom: string;
  enfantId: string;
  enfantPrenom: string;
  matiere: string | null;
  type: "positif" | "neutre" | "amelioration" | "comportement";
  texte: string;
  date: string;
};

const TYPES = {
  positif: { label: "Positif", couleur: "bg-emerald-50 border-emerald-200 text-emerald-800", emoji: "👏" },
  neutre: { label: "Observation", couleur: "bg-slate-50 border-slate-200 text-slate-800", emoji: "💬" },
  amelioration: { label: "À améliorer", couleur: "bg-amber-50 border-amber-200 text-amber-800", emoji: "📈" },
  comportement: { label: "Comportement", couleur: "bg-blue-50 border-blue-200 text-blue-800", emoji: "🤝" },
} as const;

export default function AppreciationsParent() {
  return <AuthGuard>{(c) => <Contenu enfants={c.enfants} />}</AuthGuard>;
}

function Contenu({ enfants }: { enfants: EnfantInscrit[] }) {
  const [appreciations, setAppreciations] = useState<Appreciation[]>([]);
  const [filtreEnfant, setFiltreEnfant] = useState<string>("tous");
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    fetch("/api/appreciations", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { appreciations: [] }))
      .then((d) => setAppreciations(d.appreciations ?? []))
      .finally(() => setChargement(false));
  }, []);

  const liste = useMemo(() => {
    if (filtreEnfant === "tous") return appreciations;
    return appreciations.filter((a) => a.enfantId === filtreEnfant);
  }, [appreciations, filtreEnfant]);

  // Compteur par enfant pour les badges des filtres
  const compteurs = useMemo(() => {
    const m = new Map<string, number>();
    appreciations.forEach((a) => m.set(a.enfantId, (m.get(a.enfantId) ?? 0) + 1));
    return m;
  }, [appreciations]);

  return (
    <>
      <AppHeader title="Suivi continu" subtitle="Appréciations des enseignants" />
      <AppShell>
        <AmbianceBanner slot="evaluations" />
        <div className="px-5 py-4 space-y-4">
          {enfants.length > 1 ? (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <FiltreButton
                actif={filtreEnfant === "tous"}
                onClick={() => setFiltreEnfant("tous")}
              >
                Tous · {appreciations.length}
              </FiltreButton>
              {enfants.map((e, i) => (
                <FiltreButton
                  key={e.id ?? i}
                  actif={filtreEnfant === e.id}
                  onClick={() => setFiltreEnfant(e.id ?? "")}
                >
                  {e.prenom}
                  {e.id && compteurs.has(e.id) ? (
                    <span className="ml-1 rounded-full bg-white/30 px-1.5 py-0.5 text-[9px]">
                      {compteurs.get(e.id)}
                    </span>
                  ) : null}
                </FiltreButton>
              ))}
            </div>
          ) : null}

          {chargement ? (
            <p className="text-center text-xs text-[var(--text-muted)]">Chargement…</p>
          ) : liste.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-muted)]">
              {appreciations.length === 0
                ? "Aucune appréciation reçue pour le moment. Les enseignants vous laisseront des messages au fil de l'année."
                : "Aucune appréciation pour ce filtre."}
            </div>
          ) : (
            <ul className="space-y-2">
              {liste.map((a) => {
                const t = TYPES[a.type] ?? TYPES.neutre;
                return (
                  <li
                    key={a.id}
                    className={`rounded-xl border ${t.couleur} p-3 shadow-sm`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide">
                        {t.emoji} {t.label}
                      </span>
                      <span className="text-[10px] opacity-70">
                        {new Date(a.date).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-sm font-bold">{a.enfantPrenom}</span>
                      {a.matiere ? (
                        <span className="text-[11px] opacity-80">· {a.matiere}</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed">{a.texte}</p>
                    <p className="mt-1.5 text-[10px] italic opacity-70">
                      — {a.enseignantNom}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </AppShell>
    </>
  );
}

function FiltreButton({
  actif,
  onClick,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
        actif
          ? "border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--brand-primary-dark)]"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
      }`}
    >
      {children}
    </button>
  );
}
