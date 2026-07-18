"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMe, type Compte } from "../../lib/auth";
import { formatClasse, type PalierId, type SectionId } from "../../lib/mockData";

type Eleve = {
  id: string;
  prenom: string;
  nom: string;
  palierId: PalierId;
  niveauId: string;
  section: SectionId;
  parent: { prenom: string; nom: string; email: string } | null;
};

type Absence = {
  id: string;
  enfantId: string;
  enfantPrenom: string;
  enfantNom: string;
  date: string;
  periode: "journee" | "matin" | "apresmidi";
  motif: string | null;
  justifiee: boolean;
  signaleParNom: string;
  createdAt: string;
};

const PERIODES: { id: Absence["periode"]; label: string }[] = [
  { id: "journee", label: "Journée entière" },
  { id: "matin", label: "Matinée" },
  { id: "apresmidi", label: "Après-midi" },
];

const ROLES_AUTORISES = ["enseignant", "admin-ecole", "super-admin"];

function aujourdhui(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AbsencesAdmin() {
  const router = useRouter();
  const [user, setUser] = useState<Compte | null>(null);
  const [chargement, setChargement] = useState(true);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [date, setDate] = useState(aujourdhui());
  const [recherche, setRecherche] = useState("");
  const [confirmation, setConfirmation] = useState<{
    eleve: Eleve;
    date: string;
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
    const [elevesRes, absRes] = await Promise.all([
      fetch("/api/enfants", { cache: "no-store" }),
      fetch(`/api/absences?date=${date}`, { cache: "no-store" }),
    ]);
    if (elevesRes.ok) setEleves((await elevesRes.json()).enfants ?? []);
    if (absRes.ok) setAbsences((await absRes.json()).absences ?? []);
  }

  useEffect(() => {
    if (user) rafraichir();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, date]);

  function notifier(msg: string) {
    setInfo(msg);
    setTimeout(() => setInfo(null), 3500);
  }

  const elevesFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return eleves;
    return eleves.filter(
      (e) =>
        e.prenom.toLowerCase().includes(q) ||
        e.nom.toLowerCase().includes(q) ||
        formatClasse(e.palierId, e.niveauId, e.section).toLowerCase().includes(q)
    );
  }, [eleves, recherche]);

  // Map enfantId → absence pour la date sélectionnée (première trouvée)
  const absencesJour = useMemo(() => {
    const m = new Map<string, Absence>();
    absences.forEach((a) => {
      if (!m.has(a.enfantId)) m.set(a.enfantId, a);
    });
    return m;
  }, [absences]);

  async function signaler(eleveId: string, periode: Absence["periode"], motif: string) {
    setErreur(null);
    const res = await fetch("/api/absences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enfantId: eleveId,
        date,
        periode,
        motif: motif || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErreur(data.error ?? "Erreur");
      return;
    }
    setConfirmation(null);
    notifier(
      data.parentPrevenu
        ? "Absence enregistrée. E-mail et notification envoyés au parent."
        : "Absence enregistrée. Aucun parent lié à l'élève pour la notification."
    );
    await rafraichir();
  }

  async function retirer(id: string) {
    if (!confirm("Retirer cette absence ? Le parent recevra une correction manuelle si nécessaire.")) return;
    const res = await fetch(`/api/absences/${id}`, { method: "DELETE" });
    if (res.ok) {
      notifier("Absence retirée.");
      await rafraichir();
    }
  }

  async function toggleJustifiee(a: Absence) {
    const res = await fetch(`/api/absences/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ justifiee: !a.justifiee }),
    });
    if (res.ok) {
      notifier(a.justifiee ? "Marquée non justifiée." : "Marquée justifiée.");
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

  const dateJolie = new Date(date + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-[var(--surface-muted)] p-4 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--brand-primary-dark)]">
              Feuille d&apos;appel — Absences
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Cochez la case d&apos;un élève absent. Un e-mail et une notification
              push seront envoyés automatiquement au parent.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-[var(--text-muted)]">
              Date :
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
            />
            <button
              onClick={() => router.push("/admin")}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-muted)]"
            >
              ← Retour
            </button>
          </div>
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
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-[var(--brand-primary-dark)]">
              {dateJolie} · {elevesFiltres.length} élève{elevesFiltres.length > 1 ? "s" : ""}
              {" · "}
              <span className="text-amber-700">
                {absencesJour.size} absent{absencesJour.size > 1 ? "s" : ""}
              </span>
            </h2>
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un élève ou une classe…"
              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs sm:w-64"
            />
          </div>

          {elevesFiltres.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-muted)]/40 p-4 text-center text-xs text-[var(--text-muted)]">
              Aucun élève trouvé.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {elevesFiltres.map((eleve) => {
                const absence = absencesJour.get(eleve.id);
                return (
                  <li
                    key={eleve.id}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <input
                      type="checkbox"
                      checked={!!absence}
                      onChange={() => {
                        if (absence) {
                          retirer(absence.id);
                        } else {
                          setConfirmation({ eleve, date });
                        }
                      }}
                      className="h-5 w-5 shrink-0 cursor-pointer accent-amber-600"
                      aria-label={`Marquer ${eleve.prenom} absent`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">
                        {eleve.prenom} {eleve.nom}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {formatClasse(eleve.palierId, eleve.niveauId, eleve.section)}
                      </div>
                    </div>
                    {absence ? (
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                          {PERIODES.find((p) => p.id === absence.periode)?.label}
                        </span>
                        <button
                          onClick={() => toggleJustifiee(absence)}
                          className={`rounded-full border px-2 py-0.5 font-semibold ${
                            absence.justifiee
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-slate-300 bg-slate-50 text-slate-600"
                          }`}
                        >
                          {absence.justifiee ? "✓ Justifiée" : "Non justifiée"}
                        </button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {absencesJour.size > 0 ? (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-[var(--brand-primary-dark)]">
              Absences signalées ce jour
            </h2>
            <ul className="space-y-2">
              {[...absencesJour.values()].map((a) => (
                <li
                  key={a.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-[var(--border)] bg-white p-3 text-sm"
                >
                  <div className="min-w-0">
                    <div className="font-semibold">
                      {a.enfantPrenom} {a.enfantNom}
                    </div>
                    {a.motif ? (
                      <p className="text-xs italic text-[var(--text-muted)] mt-0.5">
                        « {a.motif} »
                      </p>
                    ) : null}
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      Signalé par {a.signaleParNom}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {confirmation ? (
        <FormAbsence
          eleve={confirmation.eleve}
          date={confirmation.date}
          onClose={() => setConfirmation(null)}
          onSubmit={(periode, motif) => signaler(confirmation.eleve.id, periode, motif)}
        />
      ) : null}
    </div>
  );
}

function FormAbsence({
  eleve,
  date,
  onClose,
  onSubmit,
}: {
  eleve: Eleve;
  date: string;
  onClose: () => void;
  onSubmit: (periode: Absence["periode"], motif: string) => void;
}) {
  const [periode, setPeriode] = useState<Absence["periode"]>("journee");
  const [motif, setMotif] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-xl bg-white p-5 shadow-2xl sm:rounded-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--brand-primary-dark)]">
            Signaler une absence
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-lg text-[var(--text-muted)] hover:bg-[var(--surface-muted)]"
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-sm">
          <strong>{eleve.prenom} {eleve.nom}</strong>{" "}
          <span className="text-[var(--text-muted)]">·{" "}
            {new Date(date + "T12:00:00").toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </span>
        </p>

        <div className="mb-3">
          <label className="block text-xs font-medium mb-1.5">Période</label>
          <div className="grid grid-cols-3 gap-1.5">
            {PERIODES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriode(p.id)}
                className={`rounded-lg border-2 px-2 py-2 text-[11px] font-semibold transition ${
                  periode === p.id
                    ? "border-amber-400 bg-amber-50 text-amber-700"
                    : "border-[var(--border)] bg-white text-[var(--text-muted)]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium mb-1">
            Motif <span className="text-[var(--text-muted)]">(facultatif)</span>
          </label>
          <textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            rows={3}
            placeholder="Ex: maladie signalée par téléphone ce matin"
            className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
          />
        </div>

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800 mb-4">
          En cliquant sur « Signaler », un e-mail et une notification push seront
          envoyés automatiquement au parent.
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold hover:bg-[var(--surface-muted)]"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onSubmit(periode, motif)}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
          >
            Signaler et notifier
          </button>
        </div>
      </div>
    </div>
  );
}
