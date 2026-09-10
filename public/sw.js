self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  let data = { title: 'Pembaruan Data PPIC BANANA', body: 'Terdapat update data baru!' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Pembaruan Data PPIC BANANA', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/assets/icon-192.png', // Fallback icon path
    badge: '/assets/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: self.location.origin
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
