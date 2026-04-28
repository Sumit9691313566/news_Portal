const WINDOW_MS = 15 * 60 * 1000;

const getClientKey = (req) => {
  const forwardedFor = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();
  return forwardedFor || req.ip || req.socket?.remoteAddress || "unknown";
};

const rateBuckets = new Map();

const cleanupBuckets = () => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets.entries()) {
    if (bucket.resetAt <= now) {
      rateBuckets.delete(key);
    }
  }
};

setInterval(cleanupBuckets, WINDOW_MS).unref?.();

export const createRateLimiter = ({
  windowMs = WINDOW_MS,
  max = 120,
  keyPrefix = "global",
  message = "Too many requests. Please try again later.",
} = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${keyPrefix}:${getClientKey(req)}`;
    const bucket = rateBuckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({ message });
    }

    return next();
  };
};

export const blockSuspiciousRequests = (req, res, next) => {
  const url = String(req.originalUrl || req.url || "").toLowerCase();
  const blockedPatterns = [
    "../",
    "%2e%2e",
    ".env",
    "wp-admin",
    "wp-login",
    "phpmyadmin",
    ".git",
    "config.php",
  ];

  if (blockedPatterns.some((pattern) => url.includes(pattern))) {
    return res.status(404).json({ message: "Not found" });
  }

  return next();
};

export const securityHeaders = (req, res, next) => {
  const connectSrc = [
    "'self'",
    "https:",
    "wss:",
    "http://localhost:*",
    "ws://localhost:*",
  ].join(" ");

  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("X-Download-Options", "noopen");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=()");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "style-src 'self' 'unsafe-inline' https:",
      "script-src 'self' 'unsafe-inline'",
      `connect-src ${connectSrc}`,
    ].join("; ")
  );

  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  }

  next();
};

export const noStoreForProtectedApi = (req, res, next) => {
  if (req.headers.authorization) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
  }
  next();
};

const hasAllowedMime = (file, allowedPrefixes = [], allowedTypes = []) => {
  const mimetype = String(file?.mimetype || "").toLowerCase();
  return (
    allowedTypes.includes(mimetype) ||
    allowedPrefixes.some((prefix) => mimetype.startsWith(prefix))
  );
};

export const imageVideoFileFilter = (req, file, callback) => {
  if (hasAllowedMime(file, ["image/", "video/"])) {
    return callback(null, true);
  }
  return callback(Object.assign(new Error("Only image or video uploads are allowed"), { status: 400 }));
};

export const epaperFileFilter = (req, file, callback) => {
  if (hasAllowedMime(file, ["image/"], ["application/pdf"])) {
    return callback(null, true);
  }
  return callback(Object.assign(new Error("Only PDF or image uploads are allowed"), { status: 400 }));
};
