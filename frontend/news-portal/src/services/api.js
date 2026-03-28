const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const API_BASE_URL = String(RAW_API_BASE_URL).replace(/\/+$/, "");
const RAW_API_FALLBACK_URL = import.meta.env.VITE_API_FALLBACK_URL || "";
const API_FALLBACK_URL = String(RAW_API_FALLBACK_URL).replace(/\/+$/, "");
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 12000;

const isLocalApiBase = (baseUrl) =>
  baseUrl === "/api" ||
  baseUrl.startsWith("http://localhost") ||
  baseUrl.startsWith("https://localhost");

const isReadPathEligibleForEmptyFallback = (path, options = {}) => {
  const method = String(options.method || "GET").toUpperCase();
  if (method !== "GET") return false;

  const cleanPath = String(path).replace(/^\/+/, "").toLowerCase();
  return (
    cleanPath === "news" ||
    cleanPath === "epaper" ||
    cleanPath.startsWith("news?") ||
    cleanPath.startsWith("epaper?")
  );
};

const responseLooksEmpty = async (response) => {
  try {
    const cloned = response.clone();
    const text = await cloned.text();
    if (!text) return true;
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) && parsed.length === 0;
  } catch {
    return false;
  }
};

export const buildApiUrl = (path = "", baseUrl = API_BASE_URL) => {
  const cleanPath = String(path).replace(/^\/+/, "");
  return cleanPath ? `${baseUrl}/${cleanPath}` : baseUrl;
};

const shouldTryFallback = (error, response) => {
  if (response && response.status < 500) return false;
  if (!API_FALLBACK_URL || API_FALLBACK_URL === API_BASE_URL) return false;
  if (!error) return Boolean(response);
  return error.name === "AbortError" || error instanceof TypeError;
};

const doFetch = async (baseUrl, path, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(buildApiUrl(path, baseUrl), {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
};

export const fetchWithTimeout = async (
  path,
  options = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
) => {
  try {
    const primaryResponse = await doFetch(API_BASE_URL, path, options, timeoutMs);
    if (
      primaryResponse.ok &&
      isLocalApiBase(API_BASE_URL) &&
      isReadPathEligibleForEmptyFallback(path, options) &&
      API_FALLBACK_URL &&
      API_FALLBACK_URL !== API_BASE_URL &&
      (await responseLooksEmpty(primaryResponse))
    ) {
      return await doFetch(API_FALLBACK_URL, path, options, timeoutMs);
    }
    if (shouldTryFallback(null, primaryResponse)) {
      return await doFetch(API_FALLBACK_URL, path, options, timeoutMs);
    }
    return primaryResponse;
  } catch (error) {
    if (shouldTryFallback(error)) {
      return await doFetch(API_FALLBACK_URL, path, options, timeoutMs);
    }
    throw error;
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

export { API_BASE_URL, API_FALLBACK_URL };
