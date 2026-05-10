const RAW_PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || "";

export const normalizeSiteUrl = (value = "") =>
  String(value || "").trim().replace(/\/+$/, "");

export const getPublicSiteUrl = () => {
  if (typeof window !== "undefined" && window.location?.origin) {
    const currentOrigin = normalizeSiteUrl(window.location.origin);
    const currentHost = String(window.location.hostname || "").toLowerCase();
    if (currentHost === "localhost" || currentHost === "127.0.0.1") {
      return currentOrigin;
    }
  }

  const configuredUrl = normalizeSiteUrl(RAW_PUBLIC_SITE_URL);
  if (configuredUrl) return configuredUrl;

  if (typeof window !== "undefined" && window.location?.origin) {
    return normalizeSiteUrl(window.location.origin);
  }

  return "";
};

export const buildPublicUrl = (path = "/") => {
  const baseUrl = getPublicSiteUrl();
  const normalizedPath = String(path || "").trim();
  if (!baseUrl) return normalizedPath || "/";
  if (!normalizedPath || normalizedPath === "/") return `${baseUrl}/`;
  return normalizedPath.startsWith("/")
    ? `${baseUrl}${normalizedPath}`
    : `${baseUrl}/${normalizedPath}`;
};
