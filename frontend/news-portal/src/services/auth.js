// src/services/auth.js

export const loginAdmin = (email, password) => {
  // frontend demo validation
  if (email && password) {
    localStorage.setItem("adminToken", "demo-admin-token");
    return true;
  }
  return false;
};

export const logoutAdmin = () => {
  localStorage.removeItem("adminToken");
};

export const isAdminLoggedIn = () => {
  return !!localStorage.getItem("adminToken");
};
