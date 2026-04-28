import jwt from "jsonwebtoken";

const JWT_ISSUER = process.env.JWT_ISSUER || "garud-samachar-api";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "garud-samachar-admin";

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }
  return secret;
};

export const signAdminToken = (payload) =>
  jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithm: "HS256",
  });

export const verifyAdminToken = (token) =>
  jwt.verify(token, getJwtSecret(), {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithms: ["HS256"],
  });

export const isValidAdminClaims = (decoded = {}) => {
  const role = String(decoded.role || "").trim();
  const adminId = String(decoded.adminId || "").trim();
  const email = String(decoded.email || "").trim();
  return Boolean(role && (adminId || email));
};
