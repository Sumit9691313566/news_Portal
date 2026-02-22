import express from "express";
import multer from "multer";
import {
  createNews,
  getAllNews,
  updateNews,
  deleteNews,
  incrementViews,
  getDeletedNews,
  deleteDeletedNews,
  deleteDeletedNewsBulk,
} from "../controllers/newsController.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

/* Multer Memory Storage */
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ROUTES */
router.get("/", getAllNews);              // ✅ already working
router.get("/deleted", adminAuth, getDeletedNews);
router.delete("/deleted/:id", adminAuth, deleteDeletedNews);
router.delete("/deleted", adminAuth, deleteDeletedNewsBulk);
router.post("/", upload.any(), createNews);
router.post("/:id/view", incrementViews);

// 🔥 MISSING ROUTES (THIS WAS THE REAL BUG)
router.put("/:id", upload.any(), updateNews);
router.delete("/:id", deleteNews);

export default router;
