"use client";

import Link from "next/link";
import { AdminShell } from "../_components/AdminShell";
import {
  comptesParentsInitiaux,
  demandesInitiales,
  messagesInitiaux,
  statsUtilisation,
} from "../_lib/adminMockData";
import { annonces as annoncesInitiales, type Annonce } from "../../lib/mockData";
import { useSharedStore } from "../../lib/store";

export default function AdminDashboard() {
  const [annonces] = useSharedStore<Annonce[]>("annonces", annoncesInitiales);
  const messagesNonTraites = messagesInitiaux.filter((m) => !m.traite).length;
  const parentsActifs = comptesParentsInitiaux.filter((p) => p.statut === "actif").length;

  return (
    <AdminShell>
      {(session) => (
        <div className="space-y-6">
          <header>
            <h1 className="text-xl font-bold text-[var(--brand-primary-dark)]">
              Bonjour {session.prenom} 👋
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Voici un aperçu de l&apos;activité de l&apos;école.
            </p>
          </header>

          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              titre="Demandes en attente"
              valeur={demandesInitiales.length}
              urgent={demandesInitiales.length > 0}
              href="/admin/demandes"
            />
            <StatCard
              titre="Parents actifs"
              valeur={parentsActifs}
              sousLigne={`${comptesParentsInitiaux.length} comptes au total`}
              href="/admin/parents"
            />
            <StatCard
              titre="Messages non traités"
              valeur={messagesNonTraites}
              urgent={messagesNonTraites > 0}
              href="/admin/messages"
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
                Statistiques d&apos;utilisation
              </h2>
              <ul className="space-y-3 text-sm">
                <StatLigne
                  label="Connexions aujourd&apos;hui"
                  valeur={`${statsUtilisation.connexionsAujourdHui}`}
                />
                <StatLigne
                  label="Connexions sur 7 jours"
                  valeur={`${statsUtilisation.connexions7jours}`}
                />
                <StatLigne
                  label="Module le plus visité"
                  valeur={statsUtilisation.moduleLePlusVisite}
                />
                <StatLigne
                  label="Comptes parents actifs"
                  valeur={`${statsUtilisation.pourcentageActifs}%`}
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
}: {
  titre: string;
  valeur: number;
  sousLigne?: string;
  urgent?: boolean;
  href: string;
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
        {valeur}
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
