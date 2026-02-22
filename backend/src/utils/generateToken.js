import jwt from "jsonwebtoken";

const generateToken = () => {
  return jwt.sign(
    { role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

export default generateToken;
