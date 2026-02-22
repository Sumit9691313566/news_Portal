import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import newsRoutes from "./routes/newsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import epaperRoutes from "./routes/epaperRoutes.js";
import { startRetentionJob } from "./utils/retention.js";

console.log("☁️ Cloudinary Env Check:", {
  cloud: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY ? "LOADED" : "MISSING",
});

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/news", newsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/epaper", epaperRoutes);

startRetentionJob();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ Mongo Error", err));

app.listen(5000, () => {
  console.log("🚀 Server running on 5000");
});
