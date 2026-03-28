/* Service Worker for handling push events */
self.addEventListener('push', function (event) {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: 'गरुड़ समाचार', message: 'नया समाचार', url: '/' };
  }

  const title = payload.title || 'गरुड़ समाचार';
  const options = {
    body: payload.message || payload.body || '',
    data: {
      url: payload.url || '/',
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

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const data = event.notification.data || {};
  const url = data.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(url);
          }
          return client;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
