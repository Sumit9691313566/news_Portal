const MOBILE_USER_AGENT_PATTERN =
  /android|iphone|ipad|ipod|iemobile|opera mini|mobile/i;

const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  const userAgent = window.navigator?.userAgent || "";
  return MOBILE_USER_AGENT_PATTERN.test(userAgent);
};

export const buildWhatsAppShareUrl = (text = "") => {
  const cleanText = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleanText) return "";

  const encodedText = encodeURIComponent(cleanText);

  if (isMobileDevice()) {
    return `whatsapp://send?text=${encodedText}`;
  }

  return `https://web.whatsapp.com/send?text=${encodedText}`;
};

export const openWhatsAppShare = (text = "") => {
  const shareUrl = buildWhatsAppShareUrl(text);
  if (!shareUrl || typeof window === "undefined") return;
  window.open(shareUrl, "_blank", "noopener,noreferrer");
};

export const buildFacebookShareUrl = (url = "", quote = "") => {
  const cleanUrl = String(url || "").trim();
  if (!cleanUrl) return "";

  const params = new URLSearchParams({ u: cleanUrl });
  const cleanQuote = String(quote || "").replace(/\s+/g, " ").trim();
  if (cleanQuote) params.set("quote", cleanQuote);

  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
};

export const openFacebookShare = (url = "", quote = "") => {
  const shareUrl = buildFacebookShareUrl(url, quote);
  if (!shareUrl || typeof window === "undefined") return;
  window.open(shareUrl, "_blank", "noopener,noreferrer");
};
