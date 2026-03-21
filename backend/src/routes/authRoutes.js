import express from "express";
import { adminLogin } from "../controllers/authController.js";
import {
  createReporter,
  deleteReporter,
  listReporters,
} from "../controllers/reporterController.js";
import adminAuth from "../middleware/adminAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/reporters", adminAuth, requireRole("main-admin"), listReporters);
router.post("/reporters", adminAuth, requireRole("main-admin"), createReporter);
router.delete("/reporters/:id", adminAuth, requireRole("main-admin"), deleteReporter);

export default router;
