"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "../_components/AdminShell";
import {
  JOURS_SEMAINE,
  SECTIONS,
  classeId,
  emploisDuTempsParClasse,
  formatNiveau,
  paliers,
  type ClasseId,
  type Cours,
  type JourEdt,
  type Niveau,
  type Palier,
  type PalierId,
  type SectionId,
} from "../../lib/mockData";
import { useSharedStore } from "../../lib/store";

type ClasseListee = {
  id: ClasseId;
  palier: Palier;
  niveau: Niveau;
  section: SectionId;
  nbCours: number;
};

export default function EdtAdmin() {
  const [edts, setEdts] = useSharedStore<Record<ClasseId, JourEdt[]>>(
    "edts",
    emploisDuTempsParClasse
  );
  const [filtrePalier, setFiltrePalier] = useState<PalierId | "tous">("tous");
  const [recherche, setRecherche] = useState("");
  const [classeActive, setClasseActive] = useState<ClasseId | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // La liste des classes est dérivée de l'état partagé (pas un useState séparé)
  const classes = useMemo(() => {
    const liste: ClasseListee[] = [];
    paliers.forEach((p) => {
      p.niveaux.forEach((n) => {
        SECTIONS.forEach((s) => {
          const id = classeId(p.id, n.id, s);
          const edt = edts[id] ?? [];
          const nbCours = edt.reduce((acc, j) => acc + j.cours.length, 0);
          liste.push({ id, palier: p, niveau: n, section: s, nbCours });
        });
      });
    });
    return liste;
  }, [edts]);

  const classesFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return classes.filter((c) => {
      if (filtrePalier !== "tous" && c.palier.id !== filtrePalier) return false;
      if (!q) return true;
      return (
        c.niveau.nomFr.toLowerCase().includes(q) ||
        (c.niveau.nomDz ?? "").toLowerCase().includes(q) ||
        c.palier.nom.toLowerCase().includes(q) ||
        c.section.toLowerCase().includes(q)
      );
    });
  }, [classes, filtrePalier, recherche]);

  function notifier(msg: string) {
    setInfo(msg);
    setTimeout(() => setInfo(null), 2500);
  }

  function mettreAJourEdt(id: ClasseId, nouvelEdt: JourEdt[]) {
    setEdts((curr) => ({ ...curr, [id]: nouvelEdt }));
  }

  function viderClasse(id: ClasseId) {
    if (!confirm("Vider l'emploi du temps de cette classe ?")) return;
    mettreAJourEdt(id, []);
    notifier("Emploi du temps vidé.");
  }

  const classeOuverte = classes.find((c) => c.id === classeActive);

  return (
    <AdminShell>
      {() => (
        <div className="space-y-5">
          <header>
            <h1 className="text-xl font-bold text-[var(--brand-primary-dark)]">
              Emplois du temps par classe
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Sélectionnez une classe pour éditer son emploi du temps hebdomadaire.
            </p>
          </header>

          {info ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              ✓ {info}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher (niveau, section…)"
              className="flex-1 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
            />
            <div className="flex gap-1 overflow-x-auto rounded-lg bg-[var(--surface-muted)] p-1 text-xs">
              {(
                [
                  { id: "tous" as const, label: "Tous" },
                  ...paliers.map((p) => ({ id: p.id, label: p.nom })),
                ]
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFiltrePalier(opt.id)}
                  className={`shrink-0 rounded-md px-3 py-1.5 font-semibold transition ${
                    filtrePalier === opt.id
                      ? "bg-white text-[var(--brand-primary-dark)] shadow-sm"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {classesFiltrees.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setClasseActive(c.id)}
                  className={`flex w-full flex-col items-start gap-1 rounded-xl border bg-white p-3 text-left shadow-sm transition hover:border-[var(--brand-primary)]/30 hover:shadow-md ${
                    c.nbCours > 0 ? "border-[var(--border)]" : "border-dashed border-[var(--border)]"
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    {c.palier.nom}
                  </span>
                  <span className="text-sm font-bold text-[var(--brand-primary-dark)]">
                    {formatNiveau(c.niveau)} · {c.section}
                  </span>
                  <span
                    className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      c.nbCours > 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {c.nbCours} cours
                  </span>
                </button>
              </li>
            ))}
            {classesFiltrees.length === 0 ? (
              <li className="col-span-full rounded-xl border border-dashed border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--text-muted)]">
                Aucune classe ne correspond.
              </li>
            ) : null}
          </ul>

          {classeOuverte ? (
            <EditeurEdt
              classe={classeOuverte}
              edt={edts[classeOuverte.id] ?? []}
              onChange={(nouvelEdt) => mettreAJourEdt(classeOuverte.id, nouvelEdt)}
              onClose={() => setClasseActive(null)}
              onVider={() => viderClasse(classeOuverte.id)}
              onNotify={notifier}
            />
          ) : null}
        </div>
      )}
    </AdminShell>
  );
}

