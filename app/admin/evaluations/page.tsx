"use client";

import { useState } from "react";
import { AdminShell } from "../_components/AdminShell";
import {
  SECTIONS,
  bulletins as bulletinsInitiaux,
  formatClasse,
  paliers,
  type BulletinEnfant,
  type Evaluation,
  type PalierId,
  type SectionId,
} from "../../lib/mockData";
import { useSharedStore } from "../../lib/store";

function calculerMoyenne(evals: Evaluation[]): number {
  if (evals.length === 0) return 0;
  const total = evals.reduce((acc, e) => acc + (e.note / e.noteSur) * 20, 0);
  return Math.round((total / evals.length) * 10) / 10;
}

export default function EvaluationsAdmin() {
  const [bulletins, setBulletins] = useSharedStore<BulletinEnfant[]>(
    "bulletins",
    bulletinsInitiaux
  );
  const [selectionId, setSelectionId] = useState<string | null>(
    bulletinsInitiaux[0]
      ? `${bulletinsInitiaux[0].enfant}-${bulletinsInitiaux[0].niveauId}`
      : null
  );
  const [creation, setCreation] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  function bulletinKey(b: BulletinEnfant) {
    return `${b.enfant}-${b.niveauId}`;
  }

  const selection = bulletins.find((b) => bulletinKey(b) === selectionId) ?? null;

  function notifier(msg: string) {
    setInfo(msg);
    setTimeout(() => setInfo(null), 2500);
  }

  function modifierBulletin(key: string, patch: Partial<BulletinEnfant>) {
    setBulletins((curr) =>
      curr.map((b) => {
        if (bulletinKey(b) !== key) return b;
        const next = { ...b, ...patch };
        if (patch.evaluations) {
          next.moyenne = calculerMoyenne(patch.evaluations);
        }
        return next;
      })
    );
  }

  function supprimerBulletin(key: string) {
    if (!confirm("Supprimer ce bulletin ?")) return;
    setBulletins((curr) => curr.filter((b) => bulletinKey(b) !== key));
    if (selectionId === key) setSelectionId(null);
    notifier("Bulletin supprimé.");
  }

  function creerBulletin(b: Omit<BulletinEnfant, "moyenne" | "evaluations">) {
    const nouveau: BulletinEnfant = {
      ...b,
      moyenne: 0,
      evaluations: [],
    };
    setBulletins((curr) => [...curr, nouveau]);
    setSelectionId(bulletinKey(nouveau));
    setCreation(false);
    notifier("Bulletin créé. Ajoutez les notes par matière.");
  }

  return (
    <AdminShell>
      {() => (
        <div className="space-y-5">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-bold text-[var(--brand-primary-dark)]">
                Évaluations
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                {bulletins.length} bulletin{bulletins.length > 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => setCreation(true)}
              className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-primary-dark)]"
            >
              + Nouveau bulletin
            </button>
          </header>

          {info ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              ✓ {info}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[280px_1fr]">
            <nav className="space-y-1 overflow-hidden rounded-xl border border-[var(--border)] bg-white p-2 shadow-sm">
              {bulletins.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">
                  Aucun bulletin.
                </p>
              ) : (
                bulletins.map((b) => {
                  const key = bulletinKey(b);
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectionId(key)}
                      className={`flex w-full flex-col gap-0.5 rounded-md px-3 py-2 text-left transition ${
                        selectionId === key
                          ? "bg-[var(--brand-soft)]"
                          : "hover:bg-[var(--surface-muted)]"
                      }`}
                    >
                      <span className="text-sm font-semibold">{b.enfant}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {formatClasse(b.palierId, b.niveauId, b.section)}
                      </span>
                      <span className="text-[10px] font-semibold text-[var(--brand-primary-dark)]">
                        Moyenne : {b.moyenne.toFixed(1)}/20 · {b.evaluations.length} notes
                      </span>
                    </button>
                  );
                })
              )}
            </nav>

            <div>
              {selection ? (
                <EditeurBulletin
                  key={bulletinKey(selection)}
                  bulletin={selection}
                  onChange={(patch) => modifierBulletin(bulletinKey(selection), patch)}
                  onDelete={() => supprimerBulletin(bulletinKey(selection))}
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-white p-10 text-sm text-[var(--text-muted)]">
                  Sélectionnez un bulletin à gauche, ou créez-en un nouveau.
                </div>
              )}
            </div>
          </div>

          {creation ? (
            <CreationBulletin
              onCreate={creerBulletin}
              onClose={() => setCreation(false)}
            />
          ) : null}
        </div>
      )}
    </AdminShell>
  );
}

