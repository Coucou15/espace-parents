"use client";

import { useState } from "react";
import { AmbianceBanner } from "../../components/AmbianceBanner";
import { AppHeader } from "../../components/AppHeader";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../components/AuthGuard";
import { menuSemaineActuelle, menuSemaineSuivante, type RepasJour } from "../../lib/mockData";
import { useSharedStore } from "../../lib/store";

type Onglet = "actuelle" | "suivante";
type MenuStore = { actuelle: RepasJour[]; suivante: RepasJour[] };

const MENU_INITIAL: MenuStore = {
  actuelle: menuSemaineActuelle,
  suivante: menuSemaineSuivante,
};

export default function MenuPage() {
  const [onglet, setOnglet] = useState<Onglet>("actuelle");
  const [menus] = useSharedStore<MenuStore>("menu", MENU_INITIAL);
  const menu = menus[onglet];

  return (
    <AuthGuard>
      {() => (
        <>
          <AppHeader title="Menu de la cantine" subtitle="Mise à jour chaque lundi" />
          <AppShell>
            <AmbianceBanner slot="menu" />
            <div className="px-5 py-4">
              <div className="mb-4 grid grid-cols-2 rounded-lg bg-[var(--surface-muted)] p-1 text-xs font-semibold">
                <button
                  onClick={() => setOnglet("actuelle")}
                  className={`rounded-md py-2 transition ${
                    onglet === "actuelle"
                      ? "bg-[var(--surface)] text-[var(--brand-primary-dark)] shadow-sm"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  Semaine en cours
                </button>
                <button
                  onClick={() => setOnglet("suivante")}
                  className={`rounded-md py-2 transition ${
                    onglet === "suivante"
                      ? "bg-[var(--surface)] text-[var(--brand-primary-dark)] shadow-sm"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  Semaine suivante
                </button>
              </div>

              <ul className="space-y-3">
                {menu.map((j) => (
                  <JourCard key={j.date} repas={j} />
                ))}
              </ul>
            </div>
          </AppShell>
        </>
      )}
    </AuthGuard>
  );
}

function JourCard({ repas }: { repas: RepasJour }) {
  const ferme = repas.plat.toLowerCase().includes("fermeture");
  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-[var(--brand-primary-dark)]">
          {repas.jour}
        </h3>
        <span className="text-[10px] text-[var(--text-muted)]">
          {new Date(repas.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })}
        </span>
      </div>

      {ferme ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{repas.plat}</p>
      ) : (
        <dl className="space-y-1.5 text-xs">
          <Ligne label="Entrée" valeur={repas.entree} />
          <Ligne label="Plat" valeur={repas.plat} accent />
          <Ligne label="Accompagnement" valeur={repas.accompagnement} />
          <Ligne label="Dessert" valeur={repas.dessert} />
        </dl>
      )}

      {repas.allergenes && repas.allergenes.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {repas.allergenes.map((a) => (
            <span
              key={a}
              className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-amber-200"
            >
              ⚠ {a}
            </span>
          ))}
        </div>
      ) : null}
    </li>
  );
}

function Ligne({ label, valeur, accent = false }: { label: string; valeur: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="w-28 shrink-0 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </dt>
      <dd className={accent ? "font-semibold text-[var(--foreground)]" : "text-[var(--foreground)]"}>
        {valeur}
      </dd>
    </div>
  );
}
