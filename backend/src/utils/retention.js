import News from "../models/News.js";
import Epaper from "../models/Epaper.js";
import DeletedNews from "../models/DeletedNews.js";
import cloudinary from "../config/cloudinary.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_RETENTION_DAYS = 180;
const DEFAULT_INTERVAL_MS = DAY_MS;

const toNumber = (value, fallback) => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
};

const destroyCloudinary = async (publicId, resourceType) => {
  if (!publicId) return;
  const type = resourceType || "image";
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: type });
  } catch (err) {
    console.error("RETENTION: Cloudinary delete failed", publicId, type, err?.message || err);
  }
};

const cleanupNews = async (cutoff) => {
  const oldNews = await News.find({ createdAt: { $lt: cutoff } }).select(
    "title content category mediaType mediaUrl status featured breaking author views createdAt mediaPublicId mediaResourceType blocks"
  );

  if (!oldNews.length) return 0;

  for (const item of oldNews) {
    if (item.mediaPublicId) {
      await destroyCloudinary(item.mediaPublicId, item.mediaResourceType);
    }

    const blocks = Array.isArray(item.blocks) ? item.blocks : [];
    for (const block of blocks) {
      if (block?.publicId) {
        await destroyCloudinary(block.publicId, block.resourceType);
      }
    }
  }

  await DeletedNews.insertMany(
    oldNews.map((n) => ({
      newsId: n._id,
      title: n.title,
      content: n.content || "",
      category: n.category || "All",
      mediaType: n.mediaType || "text",
      mediaUrl: n.mediaUrl || null,
      status: n.status || "published",
      featured: !!n.featured,
      breaking: !!n.breaking,
      author: n.author || "Admin",
      views: n.views || 0,
      createdAt: n.createdAt,
      deletedAt: new Date(),
      deletedReason: "retention",
    }))
  );

  const ids = oldNews.map((n) => n._id);
  await News.deleteMany({ _id: { $in: ids } });
  return ids.length;
};

const cleanupEpaper = async (cutoff) => {
  const oldEpapers = await Epaper.find({ createdAt: { $lt: cutoff } });
  if (!oldEpapers.length) return 0;

  for (const epaper of oldEpapers) {
    await destroyCloudinary(
      epaper.publicId,
      epaper.fileType === "pdf" ? "raw" : "image"
    );
  }

  const ids = oldEpapers.map((e) => e._id);
  await Epaper.deleteMany({ _id: { $in: ids } });
  return ids.length;
};

export const runRetentionCleanup = async () => {
  const retentionDays = toNumber(process.env.NEWS_RETENTION_DAYS, DEFAULT_RETENTION_DAYS);
  const cutoff = new Date(Date.now() - retentionDays * DAY_MS);

  try {
    const [newsDeleted, epaperDeleted] = await Promise.all([
      cleanupNews(cutoff),
      cleanupEpaper(cutoff),
    ]);
    if (newsDeleted || epaperDeleted) {
      console.log(
        `🧹 Retention cleanup: deleted ${newsDeleted} news, ${epaperDeleted} epapers (cutoff ${cutoff.toISOString()})`
      );
    }
  } catch (err) {
    console.error("RETENTION: Cleanup failed", err?.message || err);
  }
};

export const startRetentionJob = () => {
  const intervalMs = toNumber(process.env.RETENTION_INTERVAL_MS, DEFAULT_INTERVAL_MS);
  const initialDelayMs = toNumber(process.env.RETENTION_INITIAL_DELAY_MS, 30_000);

  setTimeout(() => {
    runRetentionCleanup();
    setInterval(runRetentionCleanup, intervalMs);
  }, initialDelayMs);
};
