import News from "../models/News.js";
import mongoose from "mongoose";
import DeletedNews from "../models/DeletedNews.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const REMOTE_API_BASE = String(
  process.env.DEV_REMOTE_API_BASE ||
    "https://newsportal-production-164d.up.railway.app/api"
).replace(/\/+$/, "");
const canUseRemoteReadFallback = () =>
  process.env.NODE_ENV !== "production" &&
  (!mongoose.connection || mongoose.connection.readyState !== 1);

const fetchRemoteJson = async (path) => {
  const response = await fetch(`${REMOTE_API_BASE}/${String(path).replace(/^\/+/, "")}`);
  if (!response.ok) {
    throw new Error(`Remote API failed with status ${response.status}`);
  }
  return response.json();
};

const toBoolean = (value) =>
  value === true || value === "true" || value === "1" || value === 1;
const isMainAdmin = (req) => {
  const role = String(req?.admin?.role || "").toLowerCase();
  const adminId = String(req?.admin?.adminId || "").toLowerCase();
  const email = String(req?.admin?.email || "").toLowerCase();
  if (role !== "main-admin") return false;
  return adminId === "mainadmin" || email === "mainadmin@gmail.com";
};
const normalizeIncomingStatus = (status) => {
  const nextStatus = String(status || "").trim().toLowerCase();
  if (nextStatus === "draft") return "draft";
  if (nextStatus === "published") return "published";
  if (nextStatus === "pending") return "pending";
  return "draft";
};
const resolveCreateStatus = (req, status) => {
  if (isMainAdmin(req)) return normalizeIncomingStatus(status);
  return "draft";
};
const resolveUpdateStatus = (req, currentStatus, status) => {
  if (status === undefined) return currentStatus;
  if (isMainAdmin(req)) return normalizeIncomingStatus(status);
  return "draft";
};

const parseBlocks = (rawBlocks) => {
  if (!rawBlocks) return [];
  try {
    const parsed = typeof rawBlocks === "string" ? JSON.parse(rawBlocks) : rawBlocks;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((b) => ({
      type: b.type,
      text: b.text || "",
      url: b.url || "",
      fileKey: b.fileKey || "",
    }));
  } catch {
    return [];
  }
};

const stripHtml = (html = "") =>
  (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|blockquote)>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const contentFromBlocks = (blocks) =>
  blocks
    .filter((b) => b.type === "text" && b.text)
    .map((b) => stripHtml(b.text))
    .filter(Boolean)
    .join("\n\n");

const uploadToCloudinary = (file, resourceType) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "news_portal",
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });

/* ================= CREATE NEWS ================= */
export const createNews = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      mediaType,
      status,
      featured,
      breaking,
      author,
      blocks: rawBlocks,
    } = req.body;

    const files = Array.isArray(req.files) ? req.files : [];
    const filesByField = new Map(files.map((f) => [f.fieldname, f]));

    let blocks = parseBlocks(rawBlocks);

    if (blocks.length > 0) {
      blocks = await Promise.all(
        blocks.map(async (block) => {
          if (block.type === "image" || block.type === "video") {
            const file = block.fileKey ? filesByField.get(block.fileKey) : null;
            if (file) {
              const uploadResult = await uploadToCloudinary(
                file,
                block.type === "video" ? "video" : "image"
              );
              return {
                type: block.type,
                text: "",
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id || "",
                resourceType: block.type === "video" ? "video" : "image",
              };
            }
          }
          return {
            type: block.type,
            text: block.text || "",
            url: block.url || "",
            publicId: "",
            resourceType: block.type === "video" ? "video" : "image",
          };
        })
      );
    }

    let mediaUrl = null;
    let mediaPublicId = "";
    let mediaResourceType = "image";
    let resolvedMediaType = mediaType;

    if (blocks.length === 0) {
      const legacyFile = filesByField.get("file");
      if (legacyFile) {
        resolvedMediaType =
          mediaType ||
          (legacyFile.mimetype?.startsWith("video/") ? "video" : "image");
        const uploadResult = await uploadToCloudinary(
          legacyFile,
          resolvedMediaType === "video" ? "video" : "image"
        );
        mediaUrl = uploadResult.secure_url;
        mediaPublicId = uploadResult.public_id || "";
        mediaResourceType = resolvedMediaType === "video" ? "video" : "image";
      }
    }

    const finalContent =
      content || contentFromBlocks(blocks) || "Media content";

    const news = await News.create({
      title,
      content: finalContent,
      category,
      mediaType: blocks.length ? "text" : resolvedMediaType,
      mediaUrl,
      mediaPublicId,
      mediaResourceType,
      status: resolveCreateStatus(req, status),
      featured: toBoolean(featured),
      breaking: toBoolean(breaking),
      author: author || req?.admin?.name || "Admin",
      blocks,
    });

    res.status(201).json(news);
  } catch (error) {
    console.error("CREATE NEWS ERROR:", error);
    const message = error.message || "Failed to create news";
    const statusCode = error.status || 500;
    res.status(statusCode).json({ message });
  }
};

