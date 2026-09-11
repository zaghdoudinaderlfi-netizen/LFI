// Fusionné automatiquement dans le service worker généré par next-pwa (voir
// next.config.ts — option par défaut customWorkerSrc: "worker"). Gère la
// réception d'une notification push et le clic dessus. Le son joué à la
// réception est celui du système d'exploitation du téléphone, selon ses
// propres réglages de notification pour l'app — ce script ne le contrôle
// pas (voir la discussion dans la conversation d'origine du chantier).

self.addEventListener("push", (event) => {
  let donnees = {};
  try {
    donnees = event.data ? event.data.json() : {};
  } catch {
    donnees = { body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(donnees.title || "LFI", {
      body: donnees.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: donnees.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
