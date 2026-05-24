"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "../../components/AppHeader";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../components/AuthGuard";
import { ouvrirDansNouvelOnglet, telechargerDataUrl } from "../../lib/download";
import { reglement as reglementInitial, type SectionReglement } from "../../lib/mockData";
import { useSharedStore } from "../../lib/store";

type Reglement = {
  version: string;
  miseAJour: string;
  sections: SectionReglement[];
  pdf?: { nom: string; taille: number; base64: string } | null;
};

export default function ReglementPage() {
  const [reglement] = useSharedStore<Reglement>("reglement", reglementInitial);
  const [recherche, setRecherche] = useState("");

  const sectionsFiltrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return reglement.sections;
    return reglement.sections
      .map((s) => ({
        ...s,
        paragraphes: s.paragraphes.filter((p) => p.toLowerCase().includes(q)),
      }))
      .filter(
        (s) => s.titre.toLowerCase().includes(q) || s.paragraphes.length > 0
      );
  }, [recherche]);

  return (
    <AuthGuard>
      {() => (
        <>
          <AppHeader
            title="Règlement intérieur"
            subtitle={`Version ${reglement.version} · mis à jour le ${new Date(reglement.miseAJour).toLocaleDateString("fr-FR")}`}
          />
          <AppShell>
            <div className="px-5 py-4 space-y-4">
              <div className="relative">
                <input
                  type="search"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher dans le règlement…"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-9 pr-3 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  🔍
                </span>
              </div>

              {reglement.pdf ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    onClick={() =>
                      reglement.pdf && telechargerDataUrl(reglement.pdf.base64, reglement.pdf.nom)
                    }
                    className="flex items-center justify-center gap-2 rounded-lg bg-[var(--brand-primary)] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-primary-dark)]"
                  >
                    ⬇ Télécharger
                  </button>
                  <button
                    onClick={() => reglement.pdf && ouvrirDansNouvelOnglet(reglement.pdf.base64)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-[var(--brand-primary)] bg-[var(--surface)] py-2.5 text-sm font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-soft)]"
                  >
                    👁️ Ouvrir
                  </button>
                </div>
              ) : (
                <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-muted)]/40 py-2.5 text-xs text-[var(--text-muted)]">
                  Aucun document PDF disponible pour le moment.
                </div>
              )}

              {sectionsFiltrees.length === 0 ? (
                <p className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-4 text-center text-sm text-[var(--text-muted)]">
                  Aucun résultat pour « {recherche} ».
                </p>
              ) : (
                <ul className="space-y-3">
                  {sectionsFiltrees.map((s) => (
                    <li
                      key={s.titre}
                      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
                    >
                      <h2 className="mb-2 text-sm font-semibold text-[var(--brand-primary-dark)]">
                        {surligner(s.titre, recherche)}
                      </h2>
                      <div className="space-y-2 text-xs leading-relaxed text-[var(--foreground)]">
                        {s.paragraphes.map((p, i) => (
                          <p key={i}>{surligner(p, recherche)}</p>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </AppShell>
        </>
      )}
    </AuthGuard>
  );
}

function surligner(texte: string, recherche: string) {
  const q = recherche.trim();
  if (!q) return texte;
  const regex = new RegExp(`(${escapeRegex(q)})`, "ig");
  const parts = texte.split(regex);
  return parts.map((p, i) =>
    regex.test(p) ? (
      <mark key={i} className="rounded bg-amber-200 px-0.5 text-[var(--foreground)]">
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
