import express from "express";
import { getVisitorSummary, trackVisitor } from "../controllers/analyticsController.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.post("/visit", trackVisitor);
router.get("/summary", adminAuth, getVisitorSummary);

export default router;
