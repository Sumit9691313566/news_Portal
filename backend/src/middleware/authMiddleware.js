import { isValidAdminClaims, verifyAdminToken } from "../utils/jwt.js";

export const protect = (req, res, next) => {
  let token;

  // token header से लो
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = verifyAdminToken(token);
      if (!isValidAdminClaims(decoded)) {
        return res.status(401).json({ message: "Not authorized, invalid token claims" });
      }

      // admin flag (future use)
      req.admin = decoded;

      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};
