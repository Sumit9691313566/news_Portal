import mongoose from "mongoose";

const epaperSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    fileType: { type: String, enum: ["pdf", "image"], required: true },
    fileUrl: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Epaper", epaperSchema);
