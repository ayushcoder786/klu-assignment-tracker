import type { NotificationPreferences, PushSubscriptionPayload, NotificationStatus } from '../types/notification';
import { NOTIFICATIONS_API_BASE as API_BASE } from './apiConfig';

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch the VAPID public key from the backend.
 * This endpoint is public (no auth required) so the frontend can
 * use it to create a PushSubscription before the user logs in.
 *
 * SECURITY: Only the public key is returned — the private key never leaves the backend.
 */
export async function getVapidPublicKey(): Promise<string> {
  const res = await fetchWithTimeout(`${API_BASE}/vapid-public-key`);
  if (!res.ok) throw new Error('Failed to fetch VAPID public key');
  const data = await res.json();
  return data.publicKey ?? '';
}

/**
 * Subscribe to push notifications.
 * Sends the browser's PushSubscription keys to the backend for storage.
 * Requires JWT authentication header (set by the global API client).
 */
export async function subscribeToNotifications(
  subscription: PushSubscriptionPayload,
  token: string
): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE}/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(subscription),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to save push subscription');
  }
}

/**
 * Unsubscribe from push notifications (removes the subscription from the backend).
 */
export async function unsubscribeFromNotifications(
  endpoint: string,
  token: string
): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE}/subscribe`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint }),
  });
  if (!res.ok) throw new Error('Failed to remove push subscription');
}

/**
 * Get the current notification status (subscribed + push service available).
 */
export async function getNotificationStatus(token: string): Promise<NotificationStatus> {
  const res = await fetchWithTimeout(`${API_BASE}/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to get notification status');
  return res.json();
}

/**
 * Get the authenticated student's notification preferences.
 */
export async function getNotificationPreferences(token: string): Promise<NotificationPreferences> {
  const res = await fetchWithTimeout(`${API_BASE}/preferences`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch notification preferences');
  return res.json();
}

/**
 * Update the authenticated student's notification preferences.
 */
export async function updateNotificationPreferences(
  prefs: NotificationPreferences,
  token: string
): Promise<NotificationPreferences> {
  const res = await fetchWithTimeout(`${API_BASE}/preferences`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(prefs),
  });
  if (!res.ok) throw new Error('Failed to update notification preferences');
  return res.json();
}

/**
 * Register the browser service worker and create a push subscription.
 *
 * @param vapidPublicKey VAPID public key from backend (Base64url encoded)
 * @returns PushSubscriptionPayload with endpoint, p256dh, auth
 */
export async function registerPushSubscription(
  vapidPublicKey: string
): Promise<PushSubscriptionPayload> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  const registration = await navigator.serviceWorker.ready;

  // Convert Base64url to Uint8Array for applicationServerKey
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
  });

  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh ?? '';
  const auth = json.keys?.auth ?? '';

  if (!p256dh || !auth) {
    throw new Error('Failed to get push subscription keys from browser.');
  }

  return {
    endpoint: subscription.endpoint,
    p256dh,
    auth,
  };
}

/**
 * Convert a Base64url string to Uint8Array.
 * Required by the PushManager.subscribe() applicationServerKey parameter.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
