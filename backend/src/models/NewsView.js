import mongoose from "mongoose";

const newsViewSchema = new mongoose.Schema(
  {
    newsId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "News",
      required: true,
      index: true,
    },
    visitorId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

newsViewSchema.index({ newsId: 1, visitorId: 1 }, { unique: true });

export default mongoose.model("NewsView", newsViewSchema);
