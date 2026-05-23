"use client";

import { useState } from "react";
import { AdminShell } from "../_components/AdminShell";
import { ecole as ecoleParDefaut } from "../../lib/mockData";
import { useSharedStore } from "../../lib/store";

type InfosEcole = {
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  horaires: string;
  reseauxSociaux: {
    facebook: string;
    instagram: string;
  };
};

export default function EcoleAdmin() {
  const [ecole, setEcole] = useSharedStore<InfosEcole>("ecole", ecoleParDefaut);
  const [info, setInfo] = useState<string | null>(null);

  function modifier(patch: Partial<InfosEcole>) {
    setEcole({ ...ecole, ...patch });
  }

  function modifierReseau(reseau: "facebook" | "instagram", url: string) {
    setEcole({
      ...ecole,
      reseauxSociaux: { ...ecole.reseauxSociaux, [reseau]: url },
    });
  }

  function notifier() {
    setInfo("Coordonnées enregistrées. Les changements sont visibles immédiatement côté parents.");
    setTimeout(() => setInfo(null), 3000);
  }

  function reinitialiser() {
    if (!confirm("Restaurer les coordonnées par défaut ?")) return;
    setEcole(ecoleParDefaut);
    notifier();
  }

  return (
    <AdminShell>
      {() => (
        <div className="space-y-5 max-w-2xl">
          <header>
            <h1 className="text-xl font-bold text-[var(--brand-primary-dark)]">
              Coordonnées de l&apos;école
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Ces informations apparaissent sur la page « Nous contacter » et dans
              les e-mails envoyés aux parents.
            </p>
          </header>

          {info ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              ✓ {info}
            </div>
          ) : null}

          <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-[var(--brand-primary-dark)]">
              Informations principales
            </h2>
            <Champ
              label="Nom de l'école"
              value={ecole.nom}
              onChange={(v) => modifier({ nom: v })}
              onBlur={notifier}
            />
            <Champ
              label="Adresse"
              value={ecole.adresse}
              onChange={(v) => modifier({ adresse: v })}
              onBlur={notifier}
            />
            <Champ
              label="Téléphone"
              type="tel"
              value={ecole.telephone}
              onChange={(v) => modifier({ telephone: v })}
              onBlur={notifier}
              placeholder="+213 ..."
            />
            <Champ
              label="E-mail"
              type="email"
              value={ecole.email}
              onChange={(v) => modifier({ email: v })}
              onBlur={notifier}
            />
            <Champ
              label="Horaires d'ouverture"
              value={ecole.horaires}
              onChange={(v) => modifier({ horaires: v })}
              onBlur={notifier}
              placeholder="Lundi à vendredi · 8h00 – 17h30"
            />
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-[var(--brand-primary-dark)]">
              Réseaux sociaux
            </h2>
            <Champ
              label="Facebook (URL complète)"
              value={ecole.reseauxSociaux?.facebook ?? ""}
              onChange={(v) => modifierReseau("facebook", v)}
              onBlur={notifier}
              placeholder="https://facebook.com/..."
              optional
            />
            <Champ
              label="Instagram (URL complète)"
              value={ecole.reseauxSociaux?.instagram ?? ""}
              onChange={(v) => modifierReseau("instagram", v)}
              onBlur={notifier}
              placeholder="https://instagram.com/..."
              optional
            />
          </section>

          <div className="flex justify-between">
            <button
              onClick={reinitialiser}
              className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            >
              ↻ Restaurer par défaut
            </button>
            <p className="text-[11px] text-[var(--text-muted)] self-center">
              Les changements sont enregistrés automatiquement.
            </p>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function Champ({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder,
  optional = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  type?: string;
  placeholder?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1">
        {label}
        {optional ? <span className="text-[var(--text-muted)]"> (facultatif)</span> : null}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
      />
    </div>
  );
}
