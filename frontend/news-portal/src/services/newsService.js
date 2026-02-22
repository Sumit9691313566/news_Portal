// src/services/newsService.js

export const getAdminNews = () => {
  try {
    return JSON.parse(localStorage.getItem("adminNews")) || [];
  } catch (e) {
    return [];
  }
};
