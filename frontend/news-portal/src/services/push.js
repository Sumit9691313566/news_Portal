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
  // During development on localhost always show prompt to help testing
  try {
    // Allow an explicit reset via URL param for testing, otherwise respect user's previous choice
    if (typeof window !== 'undefined' && window.location) {
      const params = new URL(window.location.href).searchParams;
      if (params.get('resetPushPrompt') === '1') {
        localStorage.removeItem('pushPromptSeen');
      }
    }
  } catch {}
  const already = localStorage.getItem('pushPromptSeen');
  if (already === '1') return;

  // Simple popup prompt (Hindi)
  const allow = window.confirm(
    'क्या आप ब्रेकिंग न्यूज़ नोटिफिकेशन चालू करना चाहते हैं? अनुमति के लिए OK दबाएँ, बाद में करने के लिए Cancel दबाएँ।'
  );
  try {
    // persist the user's choice so the prompt won't reappear
    localStorage.setItem('pushPromptSeen', '1');
  } catch {}
  if (allow) await registerAndSubscribe();
};
