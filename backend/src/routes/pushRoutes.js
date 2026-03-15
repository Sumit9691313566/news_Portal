import express from "express";
import { vapidKey, subscribe, sendAll } from "../controllers/pushController.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/vapidPublicKey", vapidKey);
router.post("/subscribe", subscribe);
// protect send route so only admins can trigger ad-hoc sends
router.post("/send", adminAuth, sendAll);

export default router;
