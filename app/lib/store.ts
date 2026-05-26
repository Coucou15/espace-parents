"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CHANNEL_NAME = "espace-parents:store-sync";

/**
 * Petit cache module-level pour éviter de multiples canaux ouverts.
 * Une seule instance BroadcastChannel partagée entre toutes les pages.
 */
let canalShared: BroadcastChannel | null = null;
function getCanal(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  if (!canalShared) canalShared = new BroadcastChannel(CHANNEL_NAME);
  return canalShared;
}

/**
 * Hook qui partage un état entre toutes les pages (admin et parents)
 * via une API REST + SQLite.
 *
 * Synchronisation temps réel :
 * - Même onglet : événement custom (instantané)
 * - Cross-onglets, même navigateur : BroadcastChannel (instantané)
 * - Cross-appareils : refetch automatique quand l'onglet redevient visible
 *
 * API identique à la version précédente : [valeur, setter] avec setter async.
 */
export function useSharedStore<T>(
  name: string,
  fallback: T
): [T, (value: T | ((prev: T) => T)) => Promise<boolean>] {
  const [value, setValue] = useState<T>(fallback);
  const valueRef = useRef<T>(fallback);
  valueRef.current = value;

  const fetchValeur = useCallback(async () => {
    try {
      const res = await fetch(`/api/store/${encodeURIComponent(name)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setValue(data.value as T);
    } catch {
      /* offline : on garde la valeur courante */
    }
  }, [name]);

  // Charge l'état initial depuis l'API
  useEffect(() => {
    fetchValeur();
  }, [fetchValeur]);

  // Refetch quand l'onglet redevient visible (couvre cross-appareils)
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        fetchValeur();
      }
    }
    window.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", fetchValeur);
    return () => {
      window.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", fetchValeur);
    };
  }, [fetchValeur]);

  // Notifications cross-pages (même onglet) via CustomEvent
  // + cross-onglets via BroadcastChannel
  useEffect(() => {
    function appliquer(nouvelleValeur: unknown) {
      setValue(nouvelleValeur as T);
    }

    function handlerLocal(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail && "value" in detail) appliquer(detail.value);
    }

    const canal = getCanal();
    function handlerCanal(e: MessageEvent) {
      if (e.data?.name === name && "value" in e.data) {
        appliquer(e.data.value);
      } else if (e.data?.name === name && e.data.type === "refetch") {
        // Un autre onglet/page a fait une PUT, on refetch pour être à jour
        fetchValeur();
      }
    }

    window.addEventListener(`store:${name}`, handlerLocal);
    canal?.addEventListener("message", handlerCanal);
    return () => {
      window.removeEventListener(`store:${name}`, handlerLocal);
      canal?.removeEventListener("message", handlerCanal);
    };
  }, [name, fetchValeur]);

  const update = useCallback(
    async (v: T | ((prev: T) => T)): Promise<boolean> => {
      const next =
        typeof v === "function" ? (v as (prev: T) => T)(valueRef.current) : v;
      const ancien = valueRef.current;

      // Optimistic update local
      setValue(next);
      window.dispatchEvent(new CustomEvent(`store:${name}`, { detail: { value: next } }));

      // Persister en base
      try {
        const res = await fetch(`/api/store/${encodeURIComponent(name)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: next }),
        });
        if (!res.ok) {
          // Rollback côté UI
          setValue(ancien);
          window.dispatchEvent(
            new CustomEvent(`store:${name}`, { detail: { value: ancien } })
          );
          const body = await res.text().catch(() => "");
          console.error(
            `Échec PUT /api/store/${name} : HTTP ${res.status}`,
            body.slice(0, 200)
          );
          return false;
        }
        // Broadcast aux autres onglets/pages que ce store a changé.
        // On envoie la valeur si elle est petite, sinon juste un signal
        // de refetch pour éviter de saturer le channel.
        try {
          const tailleEstimee = JSON.stringify(next).length;
          if (tailleEstimee < 100_000) {
            getCanal()?.postMessage({ name, value: next });
          } else {
            getCanal()?.postMessage({ name, type: "refetch" });
          }
        } catch {
          /* ignore */
        }
        return true;
      } catch (err) {
        setValue(ancien);
        window.dispatchEvent(
          new CustomEvent(`store:${name}`, { detail: { value: ancien } })
        );
        console.error(`Échec PUT /api/store/${name}`, err);
        return false;
      }
    },
    [name]
  );

  return [value, update];
}
