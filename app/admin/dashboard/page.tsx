"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "../_components/AdminShell";
import { annonces as annoncesInitiales, type Annonce } from "../../lib/mockData";
import { useSharedStore } from "../../lib/store";

type Stats = {
  demandesEnAttente: number;
  messagesNonTraites: number;
  messagesTotal: number;
  parentsTotal: number;
  parentsActifs: number;
  enseignants: number;
  rdvsAVenir: number;
  abonnementsPush: number;
};

const STATS_VIDES: Stats = {
  demandesEnAttente: 0,
  messagesNonTraites: 0,
  messagesTotal: 0,
  parentsTotal: 0,
  parentsActifs: 0,
  enseignants: 0,
  rdvsAVenir: 0,
  abonnementsPush: 0,
};

export default function AdminDashboard() {
  const [annonces] = useSharedStore<Annonce[]>("annonces", annoncesInitiales);
  const [stats, setStats] = useState<Stats>(STATS_VIDES);
  const [chargement, setChargement] = useState(true);
  const [info, setInfo] = useState<string | null>(null);

  async function rafraichir() {
    try {
      const res = await fetch("/api/stats", { cache: "no-store" });
      if (res.ok) setStats(await res.json());
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

  async function reinitialiser(
    cible: "messages-traites" | "rdvs-passes" | "messages-tous",
    label: string
  ) {
    if (!confirm(`${label}\n\nCette action est définitive. Continuer ?`)) return;
    const res = await fetch("/api/stats/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cible }),
    });
    const data = await res.json();
    if (res.ok) {
      notifier(`${data.supprimes} entrée(s) supprimée(s)`);
      await rafraichir();
    } else {
      notifier(data.error ?? "Erreur");
    }
  }

  return (
    <AdminShell>
      {(session) => (
        <div className="space-y-6">
          <header>
            <h1 className="text-xl font-bold text-[var(--brand-primary-dark)]">
              Bonjour {session.prenom} 👋
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Voici l&apos;activité réelle de l&apos;école.
            </p>
          </header>

          {info ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              ✓ {info}
            </div>
          ) : null}

          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              titre="Demandes en attente"
              valeur={stats.demandesEnAttente}
              urgent={stats.demandesEnAttente > 0}
              href="/admin/demandes"
              chargement={chargement}
            />
            <StatCard
              titre="Parents actifs"
              valeur={stats.parentsActifs}
              sousLigne={`${stats.parentsTotal} comptes au total`}
              href="/admin/parents"
              chargement={chargement}
            />
            <StatCard
              titre="Messages non traités"
              valeur={stats.messagesNonTraites}
              urgent={stats.messagesNonTraites > 0}
              href="/admin/messages"
              chargement={chargement}
            />
            <StatCard
              titre="Annonces publiées"
              valeur={annonces.length}
              href="/admin/annonces"
            />
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-[var(--brand-primary-dark)]">
                État du système
              </h2>
              <ul className="space-y-3 text-sm">
                <StatLigne label="Enseignants" valeur={`${stats.enseignants}`} />
                <StatLigne
                  label="Rendez-vous à venir"
                  valeur={`${stats.rdvsAVenir}`}
                />
                <StatLigne
                  label="Parents abonnés aux notifications push"
                  valeur={`${stats.abonnementsPush} / ${stats.parentsTotal}`}
                />
                <StatLigne
                  label="Messages reçus au total"
                  valeur={`${stats.messagesTotal}`}
                />
              </ul>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-[var(--brand-primary-dark)]">
                Actions rapides
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <ActionRapide
                  href="/admin/annonces"
                  icone="📢"
                  label="Publier une annonce"
                />
                <ActionRapide
                  href="/admin/menu"
                  icone="🍽️"
                  label="Mettre à jour le menu"
                />
                <ActionRapide
                  href="/admin/demandes"
                  icone="📥"
                  label="Valider une demande"
                />
                <ActionRapide
                  href="/admin/messages"
                  icone="✉️"
                  label="Voir les messages"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-[var(--brand-primary-dark)]">
              ⚠ Nettoyage / réinitialisation
            </h2>
            <p className="mb-4 text-xs text-[var(--text-muted)]">
              Supprime définitivement les anciennes données pour alléger les
              listes. Les comptes parents, enseignants, créneaux, annonces, menus,
              etc. ne sont jamais touchés.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  reinitialiser(
                    "messages-traites",
                    "Supprimer tous les messages déjà marqués comme traités ?"
                  )
                }
                className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-muted)]"
              >
                🗑 Supprimer les messages traités
              </button>
              <button
                onClick={() =>
                  reinitialiser(
                    "rdvs-passes",
                    "Supprimer tous les rendez-vous dont la date est dépassée ?"
                  )
                }
                className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-muted)]"
              >
                🗑 Supprimer les RDV passés
              </button>
              <button
                onClick={() =>
                  reinitialiser(
                    "messages-tous",
                    "⚠ Supprimer TOUS les messages, traités ou non ? Cette action est irréversible."
                  )
                }
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
              >
                🗑 Vider tous les messages
              </button>
              <button
                onClick={rafraichir}
                className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-muted)]"
              >
                ↻ Rafraîchir les compteurs
              </button>
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}

function StatCard({
  titre,
  valeur,
  sousLigne,
  urgent = false,
  href,
  chargement = false,
}: {
  titre: string;
  valeur: number;
  sousLigne?: string;
  urgent?: boolean;
  href: string;
  chargement?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
        urgent ? "border-amber-300 ring-1 ring-amber-200" : "border-[var(--border)]"
      }`}
    >
      <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {titre}
      </span>
      <span
        className={`mt-1 text-3xl font-bold ${
          urgent ? "text-amber-600" : "text-[var(--brand-primary-dark)]"
        }`}
      >
        {chargement ? "…" : valeur}
      </span>
      {sousLigne ? (
        <span className="mt-1 text-[10px] text-[var(--text-muted)]">{sousLigne}</span>
      ) : null}
    </Link>
  );
}

function StatLigne({ label, valeur }: { label: string; valeur: string }) {
  return (
    <li className="flex items-center justify-between border-b border-[var(--border)] pb-2 last:border-b-0 last:pb-0">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="font-semibold text-[var(--foreground)]">{valeur}</span>
    </li>
  );
}

function ActionRapide({
  href,
  icone,
  label,
}: {
  href: string;
  icone: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-start gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-xs transition hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-soft)]"
    >
      <span className="text-xl" aria-hidden>
        {icone}
      </span>
      <span className="font-semibold text-[var(--foreground)]">{label}</span>
    </Link>
  );
}
