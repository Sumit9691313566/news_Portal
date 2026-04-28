import express from "express";
import { adminLogin } from "../controllers/authController.js";
import {
  createReporter,
  deleteReporter,
  listReporters,
} from "../controllers/reporterController.js";
import adminAuth from "../middleware/adminAuth.js";
import requireRole from "../middleware/requireRole.js";
import { createRateLimiter } from "../middleware/security.js";

const router = express.Router();

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyPrefix: "auth-login",
  message: "Too many login attempts. Please try again later.",
});

router.post("/login", loginLimiter, adminLogin);
router.get("/reporters", adminAuth, requireRole("main-admin"), listReporters);
router.post("/reporters", adminAuth, requireRole("main-admin"), createReporter);
router.delete("/reporters/:id", adminAuth, requireRole("main-admin"), deleteReporter);

export default router;
