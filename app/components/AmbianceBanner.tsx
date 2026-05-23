"use client";

import { useSharedStore } from "../lib/store";

export const SLOTS_AMBIANCE = [
  { id: "login", label: "Écran de connexion" },
  { id: "accueil", label: "Page d'accueil parent" },
  { id: "menu", label: "Menu cantine" },
  { id: "contact", label: "Nous contacter" },
  { id: "inscription", label: "Inscription" },
  { id: "rendez-vous", label: "Rendez-vous" },
  { id: "emploi-du-temps", label: "Emploi du temps" },
  { id: "evaluations", label: "Évaluations" },
] as const;

export type SlotAmbiance = (typeof SLOTS_AMBIANCE)[number]["id"];

export type Ambiance = Partial<Record<SlotAmbiance, string>>;

/**
 * Bandeau visuel pour décorer une page. Affiche la photo enregistrée par
 * l'admin pour cet emplacement (slot), ou rien si aucune photo n'est définie.
 *
 * Variantes :
 * - `hero` : grand bandeau (200px de haut), avec overlay sombre + texte par-dessus
 * - `compact` : bandeau fin (120px), purement décoratif
 */
export function AmbianceBanner({
  slot,
  titre,
  sousTitre,
  variant = "hero",
  className = "",
}: {
  slot: SlotAmbiance;
  titre?: string;
  sousTitre?: string;
  variant?: "hero" | "compact";
  className?: string;
}) {
  const [ambiance] = useSharedStore<Ambiance>("ambiance", {});
  const src = ambiance[slot];

  if (!src) return null;

  const hauteur = variant === "hero" ? "h-48" : "h-24";

  return (
    <div
      className={`relative w-full overflow-hidden ${hauteur} ${className}`}
      aria-hidden={!titre}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={titre ?? ""}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {titre || sousTitre ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
            {titre ? (
              <h2 className="text-lg font-bold drop-shadow-md">{titre}</h2>
            ) : null}
            {sousTitre ? (
              <p className="text-xs opacity-90 drop-shadow">{sousTitre}</p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
