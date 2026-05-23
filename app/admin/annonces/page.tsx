"use client";

import { useState } from "react";
import { AdminShell } from "../_components/AdminShell";
import { annonces as annoncesInitiales, type Annonce } from "../../lib/mockData";
import { useSharedStore } from "../../lib/store";

const CATEGORIES: Annonce["categorie"][] = ["urgent", "evenement", "administratif", "pedagogique"];

const categorieLabels: Record<Annonce["categorie"], { label: string; classes: string }> = {
  urgent: { label: "Urgent", classes: "bg-red-100 text-red-700" },
  evenement: { label: "Événement", classes: "bg-amber-100 text-amber-800" },
  administratif: { label: "Administratif", classes: "bg-slate-200 text-slate-700" },
  pedagogique: {
    label: "Pédagogique",
    classes: "bg-[var(--brand-soft)] text-[var(--brand-primary-dark)]",
  },
};

type FormState = {
  id: string | null;
  titre: string;
  texte: string;
  categorie: Annonce["categorie"];
};

const FORM_VIDE: FormState = { id: null, titre: "", texte: "", categorie: "evenement" };

export default function AnnoncesAdmin() {
  const [liste, setListe] = useSharedStore<Annonce[]>("annonces", annoncesInitiales);
  const [form, setForm] = useState<FormState | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function ouvrirCreation() {
    setForm(FORM_VIDE);
  }

  function ouvrirModification(a: Annonce) {
    setForm({ id: a.id, titre: a.titre, texte: a.texte, categorie: a.categorie });
  }

  function fermer() {
    setForm(null);
  }

  async function envoyerPush(annonce: Annonce) {
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: annonce.titre,
          texte: annonce.texte,
          url: "/",
          urgent: annonce.categorie === "urgent",
        }),
      });
      const data = await res.json();
      if (data.envoyes !== undefined) {
        setInfo(
          data.envoyes > 0
            ? `Notification envoyée à ${data.envoyes} parent${data.envoyes > 1 ? "s" : ""}.`
            : "Aucun parent abonné aux notifications pour l'instant."
        );
      }
    } catch (err) {
      console.error("Erreur push :", err);
      setInfo("Annonce publiée, mais l'envoi de notifications a échoué.");
    }
    setTimeout(() => setInfo(null), 4000);
  }

  function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    if (form.id) {
      setListe((curr) =>
        curr.map((a) =>
          a.id === form.id ? { ...a, titre: form.titre, texte: form.texte, categorie: form.categorie } : a
        )
      );
    } else {
      const nouvelle: Annonce = {
        id: `a${Date.now()}`,
        titre: form.titre,
        texte: form.texte,
        categorie: form.categorie,
        date: new Date().toISOString().slice(0, 10),
        lu: false,
      };
      setListe((curr) => [nouvelle, ...curr]);
      envoyerPush(nouvelle);
    }
    fermer();
  }

  function supprimer(id: string) {
    if (confirm("Supprimer cette annonce ?")) {
      setListe((curr) => curr.filter((a) => a.id !== id));
    }
  }

  return (
    <AdminShell>
      {() => (
        <div className="space-y-5">
          <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-bold text-[var(--brand-primary-dark)]">
                Annonces du tableau d&apos;affichage
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                {liste.length} annonce{liste.length > 1 ? "s" : ""} publiée
                {liste.length > 1 ? "s" : ""}.
              </p>
            </div>
            <button
              onClick={ouvrirCreation}
              className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-primary-dark)]"
            >
              + Nouvelle annonce
            </button>
          </header>

          {info ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              ✓ {info}
            </div>
          ) : null}

          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {liste.map((a) => (
              <li
                key={a.id}
                className="flex flex-col rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      categorieLabels[a.categorie].classes
                    }`}
                  >
                    {categorieLabels[a.categorie].label}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {new Date(a.date).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <h3 className="text-sm font-semibold">{a.titre}</h3>
                <p className="mt-1 line-clamp-3 text-xs text-[var(--text-muted)]">{a.texte}</p>
                <div className="mt-3 flex justify-end gap-1.5">
                  <button
                    onClick={() => ouvrirModification(a)}
                    className="rounded-md border border-[var(--border)] bg-white px-3 py-1.5 text-[11px] font-semibold hover:bg-[var(--surface-muted)]"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => supprimer(a.id)}
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-100"
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {form ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <form
                onSubmit={enregistrer}
                className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl"
              >
                <h2 className="mb-4 text-base font-semibold text-[var(--brand-primary-dark)]">
                  {form.id ? "Modifier l'annonce" : "Nouvelle annonce"}
                </h2>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Catégorie</label>
                    <select
                      value={form.categorie}
                      onChange={(e) =>
                        setForm({ ...form, categorie: e.target.value as Annonce["categorie"] })
                      }
                      className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {categorieLabels[c].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Titre</label>
                    <input
                      type="text"
                      required
                      value={form.titre}
                      onChange={(e) => setForm({ ...form, titre: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Texte</label>
                    <textarea
                      required
                      rows={5}
                      value={form.texte}
                      onChange={(e) => setForm({ ...form, texte: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={fermer}
                    className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold hover:bg-[var(--surface-muted)]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-primary-dark)]"
                  >
                    {form.id ? "Enregistrer" : "Publier"}
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
