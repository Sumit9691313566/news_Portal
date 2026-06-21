import express from "express";
import multer from "multer";
import {
  createNews,
  getAllNews,
  updateNews,
  deleteNews,
  incrementViews,
  resetAllViews,
  getUploadSignature,
  getDeletedNews,
  deleteDeletedNews,
  deleteDeletedNewsBulk,
} from "../controllers/newsController.js";
import adminAuth from "../middleware/adminAuth.js";
import optionalAdminAuth from "../middleware/optionalAdminAuth.js";
import { imageVideoFileFilter } from "../middleware/security.js";

const router = express.Router();
const MAX_NEWS_UPLOAD_BYTES = 1024 * 1024 * 1024;

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: imageVideoFileFilter,
  limits: {
    fileSize: MAX_NEWS_UPLOAD_BYTES,
    fields: 20,
    files: 20,
  },
});

router.get("/", optionalAdminAuth, getAllNews);
router.post("/upload-signature", adminAuth, getUploadSignature);
router.post("/reset-views", adminAuth, resetAllViews);
router.get("/deleted", adminAuth, getDeletedNews);
router.delete("/deleted/:id", adminAuth, deleteDeletedNews);
router.delete("/deleted", adminAuth, deleteDeletedNewsBulk);
router.post("/", adminAuth, upload.any(), createNews);
router.post("/:id/view", incrementViews);
router.put("/:id", adminAuth, upload.any(), updateNews);
router.delete("/:id", adminAuth, deleteNews);

export default router;
