import express from "express";
import multer from "multer";
import {
  deleteUserNews,
  getAllUserNews,
  submitUserNews,
  updateUserNews,
} from "../controllers/userNewsController.js";
import adminAuth from "../middleware/adminAuth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 250 * 1024 * 1024,
    files: 1,
    fields: 20,
  },
});

router.post("/", upload.single("media"), submitUserNews);
router.get("/", adminAuth, requireRole("main-admin"), getAllUserNews);
router.put("/:id", adminAuth, requireRole("main-admin"), updateUserNews);
router.delete("/:id", adminAuth, requireRole("main-admin"), deleteUserNews);

export default router;
