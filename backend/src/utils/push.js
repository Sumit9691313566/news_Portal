import webpush from "web-push";
import PushSubscriber from "../models/PushSubscriber.js";

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const CONTACT = process.env.VAPID_CONTACT || `mailto:admin@localhost`;

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try {
    webpush.setVapidDetails(CONTACT, VAPID_PUBLIC, VAPID_PRIVATE);
  } catch (e) {
    console.warn("Failed to set VAPID details:\n", e.message || e);
  }
}

const buildSubObject = (doc) => ({
  endpoint: doc.endpoint,
  keys: { p256dh: doc.p256dh_key, auth: doc.auth_key },
});

export const getVapidPublicKey = () => VAPID_PUBLIC;

export const saveSubscription = async (sub) => {
  if (!sub || !sub.endpoint) throw new Error("Invalid subscription");
  const existing = await PushSubscriber.findOne({ endpoint: sub.endpoint });
  const keys = sub.keys || {};
  if (existing) {
    existing.p256dh_key = keys.p256dh || existing.p256dh_key;
    existing.auth_key = keys.auth || existing.auth_key;
    await existing.save();
    return existing;
  }
  const created = await PushSubscriber.create({
    endpoint: sub.endpoint,
    p256dh_key: keys.p256dh || "",
    auth_key: keys.auth || "",
  });
  return created;
};

export const sendNotificationToAll = async (payload) => {
  const subs = await PushSubscriber.find().lean();
  const results = { sent: 0, removed: 0, errors: 0 };

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(buildSubObject(s), JSON.stringify(payload));
        results.sent++;
      } catch (err) {
        results.errors++;
        // remove unsubscribed/expired endpoints
        const status = err?.statusCode || err?.status;
        if (status === 410 || status === 404) {
          try {
            await PushSubscriber.deleteOne({ endpoint: s.endpoint });
            results.removed++;
          } catch {}
        }
      }
    })
  );

  return results;
};

export default webpush;
