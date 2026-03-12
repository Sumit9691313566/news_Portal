import Epaper from "../models/Epaper.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

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

export const createEpaper = async (req, res) => {
  try {
    const { title } = req.body;
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
    });

    res.status(201).json(epaper);
  } catch (error) {
    console.error("EPAPER CREATE ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllEpaper = async (req, res) => {
  try {
    const epapers = await Epaper.find().sort({ createdAt: -1 });
    res.json(epapers);
  } catch (error) {
    console.error("EPAPER GET ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getEpaperById = async (req, res) => {
  try {
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
