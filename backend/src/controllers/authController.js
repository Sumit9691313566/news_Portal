import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { seedSubAdmins } from "../utils/seedSubAdmins.js";

const MAIN_ADMIN = {
  adminId: "mainadmin",
  name: "main admin",
  email: "mainadmin@gmail.com",
  passwordHash: "$2a$12$jb49rtZZLQzIrCiS00ShTOBGZGvkDs6oiVf7jW6OHUxbm9rlpRHVi",
  role: "main-admin",
};

const normalizeRole = (role, adminId, email) => {
  const cleaned = String(role || "").trim().toLowerCase();
  const normalizedAdminId = String(adminId || "").trim().toLowerCase();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const isCanonicalMainAdmin =
    normalizedAdminId === MAIN_ADMIN.adminId ||
    normalizedEmail === MAIN_ADMIN.email;

  if (isCanonicalMainAdmin) {
    return "main-admin";
  }
  if (cleaned === "reporter") {
    return "reporter";
  }
  if (cleaned === "admin" || cleaned === "main-admin") {
    return "sub-admin";
  }
  return cleaned || "sub-admin";
};

const readEnvAdmins = () => {
  const admins = [MAIN_ADMIN];

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH) {
    admins.push({
      adminId: String(process.env.ADMIN_ID || "admin").toLowerCase(),
      name: process.env.ADMIN_NAME || "admin",
      email: String(process.env.ADMIN_EMAIL).toLowerCase(),
      passwordHash: process.env.ADMIN_PASSWORD_HASH,
      role: process.env.ADMIN_ROLE || "sub-admin",
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

      const normalizedRole = normalizeRole(
        envAdmin.role,
        envAdmin.adminId,
        envAdmin.email
      );
      const token = jwt.sign(
        {
          role: normalizedRole,
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
          role: normalizedRole,
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

    const normalizedRole = normalizeRole(admin.role, admin.adminId, admin.email);
    const token = jwt.sign(
      {
        role: normalizedRole,
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
        role: normalizedRole,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
