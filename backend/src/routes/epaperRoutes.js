import express from "express";
import multer from "multer";
import {
  createEpaper,
  getAllEpaper,
  getEpaperById,
  streamEpaperFile,
  deleteEpaper,
} from "../controllers/epaperController.js";
import adminAuth from "../middleware/adminAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
    fields: 20,
    files: 20,
  },
});

router.get("/", getAllEpaper);
router.get("/:id/file", streamEpaperFile);
router.get("/:id", getEpaperById);
router.post(
  "/",
  adminAuth,
  requireRole("main-admin", "sub-admin"),
  upload.single("file"),
  createEpaper
);
router.delete(
  "/:id",
  adminAuth,
  requireRole("main-admin", "sub-admin"),
  deleteEpaper
);

export default router;
