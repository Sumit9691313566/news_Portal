import mongoose from "mongoose";

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    titleColor: { type: String, default: "" },
    content: { type: String, required: true },
    category: { type: String, default: "All" },
    mediaType: { type: String, enum: ["image", "video", "text"], default: "text" },
    mediaUrl: { type: String, default: null },
    mediaPublicId: { type: String, default: "" },
    mediaResourceType: { type: String, enum: ["image", "video"], default: "image" },
    status: {
      type: String,
      enum: ["published", "draft", "pending"],
      default: "draft",
    },
    firstPublishedAt: { type: Date, default: null },
    featured: { type: Boolean, default: false },
    notify: { type: Boolean, default: false },
    breaking: { type: Boolean, default: false },
    author: { type: String, default: "Admin" },
    createdById: { type: String, default: "" },
    createdByName: { type: String, default: "" },
    createdByRole: {
      type: String,
      enum: ["main-admin", "sub-admin", "reporter", ""],
      default: "",
    },
    views: { type: Number, default: 0 },
    blocks: [
      {
        type: { type: String, enum: ["text", "image", "video"], required: true },
        text: { type: String, default: "" },
        url: { type: String, default: "" },
        publicId: { type: String, default: "" },
        resourceType: { type: String, enum: ["image", "video"], default: "image" },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("News", newsSchema);
