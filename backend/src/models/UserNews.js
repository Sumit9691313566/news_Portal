import mongoose from "mongoose";

const userNewsSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true, maxlength: 120 },
    mobileNumber: { type: String, default: "", trim: true, maxlength: 30 },
    city: { type: String, default: "", trim: true, maxlength: 120 },
    message: { type: String, default: "", trim: true, maxlength: 5000 },
    mediaType: {
      type: String,
      enum: ["image", "video", "none"],
      default: "none",
    },
    mediaUrl: { type: String, default: "" },
    mediaPublicId: { type: String, default: "" },
    mediaResourceType: {
      type: String,
      enum: ["image", "video", "raw"],
      default: "raw",
    },
    status: {
      type: String,
      enum: ["new", "reviewed"],
      default: "new",
    },
  },
  { timestamps: true }
);

export default mongoose.model("UserNews", userNewsSchema);
