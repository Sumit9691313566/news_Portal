import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

const cleanValue = (value) => String(value || "").trim();
const cleanId = (value) => cleanValue(value).toLowerCase();

const isMainAdmin = (req) => String(req?.admin?.role || "").toLowerCase() === "main-admin";

export const listReporters = async (req, res) => {
  try {
    if (!isMainAdmin(req)) {
      return res.status(403).json({ message: "Only main admin can view reporters" });
    }

    const reporters = await Admin.find({ role: "reporter" })
      .select("adminId name email role createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(reporters);
  } catch (error) {
    console.error("LIST REPORTERS ERROR:", error);
    return res.status(500).json({ message: "Failed to load reporters" });
  }
};

export const createReporter = async (req, res) => {
  try {
    if (!isMainAdmin(req)) {
      return res.status(403).json({ message: "Only main admin can create reporters" });
    }

    const adminId = cleanId(req.body?.adminId);
    const password = cleanValue(req.body?.password);
    const name = cleanValue(req.body?.name) || adminId;
    const emailInput = cleanValue(req.body?.email);
    const email = (emailInput || `${adminId}@reporter.local`).toLowerCase();

    if (!adminId || !password) {
      return res.status(400).json({ message: "Reporter ID and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const existing = await Admin.findOne({
      $or: [{ adminId }, { email }],
    }).lean();

    if (existing) {
      return res.status(409).json({ message: "Reporter ID or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const reporter = await Admin.create({
      adminId,
      name,
      email,
      password: hashedPassword,
      role: "reporter",
    });

    return res.status(201).json({
      message: "Reporter created successfully",
      reporter: {
        _id: reporter._id,
        adminId: reporter.adminId,
        name: reporter.name,
        email: reporter.email,
        role: reporter.role,
        createdAt: reporter.createdAt,
      },
    });
  } catch (error) {
    console.error("CREATE REPORTER ERROR:", error);
    return res.status(500).json({ message: "Failed to create reporter" });
  }
};

export const deleteReporter = async (req, res) => {
  try {
    if (!isMainAdmin(req)) {
      return res.status(403).json({ message: "Only main admin can delete reporters" });
    }

    const reporter = await Admin.findOneAndDelete({
      _id: req.params.id,
      role: "reporter",
    });

    if (!reporter) {
      return res.status(404).json({ message: "Reporter not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("DELETE REPORTER ERROR:", error);
    return res.status(500).json({ message: "Failed to delete reporter" });
  }
};
