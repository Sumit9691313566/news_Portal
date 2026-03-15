import cron from "node-cron";
import News from "../models/News.js";
import { sendNotificationToAll } from "./push.js";

// Build a digest payload from top 5 recent published news
const buildDailyDigestPayload = (newsList) => {
  const titles = newsList.map((n, i) => `${i + 1}. ${n.title}`);
  return {
    title: "आज की 5 बड़ी खबरें",
    message: titles.join(" \n"),
    url: "/",
    tag: "daily-digest",
  };
};

export const sendDailyDigestNow = async () => {
  try {
    const top5 = await News.find({ status: "published" })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    if (!top5 || top5.length === 0) return { sent: 0, reason: "no-news" };

    const payload = buildDailyDigestPayload(top5);
    const result = await sendNotificationToAll(payload);
    return result;
  } catch (err) {
    console.error("Daily digest error:", err);
    throw err;
  }
};

export const startDailyDigestJobs = () => {
  try {
    // Morning 8:00
    cron.schedule("0 8 * * *", () => {
      console.log("Running morning daily digest (8:00)");
      sendDailyDigestNow().catch((e) => console.warn("digest send failed", e.message || e));
    });

    // Evening 19:00 (7 PM)
    cron.schedule("0 19 * * *", () => {
      console.log("Running evening daily digest (19:00)");
      sendDailyDigestNow().catch((e) => console.warn("digest send failed", e.message || e));
    });

    console.log("Daily digest jobs scheduled: 08:00 & 19:00");
  } catch (err) {
    console.warn("Failed to start daily digest jobs:", err?.message || err);
  }
};
