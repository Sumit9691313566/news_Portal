import Epaper from "../models/Epaper.js";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const REMOTE_API_BASE = String(
  process.env.DEV_REMOTE_API_BASE ||
    "https://newsportal-production-164d.up.railway.app/api"
).replace(/\/+$/, "");
const canUseRemoteReadFallback = () =>
  process.env.NODE_ENV !== "production" &&
  (!mongoose.connection || mongoose.connection.readyState !== 1);

const fetchRemoteResponse = async (path) => {
  const response = await fetch(`${REMOTE_API_BASE}/${String(path).replace(/^\/+/, "")}`);
  if (!response.ok) {
    throw new Error(`Remote API failed with status ${response.status}`);
  }
  return response;
};

const uploadToCloudinary = (file, resourceType) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "news_portal/epaper",
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });

const buildPdfPreviewUrl = (publicId = "") => {
  const normalizedPublicId = String(publicId || "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/^\/+/, "");

  if (!normalizedPublicId) return "";

  return cloudinary.url(normalizedPublicId, {
    resource_type: "image",
    format: "jpg",
    transformation: [
      { page: 1 },
      { quality: "auto" },
      { width: 1200, crop: "scale" },
    ],
  });
};

export const createEpaper = async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    const file = req.file;

    if (!title || !file) {
      return res.status(400).json({ message: "Title and file required" });
    }

    const isPdf = file.mimetype === "application/pdf";
    const isImage = file.mimetype.startsWith("image/");

    if (!isPdf && !isImage) {
      return res
        .status(400)
        .json({ message: "Only PDF or image allowed" });
    }

    const uploadResult = await uploadToCloudinary(
      file,
      isPdf ? "raw" : "image"
    );

    const epaper = await Epaper.create({
      title,
      fileType: isPdf ? "pdf" : "image",
      fileUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      previewImageUrl: isPdf
        ? buildPdfPreviewUrl(uploadResult.public_id)
        : uploadResult.secure_url,
    });

    res.status(201).json(epaper);
  } catch (error) {
    console.error("EPAPER CREATE ERROR:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

export const getAllEpaper = async (req, res) => {
  try {
    if (canUseRemoteReadFallback()) {
      console.warn("MongoDB not connected - serving epaper list from remote fallback");
      const response = await fetchRemoteResponse("epaper");
      const remoteEpapers = await response.json();
      return res.json(Array.isArray(remoteEpapers) ? remoteEpapers : []);
    }

    const epapers = await Epaper.find().sort({ createdAt: -1 });
    res.json(epapers);
  } catch (error) {
    console.error("EPAPER GET ERROR:", error);
    res.json([]);
  }
};

export const getEpaperById = async (req, res) => {
  try {
    if (canUseRemoteReadFallback()) {
      console.warn("MongoDB not connected - serving epaper by id from remote fallback");
      const response = await fetchRemoteResponse(`epaper/${req.params.id}`);
      const remoteEpaper = await response.json();
      return res.json(remoteEpaper);
    }

    const epaper = await Epaper.findById(req.params.id);
    if (!epaper) {
      return res.status(404).json({ message: "Epaper not found" });
    }
    res.json(epaper);
  } catch (error) {
    console.error("EPAPER GET BY ID ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const streamEpaperFile = async (req, res) => {
  try {
    if (canUseRemoteReadFallback()) {
      console.warn("MongoDB not connected - streaming epaper file from remote fallback");
      const response = await fetchRemoteResponse(`epaper/${req.params.id}/file`);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader(
        "Content-Type",
        response.headers.get("content-type") || "application/pdf"
      );
      res.setHeader(
        "Content-Disposition",
        response.headers.get("content-disposition") || 'inline; filename="epaper.pdf"'
      );
      res.setHeader(
        "Cache-Control",
        response.headers.get("cache-control") || "public, max-age=300"
      );
      return res.send(buffer);
    }

    const epaper = await Epaper.findById(req.params.id);
    if (!epaper) {
      return res.status(404).json({ message: "Epaper not found" });
    }

    const upstream = await fetch(epaper.fileUrl);
    if (!upstream.ok) {
      return res.status(502).json({ message: "Unable to fetch e-paper file" });
    }

    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = epaper.fileType === "pdf" ? "pdf" : "jpg";
    const safeTitle = String(epaper.title || "epaper")
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
    const fileName = `${safeTitle || "epaper"}.${ext}`;

    res.setHeader(
      "Content-Type",
      epaper.fileType === "pdf" ? "application/pdf" : upstream.headers.get("content-type") || "image/jpeg"
    );
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(buffer);
  } catch (error) {
    console.error("EPAPER STREAM ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteEpaper = async (req, res) => {
  try {
    const epaper = await Epaper.findById(req.params.id);
    if (!epaper) {
      return res.status(404).json({ message: "Epaper not found" });
    }

    await cloudinary.uploader.destroy(epaper.publicId, {
      resource_type: epaper.fileType === "pdf" ? "raw" : "image",
    });
    await epaper.deleteOne();

    res.json({ success: true });
  } catch (error) {
    console.error("EPAPER DELETE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
