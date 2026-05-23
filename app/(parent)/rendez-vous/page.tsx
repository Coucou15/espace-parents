"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "../../components/AppHeader";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../components/AuthGuard";
import type { EnfantInscrit } from "../../lib/auth";

type Enseignant = {
  id: string;
  prenom: string;
  nom: string;
  matiere: string | null;
  creneauxLibres: number;
};

type Creneau = {
  id: string;
  enseignantId: string;
  dateHeure: string;
  duree: number;
};

type Rdv = {
  id: string;
  dateHeure: string;
  duree: number;
  motif: string | null;
  enseignant: { prenom: string; nom: string; matiere: string | null } | null;
  enfant: { prenom: string } | null;
};

export default function RdvParentPage() {
  return <AuthGuard>{(c) => <Contenu enfants={c.enfants} />}</AuthGuard>;
}

function Contenu({ enfants }: { enfants: EnfantInscrit[] }) {
  const [rdvs, setRdvs] = useState<Rdv[]>([]);
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [chargement, setChargement] = useState(true);
  const [enseignantSelectionne, setEnseignantSelectionne] = useState<Enseignant | null>(null);
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [reservation, setReservation] = useState<{
    creneau: Creneau;
    enseignant: Enseignant;
  } | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function rafraichir() {
    const [rdvRes, ensRes] = await Promise.all([
      fetch("/api/rdv", { cache: "no-store" }),
      fetch("/api/enseignants", { cache: "no-store" }),
    ]);
    if (rdvRes.ok) setRdvs((await rdvRes.json()).rdvs ?? []);
    if (ensRes.ok) setEnseignants((await ensRes.json()).enseignants ?? []);
    setChargement(false);
  }

  useEffect(() => {
    rafraichir();
  }, []);

  async function ouvrirEnseignant(e: Enseignant) {
    setEnseignantSelectionne(e);
    const res = await fetch(
      `/api/creneaux?enseignantId=${e.id}&libresUniquement=true`,
      { cache: "no-store" }
    );
    if (res.ok) setCreneaux((await res.json()).creneaux ?? []);
  }

  function notifier(msg: string) {
    setInfo(msg);
    setTimeout(() => setInfo(null), 3000);
  }

  async function reserver(motif: string, enfantId: string | null) {
    if (!reservation) return;
    setErreur(null);
    const res = await fetch("/api/rdv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creneauId: reservation.creneau.id,
        enfantId: enfantId || undefined,
        motif: motif || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErreur(data.error ?? "Erreur");
      return;
    }
    setReservation(null);
    setEnseignantSelectionne(null);
    notifier("Rendez-vous confirmé ! Vous recevrez un e-mail récapitulatif.");
    await rafraichir();
  }

  async function annuler(id: string) {
    if (!confirm("Annuler ce rendez-vous ?")) return;
    const res = await fetch(`/api/rdv/${id}`, { method: "DELETE" });
    if (res.ok) {
      notifier("Rendez-vous annulé. L'enseignant a été prévenu.");
      await rafraichir();
    }
  }

  const rdvsAVenir = rdvs.filter((r) => new Date(r.dateHeure) >= new Date());

  return (
    <>
      <AppHeader title="Rendez-vous" subtitle="Avec les enseignants" />
      <AppShell>
        <div className="px-5 py-4 space-y-5">
          {info ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              ✓ {info}
            </div>
          ) : null}
          {erreur ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              ⚠ {erreur}
            </div>
          ) : null}

          <section>
            <h2 className="mb-3 text-sm font-semibold text-[var(--brand-primary-dark)]">
              Mes prochains rendez-vous
            </h2>
            {chargement ? (
              <p className="text-xs text-[var(--text-muted)]">Chargement…</p>
            ) : rdvsAVenir.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-5 text-center text-xs text-[var(--text-muted)]">
                Aucun rendez-vous prévu.
              </p>
            ) : (
              <ul className="space-y-2">
                {rdvsAVenir.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">
                          {r.enseignant?.prenom} {r.enseignant?.nom}
                          {r.enseignant?.matiere ? (
                            <span className="ml-1 text-xs text-[var(--text-muted)]">
                              ({r.enseignant.matiere})
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-[var(--brand-primary-dark)] font-medium">
                          {new Date(r.dateHeure).toLocaleString("fr-FR", {
                            weekday: "long",
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        {r.enfant ? (
                          <div className="text-[10px] text-[var(--text-muted)]">
                            Concerne {r.enfant.prenom}
                          </div>
                        ) : null}
                        {r.motif ? (
                          <p className="mt-1 text-[10px] italic text-[var(--text-muted)]">
                            « {r.motif} »
                          </p>
                        ) : null}
                      </div>
                      <button
                        onClick={() => annuler(r.id)}
                        className="shrink-0 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-100"
                      >
                        Annuler
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-[var(--brand-primary-dark)]">
              Prendre rendez-vous
            </h2>
            {enseignants.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">
                Aucun enseignant disponible.
              </p>
            ) : (
              <ul className="space-y-2">
                {enseignants.map((e) => (
                  <li key={e.id}>
                    <button
                      onClick={() => ouvrirEnseignant(e)}
                      disabled={e.creneauxLibres === 0}
                      className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left shadow-sm transition hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[var(--surface)]"
                    >
                      <div>
                        <div className="text-sm font-semibold">
                          {e.prenom} {e.nom}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {e.matiere ?? "—"}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          e.creneauxLibres > 0
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {e.creneauxLibres} créneau
                        {e.creneauxLibres > 1 ? "x" : ""} libre
                        {e.creneauxLibres > 1 ? "s" : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </AppShell>

      {enseignantSelectionne && !reservation ? (
        <Modal onClose={() => setEnseignantSelectionne(null)}>
          <h2 className="mb-1 text-base font-semibold text-[var(--brand-primary-dark)]">
            {enseignantSelectionne.prenom} {enseignantSelectionne.nom}
          </h2>
          <p className="mb-4 text-xs text-[var(--text-muted)]">
            {enseignantSelectionne.matiere ?? "—"} · Choisissez un créneau
          </p>
          {creneaux.length === 0 ? (
            <p className="rounded-lg bg-[var(--surface-muted)] p-4 text-center text-xs text-[var(--text-muted)]">
              Aucun créneau libre pour le moment.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {creneaux.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() =>
                      setReservation({ creneau: c, enseignant: enseignantSelectionne })
                    }
                    className="flex w-full items-center justify-between rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-left text-sm hover:bg-[var(--brand-soft)]"
                  >
                    <span>
                      {new Date(c.dateHeure).toLocaleString("fr-FR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {c.duree} min →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      ) : null}

      {reservation ? (
        <FormReservation
          enfants={enfants}
          reservation={reservation}
          onClose={() => setReservation(null)}
          onSubmit={(motif, enfantId) => reserver(motif, enfantId)}
        />
      ) : null}
    </>
  );
}

function FormReservation({
  enfants,
  reservation,
  onClose,
  onSubmit,
}: {
  enfants: EnfantInscrit[];
  reservation: { creneau: Creneau; enseignant: Enseignant };
  onClose: () => void;
  onSubmit: (motif: string, enfantId: string | null) => void;
}) {
  const [motif, setMotif] = useState("");
  const [enfantId, setEnfantId] = useState<string>("");

  return (
    <Modal onClose={onClose}>
      <h2 className="mb-1 text-base font-semibold text-[var(--brand-primary-dark)]">
        Confirmer le rendez-vous
      </h2>
      <p className="mb-4 text-xs text-[var(--text-muted)]">
        Avec {reservation.enseignant.prenom} {reservation.enseignant.nom}
        {reservation.enseignant.matiere ? ` (${reservation.enseignant.matiere})` : ""}{" "}
        le{" "}
        <strong>
          {new Date(reservation.creneau.dateHeure).toLocaleString("fr-FR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </strong>
        .
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(motif, enfantId || null);
        }}
        className="space-y-3"
      >
        {enfants.length > 0 ? (
          <div>
            <label className="block text-xs font-medium mb-1">
              Concerne l&apos;enfant
              <span className="text-[var(--text-muted)]"> (facultatif)</span>
            </label>
            <select
              value={enfantId}
              onChange={(e) => setEnfantId(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
            >
              <option value="">— Non précisé —</option>
              {enfants.map((e, i) => (
                <option key={e.id ?? i} value={e.id ?? ""}>
                  {e.prenom} {e.nom}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div>
          <label className="block text-xs font-medium mb-1">
            Motif <span className="text-[var(--text-muted)]">(facultatif)</span>
          </label>
          <textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            rows={3}
            placeholder="Ex: faire le point sur la progression…"
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold hover:bg-[var(--surface-muted)]"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-primary-dark)]"
          >
            Confirmer
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-xl bg-white p-5 shadow-2xl sm:rounded-xl">
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="rounded-md p-1 text-lg text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
