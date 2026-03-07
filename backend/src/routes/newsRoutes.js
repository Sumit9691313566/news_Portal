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
import optionalAdminAuth from "../middleware/optionalAdminAuth.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024,
    fields: 20,
    files: 20,
  },
});

router.get("/", optionalAdminAuth, getAllNews);
router.get("/deleted", adminAuth, getDeletedNews);
router.delete("/deleted/:id", adminAuth, deleteDeletedNews);
router.delete("/deleted", adminAuth, deleteDeletedNewsBulk);
router.post("/", adminAuth, upload.any(), createNews);
router.post("/:id/view", incrementViews);
router.put("/:id", adminAuth, upload.any(), updateNews);
router.delete("/:id", adminAuth, deleteNews);

export default router;
