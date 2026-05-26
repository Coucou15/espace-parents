"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMe, type Compte } from "../../lib/auth";
import {
  formatClasse,
  type PalierId,
  type SectionId,
} from "../../lib/mockData";

type Eleve = {
  id: string;
  prenom: string;
  nom: string;
  palierId: PalierId;
  niveauId: string;
  section: SectionId;
  parent: { prenom: string; nom: string; email: string } | null;
};

type Appreciation = {
  id: string;
  enseignantId: string;
  enseignantNom: string;
  enfantId: string;
  enfantPrenom: string;
  matiere: string | null;
  type: "positif" | "neutre" | "amelioration" | "comportement";
  texte: string;
  date: string;
};

const TYPES: { id: Appreciation["type"]; label: string; couleur: string; emoji: string }[] = [
  { id: "positif", label: "Positif", couleur: "bg-emerald-100 text-emerald-700 border-emerald-200", emoji: "👏" },
  { id: "neutre", label: "Observation", couleur: "bg-slate-100 text-slate-700 border-slate-200", emoji: "💬" },
  { id: "amelioration", label: "À améliorer", couleur: "bg-amber-100 text-amber-700 border-amber-200", emoji: "📈" },
  { id: "comportement", label: "Comportement", couleur: "bg-blue-100 text-blue-700 border-blue-200", emoji: "🤝" },
];

const ROLES_AUTORISES = ["enseignant", "admin-ecole", "super-admin"];

