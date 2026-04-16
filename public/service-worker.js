// Service Worker for Push Notifications
// This handles background notifications even when the tab is closed

const CACHE_NAME = 'little-shop-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(clients.claim());
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);
  
  const data = event.data?.json() || {};
  const title = data.title || '🛍️ New Order Received!';
  const options = {
    body: data.body || 'A new order has been placed. Click to view details.',
    icon: '/logo192.png',
    badge: '/badge-72x72.png',
    tag: data.orderId || 'new-order',
    requireInteraction: true,
    data: {
      orderId: data.orderId,
      url: data.url || '/admin/dashboard'
    }
  };

  // Play notification sound (optional - using silent audio)
  // For now, we rely on system notification sound
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click:', event);
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/admin/dashboard';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        clients.openWindow(url);
      }
    })
  );
});

// Background sync for offline support (optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    console.log('[Service Worker] Syncing orders...');
  }
});
