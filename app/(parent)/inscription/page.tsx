"use client";

import { useState } from "react";
import Link from "next/link";
import { AmbianceBanner } from "../../components/AmbianceBanner";
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

type Form = {
  parentPrenom: string;
  parentNom: string;
  email: string;
  telephone: string;
  motDePasse: string;
  cgu: boolean;
  enfants: EnfantForm[];
};

const FORM_INITIAL: Form = {
  parentPrenom: "",
  parentNom: "",
  email: "",
  telephone: "",
  motDePasse: "",
  cgu: false,
  enfants: [nouvelEnfant()],
};

export default function InscriptionPage() {
  const [form, setForm] = useState<Form>(FORM_INITIAL);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  function modifierEnfant(index: number, patch: Partial<EnfantForm>) {
    setForm((curr) => {
      const enfants = [...curr.enfants];
      const e = { ...enfants[index], ...patch };
      if (patch.palierId !== undefined && patch.palierId !== curr.enfants[index].palierId) {
        e.niveauId = "";
        e.section = "A";
      }
      enfants[index] = e;
      return { ...curr, enfants };
    });
  }

  function ajouterEnfant() {
    setForm((curr) => ({ ...curr, enfants: [...curr.enfants, nouvelEnfant()] }));
  }

  function retirerEnfant(index: number) {
    setForm((curr) => ({
      ...curr,
      enfants: curr.enfants.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);

    // Validation côté client : palier + niveau choisis pour chaque enfant
    for (const enfant of form.enfants) {
      if (!enfant.palierId || !enfant.niveauId) {
        setErreur("Sélectionnez le palier et le niveau pour chaque enfant.");
        return;
      }
    }

    setEnCours(true);
    try {
      const res = await fetch("/api/demandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentPrenom: form.parentPrenom,
          parentNom: form.parentNom,
          email: form.email,
          telephone: form.telephone,
          motDePasse: form.motDePasse,
          enfants: form.enfants.map((e) => ({
            prenom: e.prenom,
            nom: e.nom,
            palierId: e.palierId,
            niveauId: e.niveauId,
            section: e.section,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error ?? "Une erreur est survenue.");
        return;
      }

      setEnvoye(true);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <AmbianceBanner slot="inscription" variant="compact" />
      <div className="flex flex-1 flex-col px-6 pt-8 pb-8">
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
            l&apos;école. Vous recevrez un code d&apos;accès dès que votre compte sera
            approuvé.
          </p>
          <p className="text-xs text-[var(--text-muted)] mb-3">
            {form.enfants.length} enfant(s) déclaré(s) :{" "}
            {form.enfants
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Vos informations
            </h2>
            <Field
              label="Prénom du parent"
              placeholder="Amina"
              value={form.parentPrenom}
              onChange={(v) => setForm((c) => ({ ...c, parentPrenom: v }))}
            />
            <Field
              label="Nom du parent"
              placeholder="Benali"
              value={form.parentNom}
              onChange={(v) => setForm((c) => ({ ...c, parentNom: v }))}
            />
            <Field
              label="E-mail"
              type="email"
              placeholder="parent@exemple.fr"
              value={form.email}
              onChange={(v) => setForm((c) => ({ ...c, email: v }))}
            />
            <Field
              label="Téléphone"
              placeholder="+213 6 ..."
              value={form.telephone}
              onChange={(v) => setForm((c) => ({ ...c, telephone: v }))}
              optional
            />
            <Field
              label="Mot de passe"
              type="password"
              hint="8 caractères minimum"
              value={form.motDePasse}
              onChange={(v) => setForm((c) => ({ ...c, motDePasse: v }))}
            />
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Vos enfants
            </h2>

            {form.enfants.map((enfant, i) => (
              <EnfantCard
                key={i}
                index={i}
                enfant={enfant}
                onChange={(patch) => modifierEnfant(i, patch)}
                onRemove={form.enfants.length > 1 ? () => retirerEnfant(i) : undefined}
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
            <input
              type="checkbox"
              required
              className="mt-0.5"
              checked={form.cgu}
              onChange={(e) => setForm((c) => ({ ...c, cgu: e.target.checked }))}
            />
            <span>
              J&apos;accepte les conditions d&apos;utilisation et la politique de
              confidentialité.
            </span>
          </label>

          {erreur ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              ⚠ {erreur}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={enCours}
            className="w-full rounded-lg bg-[var(--brand-primary)] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-primary-dark)] disabled:opacity-50"
          >
            {enCours ? "Envoi…" : "Envoyer ma demande"}
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
  optional = false,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
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
        required={!optional}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
      />
      {hint ? <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{hint}</p> : null}
    </div>
  );
}
