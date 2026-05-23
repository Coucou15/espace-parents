"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "../_components/AdminShell";

type User = {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  role: string;
  telephone: string | null;
  matiere: string | null;
  codeAcces: string | null;
  statut: string;
  createdAt: string;
  nbEnfants: number;
};

const ROLE_LABELS: Record<string, { label: string; couleur: string }> = {
  parent: { label: "Parent", couleur: "bg-blue-100 text-blue-700" },
  "admin-ecole": { label: "Admin école", couleur: "bg-purple-100 text-purple-700" },
  "super-admin": { label: "Super-admin", couleur: "bg-red-100 text-red-700" },
  enseignant: { label: "Enseignant", couleur: "bg-emerald-100 text-emerald-700" },
  cantine: { label: "Cantine", couleur: "bg-amber-100 text-amber-700" },
};

const ROLES = ["parent", "admin-ecole", "super-admin", "enseignant", "cantine"] as const;

type FormState = {
  id?: string;
  email: string;
  prenom: string;
  nom: string;
  role: string;
  telephone: string;
  matiere: string;
  motDePasse: string;
};

const FORM_VIDE: FormState = {
  email: "",
  prenom: "",
  nom: "",
  role: "enseignant",
  telephone: "",
  matiere: "",
  motDePasse: "",
};

