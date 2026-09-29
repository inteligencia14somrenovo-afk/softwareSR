self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  const dados = event.data.json();

  const titulo = dados.titulo || "Som Renovo Manager";

  const opcoes = {
    body: dados.mensagem || "Você recebeu uma nova notificação.",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    data: {
      url: dados.url || "/",
    },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(
      titulo,
      opcoes
    )
  );
});


self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url =
    event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {

      for (const client of clientList) {

        if ("focus" in client) {

          client.navigate(url);

          return client.focus();

        }

      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }

    })
  );
});