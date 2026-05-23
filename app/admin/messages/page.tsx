"use client";

import { useState } from "react";
import { AdminShell } from "../_components/AdminShell";
import { messagesInitiaux, type MessageRecu } from "../_lib/adminMockData";

export default function MessagesAdmin() {
  const [messages, setMessages] = useState<MessageRecu[]>(messagesInitiaux);
  const [selection, setSelection] = useState<MessageRecu | null>(
    messagesInitiaux.find((m) => !m.traite) ?? messagesInitiaux[0] ?? null
  );
  const [filtre, setFiltre] = useState<"tous" | "non-traites" | "traites">("non-traites");

  const liste = messages.filter((m) => {
    if (filtre === "non-traites") return !m.traite;
    if (filtre === "traites") return m.traite;
    return true;
  });

  function basculerTraite(id: string) {
    setMessages((curr) =>
      curr.map((m) => (m.id === id ? { ...m, traite: !m.traite } : m))
    );
    if (selection?.id === id) {
      setSelection((s) => (s ? { ...s, traite: !s.traite } : s));
    }
  }

  function supprimer(id: string) {
    if (!confirm("Supprimer ce message ?")) return;
    setMessages((curr) => curr.filter((m) => m.id !== id));
    if (selection?.id === id) setSelection(null);
  }

  return (
    <AdminShell>
      {() => (
        <div className="space-y-5">
          <header>
            <h1 className="text-xl font-bold text-[var(--brand-primary-dark)]">
              Messages des parents
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              {messages.filter((m) => !m.traite).length} message
              {messages.filter((m) => !m.traite).length > 1 ? "s" : ""} non traité
              {messages.filter((m) => !m.traite).length > 1 ? "s" : ""}.
            </p>
          </header>

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
                      onClick={() => setSelection(m)}
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
                        · {new Date(selection.date).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => basculerTraite(selection.id)}
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

                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
                    {selection.message}
                  </p>

                  <div className="border-t border-[var(--border)] pt-3">
                    <label className="block text-xs font-medium mb-1">Réponse</label>
                    <textarea
                      rows={4}
                      placeholder="Rédiger une réponse…"
                      className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                    />
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-primary-dark)]"
                      >
                        Envoyer la réponse
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
