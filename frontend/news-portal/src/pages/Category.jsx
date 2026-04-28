﻿import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FaFacebookF, FaLink, FaWhatsapp } from "react-icons/fa";
import SiteFooter from "../components/SiteFooter";
import "../styles/category.css";
import "../styles/userNews.css";
import brandLogo from "../../logo.png";
import { fetchWithTimeout } from "../services/api";
import { registerAndSubscribe } from "../services/push";
import { trackUniqueNewsView, trackVisit } from "../services/analytics";
import {
  buildStyledTitleHtml,
  getPlainTextTitle,
  sanitizeRichTextHtml,
  stripHtml,
} from "../utils/richText";
import { searchNews } from "../utils/searchNews";
import { getPublicSiteUrl } from "../utils/siteUrl";
import {
  CATEGORY_LIST,
  getCategoryLabel,
  getCategoryTitleColor,
  isHighlightedCategory,
  normalizeCategoryValue,
  resolveNewsCategory,
} from "../utils/categories";

const formatIssueDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const toIsoDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
};

const formatArticleDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const datePart = date.toLocaleDateString("hi-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("hi-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });

  return `${datePart}, ${timePart} बजे`;
};

const resolvePublicSiteUrl = () => {
  return getPublicSiteUrl();
};

export default function Category() {
  const navigate = useNavigate();
  const location = useLocation();
  const [allNews, setAllNews] = useState([]);
  const [newsError, setNewsError] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedNews, setSelectedNews] = useState(null);
  const [view, setView] = useState("home");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [trendWindow, setTrendWindow] = useState("all");

  /* extra states */
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(5);
  const [subscribeMessage, setSubscribeMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [fullscreenImage, setFullscreenImage] = useState("");
  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  });

  const scrollToNewsStart = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateUrlState = (
    { nextView = view, nextCategory = activeCategory, newsId = null, imageUrl = "" } = {},
    options = {}
  ) => {
    const params = new URLSearchParams(location.search);

    if (nextView && nextView !== "home") {
      params.set("view", nextView);
    } else {
      params.delete("view");
    }

    if (nextCategory && nextCategory !== "All") {
      params.set("cat", nextCategory);
    } else {
      params.delete("cat");
    }

    if (newsId) {
      params.set("newsId", newsId);
    } else {
      params.delete("newsId");
    }

    if (imageUrl) {
      params.set("image", imageUrl);
    } else {
      params.delete("image");
    }

    navigate(
      { pathname: "/", search: params.toString() },
      { replace: Boolean(options.replace), state: options.state }
    );
  };

  const openFullscreenImage = (imageUrl) => {
    if (!imageUrl) return;
    setFullscreenImage(imageUrl);
    updateUrlState(
      {
        nextView: view,
        nextCategory: activeCategory,
        newsId: selectedNews?._id || selectedNews?.id || null,
        imageUrl,
      },
      { replace: false }
    );
  };

  const closeFullscreenImage = () => {
    setFullscreenImage("");
    updateUrlState(
      {
        nextView: view,
        nextCategory: activeCategory,
        newsId: selectedNews?._id || selectedNews?.id || null,
        imageUrl: "",
      },
      { replace: true }
    );
  };

  /* ================= LOAD NEWS ================= */
  const loadNews = async () => {
    try {
      const res = await fetchWithTimeout("news");
      if (!res.ok) {
        throw new Error(`News API failed with status ${res.status}`);
      }
      const data = await res.json();

      const normalized = Array.isArray(data)
        ? data.map((n) => {
            const blocks = Array.isArray(n.blocks) ? n.blocks : [];
            const firstMedia = blocks.find(
              (b) => (b.type === "image" || b.type === "video") && b.url
            );

            const textContent =
              blocks.length > 0
                ? blocks
                    .filter((b) => b.type === "text" && b.text)
                    .map((b) => stripHtml(b.text))
                    .filter(Boolean)
                    .join("\n\n")
                : n.content;

            const mediaType = firstMedia
              ? firstMedia.type
              : n.mediaUrl && n.mediaUrl.trim() !== ""
              ? n.mediaType
              : "text";

            const mediaUrl = firstMedia
              ? firstMedia.url
              : n.mediaUrl && n.mediaUrl.trim() !== ""
              ? n.mediaUrl
              : null;

            return {
              _id: n._id,
              title: n.title,
              content: textContent,
              location: n.location || "",
              category: resolveNewsCategory({
                title: n.title,
                content: textContent,
                category: n.category || "All",
              }),
              mediaType,
              mediaUrl,
              blocks,
              createdAt: n.createdAt,
              author: n.author || "Admin",
              breaking: n.breaking || false,
              featured: n.featured || false,
              views: n.views || 0,
              firstPublishedAt: n.firstPublishedAt || null,
              updatedAt: n.contentUpdatedAt || null,
            };
          })
        : [];

      setNewsError("");
      setAllNews(normalized);
    } catch (err) {
      console.error("Failed to load news", err);
      setNewsError("Backend se news load nahi ho pa rahi. Backend restart hone ke baad kuch seconds wait karke refresh karo.");
      setAllNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
    trackVisit().catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const updateViewportState = (event) => {
      setIsMobileView(event.matches);
    };

    setIsMobileView(mediaQuery.matches);
    mediaQuery.addEventListener("change", updateViewportState);

    return () => {
      mediaQuery.removeEventListener("change", updateViewportState);
    };
  }, []);

  useEffect(() => {
    if (!fullscreenImage || typeof window === "undefined") return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeFullscreenImage();
      }
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fullscreenImage]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const nextView = params.get("view") || "home";
    const nextCategory = params.get("cat") || "All";
    const nextImage = params.get("image") || "";
    if (nextView === "video") {
      navigate("/videos", { replace: true });
      return;
    }
    setView(nextView);
    setActiveCategory(nextCategory);
    setFullscreenImage(nextImage);
  }, [location.search, navigate]);

  const syncUrlState = (nextView, nextCategory, options = {}) => {
    if (nextView === "video") {
      navigate("/videos");
      return;
    }
    updateUrlState(
      {
        nextView,
        nextCategory,
        newsId: options.newsId ?? null,
        imageUrl: options.imageUrl ?? "",
      },
      { replace: Boolean(options.replace) }
    );
  };

  /* ================= FILTER ================= */
  const normalizedActiveCategory = normalizeCategoryValue(activeCategory);

  const filteredNews =
    normalizedActiveCategory === "All"
      ? allNews
      : allNews.filter(
          (n) =>
            normalizeCategoryValue(n.category) &&
            normalizeCategoryValue(n.category).toLowerCase() ===
              normalizedActiveCategory.toLowerCase()
        );

  const videoNews = allNews.filter((n) => n.mediaType === "video");
  const mobileVideoFeed = videoNews.map((news) => ({
    id: news._id || news.id,
    _id: news._id || news.id,
    mediaUrl: news.mediaUrl,
    title: news.title,
    summary: news.content || "",
    category: getCategoryLabel(news.category),
    createdAt: news.createdAt,
    newsId: news._id || news.id,
  }));
  const searchResults = searchNews(allNews, searchTerm);


  // remove the old "most read" concept entirely; trending is driven by views
  const mostViewedNews = [...allNews].sort(
    (a, b) => (b.views || 0) - (a.views || 0)
  );
  const hasViews = mostViewedNews.some((n) => (n.views || 0) > 0);
  const mostViewed24h = mostViewedNews.filter((n) => {
    const age = Date.now() - new Date(n.createdAt).getTime();
    return age <= 24 * 60 * 60 * 1000;
  });
  const mostViewed7d = mostViewedNews.filter((n) => {
    const age = Date.now() - new Date(n.createdAt).getTime();
    return age <= 7 * 24 * 60 * 60 * 1000;
  });

  // only include items with a minimum number of views so the tab appears when a story is truly popular
  const VIEW_THRESHOLD = 3;
  const trendingList =
    trendWindow === "24h"
      ? mostViewed24h
      : trendWindow === "7d"
      ? mostViewed7d
      : mostViewedNews;
  const filteredTrendingList = trendingList.filter((n) => (n.views || 0) >= VIEW_THRESHOLD);
  const trendingExist = filteredTrendingList.length > 0;
  // button should remain visible if any time window has content
  const trendingAvailable = mostViewedNews.some((n) => (n.views || 0) >= VIEW_THRESHOLD);

  const randomRelatedNews = selectedNews
    ? [...allNews]
        .filter((n) => n._id !== selectedNews._id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 6)
    : [];

  const openNews = (news) => {
    setSelectedNews(news);
    scrollToNewsStart();
    updateUrlState({
      nextView: view,
      nextCategory: activeCategory,
      newsId: news?._id || news?.id || null,
      imageUrl: "",
    });
    if (!news?._id) return;
    trackVisit({ markAsReader: true }).catch(() => {});
    trackUniqueNewsView(news._id).then((result) => {
      if (!result?.unique) return;
      setAllNews((prev) =>
        prev.map((n) =>
          n._id === news._id ? { ...n, views: result.views ?? (n.views || 0) + 1 } : n
        )
      );
    });
  };

  const getNewsShareUrl = (news) => {
    const newsId = news?._id || news?.id;
    if (!newsId || typeof window === "undefined") return "";

    const shareUrl = new URL("/", getPublicSiteUrl());
    shareUrl.searchParams.set("newsId", newsId);
    return shareUrl.toString();
  };

  const getNewsShareText = (news) => {
    const title = String(news?.title || "Latest news");
    const shareUrl = getNewsShareUrl(news);
    return `${title} | गरुड़ समाचार ${shareUrl}`.trim();
  };

  const showShareMessage = (message) => {
    setShareMessage(message);
    window.setTimeout(() => setShareMessage(""), 2200);
  };

  const copyNewsLink = async (news) => {
    const shareUrl = getNewsShareUrl(news);
    if (!shareUrl) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const helperInput = document.createElement("input");
        helperInput.value = shareUrl;
        document.body.appendChild(helperInput);
        helperInput.select();
        document.execCommand("copy");
        document.body.removeChild(helperInput);
      }
      showShareMessage("News link copied");
    } catch {
      showShareMessage("Link copy nahi ho paya");
    }
  };

  const shareToWhatsApp = (news) => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      getNewsShareText(news)
    )}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const shareToFacebook = (news) => {
    const shareUrl = getNewsShareUrl(news);
    if (!shareUrl) return;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl
    )}`;
    window.open(facebookUrl, "_blank", "noopener,noreferrer");
  };

  const renderShareActions = (news) => (
    <div className="share-actions share-actions-card">
      <button
        type="button"
        className="share-btn share-btn-whatsapp"
        aria-label="Share on WhatsApp"
        title="Share on WhatsApp"
        onClick={(event) => {
          event.stopPropagation();
          shareToWhatsApp(news);
        }}
      >
        <FaWhatsapp />
      </button>
      <button
        type="button"
        className="share-btn share-btn-facebook"
        aria-label="Share on Facebook"
        title="Share on Facebook"
        onClick={(event) => {
          event.stopPropagation();
          shareToFacebook(news);
        }}
      >
        <FaFacebookF />
      </button>
      <button
        type="button"
        className="share-btn share-btn-copy"
        aria-label="Copy news link"
        title="Copy news link"
        onClick={(event) => {
          event.stopPropagation();
          copyNewsLink(news);
        }}
      >
        <FaLink />
      </button>
    </div>
  );

  const isNewsDetailView =
    isMobileView &&
    Boolean(selectedNews) &&
    view !== "video";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedId = location.state?.openNewsId || params.get("newsId");
    if (!requestedId) {
      setSelectedNews(null);
      return;
    }
    if (allNews.length === 0) return;

    const matched = allNews.find(
      (n) => n._id === requestedId || n.id === requestedId
    );
    if (!matched) {
      setSelectedNews(null);
      return;
    }

    setSelectedNews(matched);
    scrollToNewsStart();
  }, [allNews, location.search, location.state]);

  const categoryClass = (category) => {
    const key = normalizeCategoryValue(category || "");
    if (key === "अपराध") return "cat-apraadh";
    if (key === "संघर्ष से शिखर") return "cat-sangharsh";
    if (key === "भ्रष्टाचार") return "cat-bhrashtachar";
    if (key === "देश / विदेश") return "cat-desh-videsh";
    if (key === "रियल हीरो") return "cat-real-hero";
    if (key === "गरुड़ विशेष") return "cat-garud-vishesh";
    if (key === "सतर्क") return "cat-satark";
    if (key === "ज्योतिषी") return "cat-jyotishi";
    if (key === "आत्म वाणी") return "cat-aatm-vani";
    return "cat-default";
  };
  const breakingNews = allNews.filter((n) => n.breaking);
  const featuredNews = allNews.find((n) => n.featured);
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formatTimeAgo = (date) => {
    if (!date) return "अभी";
    const now = Date.now();
    const diffMs = now - new Date(date).getTime();
    if (Number.isNaN(diffMs) || diffMs < 0) return "अभी";
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 60) return `${mins || 1} मिनट पहले`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} घंटे पहले`;
    const days = Math.floor(hours / 24);
    return `${days} दिन पहले`;
  };
  const navCategories = CATEGORY_LIST.map((item) => item.label);

  const mobileActionsBase = [
    { key: "home", label: "🏠 होम", view: "home" },
    { key: "video", label: "▶️ वीडियो", view: "video" },
    { key: "search", label: "🔍 सर्च", view: "search" },
    { key: "user-news", label: "📨 खबर भेजें", view: "user-news" },
  ];
  const mobileActions = trendingAvailable
    ? [...mobileActionsBase, { key: "trending", label: "🔥 ट्रेंडिंग", view: "trending" }]
    : mobileActionsBase;

  const handleViewChange = (nextView) => {
    // don't allow navigating to trending if there's nothing worthy yet
    if (nextView === "trending" && !trendingAvailable) {
      return;
    }

    if (nextView === "user-news") {
      navigate("/send-news");
      return;
    }

    if (nextView === "video" && isMobileView) {
      const firstVideo = mobileVideoFeed[0];
      if (!firstVideo) {
        navigate("/videos");
        return;
      }

      navigate(`/videos/${firstVideo.id || firstVideo._id}`, {
        state: {
          videos: mobileVideoFeed,
          selectedVideoId: firstVideo.id || firstVideo._id,
          url: firstVideo.mediaUrl,
          title: firstVideo.title,
          summary: firstVideo.summary || "",
          category: getCategoryLabel(firstVideo.category),
          createdAt: firstVideo.createdAt,
          newsId: firstVideo.newsId,
        },
      });
      return;
    }

    setSelectedNews(null);
    setView(nextView);
    if (nextView === "home") {
      setActiveCategory("All");
      syncUrlState("home", "All");
      return;
    }
    syncUrlState(nextView, activeCategory);
  };

  /* ===== ORIGINAL suggestedNews (UNCHANGED) ===== */
  const suggestedNews = allNews
    .filter((n) => (selectedNews ? n._id !== selectedNews._id : true))
    .slice(0, 6);

  /* =====================================================
     OPTION A : RELATED NEWS BY CATEGORY (ADD ONLY)
     ===================================================== */

  const isReadingNews = Boolean(selectedNews);

  // Home page -> random suggestions
  const randomSuggestions = [...suggestedNews].sort(
    () => 0.5 - Math.random()
  );

  // Reading page -> same category suggestions
  const categoryBasedSuggestions = selectedNews
    ? allNews.filter(
        (n) =>
          n.category === selectedNews.category &&
          n._id !== selectedNews._id
      )
    : [];

  // Final right rail data
  const rightRailSuggestions = isReadingNews
    ? categoryBasedSuggestions.slice(0, 6)
    : randomSuggestions.slice(0, 6);
  const hasLeadMediaInBlocks = Boolean(
    selectedNews?.blocks?.some(
      (b) => (b.type === "image" || b.type === "video") && b.url
    )
  );

  const renderStyledTitle = (title, titleColor, category = "All") => ({
    __html:
      buildStyledTitleHtml(
        title,
        titleColor,
        getCategoryTitleColor(category)
      ) || getPlainTextTitle(title),
  });

  const renderHelmet = () => {
    const siteName = "Garud Samachar";
    const siteUrl = resolvePublicSiteUrl();
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "NewsMediaOrganization",
      name: siteName,
      alternateName: "गरुड़ समाचार",
      url: `${siteUrl}/`,
      logo: `${siteUrl}/logo.jpeg`,
    };

    if (selectedNews) {
      const newsUrl = getNewsShareUrl(selectedNews);
      const description = stripHtml(selectedNews.content || "").substring(0, 160);
      const publishedIso = toIsoDate(
        selectedNews.firstPublishedAt || selectedNews.createdAt
      );
      const modifiedIso = toIsoDate(
        selectedNews.updatedAt || selectedNews.createdAt
      );
      const articleSchema = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: getPlainTextTitle(selectedNews.title),
        description,
        url: newsUrl,
        mainEntityOfPage: newsUrl,
        datePublished: publishedIso,
        dateModified: modifiedIso,
        author: {
          "@type": "Person",
          name: selectedNews.author || selectedNews.createdByName || "Garud Samachar",
        },
        publisher: {
          "@type": "NewsMediaOrganization",
          name: siteName,
          url: `${siteUrl}/`,
        },
        image: selectedNews.mediaUrl
          ? [selectedNews.mediaUrl]
          : [`${siteUrl}/logo.jpeg`],
        articleSection: selectedNews.category || "News",
        inLanguage: "hi-IN",
      };
      return (
        <Helmet>
          <title>{`${getPlainTextTitle(selectedNews.title)} | ${siteName}`}</title>
          <link rel="canonical" href={newsUrl} />
          <meta name="description" content={description} />
          <meta name="robots" content="index, follow, max-image-preview:large" />
          <meta property="og:title" content={getPlainTextTitle(selectedNews.title)} />
          <meta property="og:description" content={description} />
          <meta property="og:url" content={newsUrl} />
          <meta property="og:image" content={selectedNews.mediaUrl || `${siteUrl}/logo.jpeg`} />
          <meta property="og:type" content="article" />
          <meta property="article:published_time" content={publishedIso} />
          <meta property="article:modified_time" content={modifiedIso} />
          <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
          <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        </Helmet>
      );
    }

      const pageTitle =
          activeCategory === "All"
            ? "Hindi News, Hindi Samachar & Breaking News"
            : `${getCategoryLabel(activeCategory)} News | Hindi Samachar`;
    const description =
      activeCategory === "All"
        ? `${siteName} (गरुड़ समाचार) par padhiye Hindi News, Hindi Samachar, breaking news, आज की ताजा खबर, crime news, desh videsh aur taaza Hindi khabrein.`
        : `${siteName} par ${getCategoryLabel(activeCategory)} se judi Hindi News, Hindi Samachar, breaking updates aur taaza khabrein padhiye.`;
    const keywords = `Garud Samachar, गरुड़ समाचार, Hindi News, Hindi Samachar, हिंदी समाचार, हिंदी न्यूज़, हिंदी न्यूज, Latest Hindi News, Breaking News, आज की ताजा खबर, Taza Khabar, ${getCategoryLabel(activeCategory)} News, ${getCategoryLabel(activeCategory)} Hindi News, India News in Hindi`;
    const pageUrl =
      activeCategory === "All"
        ? `${siteUrl}/`
        : `${siteUrl}/?cat=${encodeURIComponent(activeCategory)}`;
    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: filteredNews.slice(0, 20).map((news, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: getNewsShareUrl(news),
        name: getPlainTextTitle(news.title),
      })),
    };

    return (
      <Helmet>
        <title>{`${siteName} | ${pageTitle}`}</title>
        <link rel="canonical" href={pageUrl} />
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta property="og:title" content={`${siteName} | ${pageTitle}`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
      </Helmet>
    );
  };

  return (
    <div className="layout-wrapper">
      {!isNewsDetailView && (
        <>
          <header className="masthead">
            <div className="top-strip">
              <div className="top-left">
                <span className="pill live">LIVE</span>
                <span className="date">{todayLabel}</span>
              </div>
              <div className="top-right">
                <span className="edition">Morning Edition</span>
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    className="subscribe-btn"
                    onClick={async () => {
                      try {
                        await registerAndSubscribe();
                        setSubscribeMessage("Notifications enabled");
                      } catch (error) {
                        setSubscribeMessage(
                          error?.message || "Notification enable nahi ho paaya"
                        );
                      }
                      window.setTimeout(() => setSubscribeMessage(""), 2600);
                    }}
                  >
                    Subscribe
                  </button>
                  {subscribeMessage && (
                    <div className="subscribe-toast">{subscribeMessage}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="brand-row">
              <div className="brand">
                <img className="brand-logo" src={brandLogo} alt="Garud Samachar logo" />
                <span className="brand-title-hindi">गरुड़ समाचार</span>
              </div>

              <div className="nav-row nav-row-inline">
                {navCategories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`nav-item ${
                      activeCategory === item ? "nav-item-active" : ""
                    } ${
                      isHighlightedCategory(item) ? "nav-item-priority" : ""
                    }`}
                    onClick={() => {
                      setSelectedNews(null);
                      setView("home");
                      setActiveCategory(item);
                      syncUrlState("home", item);
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {breakingNews.length > 0 && (
            <div className="breaking-bar">
              <span>BREAKING</span>
              <div className="breaking-ticker">
                <div className="breaking-track">
                  {breakingNews.map((n) => (
                    <button
                      key={n._id || n.id}
                      type="button"
                      className="breaking-item"
                      onClick={() => openNews(n)}
                    >
                      {n.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="layout">
        {/* SEO Meta Tags */}
        {renderHelmet()}
        {/* ===== SIDEBAR ===== */}
        {!isNewsDetailView && (
          <aside className="sidebar">
            <ul className="menu">
              <li
                onClick={() => handleViewChange("home")}
              >
                🏠 होम
              </li>
              <li
                onClick={() => handleViewChange("video")}
              >
                ▶️ वीडियो
              </li>
              <li
                onClick={() => handleViewChange("search")}
              >
                🔍 सर्च
              </li>
              <li
                className="menu-item-highlight menu-item-highlight-news"
                onClick={() => handleViewChange("user-news")}
              >
                📨 खबर भेजें
              </li>
              {trendingAvailable && (
                <li
                  className="menu-item-highlight menu-item-highlight-trending"
                  onClick={() => handleViewChange("trending")}
                >
                  🔥 ट्रेंडिंग
                </li>
              )}
            </ul>
          </aside>
        )}

        {/* ===== MAIN CONTENT ===== */}
        <main className="content">
        {!isNewsDetailView && (
          <div className="mobile-header">
            <div className="mobile-nav-row">
              {mobileActions.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`mobile-nav-btn ${
                    view === item.view ? "mobile-nav-btn-active" : ""
                  }`}
                  onClick={() => handleViewChange(item.view)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          className={`content-grid ${
            view === "video" || view === "search"
              ? "content-grid-reading"
              : ""
          }`}
        >
          <div className="main-column">
            {shareMessage && <div className="share-toast">{shareMessage}</div>}
            {view === "home" && !selectedNews && (
              <>
                {featuredNews && (
                  <div
                    className="featured"
                    onClick={() => openNews(featuredNews)}
                  >
                    {featuredNews.mediaUrl && (
                      <img
                        src={featuredNews.mediaUrl}
                        alt={getPlainTextTitle(featuredNews.title) || "featured"}
                        onClick={(event) => {
                          event.stopPropagation();
                          openNews(featuredNews);
                        }}
                      />
                    )}
                    {featuredNews.featured && (
                      <span className="badge featured featured-tag">
                        FEATURED
                      </span>
                    )}
                    <div className="featured-info">
                      <span>{featuredNews.category}</span>
                      <div
                        className={categoryClass(featuredNews.category)}
                        dangerouslySetInnerHTML={renderStyledTitle(
                          featuredNews.title,
                          featuredNews.titleColor,
                          featuredNews.category
                        )}
                      />
                    </div>
                  </div>
                )}

                <div className="news-list">
                  {!loading && newsError && (
                    <p className="empty-state">{newsError}</p>
                  )}
                  {!loading && !newsError && filteredNews.length === 0 && (
                    <p className="empty-state">
                      इस कैटेगरी में अभी कोई खबर नहीं है।
                    </p>
                  )}
                  {loading
                    ? [...Array(3)].map((_, i) => (
                        <div key={i} className="news-card skeleton"></div>
                      ))
                    : filteredNews
                        .slice(0, visibleCount)
                        .map((news) => (
                          <div
                            key={news._id || news.id}
                            className="news-card"
                            onClick={() => openNews(news)}
                          >
                            {news.mediaType !== "text" &&
                              news.mediaUrl && (
                                <>
                                  {news.mediaType === "image" && (
                                    <img
                                      src={news.mediaUrl}
                                      alt={getPlainTextTitle(news.title)}
                                      className="news-thumb"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openNews(news);
                                      }}
                                    />
                                  )}
                                  {news.mediaType === "video" && (
                                    <video
                                      src={news.mediaUrl}
                                      className="news-thumb"
                                      muted
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openNews(news);
                                      }}
                                    />
                                  )}
                                </>
                              )}

                            <div className="news-info">
                              <div className="news-badges">
                                {news.breaking && (
                                  <span className="badge breaking">
                                    BREAKING
                                  </span>
                                )}
                                {news.featured && (
                                  <span className="badge featured">
                                    FEATURED
                                  </span>
                                )}
                              </div>

                              <div
                                className={categoryClass(news.category)}
                                dangerouslySetInnerHTML={renderStyledTitle(
                                  news.title,
                                  news.titleColor,
                                  news.category
                                )}
                              />
                              <p>
                                {news.content?.slice(0, 120)}...
                              </p>
                              {renderShareActions(news)}
                            </div>
                          </div>
                        ))}
                </div>

                {visibleCount < filteredNews.length && !loading && (
                  <button
                    className="load-more"
                    onClick={() =>
                      setVisibleCount((v) => v + 5)
                    }
                  >
                    और लोड करें
                  </button>
                )}
              </>
            )}

            {view === "video" && (
              <>
                {videoNews.length === 0 && <p>No videos uploaded yet.</p>}
                <div className="media-grid">
                  {videoNews.map((news) => (
                    <div
                      key={news._id || news.id}
                      className="media-card home-video-card"
                      onClick={() =>
                        navigate(`/videos/${news._id || news.id}`, {
                          state: {
                            url: news.mediaUrl,
                            title: getPlainTextTitle(news.title),
                            summary: news.content || "",
                            category: getCategoryLabel(news.category),
                            createdAt: news.createdAt,
                            newsId: news._id || news.id,
                          },
                        })
                      }
                    >
                      {news.mediaUrl && (
                        <div className="media-thumb media-thumb-video">
                          <video
                            src={news.mediaUrl}
                            muted
                            autoPlay
                            loop
                            playsInline
                            preload="metadata"
                          />
                          <div className="play-badge">▶</div>
                          <div className="video-story-overlay">
                            <h3
                              className={`video-story-title ${categoryClass(
                                news.category
                              )}`}
                            >
                              <span
                                dangerouslySetInnerHTML={renderStyledTitle(
                                  news.title,
                                  news.titleColor,
                                  news.category
                                )}
                              />
                            </h3>
                            <p className="video-story-summary">
                              {news.content || "वीडियो समाचार"}
                            </p>
                            <small className="video-story-meta">
                              {formatTimeAgo(news.createdAt)}
                            </small>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {view === "search" && !selectedNews && (
              <>
                <h2>Search News</h2>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by news title, keyword, or category..."
                  value={searchTerm}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setSearchTerm(nextValue);
                    setSearchSubmitted(Boolean(nextValue.trim()));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setSearchSubmitted(true);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setSearchSubmitted(true)}
                >
                  Search
                </button>

                <div className="news-list">
                  {!searchSubmitted && <div />}
                  {searchSubmitted && searchResults.length === 0 && (
                    <p>No matching news found. Try any word from the news title or content.</p>
                  )}
                  {searchSubmitted &&
                    searchResults.map((news) => (
                      <div
                        key={news._id || news.id}
                        className="news-card"
                        onClick={() => openNews(news)}
                      >
                        {news.mediaType !== "text" && news.mediaUrl && (
                          <>
                            {news.mediaType === "image" && (
                              <img
                                src={news.mediaUrl}
                                alt={getPlainTextTitle(news.title)}
                                className="news-thumb"
                              />
                            )}
                            {news.mediaType === "video" && (
                              <video
                                src={news.mediaUrl}
                                className="news-thumb"
                                muted
                              />
                            )}
                          </>
                        )}
                        <div className="news-info">
                          <div
                            className={categoryClass(news.category)}
                            dangerouslySetInnerHTML={renderStyledTitle(
                              news.title,
                              news.titleColor,
                              news.category
                            )}
                          />
                          <p>{news.content?.slice(0, 120)}...</p>
                          {renderShareActions(news)}
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}

            {view === "trending" && !selectedNews && (
              <>
                <div className="trend-head">
                  <h2>Trending News</h2>
                  <div className="trend-tabs">
                    <button
                      type="button"
                      className={`trend-tab ${trendWindow === "all" ? "active" : ""}`}
                      onClick={() => setTrendWindow("all")}
                    >
                      All Time
                    </button>
                    <button
                      type="button"
                      className={`trend-tab ${trendWindow === "24h" ? "active" : ""}`}
                      onClick={() => setTrendWindow("24h")}
                    >
                      24h
                    </button>
                    <button
                      type="button"
                      className={`trend-tab ${trendWindow === "7d" ? "active" : ""}`}
                      onClick={() => setTrendWindow("7d")}
                    >
                      7 days
                    </button>
                  </div>
                </div>
                <div className="news-list">
                  {filteredTrendingList.length > 0 ? (
                    filteredTrendingList.slice(0, 6).map((news) => (
                      <div
                        key={news._id || news.id}
                        className="news-card"
                        onClick={() => openNews(news)}
                      >
                        {news.mediaType !== "text" && news.mediaUrl && (
                          <>
                            {news.mediaType === "image" && (
                              <img
                                src={news.mediaUrl}
                                alt={getPlainTextTitle(news.title)}
                                className="news-thumb"
                              />
                            )}
                            {news.mediaType === "video" && (
                              <video
                                src={news.mediaUrl}
                                className="news-thumb"
                                muted
                              />
                            )}
                          </>
                        )}
                        <div className="news-info">
                          <div
                            className={categoryClass(news.category)}
                            dangerouslySetInnerHTML={renderStyledTitle(
                              news.title,
                              news.titleColor,
                              news.category
                            )}
                          />
                          <p>{news.content?.slice(0, 120)}...</p>
                          <small className="views-count">
                            {news.views || 0} views
                          </small>
                          {renderShareActions(news)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ padding: "20px", textAlign: "center" }}>
                      कोई ट्रेंडिंग समाचार उपलब्ध नहीं है।
                    </p>
                  )}
                </div>
              </>
            )}

            {view !== "video" && selectedNews && (
              <div className="news-full">
                <button
                  className="back-btn"
                  onClick={() => syncUrlState(view, activeCategory)}
                >
                  {"← वापस"}
                </button>

                <div
                  className={categoryClass(selectedNews.category)}
                  dangerouslySetInnerHTML={renderStyledTitle(
                    selectedNews.title,
                    selectedNews.titleColor,
                    selectedNews.category
                  )}
                />
                <div className="news-dates">
                  <small>
                    प्रकाशित:{" "}
                    <time
                      dateTime={toIsoDate(
                        selectedNews.firstPublishedAt || selectedNews.createdAt
                      )}
                    >
                      {formatArticleDateTime(
                        selectedNews.firstPublishedAt || selectedNews.createdAt
                      )}
                    </time>
                  </small>
                </div>
                {selectedNews.location && (
                  <div className="news-location">{selectedNews.location}</div>
                )}
                {renderShareActions(selectedNews)}

                {!hasLeadMediaInBlocks &&
                  selectedNews.mediaUrl &&
                  selectedNews.mediaType === "image" && (
                    <img
                      src={selectedNews.mediaUrl}
                      alt={getPlainTextTitle(selectedNews.title)}
                      className="news-lead-image"
                      onClick={() => openFullscreenImage(selectedNews.mediaUrl)}
                    />
                  )}

                {!hasLeadMediaInBlocks &&
                  selectedNews.mediaUrl &&
                  selectedNews.mediaType === "video" && (
                    <div
                      className="news-lead-video-wrap clickable-video-preview"
                      onClick={() =>
                        navigate(`/videos/${selectedNews._id || selectedNews.id}`, {
                          state: {
                            url: selectedNews.mediaUrl,
                            title: getPlainTextTitle(selectedNews.title),
                            summary: selectedNews.content || "",
                            category: getCategoryLabel(selectedNews.category),
                            createdAt: selectedNews.createdAt,
                            newsId: selectedNews._id || selectedNews.id,
                          },
                        })
                      }
                    >
                      <video
                        src={selectedNews.mediaUrl}
                        muted
                        autoPlay
                        loop
                        playsInline
                        preload="metadata"
                        className="news-lead-video"
                      />
                    </div>
                  )}

                {selectedNews.blocks &&
                selectedNews.blocks.length > 0 ? (
                  <div className="full-content">
                    {selectedNews.blocks.map((b, i) => (
                      <div key={i} className="content-block">
                        {b.type === "text" && (
                          <div
                            className="rich-output"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeRichTextHtml(b.text),
                            }}
                          />
                        )}
                        {b.type === "image" && b.url && (
                          <img
                            src={b.url}
                            alt=""
                            className="full-image"
                            onClick={() => openFullscreenImage(b.url)}
                          />
                        )}
                        {b.type === "video" && b.url && (
                          <div
                            className="full-video-wrap clickable-video-preview"
                            onClick={() =>
                              navigate(`/videos/${selectedNews._id || selectedNews.id}`, {
                                state: {
                                  url: b.url,
                                  title: getPlainTextTitle(selectedNews.title),
                                  summary: selectedNews.content || "",
                                  category: getCategoryLabel(selectedNews.category),
                                  createdAt: selectedNews.createdAt,
                                  newsId: selectedNews._id || selectedNews.id,
                                },
                              })
                            }
                          >
                            <video
                              src={b.url}
                              muted
                              autoPlay
                              loop
                              playsInline
                              preload="metadata"
                              className="full-video"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="full-content rich-output"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeRichTextHtml(selectedNews.content),
                    }}
                  />
                )}

                <div className="more-news">
                  <h3>खबरें और भी हैं...</h3>
                  <div className="more-news-grid">
                    {randomRelatedNews.map((news) => (
                      <div
                        key={news._id || news.id}
                        className="more-news-card"
                        onClick={() => openNews(news)}
                      >
                        {news.mediaType !== "text" && news.mediaUrl && (
                          <>
                            {news.mediaType === "image" && (
                              <img
                                src={news.mediaUrl}
                                alt={getPlainTextTitle(news.title)}
                              />
                            )}
                            {news.mediaType === "video" && (
                              <video
                                src={news.mediaUrl}
                                muted
                              />
                            )}
                          </>
                        )}
                        <div className="more-news-info">
                          <div
                            className={categoryClass(news.category)}
                            dangerouslySetInnerHTML={renderStyledTitle(
                              news.title,
                              news.titleColor,
                              news.category
                            )}
                          />
                          <p>{news.content?.slice(0, 90)}...</p>
                          {renderShareActions(news)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              width: "1px",
              height: "1px",
              padding: 0,
              margin: "-1px",
              overflow: "hidden",
              clip: "rect(0, 0, 0, 0)",
              whiteSpace: "nowrap",
              border: 0,
            }}
          >
            {allNews.slice(0, 100).map((news) => (
              <a
                key={`crawl-link-${news._id || news.id}`}
                href={getNewsShareUrl(news)}
              >
                {getPlainTextTitle(news.title)}
              </a>
            ))}
          </div>

          {/* ===== RIGHT RAIL ===== */}
          {view !== "video" &&
            view !== "search" && (
            <aside className="right-rail">
              <div className="suggest-card">
                <h3>
                  {isReadingNews
                    ? "संबंधित खबरें"
                    : "अन्य खबरें"}
                </h3>

                <div className="suggest-scroll" aria-label="Scrolling news suggestions">
                  <div className="suggest-scroll-track">
                    {[...rightRailSuggestions, ...rightRailSuggestions].map((n, index) => (
                      <div
                        key={`${n._id || n.id}-${index}`}
                        className="suggest-item"
                        aria-hidden={index >= rightRailSuggestions.length ? "true" : undefined}
                        onClick={() => openNews(n)}
                      >
                        {n.mediaUrl ? (
                          <img
                            src={n.mediaUrl}
                            alt={getPlainTextTitle(n.title)}
                            className="suggest-thumb"
                          />
                        ) : (
                          <div className="suggest-thumb suggest-thumb-placeholder" />
                        )}

                        <div>
                          <div className="news-badges">
                            {n.breaking && (
                              <span className="badge breaking">
                                BREAKING
                              </span>
                            )}
                            {n.featured && (
                              <span className="badge featured">
                                FEATURED
                              </span>
                            )}
                          </div>

                          <p
                            className={categoryClass(n.category)}
                            dangerouslySetInnerHTML={renderStyledTitle(
                              n.title,
                              n.titleColor,
                              n.category
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </aside>
          )}
        </div>
      </main>

      {fullscreenImage && (
        <div
          className="image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Full screen image preview"
          onClick={closeFullscreenImage}
        >
          <button
            type="button"
            className="image-lightbox-close"
            onClick={closeFullscreenImage}
          >
            ×
          </button>
          <img
            src={fullscreenImage}
            alt="Full size news"
            className="image-lightbox-media"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
      </div>

      <SiteFooter />
    </div>
  );
}
