const MOBILE_USER_AGENT_PATTERN =
  /android|iphone|ipad|ipod|iemobile|opera mini|mobile/i;

const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  const userAgent = window.navigator?.userAgent || "";
  return MOBILE_USER_AGENT_PATTERN.test(userAgent);
};

const decodeHtmlEntities = (value = "") => {
  const raw = String(value || "");
  if (typeof window !== "undefined" && window.document) {
    const textarea = window.document.createElement("textarea");
    textarea.innerHTML = raw;
    return textarea.value;
  }

  return raw
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
};

export const cleanShareText = (text = "") => {
  let cleanText = String(text || "");

  for (let i = 0; i < 2; i += 1) {
    cleanText = decodeHtmlEntities(cleanText);
  }

  return cleanText
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|blockquote|span)>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const buildWhatsAppShareUrl = (text = "") => {
  const cleanText = cleanShareText(text);
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
  const cleanQuote = cleanShareText(quote);
  if (cleanQuote) params.set("quote", cleanQuote);

  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
};

export const openFacebookShare = (url = "", quote = "") => {
  const shareUrl = buildFacebookShareUrl(url, quote);
  if (!shareUrl || typeof window === "undefined") return;
  window.open(shareUrl, "_blank", "noopener,noreferrer");
};

export const copyTextToClipboard = async (text = "") => {
  const cleanText = String(text || "").trim();
  if (!cleanText) return false;

  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(cleanText);
    return true;
  }

  const helperInput = document.createElement("textarea");
  helperInput.value = cleanText;
  helperInput.setAttribute("readonly", "");
  helperInput.style.position = "fixed";
  helperInput.style.top = "0";
  helperInput.style.left = "-9999px";
  helperInput.style.opacity = "0";
  document.body.appendChild(helperInput);
  helperInput.focus();
  helperInput.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(helperInput);
  }
};
