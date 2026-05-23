"use client";

import { useState } from "react";
import { AmbianceBanner } from "../../components/AmbianceBanner";
import { AppHeader } from "../../components/AppHeader";
import { AppShell } from "../../components/AppShell";
import { AuthGuard } from "../../components/AuthGuard";
import { ecole as ecoleParDefaut } from "../../lib/mockData";
import { useSharedStore } from "../../lib/store";

type InfosEcole = typeof ecoleParDefaut;

export default function ContactPage() {
  const [envoye, setEnvoye] = useState(false);
  const [ecole] = useSharedStore<InfosEcole>("ecole", ecoleParDefaut);

  return (
    <AuthGuard>
      {() => (
        <>
          <AppHeader title="Nous contacter" subtitle="Secrétariat de l'école" />
          <AppShell>
            <AmbianceBanner slot="contact" />
            <div className="px-5 py-4 space-y-5">
              <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-[var(--brand-primary-dark)]">
                  Coordonnées
                </h2>
                <ul className="space-y-2 text-xs">
                  <InfoRow icone="📍" label="Adresse" valeur={ecole.adresse} />
                  <InfoRow icone="📞" label="Téléphone" valeur={ecole.telephone} href={`tel:${ecole.telephone}`} />
                  <InfoRow icone="✉️" label="E-mail" valeur={ecole.email} href={`mailto:${ecole.email}`} />
                  <InfoRow icone="🕒" label="Horaires" valeur={ecole.horaires} />
                </ul>
                {ecole.reseauxSociaux?.facebook || ecole.reseauxSociaux?.instagram ? (
                  <div className="mt-3 flex gap-3 border-t border-[var(--border)] pt-3">
                    {ecole.reseauxSociaux.facebook ? (
                      <a
                        href={ecole.reseauxSociaux.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-[var(--brand-secondary)] hover:underline"
                      >
                        Facebook ↗
                      </a>
                    ) : null}
                    {ecole.reseauxSociaux.instagram ? (
                      <a
                        href={ecole.reseauxSociaux.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-[var(--brand-secondary)] hover:underline"
                      >
                        Instagram ↗
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </section>

              <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-[var(--brand-primary-dark)]">
                  Envoyer un message
                </h2>
                {envoye ? (
                  <div className="rounded-md bg-[var(--brand-soft)] px-3 py-2 text-xs text-[var(--brand-primary-dark)]">
                    Votre message a bien été envoyé. L&apos;administration vous
                    répondra sous 48h ouvrées.
                  </div>
                ) : (
                  <form
                    className="space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setEnvoye(true);
                    }}
                  >
                    <Champ label="Sujet" placeholder="Absence, rendez-vous, question…" />
                    <div>
                      <label className="block text-xs font-medium mb-1">Message</label>
                      <textarea
                        required
                        rows={4}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                        placeholder="Bonjour, …"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-[var(--brand-primary)] py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-primary-dark)]"
                    >
                      Envoyer
                    </button>
                  </form>
                )}
              </section>
            </div>
          </AppShell>
        </>
      )}
    </AuthGuard>
  );
}

function InfoRow({
  icone,
  label,
  valeur,
  href,
}: {
  icone: string;
  label: string;
  valeur: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-2.5">
      <span className="text-base leading-none">{icone}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
          {label}
        </div>
        <div className="text-sm text-[var(--foreground)] break-words">{valeur}</div>
      </div>
    </div>
  );
  return (
    <li>
      {href ? (
        <a href={href} className="block hover:opacity-80">
          {content}
        </a>
      ) : (
        content
      )}
    </li>
  );
}

function Champ({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1">{label}</label>
      <input
        type="text"
        required
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
      />
    </div>
  );
}