export default function AppreciationsAdmin() {
  const router = useRouter();
  const [user, setUser] = useState<Compte | null>(null);
  const [chargement, setChargement] = useState(true);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [appreciations, setAppreciations] = useState<Appreciation[]>([]);
  const [recherche, setRecherche] = useState("");
  const [form, setForm] = useState<{
    enfantId: string;
    type: Appreciation["type"];
    texte: string;
    matiere: string;
  } | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    fetchMe().then((u) => {
      if (!u || !ROLES_AUTORISES.includes(u.role)) {
        router.replace(u ? "/" : "/login");
        return;
      }
      setUser(u);
      setChargement(false);
    });
  }, [router]);

  async function rafraichir() {
    const [elevesRes, apprRes] = await Promise.all([
      fetch("/api/enfants", { cache: "no-store" }),
      fetch("/api/appreciations", { cache: "no-store" }),
    ]);
    if (elevesRes.ok) setEleves((await elevesRes.json()).enfants ?? []);
    if (apprRes.ok) setAppreciations((await apprRes.json()).appreciations ?? []);
  }

  useEffect(() => {
    if (user) rafraichir();
  }, [user]);

  function notifier(msg: string) {
    setInfo(msg);
    setTimeout(() => setInfo(null), 2500);
  }

  const elevesFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return eleves;
    return eleves.filter(
      (e) =>
        e.prenom.toLowerCase().includes(q) ||
        e.nom.toLowerCase().includes(q) ||
        (e.parent
          ? `${e.parent.prenom} ${e.parent.nom}`.toLowerCase().includes(q)
          : false)
    );
  }, [eleves, recherche]);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setErreur(null);
    if (!form.texte.trim()) {
      setErreur("Le texte ne peut pas être vide.");
      return;
    }
    const res = await fetch("/api/appreciations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setErreur(data.error ?? "Erreur");
      return;
    }
    setForm(null);
    notifier("Appréciation enregistrée. Visible immédiatement par le parent.");
    await rafraichir();
  }

  async function supprimer(id: string) {
    if (!confirm("Supprimer cette appréciation ?")) return;
    const res = await fetch(`/api/appreciations/${id}`, { method: "DELETE" });
    if (res.ok) {
      notifier("Appréciation supprimée.");
      await rafraichir();
    }
  }

  if (chargement || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-muted)] text-sm text-[var(--text-muted)]">
        Chargement…
      </div>
    );
  }

  const matiereParDefaut = (user as { matiere?: string | null }).matiere ?? "";

  return (
    <div className="min-h-screen bg-[var(--surface-muted)] p-4 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--brand-primary-dark)]">
              Suivi continu — Appréciations
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Laissez des appréciations rapides aux parents tout au long de l&apos;année.
            </p>
          </div>
          <button
            onClick={() => router.push("/admin")}
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-muted)]"
          >
            ← Retour
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

        <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[var(--brand-primary-dark)]">
              Élèves ({elevesFiltres.length})
            </h2>
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un élève…"
              className="w-64 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
            />
          </div>
          {elevesFiltres.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-muted)]/40 p-4 text-center text-xs text-[var(--text-muted)]">
              Aucun élève trouvé.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {elevesFiltres.map((eleve) => (
                <li key={eleve.id}>
                  <button
                    onClick={() =>
                      setForm({
                        enfantId: eleve.id,
                        type: "positif",
                        texte: "",
                        matiere: matiereParDefaut,
                      })
                    }
                    className="flex w-full flex-col items-start gap-1 rounded-lg border border-[var(--border)] bg-white p-3 text-left transition hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-soft)]"
                  >
                    <span className="text-sm font-semibold">
                      {eleve.prenom} {eleve.nom}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {formatClasse(eleve.palierId, eleve.niveauId, eleve.section)}
                    </span>
                    <span className="text-[10px] text-[var(--brand-primary)] font-semibold">
                      + Nouvelle appréciation
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-[var(--brand-primary-dark)]">
            Historique ({appreciations.length})
          </h2>
          {appreciations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-6 text-center text-sm text-[var(--text-muted)]">
              Aucune appréciation pour le moment.
            </div>
          ) : (
            <ul className="space-y-2">
              {appreciations.map((a) => {
                const t = TYPES.find((x) => x.id === a.type) ?? TYPES[1];
                return (
                  <li
                    key={a.id}
                    className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${t.couleur}`}
                          >
                            {t.emoji} {t.label}
                          </span>
                          <span className="text-sm font-semibold">{a.enfantPrenom}</span>
                          {a.matiere ? (
                            <span className="text-[11px] text-[var(--text-muted)]">
                              · {a.matiere}
                            </span>
                          ) : null}
                          <span className="text-[10px] text-[var(--text-muted)]">
                            · {new Date(a.date).toLocaleString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed">{a.texte}</p>
                        <p className="mt-1 text-[10px] italic text-[var(--text-muted)]">
                          Par {a.enseignantNom}
                        </p>
                      </div>
                      <button
                        onClick={() => supprimer(a.id)}
                        className="shrink-0 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-100"
                      >
                        Supprimer
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {form ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <form
            onSubmit={envoyer}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-xl bg-white p-5 shadow-2xl sm:rounded-xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--brand-primary-dark)]">
                Nouvelle appréciation
              </h2>
              <button
                type="button"
                onClick={() => setForm(null)}
                className="rounded-md p-1 text-lg text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
              >
                ✕
              </button>
            </div>

            <p className="mb-3 text-xs text-[var(--text-muted)]">
              Pour {eleves.find((e) => e.id === form.enfantId)?.prenom ?? "?"}{" "}
              {eleves.find((e) => e.id === form.enfantId)?.nom ?? ""}
            </p>

            <div className="mb-3">
              <label className="block text-xs font-medium mb-1.5">Type</label>
              <div className="grid grid-cols-2 gap-1.5">
                {TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setForm({ ...form, type: t.id })}
                    className={`rounded-lg border-2 px-3 py-2 text-xs font-semibold transition ${
                      form.type === t.id
                        ? t.couleur
                        : "border-[var(--border)] bg-white text-[var(--text-muted)]"
                    }`}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">
                Matière <span className="text-[var(--text-muted)]">(facultatif)</span>
              </label>
              <input
                type="text"
                value={form.matiere}
                onChange={(e) => setForm({ ...form, matiere: e.target.value })}
                placeholder="Ex: Mathématiques"
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium mb-1">Appréciation</label>
              <textarea
                required
                rows={4}
                value={form.texte}
                onChange={(e) => setForm({ ...form, texte: e.target.value })}
                placeholder="Ex: Très bon travail aujourd'hui sur les fractions, à continuer."
                className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
              />
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                Sera visible immédiatement par le parent dans son application.
              </p>
            </div>

            <div className="flex justify-end gap-2">
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
                Envoyer au parent
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
