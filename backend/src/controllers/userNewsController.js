import UserNews from "../models/UserNews.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const uploadToCloudinary = (file, resourceType) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "news_portal/user_news",
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });

const cleanText = (value = "", maxLength = 5000) =>
  String(value || "").trim().slice(0, maxLength);

const resolveMediaType = (file) => {
  if (!file?.mimetype) return { mediaType: "none", resourceType: "raw" };
  if (file.mimetype.startsWith("image/")) {
    return { mediaType: "image", resourceType: "image" };
  }
  if (file.mimetype.startsWith("video/")) {
    return { mediaType: "video", resourceType: "video" };
  }
  return { mediaType: "none", resourceType: "raw" };
};

export const submitUserNews = async (req, res) => {
  try {
    const name = cleanText(req.body?.name, 120);
    const mobileNumber = cleanText(req.body?.mobileNumber, 30);
    const city = cleanText(req.body?.city, 120);
    const message = cleanText(req.body?.message, 5000);
    const file = req.file || null;

    if (!message && !file) {
      return res.status(400).json({
        message: "News bhejne ke liye text message ya image/video me se kuchh dena zaroori hai.",
      });
    }

    let mediaUrl = "";
    let mediaPublicId = "";
    let mediaType = "none";
    let mediaResourceType = "raw";

    if (file) {
      const resolved = resolveMediaType(file);
      if (resolved.mediaType === "none") {
        return res.status(400).json({
          message: "Sirf image ya video upload kiya ja sakta hai.",
        });
      }

      const uploadResult = await uploadToCloudinary(file, resolved.resourceType);
      mediaUrl = uploadResult.secure_url || "";
      mediaPublicId = uploadResult.public_id || "";
      mediaType = resolved.mediaType;
      mediaResourceType = resolved.resourceType;
    }

    const created = await UserNews.create({
      name,
      mobileNumber,
      city,
      message,
      mediaType,
      mediaUrl,
      mediaPublicId,
      mediaResourceType,
      status: "new",
    });

    return res.status(201).json({
      message: "Aapki khabar main admin tak bhej di gayi hai.",
      submission: created,
    });
  } catch (error) {
    console.error("SUBMIT USER NEWS ERROR:", error);
    return res.status(500).json({
      message: error.message || "User news submit nahi ho paayi.",
    });
  }
};

export const getAllUserNews = async (req, res) => {
  try {
    const submissions = await UserNews.find().sort({ createdAt: -1 });
    return res.json(submissions);
  } catch (error) {
    console.error("GET USER NEWS ERROR:", error);
    return res.status(500).json({ message: "User news load nahi ho paayi." });
  }
};

export const updateUserNews = async (req, res) => {
  try {
    const submission = await UserNews.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: "User news nahi mili." });
    }

    if (req.body?.name !== undefined) {
      submission.name = cleanText(req.body.name, 120);
    }
    if (req.body?.mobileNumber !== undefined) {
      submission.mobileNumber = cleanText(req.body.mobileNumber, 30);
    }
    if (req.body?.city !== undefined) {
      submission.city = cleanText(req.body.city, 120);
    }
    if (req.body?.message !== undefined) {
      submission.message = cleanText(req.body.message, 5000);
    }
    if (req.body?.status !== undefined) {
      const nextStatus = String(req.body.status || "").trim().toLowerCase();
      submission.status = nextStatus === "reviewed" ? "reviewed" : "new";
    }

    await submission.save();
    return res.json({
      message: "User news update ho gayi.",
      submission,
    });
  } catch (error) {
    console.error("UPDATE USER NEWS ERROR:", error);
    return res.status(500).json({ message: "User news update nahi ho paayi." });
  }
};

export const deleteUserNews = async (req, res) => {
  try {
    const submission = await UserNews.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: "User news nahi mili." });
    }

    if (submission.mediaPublicId) {
      await cloudinary.uploader.destroy(submission.mediaPublicId, {
        resource_type: submission.mediaResourceType || "image",
      });
    }

    await submission.deleteOne();
    return res.json({ success: true, message: "User news delete ho gayi." });
  } catch (error) {
    console.error("DELETE USER NEWS ERROR:", error);
    return res.status(500).json({ message: "User news delete nahi ho paayi." });
  }
};
