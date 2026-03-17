import { API_BASE_URL } from "./api";

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const subscribeWithServiceWorker = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');

    const resp = await fetch(`${API_BASE_URL}/push/vapidPublicKey`);
    if (!resp.ok) return;
    const { publicKey } = await resp.json();
    if (!publicKey) return;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await fetch(`${API_BASE_URL}/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });
    localStorage.setItem('pushSubscribed', '1');
  } catch (err) {
    console.warn('Push subscribe failed', err);
  }
};

export const registerAndSubscribe = async () => {
  // Request permission immediately (should be called from a user gesture).
  if (!('Notification' in window)) return;
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    await subscribeWithServiceWorker();
  } catch (err) {
    console.warn('Requesting notification permission failed', err);
  }
};

export const promptForSubscription = async () => {
  try {
    if (typeof window !== 'undefined' && window.location) {
      const params = new URL(window.location.href).searchParams;
      if (params.get('resetPushPrompt') === '1') {
        localStorage.removeItem('pushPromptSeen');
        localStorage.removeItem('pushSubscribed');
      }
    }
  } catch {}

  try {
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted' &&
      localStorage.getItem('pushSubscribed') !== '1'
    ) {
      await subscribeWithServiceWorker();
      localStorage.setItem('pushPromptSeen', '1');
      return;
    }
  } catch (err) {
    console.warn('Auto re-subscribe failed', err);
  }

  const already = localStorage.getItem('pushPromptSeen');
  if (already === '1') return;

  const allow = window.confirm(
    "Breaking news aur latest updates sabse pehle paane ke liye notifications allow karein. Allow karne ke liye OK dabayein, baad me karne ke liye Cancel dabayein."
  );
  try {
    // persist the user's choice so the prompt won't reappear
    localStorage.setItem('pushPromptSeen', '1');
  } catch {}
  if (allow) await registerAndSubscribe();
};

