import Visitor from "../models/Visitor.js";

const cleanVisitorId = (value) => String(value || "").trim();

export const trackVisitor = async (req, res) => {
  try {
    const visitorId = cleanVisitorId(req.body?.visitorId);
    const markAsReader = req.body?.markAsReader === true;

    if (!visitorId) {
      return res.status(400).json({ message: "visitorId is required" });
    }

    const now = new Date();
    const update = {
      $set: {
        lastSeenAt: now,
        userAgent: String(req.headers["user-agent"] || "").slice(0, 500),
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
