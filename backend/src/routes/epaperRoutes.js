import express from "express";
import multer from "multer";
import {
  createEpaper,
  getAllEpaper,
  getEpaperById,
  deleteEpaper,
} from "../controllers/epaperController.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/", getAllEpaper);
router.get("/:id", getEpaperById);
router.post("/", upload.single("file"), createEpaper);
router.delete("/:id", deleteEpaper);

export default router;
