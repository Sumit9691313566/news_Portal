import mongoose from "mongoose";

const pushSubscriberSchema = new mongoose.Schema(
  {
    endpoint: { type: String, required: true, unique: true },
    p256dh_key: { type: String, required: true },
    auth_key: { type: String, required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

export default mongoose.model("PushSubscriber", pushSubscriberSchema);
