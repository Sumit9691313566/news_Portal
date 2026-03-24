import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/category.css";
import { fetchWithTimeout } from "../services/api";
import { fallbackVideos, normalizeVideosFromNews } from "../utils/videoFeed";

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

const toHindiCategory = (category) => {
  const key = String(category || "").trim().toLowerCase();
  if (key === "national") return "देश";
  if (key === "business") return "बिजनेस";
  if (key === "politics") return "राजनीति";
  if (key === "sports") return "खेल";
  if (key === "tech") return "टेक";
  if (key === "entertainment") return "मनोरंजन";
  if (key === "world") return "दुनिया";
  if (key === "article") return "आर्टिकल";
  return category || "वीडियो";
};

const categoryClass = (category) => {
  const key = String(category || "").trim().toLowerCase();
  if (key === "national") return "cat-national";
  if (key === "business") return "cat-business";
  if (key === "politics") return "cat-politics";
  if (key === "sports") return "cat-sports";
  if (key === "tech") return "cat-tech";
  if (key === "entertainment") return "cat-entertainment";
  if (key === "world") return "cat-world";
  if (key === "article") return "cat-article";
  return "cat-default";
};

export default function Videos() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  });

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
    const load = async () => {
      try {
        const res = await fetchWithTimeout("news");
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const videoItems = normalizeVideosFromNews(list);
        setVideos(videoItems.length > 0 ? videoItems : fallbackVideos);
      } catch (err) {
        console.error("Failed to load videos", err);
        setVideos(fallbackVideos);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const goBackSafe = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  const openVideo = (video) => {
    navigate(`/videos/${video.id || video._id}`, {
      replace: true,
      state: {
        videos,
        selectedVideoId: video.id || video._id,
        url: video.mediaUrl,
        title: video.title,
        summary: video.summary || "",
        category: video.category || "Article",
        createdAt: video.createdAt,
        newsId: video.newsId,
      },
    });
  };

  useLayoutEffect(() => {
    if (!isMobileView || loading || videos.length === 0) return;
    openVideo(videos[0]);
  }, [isMobileView, loading, videos]);

  if (isMobileView) {
    return null;
  }

  return (
    <div className="layout">
      <main className="content media-page videos-page videos-page-bhaskar">
        <div className="page-toolbar page-toolbar-videos">
          <button type="button" className="page-toolbar-btn" onClick={goBackSafe}>
            &larr; Back
          </button>
          <button
            type="button"
            className="page-toolbar-btn"
            onClick={() => navigate("/")}
          >
            Home
          </button>
        </div>

        {!loading && videos.length === 0 && (
          <div className="videos-empty-state">
            <h2>No videos uploaded yet.</h2>
            <p>Video news aate hi yahan 4-column layout mein dikhengi.</p>
          </div>
        )}

        <div className="media-grid">
          {videos.map((video) => (
            <article
              key={video.id || video._id}
              className="media-card video-news-card"
              onClick={() => openVideo(video)}
            >
              <div className="media-thumb media-thumb-video">
                <video
                  src={video.mediaUrl}
                  muted
                  autoPlay
                  loop
                  playsInline
                  preload="metadata"
                />
                <div className="video-thumb-shade" />
                <div className="play-badge">▶</div>
                <div className="video-title-overlay">
                  <h3 className={`video-thumb-title ${categoryClass(video.category)}`}>
                    {video.title}
                  </h3>
                  <div className="video-inline-meta">
                    <span className="video-inline-category">
                      {toHindiCategory(video.category)}
                    </span>
                    <span className="video-inline-time">
                      {formatTimeAgo(video.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
