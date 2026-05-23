"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMe, type Compte } from "../../lib/auth";

type RDV = {
  id: string;
  dateHeure: string;
  duree: number;
  motif: string | null;
  statut: string;
  parent: { id: string; prenom: string; nom: string } | null;
  enseignant: { id: string; prenom: string; nom: string; matiere: string | null } | null;
  enfant: { id: string; prenom: string; nom: string } | null;
};

type Creneau = {
  id: string;
  enseignantId: string;
  dateHeure: string;
  duree: number;
  pris: boolean;
};

const ROLES_AUTORISES = ["admin-ecole", "super-admin", "enseignant"];

export default function RdvAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<Compte | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    fetchMe().then((u) => {
      if (!u || !ROLES_AUTORISES.includes(u.role)) {
        router.replace(u ? "/" : "/login");
      } else {
        setUser(u);
      }
      setChargement(false);
    });
  }, [router]);

  if (chargement) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-muted)] text-sm text-[var(--text-muted)]">
        Chargement…
      </div>
    );
  }
  if (!user) return null;

  return user.role === "enseignant" ? (
    <EspaceEnseignant user={user} onDeconnexion={() => router.replace("/admin")} />
  ) : (
    <AdminRdvVue />
  );
}

function EspaceEnseignant({
  user,
  onDeconnexion,
}: {
  user: Compte;
  onDeconnexion: () => void;
}) {
  const [rdvs, setRdvs] = useState<RDV[]>([]);
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [nouveauCreneau, setNouveauCreneau] = useState({ date: "", heure: "", duree: 15 });
  const [info, setInfo] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function rafraichir() {
    const [rdvRes, creneauRes] = await Promise.all([
      fetch("/api/rdv", { cache: "no-store" }),
      fetch("/api/creneaux", { cache: "no-store" }),
    ]);
    if (rdvRes.ok) setRdvs((await rdvRes.json()).rdvs ?? []);
    if (creneauRes.ok) setCreneaux((await creneauRes.json()).creneaux ?? []);
  }

  useEffect(() => {
    rafraichir();
  }, []);

  function notifier(msg: string) {
    setInfo(msg);
    setTimeout(() => setInfo(null), 2500);
  }

  async function ajouterCreneau(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (!nouveauCreneau.date || !nouveauCreneau.heure) {
      setErreur("Date et heure requises");
      return;
    }
    const dateHeure = `${nouveauCreneau.date}T${nouveauCreneau.heure}:00`;
    const res = await fetch("/api/creneaux", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateHeure, duree: nouveauCreneau.duree }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErreur(data.error ?? "Erreur");
      return;
    }
    setNouveauCreneau({ date: "", heure: "", duree: 15 });
    notifier("Créneau ajouté");
    await rafraichir();
  }

  async function supprimerCreneau(id: string) {
    const res = await fetch(`/api/creneaux/${id}`, { method: "DELETE" });
    if (res.ok) {
      notifier("Créneau retiré");
      await rafraichir();
    }
  }

  async function annulerRdv(id: string) {
    if (!confirm("Annuler ce rendez-vous ?")) return;
    const res = await fetch(`/api/rdv/${id}`, { method: "DELETE" });
    if (res.ok) {
      notifier("Rendez-vous annulé. Le parent a été notifié.");
      await rafraichir();
    }
  }

  const rdvsAVenir = rdvs.filter((r) => new Date(r.dateHeure) >= new Date());
  const creneauxFuturs = creneaux.filter(
    (c) => !c.pris && new Date(c.dateHeure) >= new Date()
  );

  return (
    <div className="min-h-screen bg-[var(--surface-muted)] p-4 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--brand-primary-dark)]">
              Espace enseignant
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              {user.prenom} {user.nom}
              {user.role === "enseignant" ? " · Vos rendez-vous et créneaux" : ""}
            </p>
          </div>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              onDeconnexion();
            }}
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-muted)]"
          >
            Déconnexion
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
          <h2 className="mb-4 text-base font-bold text-[var(--brand-primary-dark)]">
            Rendez-vous à venir ({rdvsAVenir.length})
          </h2>
          {rdvsAVenir.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Aucun rendez-vous prévu.</p>
          ) : (
            <ul className="space-y-2">
              {rdvsAVenir.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-2 rounded-lg border border-[var(--border)] p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">
                      {new Date(r.dateHeure).toLocaleString("fr-FR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      Avec {r.parent?.prenom} {r.parent?.nom}
                      {r.enfant ? ` · concerne ${r.enfant.prenom}` : ""}
                      {" · "}{r.duree} min
                    </div>
                    {r.motif ? (
                      <div className="mt-1 text-xs italic text-[var(--text-muted)]">
                        « {r.motif} »
                      </div>
                    ) : null}
                  </div>
                  <button
                    onClick={() => annulerRdv(r.id)}
                    className="shrink-0 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                  >
                    Annuler
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-[var(--brand-primary-dark)]">
            Mes créneaux disponibles
          </h2>

          <form onSubmit={ajouterCreneau} className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_80px_auto]">
            <input
              type="date"
              required
              value={nouveauCreneau.date}
              onChange={(e) => setNouveauCreneau({ ...nouveauCreneau, date: e.target.value })}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
            />
            <input
              type="time"
              required
              value={nouveauCreneau.heure}
              onChange={(e) => setNouveauCreneau({ ...nouveauCreneau, heure: e.target.value })}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={5}
              max={120}
              value={nouveauCreneau.duree}
              onChange={(e) =>
                setNouveauCreneau({ ...nouveauCreneau, duree: parseInt(e.target.value) || 15 })
              }
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
              title="Durée en minutes"
            />
            <button
              type="submit"
              className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-primary-dark)]"
            >
              + Ajouter
            </button>
          </form>

          {creneauxFuturs.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              Aucun créneau libre à venir. Ajoutez-en pour permettre aux parents de réserver.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {creneauxFuturs.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/40 px-3 py-2 text-xs"
                >
                  <span>
                    {new Date(c.dateHeure).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    <span className="text-[var(--text-muted)]"> · {c.duree}min</span>
                  </span>
                  <button
                    onClick={() => supprimerCreneau(c.id)}
                    className="ml-2 rounded-md text-red-600 hover:bg-red-50 px-1"
                    title="Retirer"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function AdminRdvVue() {
  // Admin : on réutilise l'AdminShell pour avoir la sidebar
  return <AdminVueAvecShell />;
}

import { AdminShell } from "../_components/AdminShell";

function AdminVueAvecShell() {
  const [rdvs, setRdvs] = useState<RDV[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    fetch("/api/rdv", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setRdvs(d.rdvs ?? []))
      .finally(() => setChargement(false));
  }, []);

  const aVenir = rdvs.filter((r) => new Date(r.dateHeure) >= new Date());
  const passes = rdvs.filter((r) => new Date(r.dateHeure) < new Date());

  return (
    <AdminShell>
      {() => (
        <div className="space-y-5">
          <header>
            <h1 className="text-xl font-bold text-[var(--brand-primary-dark)]">
              Tous les rendez-vous
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              {chargement
                ? "…"
                : `${aVenir.length} à venir · ${passes.length} passé${passes.length > 1 ? "s" : ""}`}
            </p>
          </header>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-[var(--brand-primary-dark)]">
              À venir
            </h2>
            {aVenir.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-6 text-center text-sm text-[var(--text-muted)]">
                Aucun rendez-vous à venir.
              </div>
            ) : (
              <RdvTable rdvs={aVenir} />
            )}
          </section>

          {passes.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-[var(--text-muted)]">
                Historique
              </h2>
              <RdvTable rdvs={passes.slice(0, 20)} />
            </section>
          ) : null}
        </div>
      )}
    </AdminShell>
  );
}

function RdvTable({ rdvs }: { rdvs: RDV[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-[var(--surface-muted)] text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
          <tr>
            <th className="px-4 py-2 text-left font-semibold">Date</th>
            <th className="px-4 py-2 text-left font-semibold">Parent</th>
            <th className="px-4 py-2 text-left font-semibold">Enseignant</th>
            <th className="hidden px-4 py-2 text-left font-semibold lg:table-cell">Enfant</th>
            <th className="hidden px-4 py-2 text-left font-semibold lg:table-cell">Motif</th>
          </tr>
        </thead>
        <tbody>
          {rdvs.map((r) => (
            <tr key={r.id} className="border-t border-[var(--border)]">
              <td className="px-4 py-3 text-xs">
                {new Date(r.dateHeure).toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-4 py-3 text-xs">
                {r.parent ? `${r.parent.prenom} ${r.parent.nom}` : "—"}
              </td>
              <td className="px-4 py-3 text-xs">
                {r.enseignant
                  ? `${r.enseignant.prenom} ${r.enseignant.nom}${r.enseignant.matiere ? ` (${r.enseignant.matiere})` : ""}`
                  : "—"}
              </td>
              <td className="hidden px-4 py-3 text-xs lg:table-cell">
                {r.enfant ? r.enfant.prenom : "—"}
              </td>
              <td className="hidden px-4 py-3 text-xs italic text-[var(--text-muted)] lg:table-cell">
                {r.motif ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
