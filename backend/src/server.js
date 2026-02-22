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

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

const app = express();

// CORS Configuration for multiple environments
const normalize = (u = "") => String(u).replace(/\/+$|\s+/g, "").replace(/:\/\/$/, "");
const frontendUrl = normalize(process.env.FRONTEND_URL || "");
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5000",
  "https://newsportal-production-164d.up.railway.app",
  "https://news-portal-chi-self.vercel.app",
  frontendUrl,
].filter(Boolean);

// Use a function for origin so we can log and provide clearer behavior
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow server-to-server or tools without origin
      if (NODE_ENV !== "production") return callback(null, true);
      const cleanedOrigin = normalize(origin);
      // allow explicit configured origins
      if (allowedOrigins.includes(cleanedOrigin)) return callback(null, true);
      // allow vercel preview/domains and railway preview domains
      if (cleanedOrigin.includes("vercel.app") || cleanedOrigin.includes("railway.app")) {
        console.log("Allowed dynamic origin (vercel/railway):", cleanedOrigin);
        return callback(null, true);
      }
      console.warn("Blocked CORS origin:", origin, "(clean:", cleanedOrigin, ") allowed:", allowedOrigins);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Debug endpoint to verify runtime configuration (safe to remove in production)
app.get("/debug", (req, res) => {
  const mongooseState = mongoose.connection ? mongoose.connection.readyState : "unknown";
  res.json({
    nodeEnv: NODE_ENV,
    frontendUrl: frontendUrl,
    allowedOrigins,
    mongoState: mongooseState,
  });
});

app.use("/api/news", newsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/epaper", epaperRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  const payload = { message: err.message || "Internal server error" };
  if (process.env.NODE_ENV !== "production") payload.stack = err.stack;
  res.status(err.status || 500).json(payload);
});

startRetentionJob();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ Mongo Error", err));

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT} (${NODE_ENV})`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    mongoose.connection.close();
  });
});
