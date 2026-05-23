"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "../../components/AppHeader";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../components/AuthGuard";
import type { EnfantInscrit } from "../../lib/auth";
import {
  classeId,
  emploisDuTempsParClasse,
  formatClasse,
  getNiveau,
  type ClasseId,
  type JourEdt,
} from "../../lib/mockData";
import { useSharedStore } from "../../lib/store";

const couleursMatiere: Record<string, string> = {
  Français: "border-l-blue-500",
  Mathématiques: "border-l-emerald-500",
  Sciences: "border-l-purple-500",
  SVT: "border-l-purple-500",
  "Physique-Chimie": "border-l-fuchsia-500",
  Anglais: "border-l-amber-500",
  Arabe: "border-l-teal-500",
  Sport: "border-l-red-500",
  EPS: "border-l-red-500",
  "Arts plastiques": "border-l-pink-500",
  "Arts visuels": "border-l-pink-500",
  Musique: "border-l-violet-500",
  "Histoire-Géo": "border-l-orange-500",
  Récréation: "border-l-slate-300",
  Motricité: "border-l-red-500",
  "Atelier lecture": "border-l-blue-500",
  "Atelier mathématiques": "border-l-emerald-500",
  "Accueil et regroupement": "border-l-slate-300",
};

export default function EmploiDuTempsPage() {
  return <AuthGuard>{(compte) => <Contenu enfants={compte.enfants} />}</AuthGuard>;
}

function Contenu({ enfants }: { enfants: EnfantInscrit[] }) {
  const [edts] = useSharedStore<Record<ClasseId, JourEdt[]>>(
    "edts",
    emploisDuTempsParClasse
  );
  const [enfantIndex, setEnfantIndex] = useState(0);
  const enfant = enfants[enfantIndex];
  const niveau = enfant ? getNiveau(enfant.palierId, enfant.niveauId) : undefined;

  const edt = useMemo(
    () =>
      enfant
        ? edts[classeId(enfant.palierId, enfant.niveauId, enfant.section)] ?? []
        : [],
    [enfant, edts]
  );

  const joursAvecCours = edt.filter((j) => j.cours.length > 0);
  const [jourActif, setJourActif] = useState(joursAvecCours[0]?.jour ?? "Lundi");
  const jour = edt.find((j) => j.jour === jourActif);

  return (
    <>
      <AppHeader
        title="Emploi du temps"
        subtitle={
          enfant
            ? `${enfant.prenom} · ${niveau?.nomDz ?? niveau?.nomFr ?? ""} ${enfant.section}`
            : undefined
        }
      />
      <AppShell>
        <div className="px-5 py-4 space-y-4">
          {enfants.length > 1 ? (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {enfants.map((e, i) => (
                <button
                  key={`${e.prenom}-${i}`}
                  onClick={() => setEnfantIndex(i)}
                  className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    i === enfantIndex
                      ? "border-[var(--brand-primary)] bg-[var(--brand-soft)] text-[var(--brand-primary-dark)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
                  }`}
                >
                  {e.prenom}
                </button>
              ))}
            </div>
          ) : null}

          {joursAvecCours.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--text-muted)]">
              📅 Aucun emploi du temps n&apos;est encore disponible pour la classe{" "}
              <strong>
                {enfant
                  ? formatClasse(enfant.palierId, enfant.niveauId, enfant.section)
                  : ""}
              </strong>
              .
              <p className="mt-2 text-xs">
                L&apos;administration le publiera prochainement.
              </p>
            </div>
          ) : (
            <>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {edt.map((j) => (
                  <button
                    key={j.jour}
                    onClick={() => setJourActif(j.jour)}
                    disabled={j.cours.length === 0}
                    className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-40 ${
                      j.jour === jourActif
                        ? "bg-[var(--brand-primary)] text-white shadow"
                        : "bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]"
                    }`}
                  >
                    {j.jour}
                  </button>
                ))}
              </div>

              {jour && jour.cours.length > 0 ? (
                <ul className="space-y-2">
                  {jour.cours.map((c) => (
                    <li
                      key={c.id}
                      className={`flex gap-3 rounded-xl border border-[var(--border)] border-l-4 bg-[var(--surface)] p-3 shadow-sm ${
                        couleursMatiere[c.matiere] ?? "border-l-[var(--brand-primary)]"
                      } ${c.modifie ? "ring-2 ring-amber-300" : ""}`}
                    >
                      <div className="flex flex-col items-center justify-center text-[10px] font-semibold text-[var(--text-muted)]">
                        <span>{c.debut}</span>
                        <span className="my-0.5 h-3 w-px bg-[var(--border)]" />
                        <span>{c.fin}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold">{c.matiere}</h3>
                          {c.modifie ? (
                            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                              Modifié
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {c.enseignant} · Salle {c.salle}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-center text-xs text-[var(--text-muted)]">
                  Pas de cours ce jour-là.
                </p>
              )}

              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--brand-primary)] bg-[var(--surface)] py-2.5 text-sm font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-soft)]">
                ⬇ Télécharger l&apos;emploi du temps (PDF)
              </button>
            </>
          )}
        </div>
      </AppShell>
    </>
  );
}
