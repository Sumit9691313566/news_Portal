import express from "express";
import { shareNewsPreview } from "../controllers/shareController.js";

const router = express.Router();

router.get("/", shareNewsPreview);
router.get("/:id", shareNewsPreview);

export default router;
