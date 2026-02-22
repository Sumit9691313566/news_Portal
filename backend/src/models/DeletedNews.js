import mongoose from "mongoose";

const deletedNewsSchema = new mongoose.Schema(
  {
    newsId: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    content: { type: String, default: "" },
    category: { type: String, default: "All" },
    mediaType: { type: String, enum: ["image", "video", "text"], default: "text" },
    mediaUrl: { type: String, default: null },
    status: { type: String, enum: ["published", "draft"], default: "published" },
    featured: { type: Boolean, default: false },
    breaking: { type: Boolean, default: false },
    author: { type: String, default: "Admin" },
    views: { type: Number, default: 0 },
    createdAt: { type: Date },
    deletedAt: { type: Date, default: Date.now },
    deletedReason: { type: String, enum: ["manual", "retention"], default: "manual" },
  },
  { timestamps: true }
);

export default mongoose.model("DeletedNews", deletedNewsSchema);
