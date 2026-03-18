import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    firstSeenAt: {
      type: Date,
      default: Date.now,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    hasReadNews: {
      type: Boolean,
      default: false,
    },
    lastReadAt: {
      type: Date,
      default: null,
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Visitor", visitorSchema);