export default function UtilisateursAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<string>("tous");
  const [form, setForm] = useState<FormState | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function rafraichir() {
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      if (!res.ok) {
        setErreur(`Erreur de chargement (HTTP ${res.status})`);
        return;
      }
      const data = await res.json();
      setUsers(data.users ?? []);
      setErreur(null);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    rafraichir();
  }, []);

  function notifier(msg: string) {
    setInfo(msg);
    setTimeout(() => setInfo(null), 3000);
  }

  const usersFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return users.filter((u) => {
      if (filtre !== "tous" && u.role !== filtre) return false;
      if (!q) return true;
      return (
        u.prenom.toLowerCase().includes(q) ||
        u.nom.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.matiere ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, recherche, filtre]);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setErreur(null);

    const body: Record<string, string | null> = {
      email: form.email,
      prenom: form.prenom,
      nom: form.nom,
      role: form.role,
      telephone: form.telephone || null,
      matiere: form.role === "enseignant" ? form.matiere || null : null,
    };
    if (form.motDePasse) body.motDePasse = form.motDePasse;

    let res: Response;
    if (form.id) {
      // Edit : on n'envoie pas l'email (pas modifiable pour l'instant)
      delete body.email;
      res = await fetch(`/api/users/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      if (!form.motDePasse) {
        setErreur("Le mot de passe est requis pour créer un compte.");
        return;
      }
      res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    const data = await res.json();
    if (!res.ok) {
      setErreur(data.error ?? "Erreur");
      return;
    }
    setForm(null);
    notifier(form.id ? "Compte mis à jour" : "Compte créé");
    await rafraichir();
  }

  async function supprimer(id: string) {
    if (!confirm("Supprimer définitivement ce compte ?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setErreur(data.error ?? "Erreur");
      return;
    }
    notifier("Compte supprimé");
    await rafraichir();
  }

  async function toggleStatut(u: User) {
    const next = u.statut === "actif" ? "suspendu" : "actif";
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: next }),
    });
    if (res.ok) {
      notifier(`Compte ${next}`);
      await rafraichir();
    }
  }

  return (
    <AdminShell>
      {() => (
        <div className="space-y-5">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-bold text-[var(--brand-primary-dark)]">
                Utilisateurs
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                {chargement ? "…" : `${users.length} compte${users.length > 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              onClick={() => setForm({ ...FORM_VIDE })}
              className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-primary-dark)]"
            >
              + Nouvel utilisateur
            </button>
          </header>

          {info ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              ✓ {info}
            </div>
          ) : null}
          {erreur ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              ⚠ {erreur}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher…"
              className="flex-1 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
            />
            <div className="flex gap-1 overflow-x-auto rounded-lg bg-[var(--surface-muted)] p-1 text-xs">
              <button
                onClick={() => setFiltre("tous")}
                className={`shrink-0 rounded-md px-3 py-1.5 font-semibold transition ${
                  filtre === "tous"
                    ? "bg-white text-[var(--brand-primary-dark)] shadow-sm"
                    : "text-[var(--text-muted)]"
                }`}
              >
                Tous
              </button>
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setFiltre(r)}
                  className={`shrink-0 rounded-md px-3 py-1.5 font-semibold transition ${
                    filtre === r
                      ? "bg-white text-[var(--brand-primary-dark)] shadow-sm"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {ROLE_LABELS[r].label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-[var(--surface-muted)] text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Utilisateur</th>
                  <th className="hidden px-4 py-3 text-left font-semibold lg:table-cell">
                    E-mail
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">Rôle</th>
                  <th className="hidden px-4 py-3 text-left font-semibold lg:table-cell">
                    Détail
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">Statut</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersFiltres.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-[var(--border)] hover:bg-[var(--surface-muted)]/40"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {u.prenom} {u.nom}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] lg:hidden">
                        {u.email}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-[var(--text-muted)] lg:table-cell">
                      {u.email}
                      {u.telephone ? <div>{u.telephone}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          ROLE_LABELS[u.role]?.couleur ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {ROLE_LABELS[u.role]?.label ?? u.role}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-[var(--text-muted)] lg:table-cell">
                      {u.role === "enseignant" && u.matiere ? `Matière : ${u.matiere}` : null}
                      {u.role === "parent"
                        ? `${u.nbEnfants} enfant${u.nbEnfants > 1 ? "s" : ""}`
                        : null}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          u.statut === "actif"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {u.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() =>
                            setForm({
                              id: u.id,
                              email: u.email,
                              prenom: u.prenom,
                              nom: u.nom,
                              role: u.role,
                              telephone: u.telephone ?? "",
                              matiere: u.matiere ?? "",
                              motDePasse: "",
                            })
                          }
                          className="rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[11px] hover:bg-[var(--surface-muted)]"
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => toggleStatut(u)}
                          className="rounded-md border border-[var(--border)] bg-white px-2 py-1 text-[11px] hover:bg-[var(--surface-muted)]"
                          title={u.statut === "actif" ? "Suspendre" : "Réactiver"}
                        >
                          {u.statut === "actif" ? "⏸" : "▶"}
                        </button>
                        <button
                          onClick={() => supprimer(u.id)}
                          className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] text-red-600 hover:bg-red-100"
                          title="Supprimer"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {usersFiltres.length === 0 && !chargement ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                      Aucun utilisateur ne correspond.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {form ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <form onSubmit={enregistrer} className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[var(--brand-primary-dark)]">
                    {form.id ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setForm(null)}
                    className="rounded-md p-1 text-lg text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Champ
                      label="Prénom"
                      value={form.prenom}
                      onChange={(v) => setForm({ ...form, prenom: v })}
                    />
                    <Champ
                      label="Nom"
                      value={form.nom}
                      onChange={(v) => setForm({ ...form, nom: v })}
                    />
                  </div>
                  <Champ
                    label="E-mail"
                    type="email"
                    value={form.email}
                    onChange={(v) => setForm({ ...form, email: v })}
                    disabled={!!form.id}
                  />
                  <Champ
                    label={form.id ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe"}
                    type="password"
                    value={form.motDePasse}
                    onChange={(v) => setForm({ ...form, motDePasse: v })}
                    optional={!!form.id}
                  />
                  <div>
                    <label className="block text-xs font-medium mb-1">Rôle</label>
                    <select
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r].label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {form.role === "enseignant" ? (
                    <Champ
                      label="Matière enseignée"
                      placeholder="Ex: Mathématiques"
                      value={form.matiere}
                      onChange={(v) => setForm({ ...form, matiere: v })}
                      optional
                    />
                  ) : null}
                  <Champ
                    label="Téléphone"
                    value={form.telephone}
                    onChange={(v) => setForm({ ...form, telephone: v })}
                    optional
                  />
                </div>

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setForm(null)}
                    className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold hover:bg-[var(--surface-muted)]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-primary-dark)]"
                  >
                    {form.id ? "Enregistrer" : "Créer"}
                  </button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
      )}
    </AdminShell>
  );
}

function Champ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  optional = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  optional?: boolean;
  disabled?: boolean;
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
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 disabled:bg-[var(--surface-muted)] disabled:cursor-not-allowed"
      />
    </div>
  );
}
