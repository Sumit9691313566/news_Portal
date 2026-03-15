import { useEffect, useState } from "react";
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

const categoryClass = (category) => {
  const key = (category || "").toLowerCase();
  if (key === "national") return "cat-national";
  if (key === "politics") return "cat-politics";
  if (key === "sports") return "cat-sports";
  if (key === "tech") return "cat-tech";
  if (key === "business") return "cat-business";
  if (key === "entertainment") return "cat-entertainment";
  if (key === "world") return "cat-world";
  if (key === "article") return "cat-article";
  return "cat-default";
};

export default function Videos() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="layout">
      <main className="content media-page videos-page">
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

        {!loading && videos.length === 0 && <p>No videos uploaded yet.</p>}

        <div className="media-grid">
          {videos.map((video) => (
            <div
              key={video.id || video._id}
              className="media-card"
              onClick={() => openVideo(video)}
            >
              <div className="media-thumb media-thumb-video">
                <video src={video.mediaUrl} muted preload="metadata" />
                <div className="play-badge">▶</div>
                <div className="video-story-overlay">
                  <h3
                    className={`video-story-title ${categoryClass(video.category)}`}
                  >
                    {video.title}
                  </h3>
                  <p className="video-story-summary">
                    {video.summary || "वीडियो समाचार"}
                  </p>
                  <small className="video-story-meta">
                    {formatTimeAgo(video.createdAt)}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
