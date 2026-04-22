/* Service Worker for handling push events */
const stripHtml = (value) =>
  String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

self.addEventListener("push", function (event) {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: "Garud Samachar", message: "Naya samachar", url: "/" };
  }

  const title = stripHtml(payload.title || "Garud Samachar");
  const options = {
    body: stripHtml(payload.message || payload.body || ""),
    data: {
      url: payload.url || "/",
      newsId: payload.newsId || null,
    },
    tag: payload.tag || undefined,
  };

  if (payload.image) {
    options.icon = payload.image;
    options.badge = payload.image;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const data = event.notification.data || {};
  const url = data.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) {
            return client.navigate(url);
          }
          return client;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
