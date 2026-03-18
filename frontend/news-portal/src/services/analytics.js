import { fetchWithTimeout } from "./api";

const VISITOR_STORAGE_KEY = "newsPortalVisitorId";

const createVisitorId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const getVisitorId = () => {
  if (typeof window === "undefined") return "";

  let visitorId = localStorage.getItem(VISITOR_STORAGE_KEY);
  if (!visitorId) {
    visitorId = createVisitorId();
    localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
  }

  return visitorId;
};

export const trackVisit = async ({ markAsReader = false } = {}) => {
  const visitorId = getVisitorId();
  if (!visitorId) return;

  try {
    await fetchWithTimeout("analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId,
        markAsReader,
      }),
    });
  } catch (error) {
    console.warn("Visitor tracking failed", error);
  }
};

export const fetchVisitorSummary = async (token) => {
  const res = await fetchWithTimeout("analytics/summary", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res;
};