/* ================= UPDATE NEWS ================= */
export const updateNews = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      mediaType,
      status,
      featured,
      breaking,
      author,
      blocks: rawBlocks,
    } = req.body;

    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }

    const files = Array.isArray(req.files) ? req.files : [];
    const filesByField = new Map(files.map((f) => [f.fieldname, f]));
    let blocks = parseBlocks(rawBlocks);

    if (blocks.length > 0) {
      blocks = await Promise.all(
        blocks.map(async (block) => {
          if (block.type === "image" || block.type === "video") {
            const file = block.fileKey ? filesByField.get(block.fileKey) : null;
            if (file) {
              const uploadResult = await uploadToCloudinary(
                file,
                block.type === "video" ? "video" : "image"
              );
              return {
                type: block.type,
                text: "",
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id || "",
                resourceType: block.type === "video" ? "video" : "image",
              };
            }
          }
          return {
            type: block.type,
            text: block.text || "",
            url: block.url || "",
            publicId: "",
            resourceType: block.type === "video" ? "video" : "image",
          };
        })
      );
    }

    if (title !== undefined) news.title = title;
    if (content !== undefined) news.content = content;
    if (category !== undefined) news.category = category;
    if (status !== undefined) {
      news.status = resolveUpdateStatus(req, news.status, status);
    }
    if (featured !== undefined) news.featured = toBoolean(featured);
    if (breaking !== undefined) news.breaking = toBoolean(breaking);
    if (author !== undefined) news.author = author;

    if (blocks.length > 0) {
      news.blocks = blocks;
      if (!content) {
        news.content = contentFromBlocks(blocks) || "Media content";
      }
      news.mediaType = "text";
      news.mediaUrl = null;
      news.mediaPublicId = "";
      news.mediaResourceType = "image";
    } else {
      const legacyFile = filesByField.get("file");
      if (legacyFile) {
        const resolvedMediaType =
          mediaType ||
          (legacyFile.mimetype?.startsWith("video/") ? "video" : "image");
        const uploadResult = await uploadToCloudinary(
          legacyFile,
          resolvedMediaType === "video" ? "video" : "image"
        );
        news.mediaType = resolvedMediaType;
        news.mediaUrl = uploadResult.secure_url;
        news.mediaPublicId = uploadResult.public_id || "";
        news.mediaResourceType = resolvedMediaType === "video" ? "video" : "image";
      } else if (mediaType !== undefined) {
        news.mediaType = mediaType;
      }
    }

    await news.save();

    res.json(news);
  } catch (error) {
    console.error("UPDATE NEWS ERROR:", error);
    const message = error.message || "Failed to update news";
    const statusCode = error.status || 500;
    res.status(statusCode).json({ message });
  }
};

/* ================= DELETE NEWS ================= */
export const deleteNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }

    // Save to deleted collection (admin can review)
    await DeletedNews.create({
      newsId: news._id,
      title: news.title,
      content: news.content || "",
      category: news.category || "All",
      mediaType: news.mediaType || "text",
      mediaUrl: news.mediaUrl || null,
      status: news.status || "published",
      featured: !!news.featured,
      breaking: !!news.breaking,
      author: news.author || "Admin",
      views: news.views || 0,
      createdAt: news.createdAt,
      deletedAt: new Date(),
      deletedReason: "manual",
    });

    // Cleanup Cloudinary assets (if we have publicId)
    if (news.mediaPublicId) {
      await cloudinary.uploader.destroy(news.mediaPublicId, {
        resource_type: news.mediaResourceType || "image",
      });
    }
    const blocks = Array.isArray(news.blocks) ? news.blocks : [];
    for (const block of blocks) {
      if (block?.publicId) {
        await cloudinary.uploader.destroy(block.publicId, {
          resource_type: block.resourceType || "image",
        });
      }
    }

    await news.deleteOne();
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE NEWS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET DELETED NEWS (ADMIN) ================= */
export const getDeletedNews = async (req, res) => {
  try {
    const deleted = await DeletedNews.find().sort({ deletedAt: -1 });
    res.json(deleted);
  } catch (error) {
    console.error("GET DELETED NEWS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE FROM DELETED (ADMIN) ================= */
export const deleteDeletedNews = async (req, res) => {
  try {
    const deleted = await DeletedNews.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Deleted news not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE DELETED NEWS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= BULK DELETE FROM DELETED (ADMIN) ================= */
export const deleteDeletedNewsBulk = async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    if (ids.length === 0) {
      return res.status(400).json({ message: "No ids provided" });
    }

    const result = await DeletedNews.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, deletedCount: result.deletedCount || 0 });
  } catch (error) {
    console.error("BULK DELETE DELETED NEWS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET ALL NEWS ================= */
export const getAllNews = async (req, res) => {
  try {
    if (canUseRemoteReadFallback()) {
      console.warn("MongoDB not connected - serving news from remote fallback");
      const remoteNews = await fetchRemoteJson("news");
      return res.json(Array.isArray(remoteNews) ? remoteNews : []);
    }

    let query = {};
    if (!req?.admin) {
      query = { status: "published" };
    } else if (!isMainAdmin(req)) {
      query = { $or: [{ status: "published" }, { status: "draft" }, { status: "pending" }] };
    }
    const news = await News.find(query).sort({ createdAt: -1 });
    res.json(news);
  } catch (error) {
    console.error("GET NEWS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= INCREMENT VIEWS ================= */
export const incrementViews = async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }
    res.json({ views: news.views });
  } catch (error) {
    console.error("INCREMENT VIEWS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
