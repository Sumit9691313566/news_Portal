/* Service Worker for handling push events */
const SW_VERSION = "push-sanitize-v2";

const decodeHtmlEntities = (value = "") => {
  let decoded = String(value || "");
  const entityMap = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    "#39": "'",
  };

  for (let i = 0; i < 3; i += 1) {
    const next = decoded.replace(
      /&(#x?[0-9a-f]+|[a-z]+);/gi,
      (match, entity) => {
        const key = String(entity || "").toLowerCase();
        if (entityMap[key] !== undefined) return entityMap[key];
        if (key.startsWith("#x")) {
          const code = Number.parseInt(key.slice(2), 16);
          return Number.isFinite(code) ? String.fromCharCode(code) : match;
        }
        if (key.startsWith("#")) {
          const code = Number.parseInt(key.slice(1), 10);
          return Number.isFinite(code) ? String.fromCharCode(code) : match;
        }
        return match;
      }
    );

    if (next === decoded) break;
    decoded = next;
  }

  return decoded;
};

const stripHtml = (value) =>
  decodeHtmlEntities(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|blockquote|span)>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/style\s*=\s*"[^"]*"/gi, " ")
    .replace(/style\s*=\s*'[^']*'/gi, " ")
    .replace(/<\/?span[^>]*$/gi, " ")
    .replace(/<[^>]*$/g, " ")
    .replace(/\s+/g, " ")
    .trim();

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

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
      version: SW_VERSION,
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
