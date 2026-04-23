const BLOCK_BREAK_TAGS = /<\/(p|div|li|h1|h2|h3|h4|h5|h6|blockquote)>/gi;
const BR_TAGS = /<br\s*\/?>/gi;
const ALL_TAGS = /<[^>]*>/g;
const TITLE_BLOCK_TAGS = /<\/?(p|div|h1|h2|h3|h4|h5|h6|blockquote|li|ul|ol)>/gi;

const FONT_SIZE_MAP = {
  "1": "10px",
  "2": "12px",
  "3": "14px",
  "4": "16px",
  "5": "18px",
  "6": "24px",
  "7": "32px",
};

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "span",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "a",
  "div",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
]);

const ALLOWED_STYLE_PROPS = new Set([
  "color",
  "background-color",
  "font-size",
  "font-weight",
  "font-style",
  "text-decoration",
  "text-align",
  "line-height",
  "margin-left",
  "border",
  "border-collapse",
  "padding",
  "width",
]);

const sanitizeStyle = (styleValue = "") =>
  styleValue
    .split(";")
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => {
      const idx = rule.indexOf(":");
      if (idx === -1) return "";
      const key = rule.slice(0, idx).trim().toLowerCase();
      const value = rule.slice(idx + 1).trim();
      if (!ALLOWED_STYLE_PROPS.has(key)) return "";
      if (!value || /url\s*\(/i.test(value)) return "";
      return `${key}: ${value}`;
    })
    .filter(Boolean)
    .join("; ");

const normalizeBlockAlignment = (tag, styleValue = "") => {
  if (!styleValue) return "";
  if (!["div", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) {
    return styleValue;
  }

  return styleValue
    .split(";")
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => {
      const idx = rule.indexOf(":");
      if (idx === -1) return rule;
      const key = rule.slice(0, idx).trim().toLowerCase();
      const value = rule.slice(idx + 1).trim().toLowerCase();
      if (key === "text-align" && value === "justify") {
        return "text-align: left";
      }
      return rule;
    })
    .join("; ");
};

const normalizeNode = (node) => {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
  const tag = node.tagName.toLowerCase();

  if (tag === "script" || tag === "style") {
    node.remove();
    return;
  }

  if (tag === "font") {
    const span = document.createElement("span");
    const mappedSize = FONT_SIZE_MAP[node.getAttribute("size") || ""];
    if (mappedSize) span.style.fontSize = mappedSize;
    const color = node.getAttribute("color");
    if (color) span.style.color = color;
    span.innerHTML = node.innerHTML;
    node.replaceWith(span);
    normalizeNode(span);
    return;
  }

  if (tag === "strike") {
    const strikeReplacement = document.createElement("s");
    strikeReplacement.innerHTML = node.innerHTML;
    node.replaceWith(strikeReplacement);
    normalizeNode(strikeReplacement);
    return;
  }

  const children = [...node.children];
  children.forEach(normalizeNode);

  if (!ALLOWED_TAGS.has(tag)) {
    const fragment = document.createDocumentFragment();
    while (node.firstChild) fragment.appendChild(node.firstChild);
    node.replaceWith(fragment);
    return;
  }

  [...node.attributes].forEach((attr) => {
    const name = attr.name.toLowerCase();
    if (name.startsWith("on")) {
      node.removeAttribute(attr.name);
      return;
    }

    if (name === "style") {
      const cleaned = normalizeBlockAlignment(tag, sanitizeStyle(attr.value));
      if (cleaned) node.setAttribute("style", cleaned);
      else node.removeAttribute("style");
      return;
    }

    if (tag === "a" && name === "href") {
      const value = (attr.value || "").trim();
      if (/^javascript:/i.test(value) || /^data:/i.test(value)) {
        node.removeAttribute("href");
      }
      return;
    }

    if (tag === "a" && (name === "target" || name === "rel")) return;

    node.removeAttribute(attr.name);
  });

  if (tag === "a" && node.getAttribute("href")) {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
};

const sanitizeWithDom = (html = "") => {
  if (typeof window === "undefined" || !window.document) return html || "";
  const container = document.createElement("div");
  container.innerHTML = html || "";
  [...container.children].forEach(normalizeNode);
  return container.innerHTML.trim();
};

export const sanitizeRichTextHtml = (html = "") => sanitizeWithDom(html);

const stripTitleSizeStyles = (html = "") => {
  if (typeof window === "undefined" || !window.document) {
    return String(html || "").replace(
      /style\s*=\s*"([^"]*)"/gi,
      (_match, styleValue) => {
        const cleaned = String(styleValue || "")
          .split(";")
          .map((rule) => rule.trim())
          .filter(Boolean)
          .filter((rule) => {
            const key = rule.split(":")[0]?.trim()?.toLowerCase();
            return key && key !== "font-size" && key !== "line-height";
          })
          .join("; ");

        return cleaned ? `style="${cleaned}"` : "";
      }
    );
  }

  const container = document.createElement("div");
  container.innerHTML = html || "";

  container.querySelectorAll("*").forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.style.removeProperty("font-size");
    node.style.removeProperty("line-height");
    if (!node.getAttribute("style")?.trim()) {
      node.removeAttribute("style");
    }
  });

  return container.innerHTML.trim();
};

const escapeHtml = (value = "") =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const sanitizeTitleHtml = (html = "") => {
  const sanitized = sanitizeRichTextHtml(html || "");
  const normalizedTitle = stripTitleSizeStyles(sanitized);
  return normalizedTitle
    .replace(BR_TAGS, " ")
    .replace(TITLE_BLOCK_TAGS, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const stripHtml = (html = "") =>
  (html || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(BR_TAGS, "\n")
    .replace(BLOCK_BREAK_TAGS, "\n")
    .replace(ALL_TAGS, " ")
    .replace(ALL_TAGS, " ")
    .replace(/\s+/g, " ")
    .trim();

export const getPlainTextTitle = (html = "") => stripHtml(sanitizeTitleHtml(html));

const isSafeColor = (value = "") =>
  /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(value || "").trim());

export const buildStyledTitleHtml = (html = "", titleColor = "") => {
  const safeTitleHtml = sanitizeTitleHtml(html);
  const fallbackText = escapeHtml(getPlainTextTitle(html));
  const safeColor = isSafeColor(titleColor) ? String(titleColor).trim() : "";
  const content = safeTitleHtml || fallbackText;

  if (!content) return "";
  if (!safeColor) return content;

  return `<span style="color: ${safeColor};">${content}</span>`;
};

export const countWordsFromHtml = (html = "") => {
  const text = stripHtml(html);
  if (!text) return 0;
  return text.split(/\s+/).length;
};
