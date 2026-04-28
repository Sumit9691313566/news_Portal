import { signAdminToken } from "./jwt.js";

const generateToken = () => {
  return signAdminToken({ role: "sub-admin", adminId: "admin", name: "Admin" });
};

export default generateToken;
