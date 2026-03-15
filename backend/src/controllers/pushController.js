import { getVapidPublicKey, saveSubscription, sendNotificationToAll } from "../utils/push.js";

export const vapidKey = async (req, res) => {
  const key = getVapidPublicKey();
  if (!key) return res.status(500).json({ message: "VAPID key not configured" });
  res.json({ publicKey: key });
};

export const subscribe = async (req, res) => {
  try {
    const sub = req.body;
    if (!sub || !sub.endpoint) return res.status(400).json({ message: "Invalid subscription" });
    const saved = await saveSubscription(sub);
    res.status(201).json({ success: true, savedId: saved._id });
  } catch (err) {
    console.error("SUBSCRIBE ERROR:", err);
    res.status(500).json({ message: err.message || "Failed to save subscription" });
  }
};

export const sendAll = async (req, res) => {
  try {
    const body = req.body || {};
    // normalize payload
    const payload = {
      title: String(body.title || body.heading || "गरुड़ समाचार").slice(0, 100),
      message: String(body.message || body.body || body.msg || "नया समाचार उपलब्ध है").slice(0, 500),
      image: body.image || body.icon || null,
      url: body.url || body.link || "/",
      tag: body.tag || `manual-${Date.now()}`,
      timestamp: Date.now(),
    };

    const result = await sendNotificationToAll(payload);
    res.json({ success: true, payloadUsed: payload, result });
  } catch (err) {
    console.error("SEND ALL ERROR:", err);
    res.status(500).json({ message: err.message || "Failed to send" });
  }
};