function EditeurEdt({
  classe,
  edt,
  onChange,
  onClose,
  onVider,
  onNotify,
}: {
  classe: ClasseListee;
  edt: JourEdt[];
  onChange: (e: JourEdt[]) => void;
  onClose: () => void;
  onVider: () => void;
  onNotify: (msg: string) => void;
}) {
  const [jourActif, setJourActif] = useState<string>(JOURS_SEMAINE[0]);
  const edtCourant = JOURS_SEMAINE.map((jour) => {
    const trouve = edt.find((j) => j.jour === jour);
    return trouve ?? { jour, cours: [] };
  });
  const jour = edtCourant.find((j) => j.jour === jourActif)!;

  function ajouterCours() {
    const nouveau: Cours = {
      id: `c${Date.now()}`,
      matiere: "Nouvelle matière",
      enseignant: "",
      salle: "",
      debut: "08:30",
      fin: "09:30",
    };
    const nouvelEdt = edtCourant.map((j) =>
      j.jour === jourActif ? { ...j, cours: [...j.cours, nouveau] } : j
    );
    onChange(nouvelEdt);
  }

  function modifierCours(coursId: string, patch: Partial<Cours>) {
    const nouvelEdt = edtCourant.map((j) =>
      j.jour === jourActif
        ? { ...j, cours: j.cours.map((c) => (c.id === coursId ? { ...c, ...patch } : c)) }
        : j
    );
    onChange(nouvelEdt);
  }

  function supprimerCours(coursId: string) {
    const nouvelEdt = edtCourant.map((j) =>
      j.jour === jourActif ? { ...j, cours: j.cours.filter((c) => c.id !== coursId) } : j
    );
    onChange(nouvelEdt);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 lg:items-center lg:p-4">
      <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-xl bg-white shadow-2xl lg:rounded-xl">
        <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {classe.palier.nom}
            </div>
            <h2 className="text-base font-bold text-[var(--brand-primary-dark)]">
              {formatNiveau(classe.niveau)} · Section {classe.section}
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onNotify("Emploi du temps publié aux parents.");
                onClose();
              }}
              className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--brand-primary-dark)]"
            >
              💾 Publier
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-lg text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="flex gap-1 overflow-x-auto border-b border-[var(--border)] bg-[var(--surface-muted)] px-5 py-2">
          {JOURS_SEMAINE.map((j) => {
            const nbCours = edtCourant.find((e) => e.jour === j)?.cours.length ?? 0;
            return (
              <button
                key={j}
                onClick={() => setJourActif(j)}
                className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  j === jourActif
                    ? "bg-[var(--brand-primary)] text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:bg-white"
                }`}
              >
                {j}{" "}
                {nbCours > 0 ? (
                  <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px]">
                    {nbCours}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {jour.cours.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)]/50 p-10 text-center text-sm text-[var(--text-muted)]">
              Aucun cours pour {jour.jour}.
              <div className="mt-3">
                <button
                  onClick={ajouterCours}
                  className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-primary-dark)]"
                >
                  + Ajouter un cours
                </button>
              </div>
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {jour.cours.map((c) => (
                  <li
                    key={c.id}
                    className="grid grid-cols-1 gap-2 rounded-lg border border-[var(--border)] bg-white p-3 sm:grid-cols-[80px_80px_1fr_1fr_80px_auto]"
                  >
                    <ChampMini
                      label="Début"
                      type="time"
                      value={c.debut}
                      onChange={(v) => modifierCours(c.id, { debut: v })}
                    />
                    <ChampMini
                      label="Fin"
                      type="time"
                      value={c.fin}
                      onChange={(v) => modifierCours(c.id, { fin: v })}
                    />
                    <ChampMini
                      label="Matière"
                      value={c.matiere}
                      onChange={(v) => modifierCours(c.id, { matiere: v })}
                    />
                    <ChampMini
                      label="Enseignant"
                      value={c.enseignant}
                      onChange={(v) => modifierCours(c.id, { enseignant: v })}
                    />
                    <ChampMini
                      label="Salle"
                      value={c.salle}
                      onChange={(v) => modifierCours(c.id, { salle: v })}
                    />
                    <div className="flex items-end">
                      <button
                        onClick={() => supprimerCours(c.id)}
                        className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-600 hover:bg-red-100"
                        title="Supprimer"
                      >
                        🗑
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between gap-2">
                <button
                  onClick={onVider}
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Vider la semaine
                </button>
                <button
                  onClick={ajouterCours}
                  className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--brand-primary-dark)]"
                >
                  + Ajouter un cours
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ChampMini({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-0.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-xs focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
      />
    </div>
  );
}
