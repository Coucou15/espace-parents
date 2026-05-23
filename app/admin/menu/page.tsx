"use client";

import { useState } from "react";
import { AdminShell } from "../_components/AdminShell";
import {
  menuSemaineActuelle,
  menuSemaineSuivante,
  type RepasJour,
} from "../../lib/mockData";
import { useSharedStore } from "../../lib/store";

type Onglet = "actuelle" | "suivante";
type MenuStore = { actuelle: RepasJour[]; suivante: RepasJour[] };

const MENU_INITIAL: MenuStore = {
  actuelle: menuSemaineActuelle,
  suivante: menuSemaineSuivante,
};

export default function MenuAdmin() {
  const [onglet, setOnglet] = useState<Onglet>("actuelle");
  const [menus, setMenus] = useSharedStore<MenuStore>("menu", MENU_INITIAL);
  const [info, setInfo] = useState<string | null>(null);

  const menu = menus[onglet];

  function modifier(jourIndex: number, patch: Partial<RepasJour>) {
    setMenus((curr) => ({
      ...curr,
      [onglet]: curr[onglet].map((j, i) => (i === jourIndex ? { ...j, ...patch } : j)),
    }));
  }

  function enregistrer() {
    setInfo("Menu enregistré et envoyé aux parents.");
    setTimeout(() => setInfo(null), 2500);
  }

  return (
    <AdminShell>
      {() => (
        <div className="space-y-5">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-bold text-[var(--brand-primary-dark)]">
                Menu de la cantine
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                Édition des repas de la semaine en cours et de la semaine suivante.
              </p>
            </div>
            <button
              onClick={enregistrer}
              className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-primary-dark)]"
            >
              💾 Enregistrer
            </button>
          </header>

          {info ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              ✓ {info}
            </div>
          ) : null}

          <div className="flex gap-1.5 rounded-lg bg-[var(--surface-muted)] p-1 text-xs lg:w-fit">
            {(["actuelle", "suivante"] as const).map((o) => (
              <button
                key={o}
                onClick={() => setOnglet(o)}
                className={`rounded-md px-4 py-2 font-semibold transition ${
                  onglet === o
                    ? "bg-white text-[var(--brand-primary-dark)] shadow-sm"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {o === "actuelle" ? "Semaine en cours" : "Semaine suivante"}
              </button>
            ))}
          </div>

          <ul className="space-y-3">
            {menu.map((j, i) => (
              <li
                key={j.date}
                className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm lg:p-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--brand-primary-dark)]">
                    {j.jour}
                  </h3>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {new Date(j.date).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                    })}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <Champ
                    label="Entrée"
                    value={j.entree}
                    onChange={(v) => modifier(i, { entree: v })}
                  />
                  <Champ
                    label="Plat principal"
                    value={j.plat}
                    onChange={(v) => modifier(i, { plat: v })}
                  />
                  <Champ
                    label="Accompagnement"
                    value={j.accompagnement}
                    onChange={(v) => modifier(i, { accompagnement: v })}
                  />
                  <Champ
                    label="Dessert"
                    value={j.dessert}
                    onChange={(v) => modifier(i, { dessert: v })}
                  />
                </div>
                <div className="mt-3">
                  <Champ
                    label="Allergènes (séparés par des virgules)"
                    value={(j.allergenes ?? []).join(", ")}
                    onChange={(v) =>
                      modifier(i, {
                        allergenes: v
                          .split(",")
                          .map((x) => x.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AdminShell>
  );
}

function Champ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
      />
    </div>
  );
}
