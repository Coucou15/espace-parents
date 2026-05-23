"use client";

import { useEffect, useState } from "react";
import {
  getCurrentSubscription,
  pushNotificationsSupported,
  registerServiceWorker,
  subscribeUser,
  unsubscribeUser,
} from "../lib/push";

export function PushToggle({ userEmail }: { userEmail?: string }) {
  const [supporte, setSupporte] = useState(true);
  const [actif, setActif] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!pushNotificationsSupported()) {
      setSupporte(false);
      return;
    }
    registerServiceWorker().then(async () => {
      const sub = await getCurrentSubscription();
      setActif(!!sub);
    });
  }, []);

  async function activer() {
    setEnCours(true);
    setErreur(null);
    setInfo(null);
    try {
      await subscribeUser(userEmail);
      setActif(true);
      setInfo("Notifications activées. Vous serez prévenu·e à chaque nouvelle annonce.");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setEnCours(false);
    }
  }

  async function desactiver() {
    setEnCours(true);
    setErreur(null);
    setInfo(null);
    try {
      await unsubscribeUser();
      setActif(false);
      setInfo("Notifications désactivées.");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setEnCours(false);
    }
  }

  if (!supporte) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        Les notifications push ne sont pas supportées par ce navigateur (essayez Chrome,
        Firefox ou Edge).
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Notifications push</div>
          <div className="text-[11px] text-[var(--text-muted)]">
            Recevez les annonces de l&apos;école sur ce navigateur, même fermé.
          </div>
        </div>
        <button
          onClick={actif ? desactiver : activer}
          disabled={enCours}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition disabled:opacity-50 ${
            actif
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              : "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)]"
          }`}
        >
          {enCours ? "…" : actif ? "Activées ✓" : "Activer"}
        </button>
      </div>

      {info ? (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
          {info}
        </div>
      ) : null}
      {erreur ? (
        <div className="rounded-md bg-red-50 px-3 py-2 text-[11px] text-red-700">
          ⚠ {erreur}
        </div>
      ) : null}
    </div>
  );
}
