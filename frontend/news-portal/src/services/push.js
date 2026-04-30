import { API_BASE_URL } from "./api";

const PUSH_SUBSCRIBED_KEY = "pushSubscribed";
const PUSH_PROMPT_SEEN_KEY = "pushPromptSeen";
const PUSH_PROMPT_DISMISSED_KEY = "pushPromptDismissed";
const PUSH_ALLOWED_HOSTS = new Set(["garudsamachar.in", "www.garudsamachar.in"]);

export const isPushAllowedHost = () => {
  if (typeof window === "undefined") return false;
  return PUSH_ALLOWED_HOSTS.has(String(window.location.hostname || "").toLowerCase());
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const getServiceWorkerRegistration = async () => {
  if (!isPushAllowedHost()) {
    throw new Error("Notifications sirf garudsamachar.in par available hain.");
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push notifications are not supported on this device.");
  }

  const registration = await navigator.serviceWorker.register("/sw.js", {
    updateViaCache: "none",
  });
  await registration.update().catch(() => {});
  return navigator.serviceWorker.ready;
};

const saveSubscription = async (subscription) => {
  const response = await fetch(`${API_BASE_URL}/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...subscription.toJSON(),
      permissionStatus: "granted",
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "Subscription save failed.");
  }

  localStorage.setItem(PUSH_SUBSCRIBED_KEY, "1");
  localStorage.setItem(PUSH_PROMPT_SEEN_KEY, "1");
  localStorage.removeItem(PUSH_PROMPT_DISMISSED_KEY);
  return response.json().catch(() => ({}));
};

export const subscribeWithServiceWorker = async () => {
  const registration = await getServiceWorkerRegistration();
  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) {
    await saveSubscription(existingSubscription);
    return { success: true, reused: true };
  }

  const resp = await fetch(`${API_BASE_URL}/push/vapidPublicKey`);
  if (!resp.ok) {
    const payload = await resp.json().catch(() => ({}));
    throw new Error(payload.message || "VAPID public key not available.");
  }

  const { publicKey } = await resp.json();
  if (!publicKey) {
    throw new Error("VAPID public key missing.");
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await saveSubscription(subscription);
  return { success: true, reused: false };
};

export const registerAndSubscribe = async () => {
  if (!isPushAllowedHost()) {
    throw new Error("Notifications sirf garudsamachar.in par available hain.");
  }

  if (!("Notification" in window)) {
    throw new Error("Notifications are not supported on this device.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  localStorage.setItem(PUSH_PROMPT_SEEN_KEY, "1");
  return subscribeWithServiceWorker();
};

export const dismissPushPrompt = () => {
  localStorage.setItem(PUSH_PROMPT_DISMISSED_KEY, "1");
};

export const shouldShowPushPrompt = () => {
  if (typeof window === "undefined") return false;
  if (!isPushAllowedHost()) return false;
  if (!("Notification" in window)) return false;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  if (window.location.protocol !== "https:") return false;

  try {
    const params = new URL(window.location.href).searchParams;
    if (params.get("resetPushPrompt") === "1") {
      localStorage.removeItem(PUSH_PROMPT_SEEN_KEY);
      localStorage.removeItem(PUSH_SUBSCRIBED_KEY);
      localStorage.removeItem(PUSH_PROMPT_DISMISSED_KEY);
    }
  } catch {}

  if (Notification.permission === "granted") return false;
  if (Notification.permission === "denied") return false;
  if (localStorage.getItem(PUSH_SUBSCRIBED_KEY) === "1") return false;
  return localStorage.getItem(PUSH_PROMPT_DISMISSED_KEY) !== "1";
};

export const restoreExistingPushSubscription = async () => {
  try {
    if (!isPushAllowedHost()) return { success: false, skipped: true };
    if (typeof Notification === "undefined") return { success: false, skipped: true };
    if (Notification.permission !== "granted") return { success: false, skipped: true };

    return await subscribeWithServiceWorker();
  } catch (error) {
    console.warn("Auto re-subscribe failed", error);
    return { success: false, skipped: false, error };
  }
};

export const promptForSubscription = async () => {
  try {
    if (typeof window !== "undefined" && window.location) {
      const params = new URL(window.location.href).searchParams;
      if (params.get("resetPushPrompt") === "1") {
        localStorage.removeItem(PUSH_PROMPT_SEEN_KEY);
        localStorage.removeItem(PUSH_SUBSCRIBED_KEY);
        localStorage.removeItem(PUSH_PROMPT_DISMISSED_KEY);
      }
    }
  } catch {}

  return restoreExistingPushSubscription();
};
