import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logoMark from "../logo.png";
import "../styles/category.css";
import { fetchWithTimeout } from "../services/api";

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

  const fallbackVideos = [
    {
      id: "fallback-1",
      title: "डेमो वीडियो 1",
      summary: "यह डेमो वीडियो कार्ड लेआउट है।",
      category: "Article",
      mediaUrl:
        "https://images.unsplash.com/photo-1518770660439-4636190af475",
      mediaType: "video",
      createdAt: new Date().toISOString(),
    },
    {
      id: "fallback-2",
      title: "डेमो वीडियो 2",
      summary: "यह डेमो वीडियो कार्ड लेआउट है।",
      category: "Article",
      mediaUrl:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
      mediaType: "video",
      createdAt: new Date().toISOString(),
    },
    {
      id: "fallback-3",
      title: "डेमो वीडियो 3",
      summary: "यह डेमो वीडियो कार्ड लेआउट है।",
      category: "Article",
      mediaUrl:
        "https://images.unsplash.com/photo-1522199710521-72d69614c702",
      mediaType: "video",
      createdAt: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithTimeout("news");
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];

        const videoItems = list.flatMap((n) => {
          const blocks = Array.isArray(n.blocks) ? n.blocks : [];
          const summaryFromBlocks = blocks
            .filter((b) => b.type === "text" && b.text)
            .map((b) => b.text.trim())
            .filter(Boolean)
            .join(" ");

          const summary = (n.content || summaryFromBlocks || "").trim();
          const items = [];

          if (n.mediaType === "video" && n.mediaUrl) {
            items.push({
              id: `${n._id || n.id}-main`,
              title: n.title,
              summary,
              mediaUrl: n.mediaUrl,
              mediaType: "video",
              category: n.category || "Article",
              createdAt: n.createdAt,
              newsId: n._id || n.id,
            });
          }

          blocks.forEach((b, idx) => {
            if (b.type === "video" && b.url) {
              items.push({
                id: `${n._id || n.id || "block"}-${idx}`,
                title: n.title,
                summary,
                mediaUrl: b.url,
                mediaType: "video",
                category: n.category || "Article",
                createdAt: n.createdAt,
                newsId: n._id || n.id,
              });
            }
          });

          return items;
        });

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

  const openVideo = (video) => {
    navigate(`/videos/${video._id || video.id}`, {
      state: {
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
      <aside className="sidebar">
        <div className="sidebar-logo">News Portal</div>
        <ul className="menu">
          <li onClick={() => navigate("/")}>Home</li>
          <li onClick={() => navigate("/videos")}>Videos</li>
          <li onClick={() => navigate("/search")}>Search</li>
          <li onClick={() => navigate("/epaper")}>E-Paper</li>
        </ul>
      </aside>

      <main className="content media-page">
        {!loading && videos.length === 0 && <p>No videos uploaded yet.</p>}

        <div className="media-grid">
          {videos.map((v) => (
            <div
              key={v._id || v.id}
              className="media-card"
              onClick={() => openVideo(v)}
            >
              <div className="media-thumb media-thumb-video">
                <video src={v.mediaUrl} muted preload="metadata" />
                <div className="play-badge">▶</div>
                <div className="video-story-overlay">
                  <h3 className={`video-story-title ${categoryClass(v.category)}`}>
                    {v.title}
                  </h3>
                  <p className="video-story-summary">
                    {v.summary || "वीडियो समाचार"}
                  </p>
                  <small className="video-story-meta">
                    {formatTimeAgo(v.createdAt)}
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

