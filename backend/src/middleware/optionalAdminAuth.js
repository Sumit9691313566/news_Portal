import jwt from "jsonwebtoken";

const optionalAdminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
  } catch {
    req.admin = null;
  }

  return next();
};

export default optionalAdminAuth;
