import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * ADMIN LOGIN CONTROLLER
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // debug logs
    console.log("📧 Login Email:", email);
    console.log("📧 Admin Email:", process.env.ADMIN_EMAIL);
    console.log("🔐 Hash Loaded:", !!process.env.ADMIN_PASSWORD_HASH);
    console.log("🔐 JWT Loaded:", !!process.env.JWT_SECRET);

    // email check
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // password check
    const isMatch = bcrypt.compareSync(
      password,
      process.env.ADMIN_PASSWORD_HASH
    );

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // create token
    const token = jwt.sign(
      { role: "admin", email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
