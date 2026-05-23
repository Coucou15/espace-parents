"use client";

import { AmbianceBanner } from "../components/AmbianceBanner";
import { AppHeader } from "../components/AppHeader";
import { AppShell } from "../components/AppShell";
import { AuthGuard } from "../components/AuthGuard";
import { ModuleGrid } from "../components/ModuleGrid";
import { annonces as annoncesInitiales, type Annonce } from "../lib/mockData";
import { useSharedStore } from "../lib/store";

const categorieLabels: Record<Annonce["categorie"], { label: string; classes: string }> = {
  urgent: { label: "Urgent", classes: "bg-red-100 text-red-700" },
  evenement: { label: "Événement", classes: "bg-amber-100 text-amber-800" },
  administratif: { label: "Administratif", classes: "bg-slate-200 text-slate-700" },
  pedagogique: {
    label: "Pédagogique",
    classes: "bg-[var(--brand-soft)] text-[var(--brand-primary-dark)]",
  },
};

export default function AccueilPage() {
  const [annonces] = useSharedStore<Annonce[]>("annonces", annoncesInitiales);
  return (
    <AuthGuard>
      {(compte) => (
        <>
          <AppHeader
            title={`Bonjour ${compte.prenom}`}
            subtitle="Voici les dernières actualités de l'école"
          />
          <AppShell>
            <AmbianceBanner slot="accueil" />
            <div className="px-5 py-4">
              <ModuleGrid />
            </div>
            <section className="px-5 pb-4">
              <h2 className="mb-3 flex items-center justify-between text-sm font-semibold text-[var(--brand-primary-dark)]">
                <span>Tableau d&apos;affichage</span>
                <span className="text-[10px] font-medium text-[var(--text-muted)]">
                  {annonces.filter((a) => !a.lu).length} non lu(s)
                </span>
              </h2>
              <ul className="space-y-3">
                {annonces.map((a) => (
                  <li
                    key={a.id}
                    className={`rounded-xl border bg-[var(--surface)] p-4 shadow-sm ${
                      a.lu
                        ? "border-[var(--border)]"
                        : "border-[var(--brand-primary)]/30 ring-1 ring-[var(--brand-primary)]/10"
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          categorieLabels[a.categorie].classes
                        }`}
                      >
                        {categorieLabels[a.categorie].label}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {formatDate(a.date)}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">
                      {a.titre}
                      {!a.lu ? (
                        <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)]" />
                      ) : null}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                      {a.texte}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </AppShell>
        </>
      )}
    </AuthGuard>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
