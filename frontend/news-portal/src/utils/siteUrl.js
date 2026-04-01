const RAW_PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || "";

export const normalizeSiteUrl = (value = "") =>
  String(value || "").trim().replace(/\/+$/, "");

export const getPublicSiteUrl = () => {
  const configuredUrl = normalizeSiteUrl(RAW_PUBLIC_SITE_URL);
  if (configuredUrl) return configuredUrl;

  if (typeof window !== "undefined" && window.location?.origin) {
    return normalizeSiteUrl(window.location.origin);
  }

  return "http://localhost:5173";
};

export const buildPublicUrl = (path = "/") => {
  const baseUrl = getPublicSiteUrl();
  const normalizedPath = String(path || "").trim();
  if (!normalizedPath || normalizedPath === "/") return `${baseUrl}/`;
  return normalizedPath.startsWith("/")
    ? `${baseUrl}${normalizedPath}`
    : `${baseUrl}/${normalizedPath}`;
};
