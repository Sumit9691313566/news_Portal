import express from "express";
import multer from "multer";
import {
  createEpaper,
  getAllEpaper,
  getEpaperById,
  streamEpaperFile,
  deleteEpaper,
} from "../controllers/epaperController.js";

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
router.post("/", upload.single("file"), createEpaper);
router.delete("/:id", deleteEpaper);

export default router;