function EditeurBulletin({
  bulletin,
  onChange,
  onDelete,
}: {
  bulletin: BulletinEnfant;
  onChange: (patch: Partial<BulletinEnfant>) => void;
  onDelete: () => void;
}) {
  function modifierEvaluation(i: number, patch: Partial<Evaluation>) {
    onChange({
      evaluations: bulletin.evaluations.map((e, idx) =>
        idx === i ? { ...e, ...patch } : e
      ),
    });
  }

  function ajouterEvaluation() {
    const nouvelle: Evaluation = {
      matiere: "Nouvelle matière",
      note: 10,
      noteSur: 20,
      appreciation: "",
      date: new Date().toISOString().slice(0, 10),
    };
    onChange({ evaluations: [...bulletin.evaluations, nouvelle] });
  }

  function supprimerEvaluation(i: number) {
    onChange({ evaluations: bulletin.evaluations.filter((_, idx) => idx !== i) });
  }

  return (
    <article className="space-y-4 rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-bold text-[var(--brand-primary-dark)]">
            {bulletin.enfant}
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            {formatClasse(bulletin.palierId, bulletin.niveauId, bulletin.section)} ·{" "}
            <input
              type="text"
              value={bulletin.trimestre}
              onChange={(e) => onChange({ trimestre: e.target.value })}
              className="ml-1 rounded border border-[var(--border)] bg-white px-2 py-0.5 text-xs"
              size={28}
            />
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[var(--brand-soft)] px-3 py-1.5 text-center">
            <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
              Moyenne
            </div>
            <div className="text-lg font-bold text-[var(--brand-primary-dark)]">
              {bulletin.moyenne.toFixed(1)}/20
            </div>
          </div>
          <button
            onClick={onDelete}
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
          >
            🗑 Supprimer
          </button>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Notes par matière ({bulletin.evaluations.length})
          </h3>
          <button
            onClick={ajouterEvaluation}
            className="rounded-lg bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--brand-primary-dark)]"
          >
            + Matière
          </button>
        </div>

        {bulletin.evaluations.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-muted)]/50 p-6 text-center text-xs text-[var(--text-muted)]">
            Aucune note. Cliquez sur « + Matière » pour ajouter la première.
          </p>
        ) : (
          <ul className="space-y-2">
            {bulletin.evaluations.map((e, i) => (
              <li
                key={i}
                className="grid grid-cols-1 gap-2 rounded-lg border border-[var(--border)] bg-white p-3 sm:grid-cols-[1.5fr_70px_70px_120px_2fr_auto]"
              >
                <Mini
                  label="Matière"
                  value={e.matiere}
                  onChange={(v) => modifierEvaluation(i, { matiere: v })}
                />
                <Mini
                  label="Note"
                  type="number"
                  value={String(e.note)}
                  onChange={(v) => modifierEvaluation(i, { note: parseFloat(v) || 0 })}
                />
                <Mini
                  label="Sur"
                  type="number"
                  value={String(e.noteSur)}
                  onChange={(v) =>
                    modifierEvaluation(i, { noteSur: parseFloat(v) || 20 })
                  }
                />
                <Mini
                  label="Date"
                  type="date"
                  value={e.date}
                  onChange={(v) => modifierEvaluation(i, { date: v })}
                />
                <Mini
                  label="Appréciation"
                  value={e.appreciation}
                  onChange={(v) => modifierEvaluation(i, { appreciation: v })}
                />
                <div className="flex items-end">
                  <button
                    onClick={() => supprimerEvaluation(i)}
                    className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-600 hover:bg-red-100"
                    title="Supprimer la matière"
                  >
                    🗑
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

function CreationBulletin({
  onCreate,
  onClose,
}: {
  onCreate: (b: Omit<BulletinEnfant, "moyenne" | "evaluations">) => void;
  onClose: () => void;
}) {
  const [enfant, setEnfant] = useState("");
  const [palierId, setPalierId] = useState<PalierId | "">("");
  const [niveauId, setNiveauId] = useState("");
  const [section, setSection] = useState<SectionId>("A");
  const [trimestre, setTrimestre] = useState("3ᵉ trimestre 2025-2026");

  const palier = palierId ? paliers.find((p) => p.id === palierId) : undefined;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!enfant || !palierId || !niveauId) return;
    onCreate({ enfant, palierId, niveauId, section, trimestre });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--brand-primary-dark)]">
            Nouveau bulletin
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-lg text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Prénom de l&apos;élève</label>
            <input
              required
              value={enfant}
              onChange={(e) => setEnfant(e.target.value)}
              placeholder="Ex: Sami"
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Palier</label>
            <select
              required
              value={palierId}
              onChange={(e) => {
                setPalierId(e.target.value as PalierId);
                setNiveauId("");
              }}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
            >
              <option value="">— Choisir —</option>
              {paliers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </div>

          {palier ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">Niveau</label>
                <select
                  required
                  value={niveauId}
                  onChange={(e) => setNiveauId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                >
                  <option value="">— Choisir —</option>
                  {palier.niveaux.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.nomDz ? `${n.nomDz} (${n.nomFr})` : n.nomFr}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Section</label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value as SectionId)}
                  className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                >
                  {SECTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          <div>
            <label className="block text-xs font-medium mb-1">Trimestre</label>
            <input
              required
              value={trimestre}
              onChange={(e) => setTrimestre(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold hover:bg-[var(--surface-muted)]"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-primary-dark)]"
          >
            Créer
          </button>
        </div>
      </form>
    </div>
  );
}

function Mini({
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
