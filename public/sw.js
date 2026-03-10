self.addEventListener('push', function (event) {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url ?? '/' },
      actions: [
        { action: 'open', title: 'Open app' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    }),
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) return client.focus();
        }
        // Otherwise open it
        if (clients.openWindow) return clients.openWindow('/');
      }),
  );
});
