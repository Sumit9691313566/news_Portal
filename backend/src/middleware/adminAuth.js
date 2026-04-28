import { isValidAdminClaims, verifyAdminToken } from "../utils/jwt.js";

const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Only admin login allowed" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = verifyAdminToken(token);
    if (!isValidAdminClaims(decoded)) {
      return res.status(401).json({ message: "Invalid token claims" });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default adminAuth;
