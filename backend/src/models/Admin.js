// models/Admin.js
import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  adminId: { type: String, unique: true, required: true, trim: true, lowercase: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, required: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, default: "sub-admin" },
});

export default mongoose.model("Admin", adminSchema);
