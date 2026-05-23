"use client";

import { useEffect } from "react";

/**
 * Enregistre le Service Worker au chargement de l'app.
 * Permet : notifications push + comportement PWA (mise en cache, hors-ligne).
 * Composant invisible, à monter dans le layout racine.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Échec de l'enregistrement du Service Worker :", err);
    });
  }, []);
  return null;
}
