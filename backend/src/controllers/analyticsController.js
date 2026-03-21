import Visitor from "../models/Visitor.js";

const cleanVisitorId = (value) => String(value || "").trim();
const cleanHeader = (value) => String(value || "").trim().toLowerCase();

const containsAny = (value, needles) => needles.some((needle) => value.includes(needle));

const isAutomatedUserAgent = (userAgent) =>
  containsAny(cleanHeader(userAgent), [
    "headlesschrome",
    "lighthouse",
    "puppeteer",
    "playwright",
    "cypress",
    "selenium",
    "webdriver",
  ]);

const isLocalDevRequest = (req) => {
  const host = cleanHeader(req.headers.host);
  const origin = cleanHeader(req.headers.origin);
  const referer = cleanHeader(req.headers.referer);
  const forwardedFor = cleanHeader(req.headers["x-forwarded-for"]);
  const remoteAddress = cleanHeader(req.socket?.remoteAddress);

  const looksLocal = (value) =>
    value.includes("localhost") ||
    value.includes("127.0.0.1") ||
    value.includes("[::1]") ||
    value.includes("::1");

  return [host, origin, referer, forwardedFor, remoteAddress].some(looksLocal);
};

export const trackVisitor = async (req, res) => {
  try {
    const visitorId = cleanVisitorId(req.body?.visitorId);
    const markAsReader = req.body?.markAsReader === true;
    const userAgent = String(req.headers["user-agent"] || "").slice(0, 500);

    if (!visitorId) {
      return res.status(400).json({ message: "visitorId is required" });
    }

    if (isAutomatedUserAgent(userAgent) || isLocalDevRequest(req)) {
      return res.status(202).json({ success: true, skipped: true });
    }

    const now = new Date();
    const update = {
      $set: {
        lastSeenAt: now,
        userAgent,
        sourceHost: String(req.headers.host || "").slice(0, 200),
        sourceOrigin: String(req.headers.origin || req.headers.referer || "").slice(0, 500),
      },
      $setOnInsert: {
        visitorId,
        firstSeenAt: now,
      },
    };

    if (markAsReader) {
      update.$set.hasReadNews = true;
      update.$set.lastReadAt = now;
    }

    await Visitor.findOneAndUpdate({ visitorId }, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error("TRACK VISITOR ERROR:", error);
    return res.status(500).json({ message: "Failed to track visitor" });
  }
};

export const getVisitorSummary = async (req, res) => {
  try {
    const [totalVisitors, uniqueReaders, todayVisitors] = await Promise.all([
      Visitor.countDocuments(),
      Visitor.countDocuments({ hasReadNews: true }),
      Visitor.countDocuments({
        firstSeenAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }),
    ]);

    return res.json({
      totalVisitors,
      uniqueReaders,
      todayVisitors,
    });
  } catch (error) {
    console.error("GET VISITOR SUMMARY ERROR:", error);
    return res.status(500).json({ message: "Failed to load visitor summary" });
  }
};
