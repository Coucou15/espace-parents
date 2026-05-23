// Service Worker pour les notifications push de l'application Espace Parents.
// Doit être servi à la racine du site (depuis /sw.js) pour avoir un scope global.

self.addEventListener("install", (event) => {
  // Activation immédiate sans attendre que les anciens onglets ferment.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Prend le contrôle des onglets ouverts dès l'activation.
  event.waitUntil(self.clients.claim());
});

// Handler fetch minimal : laisse passer toutes les requêtes telles quelles.
// Sans ce handler, Chrome refuse d'afficher la bannière "Installer l'app"
// car il considère l'app comme non-PWA.
self.addEventListener("fetch", (event) => {
  // Pas-through : pas de mise en cache pour l'instant, on reste léger.
  // (Une stratégie offline-first viendrait ici plus tard si besoin.)
});

// Réception d'une notification push envoyée par le serveur.
self.addEventListener("push", (event) => {
  let payload = { titre: "Espace Parents", texte: "Nouvelle notification", url: "/" };
  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.texte = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.titre, {
      body: payload.texte,
      icon: "/logo.jpg",
      badge: "/logo.jpg",
      data: { url: payload.url ?? "/" },
      tag: payload.tag, // évite les doublons si même tag
      requireInteraction: payload.urgent === true,
    })
  );
});

// Clic sur la notification : ouvre/focus l'application sur la bonne page.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
