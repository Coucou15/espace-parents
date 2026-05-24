"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../_components/AdminShell";

type Message = {
  id: string;
  parentPrenom: string;
  parentNom: string;
  email: string;
  sujet: string;
  message: string;
  traite: boolean;
  date: string;
};

export default function MessagesAdmin() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chargement, setChargement] = useState(true);
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<"tous" | "non-traites" | "traites">("non-traites");
  const [erreur, setErreur] = useState<string | null>(null);
  const [reponse, setReponse] = useState("");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  function notifier(msg: string) {
    setInfo(msg);
    setTimeout(() => setInfo(null), 3000);
  }

  async function envoyerReponse(messageId: string) {
    if (!reponse.trim()) return;
    setEnvoiEnCours(true);
    setErreur(null);
    try {
      const res = await fetch(`/api/messages/${messageId}/repondre`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reponse }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErreur(data.error ?? "Échec de l'envoi");
        return;
      }
      setReponse("");
      notifier("Réponse envoyée au parent par e-mail. Message marqué comme traité.");
      await rafraichir();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur réseau");
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function rafraichir() {
    try {
      const res = await fetch("/api/messages", { cache: "no-store" });
      if (!res.ok) {
        setErreur(`Erreur de chargement (HTTP ${res.status})`);
        return;
      }
      const data = await res.json();
      setMessages(data.messages ?? []);
      setErreur(null);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    rafraichir();
  }, []);

  // Reset la zone de réponse quand on change de message sélectionné
  useEffect(() => {
    setReponse("");
    setErreur(null);
  }, [selectionId]);

  const liste = messages.filter((m) => {
    if (filtre === "non-traites") return !m.traite;
    if (filtre === "traites") return m.traite;
    return true;
  });

  const selection = messages.find((m) => m.id === selectionId) ?? liste[0] ?? null;

  async function basculerTraite(m: Message) {
    const res = await fetch(`/api/messages/${m.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ traite: !m.traite }),
    });
    if (res.ok) await rafraichir();
  }

  async function supprimer(id: string) {
    if (!confirm("Supprimer ce message ?")) return;
    const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (selectionId === id) setSelectionId(null);
      await rafraichir();
    }
  }

  return (
    <AdminShell>
      {() => (
        <div className="space-y-5">
          <header className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[var(--brand-primary-dark)]">
                Messages des parents
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                {chargement
                  ? "Chargement…"
                  : `${messages.filter((m) => !m.traite).length} non traité${
                      messages.filter((m) => !m.traite).length > 1 ? "s" : ""
                    } sur ${messages.length}`}
              </p>
            </div>
            <button
              onClick={rafraichir}
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-muted)]"
            >
              ↻ Rafraîchir
            </button>
          </header>

          {erreur ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              ⚠ {erreur}
            </div>
          ) : null}

          <div className="flex gap-1.5 rounded-lg bg-[var(--surface-muted)] p-1 text-xs lg:w-fit">
            {(
              [
                { id: "non-traites", label: "Non traités" },
                { id: "traites", label: "Traités" },
                { id: "tous", label: "Tous" },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltre(f.id)}
                className={`rounded-md px-3 py-1.5 font-semibold transition ${
                  filtre === f.id
                    ? "bg-white text-[var(--brand-primary-dark)] shadow-sm"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_2fr]">
            <ul className="space-y-2">
              {liste.length === 0 ? (
                <li className="rounded-xl border border-dashed border-[var(--border)] bg-white p-6 text-center text-sm text-[var(--text-muted)]">
                  Aucun message.
                </li>
              ) : (
                liste.map((m) => (
                  <li key={m.id}>
                    <button
                      onClick={() => setSelectionId(m.id)}
                      className={`flex w-full flex-col gap-1 rounded-lg border bg-white p-3 text-left text-sm transition ${
                        selection?.id === m.id
                          ? "border-[var(--brand-primary)] bg-[var(--brand-soft)]"
                          : "border-[var(--border)] hover:bg-[var(--surface-muted)]"
                      } ${!m.traite ? "ring-1 ring-amber-200" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold">
                          {m.parentPrenom} {m.parentNom}
                        </span>
                        <span className="shrink-0 text-[10px] text-[var(--text-muted)]">
                          {new Date(m.date).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <div className="truncate text-xs font-medium text-[var(--brand-primary-dark)]">
                        {m.sujet}
                      </div>
                      <div className="line-clamp-1 text-[11px] text-[var(--text-muted)]">
                        {m.message}
                      </div>
                      {!m.traite ? (
                        <span className="self-start rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Non traité
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))
              )}
            </ul>

            <div>
              {selection ? (
                <article className="space-y-4 rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
                  <header className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-[var(--brand-primary-dark)]">
                        {selection.sujet}
                      </h2>
                      <div className="text-xs text-[var(--text-muted)]">
                        De {selection.parentPrenom} {selection.parentNom} ·{" "}
                        <a href={`mailto:${selection.email}`} className="underline">
                          {selection.email}
                        </a>{" "}
                        ·{" "}
                        {new Date(selection.date).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => basculerTraite(selection)}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          selection.traite
                            ? "border border-[var(--border)] bg-white hover:bg-[var(--surface-muted)]"
                            : "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)]"
                        }`}
                      >
                        {selection.traite ? "Marquer non traité" : "Marquer traité"}
                      </button>
                      <button
                        onClick={() => supprimer(selection.id)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                      >
                        Supprimer
                      </button>
                    </div>
                  </header>

                  <div className="rounded-lg bg-[var(--surface-muted)]/60 p-3">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
                      {selection.message}
                    </p>
                  </div>

                  <div className="border-t border-[var(--border)] pt-4">
                    <h3 className="mb-2 text-sm font-semibold text-[var(--brand-primary-dark)]">
                      ✉️ Répondre directement par e-mail
                    </h3>
                    <p className="mb-2 text-[11px] text-[var(--text-muted)]">
                      Votre réponse sera envoyée à <strong>{selection.email}</strong>{" "}
                      sans quitter l&apos;application. Le message sera automatiquement
                      marqué comme traité.
                    </p>
                    <textarea
                      value={reponse}
                      onChange={(e) => setReponse(e.target.value)}
                      rows={5}
                      placeholder={`Bonjour ${selection.parentPrenom},\n\n…`}
                      className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                    />
                    {erreur ? (
                      <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        ⚠ {erreur}
                      </p>
                    ) : null}
                    {info ? (
                      <p className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                        ✓ {info}
                      </p>
                    ) : null}
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => envoyerReponse(selection.id)}
                        disabled={envoiEnCours || !reponse.trim()}
                        className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {envoiEnCours ? "Envoi en cours…" : "Envoyer la réponse"}
                      </button>
                    </div>
                  </div>
                </article>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-white p-10 text-sm text-[var(--text-muted)]">
                  Sélectionnez un message à gauche.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
