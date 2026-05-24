"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

/**
 * Hook qui édite localement une valeur et la sauvegarde de manière débouncée.
 *
 * - `valeurInitiale` : ce qui est dans la base à la création
 * - `save` : fonction async qui persiste la valeur (renvoie true si OK)
 * - `delay` : nombre de ms à attendre après le dernier changement avant
 *             de déclencher la sauvegarde (défaut 800ms)
 *
 * Retour : [valeurLocale, modifier, statut]
 *
 * Avantages vs. sauvegarde à chaque touche :
 * - Une seule requête par "rafale" de frappe
 * - Statut visible pour l'utilisateur (idle / saving / saved / error)
 * - Pas de blocage de l'UI
 */
export function useDebouncedSave<T>(
  valeurInitiale: T,
  save: (v: T) => Promise<boolean>,
  delay = 800
): [T, (next: T) => void, SaveStatus] {
  const [valeur, setValeur] = useState<T>(valeurInitiale);
  const [statut, setStatut] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  // Si la valeur initiale change (changement de section par exemple),
  // on resynchronise l'état local et on annule tout timer en cours.
  useEffect(() => {
    setValeur(valeurInitiale);
    setStatut("idle");
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(valeurInitiale)]);

  // Cleanup à l'unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const modifier = useCallback(
    (next: T) => {
      setValeur(next);
      setStatut("pending");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        setStatut("saving");
        const ok = await saveRef.current(next);
        setStatut(ok ? "saved" : "error");
        if (ok) {
          // Repasser à idle après 1.5s pour que l'indicateur "Enregistré"
          // ne reste pas affiché en permanence.
          setTimeout(() => setStatut((s) => (s === "saved" ? "idle" : s)), 1500);
        }
      }, delay);
    },
    [delay]
  );

  return [valeur, modifier, statut];
}

export function StatusIndicator({ statut }: { statut: SaveStatus }) {
  if (statut === "idle") return null;
  if (statut === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)]">
        ✏️ En cours d&apos;édition…
      </span>
    );
  }
  if (statut === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)]">
        ⏳ Enregistrement…
      </span>
    );
  }
  if (statut === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
        ✓ Enregistré
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-600">
      ⚠ Erreur d&apos;enregistrement
    </span>
  );
}
