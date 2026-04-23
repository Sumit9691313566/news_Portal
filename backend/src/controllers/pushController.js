import { getVapidPublicKey, saveSubscription, sendNotificationToAll } from "../utils/push.js";

const decodeHtmlEntities = (value = "") => {
  let decoded = String(value || "");
  const entityMap = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    "#39": "'",
  };

  for (let i = 0; i < 3; i += 1) {
    const next = decoded.replace(
      /&(#x?[0-9a-f]+|[a-z]+);/gi,
      (match, entity) => {
        const key = String(entity || "").toLowerCase();
        if (entityMap[key] !== undefined) return entityMap[key];
        if (key.startsWith("#x")) {
          const code = Number.parseInt(key.slice(2), 16);
          return Number.isFinite(code) ? String.fromCharCode(code) : match;
        }
        if (key.startsWith("#")) {
          const code = Number.parseInt(key.slice(1), 10);
          return Number.isFinite(code) ? String.fromCharCode(code) : match;
        }
        return match;
      }
    );

    if (next === decoded) break;
    decoded = next;
  }

  return decoded;
};

const stripHtml = (value = "") =>
  decodeHtmlEntities(value)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|blockquote|span)>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/style\s*=\s*"[^"]*"/gi, " ")
    .replace(/style\s*=\s*'[^']*'/gi, " ")
    .replace(/<\/?span[^>]*$/gi, " ")
    .replace(/<[^>]*$/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const vapidKey = async (req, res) => {
  const key = getVapidPublicKey();
  if (!key) return res.status(500).json({ message: "VAPID key not configured" });
  res.json({ publicKey: key });
};

export const subscribe = async (req, res) => {
  try {
    const sub = req.body;
    if (!sub || !sub.endpoint) {
      return res.status(400).json({ message: "Invalid subscription" });
    }
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
    const payload = {
      title: stripHtml(body.title || body.heading || "Garud Samachar").slice(0, 100),
      message: stripHtml(body.message || body.body || body.msg || "Naya samachar uplabdh hai").slice(0, 500),
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
