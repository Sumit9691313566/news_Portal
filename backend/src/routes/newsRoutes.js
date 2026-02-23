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

/* Multer Memory Storage with size limits */
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB for videos
    fields: 20,
    files: 20,
  },
});

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
