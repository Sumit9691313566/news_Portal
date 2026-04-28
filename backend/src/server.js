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
import {
  blockSuspiciousRequests,
  createRateLimiter,
  noStoreForProtectedApi,
  securityHeaders,
} from "./middleware/security.js";

console.log("Cloudinary Env Check:", {
  cloud: process.env.CLOUDINARY_CLOUD_NAME ? "LOADED" : "MISSING",
  key: process.env.CLOUDINARY_API_KEY ? "LOADED" : "MISSING",
});

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "";
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
app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use((req, res, next) => {
  req.setTimeout(120000);
  res.setTimeout(120000);
  next();
});

const normalize = (u = "") => String(u).replace(/\/+$|\s+/g, "").replace(/:\/\/$/, "");
const frontendUrl = normalize(process.env.FRONTEND_URL || "");
const extraOrigins = String(process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => normalize(origin))
  .filter(Boolean);
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5000",
  frontendUrl,
  ...extraOrigins,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (NODE_ENV !== "production") return callback(null, true);

      const cleanedOrigin = normalize(origin);
      if (allowedOrigins.includes(cleanedOrigin)) return callback(null, true);

      console.warn("Blocked CORS origin:", origin, "(clean:", cleanedOrigin, ") allowed:", allowedOrigins);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(securityHeaders);
app.use(blockSuspiciousRequests);
app.use(noStoreForProtectedApi);
app.use(createRateLimiter({ max: 600, keyPrefix: "api-global" }));

app.use(express.json({ limit: "1mb", strict: true }));
app.use(express.urlencoded({ extended: true, limit: "1mb", parameterLimit: 50 }));

const writeLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120,
  keyPrefix: "write",
  message: "Too many write requests. Please try again later.",
});

const publicSubmitLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyPrefix: "public-submit",
  message: "Too many submissions. Please try again later.",
});

const limitWriteMethods = (limiter) => (req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return limiter(req, res, next);
  }
  return next();
};

const limitPublicSubmissions = (req, res, next) => {
  if (req.method === "POST" && !req.headers.authorization) {
    return publicSubmitLimiter(req, res, next);
  }
  return next();
};

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/debug", (req, res) => {
  if (NODE_ENV === "production") {
    return res.status(404).json({ message: "Not found" });
  }

  const mongooseState = mongoose.connection ? mongoose.connection.readyState : "unknown";
  res.json({
    nodeEnv: NODE_ENV,
    frontendUrl,
    allowedOrigins,
    mongoState: mongooseState,
  });
});

app.use("/api/news", limitWriteMethods(writeLimiter), newsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/epaper", epaperRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/user-news", limitPublicSubmissions, userNewsRoutes);

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
    console.warn("MONGO_URI/MONGODB_URI is missing. Starting server without DB connection.");
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
