// public/sw.js — ShipTrack Global Push Service Worker

self.addEventListener('push', function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'ShipTrack', body: event.data ? event.data.text() : 'New notification' };
  }

  const title = data.title || 'ShipTrack Global';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/logo/mark-modern.svg',
    badge: '/logo/mark-modern.svg',
    tag: data.tag || 'shiptrack-visitor',
    renotify: true,
    data: { url: data.url || '/admin/dashboard' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/admin/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
