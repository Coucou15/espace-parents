"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "../../components/Logo";
import {
  SECTIONS,
  formatClasse,
  formatNiveau,
  getPalier,
  paliers,
  type PalierId,
  type SectionId,
} from "../../lib/mockData";

type EnfantForm = {
  prenom: string;
  nom: string;
  palierId: PalierId | "";
  niveauId: string;
  section: SectionId;
};

function nouvelEnfant(): EnfantForm {
  return { prenom: "", nom: "", palierId: "", niveauId: "", section: "A" };
}

export default function InscriptionPage() {
  const [envoye, setEnvoye] = useState(false);
  const [enfants, setEnfants] = useState<EnfantForm[]>([nouvelEnfant()]);

  function modifier(index: number, patch: Partial<EnfantForm>) {
    setEnfants((curr) => {
      const next = [...curr];
      const e = { ...next[index], ...patch };
      // Si le palier change, on réinitialise niveau et section
      if (patch.palierId !== undefined && patch.palierId !== curr[index].palierId) {
        e.niveauId = "";
        e.section = "A";
      }
      next[index] = e;
      return next;
    });
  }

  function ajouterEnfant() {
    setEnfants((curr) => [...curr, nouvelEnfant()]);
  }

  function retirerEnfant(index: number) {
    setEnfants((curr) => curr.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-1 flex-col px-6 pt-10 pb-8">
      <div className="flex flex-col items-center gap-3 mb-6">
        <Logo size={56} />
        <h1 className="text-lg font-semibold text-[var(--brand-primary-dark)]">
          Créer un compte parent
        </h1>
      </div>

      {envoye ? (
        <div className="rounded-lg bg-[var(--brand-soft)] border border-[var(--brand-primary)]/20 p-4 text-sm">
          <p className="font-semibold text-[var(--brand-primary-dark)] mb-1">
            Demande envoyée
          </p>
          <p className="text-[var(--text-muted)] mb-2">
            Votre demande est en attente de validation par l&apos;administration de
            l&apos;école. Vous recevrez un code d&apos;accès par e-mail ou SMS dès que
            votre compte sera approuvé.
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-3">
            {enfants.length} enfant(s) déclaré(s) :{" "}
            {enfants
              .map((e) =>
                e.palierId && e.niveauId
                  ? `${e.prenom} (${formatClasse(e.palierId, e.niveauId, e.section)})`
                  : e.prenom
              )
              .join(", ")}
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-xs font-semibold text-white"
          >
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setEnvoye(true);
          }}
          className="space-y-4"
        >
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Vos informations
            </h2>
            <Field label="Prénom du parent" placeholder="Amina" />
            <Field label="Nom du parent" placeholder="Benali" />
            <Field label="E-mail" type="email" placeholder="parent@exemple.fr" />
            <Field label="Téléphone" placeholder="+213 6 ..." />
            <Field
              label="Mot de passe"
              type="password"
              hint="8 caractères min., 1 majuscule, 1 chiffre, 1 spécial"
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Vos enfants
            </h2>

            {enfants.map((enfant, i) => (
              <EnfantCard
                key={i}
                index={i}
                enfant={enfant}
                onChange={(patch) => modifier(i, patch)}
                onRemove={enfants.length > 1 ? () => retirerEnfant(i) : undefined}
              />
            ))}

            <button
              type="button"
              onClick={ajouterEnfant}
              className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--brand-primary)]/40 bg-[var(--brand-soft)]/40 py-2.5 text-xs font-semibold text-[var(--brand-primary-dark)] hover:bg-[var(--brand-soft)]"
            >
              + Ajouter un autre enfant
            </button>
          </section>

          <label className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
            <input type="checkbox" required className="mt-0.5" />
            <span>
              J&apos;accepte les conditions d&apos;utilisation et la politique de
              confidentialité.
            </span>
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-[var(--brand-primary)] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-primary-dark)]"
          >
            Envoyer ma demande
          </button>
          <Link
            href="/login"
            className="block text-center text-xs text-[var(--brand-secondary)] hover:underline"
          >
            J&apos;ai déjà un compte
          </Link>
        </form>
      )}
    </div>
  );
}

function EnfantCard({
  index,
  enfant,
  onChange,
  onRemove,
}: {
  index: number;
  enfant: EnfantForm;
  onChange: (patch: Partial<EnfantForm>) => void;
  onRemove?: () => void;
}) {
  const palier = enfant.palierId ? getPalier(enfant.palierId) : undefined;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--brand-primary-dark)]">
          Enfant {index + 1}
        </span>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-[10px] font-semibold text-red-600 hover:underline"
          >
            Retirer
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Field
          label="Prénom"
          placeholder="Sami"
          value={enfant.prenom}
          onChange={(v) => onChange({ prenom: v })}
        />
        <Field
          label="Nom"
          placeholder="Benali"
          value={enfant.nom}
          onChange={(v) => onChange({ nom: v })}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Palier</label>
        <select
          required
          value={enfant.palierId}
          onChange={(e) => onChange({ palierId: e.target.value as PalierId })}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
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
              value={enfant.niveauId}
              onChange={(e) => onChange({ niveauId: e.target.value })}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
            >
              <option value="">— Choisir —</option>
              {palier.niveaux.map((n) => (
                <option key={n.id} value={n.id}>
                  {formatNiveau(n)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Section</label>
            <select
              required
              value={enfant.section}
              onChange={(e) => onChange({ section: e.target.value as SectionId })}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
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
    </div>
  );
}

function Field({
  label,
  type = "text",
  placeholder,
  hint,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1">{label}</label>
      <input
        type={type}
        required
        placeholder={placeholder}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
      />
      {hint ? <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{hint}</p> : null}
    </div>
  );
}
