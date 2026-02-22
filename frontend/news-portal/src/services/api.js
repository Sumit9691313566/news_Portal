const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const API_BASE_URL = String(RAW_API_BASE_URL).replace(/\/+$/, "");
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 4500;

export const buildApiUrl = (path = "") => {
  const cleanPath = String(path).replace(/^\/+/, "");
  return cleanPath ? `${API_BASE_URL}/${cleanPath}` : API_BASE_URL;
};

export const fetchWithTimeout = async (
  path,
  options = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(buildApiUrl(path), {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
};

export const loginAdmin = async (email, password) => {
  const res = await fetchWithTimeout("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res;
};

export const fetchNews = async () => {
  const res = await fetchWithTimeout("/news");
  return res.json();
};

export const addNews = async (newsData) => {
  const token = localStorage.getItem("adminToken");

  const res = await fetchWithTimeout("/news", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(newsData),
  });

  return res.json();
};

export const updateNews = async (id, newsData) => {
  const token = localStorage.getItem("adminToken");

  const res = await fetchWithTimeout(`/news/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(newsData),
  });

  return res.json();
};

export const deleteNews = async (id) => {
  const token = localStorage.getItem("adminToken");

  await fetchWithTimeout(`/news/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export { API_BASE_URL };
