"use client";

/**
 * Helpers côté client pour gérer l'abonnement aux notifications push.
 *
 * Flow général :
 * 1. registerServiceWorker() au chargement de l'app (silencieux, idempotent)
 * 2. quand le parent active les notifications : subscribeUser()
 *    → demande permission → s'abonne via PushManager → POST /api/push/subscribe
 * 3. unsubscribeUser() inverse l'opération
 */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export function pushNotificationsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Convertit la clé publique VAPID (base64url) en ArrayBuffer pour PushManager. */
function urlBase64ToBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!pushNotificationsSupported()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch (err) {
    console.error("Échec de l'enregistrement du Service Worker :", err);
    return null;
  }
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!pushNotificationsSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function subscribeUser(userEmail?: string): Promise<PushSubscription | null> {
  if (!pushNotificationsSupported()) {
    throw new Error("Les notifications push ne sont pas supportées par ce navigateur.");
  }
  if (!PUBLIC_KEY) {
    throw new Error("Clé VAPID publique manquante dans la configuration.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permission refusée par l'utilisateur.");
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToBuffer(PUBLIC_KEY),
    });
  }

  // Persiste côté serveur
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: subscription.toJSON(), userEmail }),
  });
  if (!res.ok) {
    throw new Error(`Erreur d'enregistrement côté serveur (${res.status})`);
  }
  return subscription;
}

export async function unsubscribeUser(): Promise<boolean> {
  if (!pushNotificationsSupported()) return false;
  const subscription = await getCurrentSubscription();
  if (!subscription) return true;

  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
  return subscription.unsubscribe();
}
