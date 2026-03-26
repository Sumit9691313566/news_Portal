import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dns from "node:dns";

import newsRoutes from "./routes/newsRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import epaperRoutes from "./routes/epaperRoutes.js";
import pushRoutes from "./routes/pushRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import userNewsRoutes from "./routes/userNewsRoutes.js";
import { startRetentionJob } from "./utils/retention.js";
import { startDailyDigestJobs } from "./utils/digest.js";

console.log("Cloudinary Env Check:", {
  cloud: process.env.CLOUDINARY_CLOUD_NAME,
  key: process.env.CLOUDINARY_API_KEY ? "LOADED" : "MISSING",
});

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DNS_SERVERS = String(
  process.env.MONGO_DNS_SERVERS || "8.8.8.8,1.1.1.1"
)
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean);

if (MONGO_DNS_SERVERS.length > 0) {
  dns.setServers(MONGO_DNS_SERVERS);
  console.log("Mongo DNS servers:", MONGO_DNS_SERVERS);
}

const app = express();

app.use((req, res, next) => {
  req.setTimeout(120000);
  res.setTimeout(120000);
  next();
});

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

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (NODE_ENV !== "production") return callback(null, true);

      const cleanedOrigin = normalize(origin);
      if (allowedOrigins.includes(cleanedOrigin)) return callback(null, true);

      if (cleanedOrigin.includes("vercel.app") || cleanedOrigin.includes("railway.app")) {
        console.log("Allowed dynamic origin (vercel/railway):", cleanedOrigin);
        return callback(null, true);
      }

      console.warn("Blocked CORS origin:", origin, "(clean:", cleanedOrigin, ") allowed:", allowedOrigins);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/debug", (req, res) => {
  const mongooseState = mongoose.connection ? mongoose.connection.readyState : "unknown";
  res.json({
    nodeEnv: NODE_ENV,
    frontendUrl,
    allowedOrigins,
    mongoState: mongooseState,
  });
});

app.use("/api/news", newsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/epaper", epaperRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/user-news", userNewsRoutes);

app.use((err, req, res, next) => {
  console.error("Error:", err);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      message: "File too large. Maximum size is 500MB.",
    });
  }

  if (err.code === "LIMIT_FIELD_COUNT") {
    return res.status(400).json({
      message: "Too many fields in request.",
    });
  }

  const payload = { message: err.message || "Internal server error" };
  if (process.env.NODE_ENV !== "production") payload.stack = err.stack;
  res.status(err.status || 500).json(payload);
});

let server = null;

const startServer = async () => {
  server = app.listen(PORT, () => {
    console.log(`Server running on ${PORT} (${NODE_ENV})`);
  });

  if (!MONGO_URI) {
    console.warn("MONGO_URI is missing. Starting server without DB connection.");
    return;
  }

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log("MongoDB Connected");
    startRetentionJob();
    // start daily digest scheduler
    startDailyDigestJobs();
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    console.warn("Continuing without DB connection.");
  }
};

startServer().catch((err) => {
  console.error("Startup Error:", err);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  if (!server) {
    mongoose.connection.close();
    return;
  }

  server.close(() => {
    console.log("HTTP server closed");
    mongoose.connection.close();
  });
});
