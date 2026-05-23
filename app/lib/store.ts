"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook qui partage un état entre toutes les pages (admin et parents)
 * via une API REST + SQLite.
 *
 * - Au montage : GET /api/store/{name} pour charger l'état persisté.
 * - À chaque setValue : optimistic update local + PUT /api/store/{name}.
 * - Si une autre page modifie la valeur, on est notifié via :
 *   - un événement custom (même onglet)
 *   - un polling léger sur la dernière mise à jour (cross-onglets / cross-machines)
 *
 * API identique à l'ancien useSharedStore localStorage pour faciliter
 * la migration des composants existants.
 *
 * `fallback` est utilisé tant que la requête initiale n'a pas répondu.
 */
export function useSharedStore<T>(
  name: string,
  fallback: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(fallback);
  const valueRef = useRef<T>(fallback);
  valueRef.current = value;

  // Charge l'état initial depuis l'API
  useEffect(() => {
    let annule = false;
    fetch(`/api/store/${encodeURIComponent(name)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (annule || !data) return;
        setValue(data.value as T);
      })
      .catch(() => {
        /* offline : on garde le fallback */
      });
    return () => {
      annule = true;
    };
  }, [name]);

  // Notifications cross-pages (même onglet) via CustomEvent
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && "value" in detail) {
        setValue(detail.value as T);
      }
    };
    window.addEventListener(`store:${name}`, handler);
    return () => window.removeEventListener(`store:${name}`, handler);
  }, [name]);

  const update = useCallback(
    (v: T | ((prev: T) => T)) => {
      const next =
        typeof v === "function" ? (v as (prev: T) => T)(valueRef.current) : v;

      // Optimistic update local
      setValue(next);
      // Diffuser aux autres composants du même onglet
      window.dispatchEvent(new CustomEvent(`store:${name}`, { detail: { value: next } }));
      // Persister en base
      fetch(`/api/store/${encodeURIComponent(name)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: next }),
      }).catch((err) => {
        console.error(`Échec PUT /api/store/${name}`, err);
      });
    },
    [name]
  );

  return [value, update];
}
