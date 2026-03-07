import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

const SUB_ADMINS = [
  {
    adminId: "subadmin1",
    name: "sub admin 1",
    email: "sumitsub1@gmail.com",
    password: "SumitSub@123",
    role: "sub-admin",
  },
  {
    adminId: "subadmin2",
    name: "sub admin 2",
    email: "sumitsub2@gmail.com",
    password: "SumitSub2@123",
    role: "sub-admin",
  },
];

export const seedSubAdmins = async () => {
  for (const adminData of SUB_ADMINS) {
    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    await Admin.findOneAndUpdate(
      { adminId: adminData.adminId },
      {
        $set: {
          name: adminData.name,
          email: adminData.email,
          password: hashedPassword,
          role: adminData.role,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );
  }
};
