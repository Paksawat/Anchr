// Anchr Service Worker
// Provides: offline app-shell caching + push notification handling

const CACHE = 'anchr-v1';

// App shell — minimal set of assets that make the app skeleton work offline
const SHELL = ['/', '/anchr-circle-small.svg'];

// ─── Install: cache app shell ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting(); // activate immediately, don't wait for old SW to die
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)),
  );
});

// ─── Activate: evict stale caches ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()), // take control of all open tabs immediately
  );
});

// ─── Fetch: stale-while-revalidate for navigations, skip API calls ──────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never intercept: non-GET, API calls, cross-origin requests
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached); // offline fallback: return cached version

      // Return cache immediately if available; network updates it in background
      return cached || networkFetch;
    }),
  );
});

// ─── Push: show notification ─────────────────────────────────────────────────
// Triggered by Web Push from backend (when VAPID is configured)
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { title: 'Anchr', body: event.data?.text() ?? 'Time to check in.' };
  }

  const title = data.title || 'Anchr';
  const options = {
    body: data.body || 'Take a moment to check in. Stay grounded.',
    icon: '/anchr-circle-small.svg',
    badge: '/anchr-circle-small.svg',
    tag: data.tag || 'anchr-reminder',
    renotify: true,
    data: { url: data.url || '/dashboard' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification click: focus or open the app ──────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing window if one is open
        for (const client of windowClients) {
          if ('focus' in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) return clients.openWindow(targetUrl);
      }),
  );
});
