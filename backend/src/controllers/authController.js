import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { seedSubAdmins } from "../utils/seedSubAdmins.js";

const readEnvAdmins = () => {
  const admins = [];

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH) {
    admins.push({
      adminId: String(process.env.ADMIN_ID || "admin").toLowerCase(),
      name: "main admin",
      email: String(process.env.ADMIN_EMAIL).toLowerCase(),
      passwordHash: process.env.ADMIN_PASSWORD_HASH,
      role: "admin",
    });
  }

  if (process.env.SUB_ADMIN_1_EMAIL && process.env.SUB_ADMIN_1_PASSWORD_HASH) {
    admins.push({
      adminId: String(process.env.SUB_ADMIN_1_ID || "subadmin1").toLowerCase(),
      name: process.env.SUB_ADMIN_1_NAME || "sub admin 1",
      email: String(process.env.SUB_ADMIN_1_EMAIL).toLowerCase(),
      passwordHash: process.env.SUB_ADMIN_1_PASSWORD_HASH,
      role: "sub-admin",
    });
  }

  if (process.env.SUB_ADMIN_2_EMAIL && process.env.SUB_ADMIN_2_PASSWORD_HASH) {
    admins.push({
      adminId: String(process.env.SUB_ADMIN_2_ID || "subadmin2").toLowerCase(),
      name: process.env.SUB_ADMIN_2_NAME || "sub admin 2",
      email: String(process.env.SUB_ADMIN_2_EMAIL).toLowerCase(),
      passwordHash: process.env.SUB_ADMIN_2_PASSWORD_HASH,
      role: "sub-admin",
    });
  }

  return admins;
};

/**
 * ADMIN LOGIN CONTROLLER (supports adminId or email in email field)
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const loginId = String(email || "").trim().toLowerCase();

    if (!loginId || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const envAdmin = readEnvAdmins().find(
      (a) => a.email === loginId || a.adminId === loginId
    );
    if (envAdmin) {
      const isEnvMatch = await bcrypt.compare(password, envAdmin.passwordHash);
      if (!isEnvMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        {
          role: envAdmin.role,
          adminId: envAdmin.adminId,
          name: envAdmin.name,
          email: envAdmin.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      return res.status(200).json({
        message: "Login successful",
        token,
        admin: {
          id: envAdmin.adminId,
          name: envAdmin.name,
          email: envAdmin.email,
          role: envAdmin.role,
        },
      });
    }

    try {
      await seedSubAdmins();
    } catch (seedErr) {
      console.warn("Seed skipped:", seedErr?.message || seedErr);
    }

    const admin = await Admin.findOne({
      $or: [{ email: loginId }, { adminId: loginId }],
    });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        role: admin.role || "sub-admin",
        adminId: admin.adminId,
        name: admin.name,
        email: admin.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        id: admin.adminId,
        name: admin.name,
        email: admin.email,
        role: admin.role || "sub-admin",
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
