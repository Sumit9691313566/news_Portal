import { isValidAdminClaims, verifyAdminToken } from "../utils/jwt.js";

const optionalAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = verifyAdminToken(token);
    req.admin = isValidAdminClaims(decoded) ? decoded : null;
  } catch {
    req.admin = null;
  }

  return next();
};

export default optionalAdminAuth;
