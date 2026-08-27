/// <reference lib="WebWorker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// ─── Workbox Precaching ──────────────────────────────────────────────────────
// This array is injected at build time by vite-plugin-pwa (injectManifest strategy)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
precacheAndRoute((self as any).__WB_MANIFEST);
cleanupOutdatedCaches();

// ─── Push Event Handler ──────────────────────────────────────────────────────
/**
 * Handle incoming push notifications from the KLU Assignment Tracker backend.
 *
 * Expected payload JSON structure:
 * {
 *   "title": "Assignment Due Tomorrow",
 *   "body": "Data Structures — Assignment 3 is due tomorrow at 11:59 PM.",
 *   "icon": "/icons/pwa-192x192.png",
 *   "badge": "/icons/pwa-192x192.png",
 *   "data": {
 *     "assignmentId": "...",
 *     "url": "/assignments/..."
 *   }
 * }
 */
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  let payload: {
    title?: string;
    body?: string;
    icon?: string;
    badge?: string;
    data?: { assignmentId?: string; url?: string };
  } = {};

  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'KLU Assignment Tracker', body: event.data.text() };
  }

  const title = payload.title ?? 'KLU Assignment Tracker';
  const options: NotificationOptions = {
    body: payload.body ?? 'You have an assignment update.',
    icon: payload.icon ?? '/icons/pwa-192x192.png',
    badge: payload.badge ?? '/icons/pwa-192x192.png',
    data: payload.data ?? {},
    tag: `klu-assignment-${payload.data?.assignmentId ?? 'general'}`,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification Click Handler ───────────────────────────────────────────────
/**
 * Handle clicks on push notifications.
 * Opens or focuses the PWA and navigates to the relevant assignment page.
 */
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const data = event.notification.data ?? {};
  const targetUrl = data.url ?? '/dashboard';
  const fullUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Focus an existing window if the PWA is already open
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          await client.focus();
          // Navigate to the assignment page
          if ('navigate' in client) {
            await (client as WindowClient).navigate(fullUrl);
          }
          return;
        }
      }

      // Otherwise open a new window
      if (self.clients.openWindow) {
        await self.clients.openWindow(fullUrl);
      }
    })()
  );
});
