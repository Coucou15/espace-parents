"use client";

import { useRouter } from "next/navigation";
import { AppHeader } from "../../components/AppHeader";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../components/AuthGuard";
import { PushToggle } from "../../components/PushToggle";
import { logout } from "../../lib/auth";
import { formatClasse, getPalier } from "../../lib/mockData";

export default function ProfilPage() {
  const router = useRouter();

  async function deconnexion() {
    await logout();
    router.replace("/login");
  }

  return (
    <AuthGuard>
      {(compte) => (
        <>
          <AppHeader title="Mon profil" subtitle="Compte et préférences" />
          <AppShell>
            <div className="px-5 py-4 space-y-5">
              <section className="rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-dark)] p-5 text-white shadow-sm">
                <div className="text-xs opacity-80">Connecté en tant que</div>
                <div className="text-lg font-semibold">
                  {compte.prenom} {compte.nom}
                </div>
                <div className="text-xs opacity-90">{compte.email}</div>
                {compte.telephone ? (
                  <div className="text-xs opacity-90">{compte.telephone}</div>
                ) : null}
              </section>

              <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-[var(--brand-primary-dark)]">
                  Mes enfants
                </h2>
                <ul className="divide-y divide-[var(--border)]">
                  {compte.enfants.map((e, i) => (
                    <li
                      key={`${e.prenom}-${e.niveauId}-${i}`}
                      className="flex items-center justify-between gap-2 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">
                          {e.prenom} {e.nom}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {getPalier(e.palierId)?.nom} ·{" "}
                          {formatClasse(e.palierId, e.niveauId, e.section)}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand-primary-dark)]">
                        Inscrit
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                <PushToggle userEmail={compte.email} />
              </section>

              <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                <Lien label="Modifier le mot de passe" />
                <Lien label="Modifier le code d'accès" />
                <Lien label="Langue" valeur="Français" />
              </section>

              <button
                onClick={deconnexion}
                className="w-full rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                Se déconnecter
              </button>

              <p className="text-center text-[10px] text-[var(--text-muted)] pt-2">
                Espace Parents · v0.1 (prototype)
              </p>
            </div>
          </AppShell>
        </>
      )}
    </AuthGuard>
  );
}

function Lien({ label, valeur }: { label: string; valeur?: string }) {
  return (
    <button className="flex w-full items-center justify-between border-b border-[var(--border)] px-4 py-3 text-left text-sm last:border-b-0 hover:bg-[var(--surface-muted)]">
      <span>{label}</span>
      <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
        {valeur}
        <span aria-hidden>›</span>
      </span>
    </button>
  );
}
