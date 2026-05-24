"use client";

import { useRef, useState } from "react";
import { AdminShell } from "../_components/AdminShell";
import { reglement as reglementInitial, type SectionReglement } from "../../lib/mockData";
import { useSharedStore } from "../../lib/store";

type DocumentPdf = {
  nom: string; // nom de fichier original
  taille: number; // octets
  base64: string; // data URL complet (data:application/pdf;base64,...)
};

type Reglement = {
  version: string;
  miseAJour: string;
  sections: SectionReglement[];
  pdf?: DocumentPdf | null;
};

export default function ReglementAdmin() {
  const [reglement, setReglement] = useSharedStore<Reglement>("reglement", reglementInitial);
  const [editionIndex, setEditionIndex] = useState<number | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function notifier(msg: string) {
    setInfo(msg);
    setTimeout(() => setInfo(null), 2500);
  }

  function toucherMiseAJour() {
    setReglement((r) => ({ ...r, miseAJour: new Date().toISOString().slice(0, 10) }));
  }

  function ajouterSection() {
    setReglement((r) => ({
      ...r,
      sections: [...r.sections, { titre: `Nouvelle section`, paragraphes: [""] }],
      miseAJour: new Date().toISOString().slice(0, 10),
    }));
    setEditionIndex(reglement.sections.length);
    notifier("Section ajoutée.");
  }

  function supprimerSection(i: number) {
    if (!confirm("Supprimer cette section ?")) return;
    setReglement((r) => ({
      ...r,
      sections: r.sections.filter((_, idx) => idx !== i),
      miseAJour: new Date().toISOString().slice(0, 10),
    }));
    if (editionIndex === i) setEditionIndex(null);
    notifier("Section supprimée.");
  }

  function modifierSection(i: number, patch: Partial<SectionReglement>) {
    setReglement((r) => ({
      ...r,
      sections: r.sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
  }

  function deplacer(i: number, direction: -1 | 1) {
    const j = i + direction;
    if (j < 0 || j >= reglement.sections.length) return;
    setReglement((r) => {
      const sections = [...r.sections];
      [sections[i], sections[j]] = [sections[j], sections[i]];
      return { ...r, sections };
    });
    if (editionIndex === i) setEditionIndex(j);
    else if (editionIndex === j) setEditionIndex(i);
  }

  function nouvelleVersion() {
    const match = /^v(\d+)\.(\d+)$/.exec(reglement.version);
    let next = "v1.0";
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10) + 1;
      next = `v${major}.${minor}`;
    }
    setReglement((r) => ({
      ...r,
      version: next,
      miseAJour: new Date().toISOString().slice(0, 10),
    }));
    notifier(`Nouvelle version ${next} publiée.`);
  }

  function lireFichier(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(f);
    });
  }

  async function uploaderPdf(file: File) {
    if (file.type !== "application/pdf") {
      notifier("⚠ Le fichier doit être un PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notifier("⚠ Fichier trop lourd (5 Mo maximum). Compressez-le d'abord.");
      return;
    }
    const base64 = await lireFichier(file);
    setReglement((r) => ({
      ...r,
      pdf: { nom: file.name, taille: file.size, base64 },
      miseAJour: new Date().toISOString().slice(0, 10),
    }));
    notifier(`Document « ${file.name} » publié.`);
  }

  function retirerPdf() {
    if (!confirm("Retirer le document PDF du règlement ?")) return;
    setReglement((r) => ({ ...r, pdf: null }));
    notifier("Document retiré.");
  }

  function tailleLisible(octets: number): string {
    if (octets < 1024) return `${octets} o`;
    if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
    return `${(octets / 1024 / 1024).toFixed(2)} Mo`;
  }

  return (
    <AdminShell>
      {() => (
        <div className="space-y-5">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-bold text-[var(--brand-primary-dark)]">
                Règlement intérieur
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                Version <strong>{reglement.version}</strong> · mis à jour le{" "}
                {new Date(reglement.miseAJour).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={nouvelleVersion}
                className="rounded-lg border border-[var(--brand-primary)] bg-white px-3 py-2 text-xs font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-soft)]"
              >
                Publier nouvelle version
              </button>
              <button
                onClick={ajouterSection}
                className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-primary-dark)]"
              >
                + Section
              </button>
            </div>
          </header>

          {info ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              ✓ {info}
            </div>
          ) : null}

          <PdfSection
            pdf={reglement.pdf ?? null}
            onUpload={uploaderPdf}
            onRetirer={retirerPdf}
            formatTaille={tailleLisible}
          />

          <div className="grid grid-cols-1 gap-2 lg:grid-cols-[260px_1fr]">
            <nav className="space-y-1 overflow-hidden rounded-xl border border-[var(--border)] bg-white p-2 shadow-sm">
              {reglement.sections.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">
                  Aucune section.
                </p>
              ) : (
                reglement.sections.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setEditionIndex(i)}
                    className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-xs transition ${
                      editionIndex === i
                        ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand-primary-dark)]"
                        : "hover:bg-[var(--surface-muted)]"
                    }`}
                  >
                    <span className="truncate">{s.titre || "(sans titre)"}</span>
                    <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-600">
                      {s.paragraphes.length}
                    </span>
                  </button>
                ))
              )}
            </nav>

            <div>
              {editionIndex !== null && reglement.sections[editionIndex] ? (
                <EditeurSection
                  key={editionIndex}
                  section={reglement.sections[editionIndex]}
                  onChange={(patch) => {
                    modifierSection(editionIndex, patch);
                    toucherMiseAJour();
                  }}
                  onDelete={() => supprimerSection(editionIndex)}
                  onMoveUp={editionIndex > 0 ? () => deplacer(editionIndex, -1) : undefined}
                  onMoveDown={
                    editionIndex < reglement.sections.length - 1
                      ? () => deplacer(editionIndex, 1)
                      : undefined
                  }
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-white p-10 text-sm text-[var(--text-muted)]">
                  Sélectionnez une section à gauche pour la modifier.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function EditeurSection({
  section,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  section: SectionReglement;
  onChange: (patch: Partial<SectionReglement>) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  function modifierParagraphe(i: number, valeur: string) {
    onChange({
      paragraphes: section.paragraphes.map((p, idx) => (idx === i ? valeur : p)),
    });
  }

  function ajouterParagraphe() {
    onChange({ paragraphes: [...section.paragraphes, ""] });
  }

  function supprimerParagraphe(i: number) {
    onChange({ paragraphes: section.paragraphes.filter((_, idx) => idx !== i) });
  }

  return (
    <article className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <input
          type="text"
          value={section.titre}
          onChange={(e) => onChange({ titre: e.target.value })}
          placeholder="Titre de la section"
          className="flex-1 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
        />
        <div className="flex gap-1">
          <button
            onClick={onMoveUp}
            disabled={!onMoveUp}
            className="rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-xs disabled:opacity-30 hover:bg-[var(--surface-muted)]"
            title="Monter"
          >
            ▲
          </button>
          <button
            onClick={onMoveDown}
            disabled={!onMoveDown}
            className="rounded-md border border-[var(--border)] bg-white px-2 py-1.5 text-xs disabled:opacity-30 hover:bg-[var(--surface-muted)]"
            title="Descendre"
          >
            ▼
          </button>
          <button
            onClick={onDelete}
            className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-600 hover:bg-red-100"
            title="Supprimer"
          >
            🗑
          </button>
        </div>
      </div>

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Paragraphes ({section.paragraphes.length})
      </h3>
      <ul className="space-y-2">
        {section.paragraphes.map((p, i) => (
          <li key={i} className="flex items-start gap-2">
            <textarea
              value={p}
              onChange={(e) => modifierParagraphe(i, e.target.value)}
              rows={2}
              className="flex-1 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
              placeholder="Contenu du paragraphe…"
            />
            <button
              onClick={() => supprimerParagraphe(i)}
              className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] text-red-600 hover:bg-red-100"
              title="Supprimer le paragraphe"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={ajouterParagraphe}
        className="mt-3 w-full rounded-lg border border-dashed border-[var(--brand-primary)]/40 bg-[var(--brand-soft)]/40 py-2 text-xs font-semibold text-[var(--brand-primary-dark)] hover:bg-[var(--brand-soft)]"
      >
        + Ajouter un paragraphe
      </button>
    </article>
  );
}

function PdfSection({
  pdf,
  onUpload,
  onRetirer,
  formatTaille,
}: {
  pdf: DocumentPdf | null;
  onUpload: (file: File) => void;
  onRetirer: () => void;
  formatTaille: (octets: number) => string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[var(--brand-primary-dark)]">
            📄 Document PDF officiel
          </h2>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Publiez le règlement intérieur signé en version PDF. Les parents pourront
            le télécharger depuis leur application.
          </p>
        </div>
        {pdf ? (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            Publié
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            Non publié
          </span>
        )}
      </div>

      {pdf ? (
        <div className="mt-3 flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/40 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex items-center gap-3">
            <span className="text-2xl" aria-hidden>📄</span>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{pdf.nom}</div>
              <div className="text-[10px] text-[var(--text-muted)]">
                {formatTaille(pdf.taille)}
              </div>
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <a
              href={pdf.base64}
              download={pdf.nom}
              className="rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-[11px] font-semibold hover:bg-[var(--surface-muted)]"
            >
              ⬇ Télécharger
            </a>
            <button
              onClick={() => inputRef.current?.click()}
              className="rounded-md bg-[var(--brand-primary)] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[var(--brand-primary-dark)]"
            >
              Remplacer
            </button>
            <button
              onClick={onRetirer}
              className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-100"
            >
              Retirer
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <button
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--surface-muted)]/40 py-4 text-sm font-semibold text-[var(--brand-primary-dark)] hover:border-[var(--brand-primary)]/40 hover:bg-[var(--brand-soft)]/40"
          >
            📤 Téléverser le document PDF (5 Mo max)
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
    </section>
  );
}
