import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchWithTimeout } from "../services/api";
import { fallbackVideos, normalizeVideosFromNews } from "../utils/videoFeed";
import "../styles/videoPlayer.css";

export default function VideoPlayer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();
  const feedRef = useRef(null);
  const cardRefs = useRef([]);
  const videoRefs = useRef([]);
  const lastRouteVideoIdRef = useRef(null);

  const [videos, setVideos] = useState(() => {
    if (Array.isArray(state?.videos) && state.videos.length > 0) {
      return state.videos;
    }

    if (state?.url) {
      return [
        {
          id: state?.selectedVideoId || id || "video",
          mediaUrl: state.url,
          title: state.title || "Video",
          summary: state.summary || "",
          category: state.category || "Article",
          createdAt: state.createdAt,
          newsId: state.newsId || null,
        },
      ];
    }

    return [];
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(videos.length === 0);

  useEffect(() => {
    const selectedId = state?.selectedVideoId || id;
    if (!selectedId || videos.length === 0) return;

    const index = videos.findIndex(
      (video) => String(video.id || video._id) === String(selectedId)
    );
    if (index >= 0) {
      setActiveIndex(index);
    }
  }, [id, state?.selectedVideoId, videos]);

  useEffect(() => {
    if (videos.length > 0) {
      setIsLoading(false);
      return;
    }

    let ignore = false;

    const load = async () => {
      try {
        const res = await fetchWithTimeout("news");
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        const normalized = normalizeVideosFromNews(list);
        if (ignore) return;

        const nextVideos = normalized.length > 0 ? normalized : fallbackVideos;
        setVideos(nextVideos);

        const selectedId = state?.selectedVideoId || id;
        const index = nextVideos.findIndex(
          (video) =>
            String(video.id || video._id) === String(selectedId) ||
            String(video.newsId) === String(selectedId)
        );
        setActiveIndex(index >= 0 ? index : 0);
      } catch (err) {
        console.error("Failed to load video feed", err);
        if (!ignore) {
          setVideos(fallbackVideos);
          setActiveIndex(0);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [id, state?.selectedVideoId, videos.length]);

  useEffect(() => {
    if (!feedRef.current || !cardRefs.current[activeIndex]) return;

    cardRefs.current[activeIndex].scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [activeIndex]);

  useEffect(() => {
    const activeVideo = videos[activeIndex];
    if (!activeVideo) return;

    const routeVideoId = activeVideo.id || activeVideo._id;
    if (lastRouteVideoIdRef.current === routeVideoId) {
      return;
    }

    lastRouteVideoIdRef.current = routeVideoId;

    navigate(`/videos/${routeVideoId}`, {
      replace: true,
      state: {
        videos,
        selectedVideoId: routeVideoId,
        url: activeVideo.mediaUrl,
        title: activeVideo.title,
        summary: activeVideo.summary || "",
        category: activeVideo.category || "Article",
        createdAt: activeVideo.createdAt,
        newsId: activeVideo.newsId,
      },
    });
  }, [activeIndex, navigate, videos]);

  useEffect(() => {
    videoRefs.current.forEach((videoEl, index) => {
      if (!videoEl) return;

      if (index === activeIndex) {
        const playPromise = videoEl.play();
        if (playPromise?.catch) {
          playPromise.catch(() => {});
        }
      } else {
        videoEl.pause();
      }
    });
  }, [activeIndex, videos]);

  useEffect(() => {
    const root = feedRef.current;
    if (!root || videos.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let nextIndex = activeIndex;
        let maxRatio = 0;

        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const index = Number(entry.target.dataset.index);
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            nextIndex = index;
          }
        });

        if (nextIndex !== activeIndex) {
          setActiveIndex(nextIndex);
        }
      },
      {
        root,
        threshold: [0.55, 0.7, 0.9],
      }
    );

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, [activeIndex, videos]);

  const activeVideo = videos[activeIndex];

  const shareUrl = useMemo(() => {
    if (!activeVideo) return window.location.href;
    const currentId = activeVideo.id || activeVideo._id || id;
    return `${window.location.origin}/videos/${currentId}`;
  }, [activeVideo, id]);

  const activeVideoCreatedAt = activeVideo?.createdAt
    ? new Date(activeVideo.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const goBackSafe = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/videos");
  };

  const copyVideoLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copy ho gaya");
    } catch {
      alert("Link copy nahi ho paya");
    }
  };

  const openRelatedNews = (newsId) => {
    if (!newsId) {
      navigate("/");
      return;
    }

    navigate("/", { state: { openNewsId: newsId } });
  };

  const handleFacebookShare = () => {
    const target = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl
    )}`;
    window.open(target, "_blank", "noopener,noreferrer");
  };

  const handleTwitterShare = () => {
    const target = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      shareUrl
    )}&text=${encodeURIComponent(activeVideo?.title || "Video")}`;
    window.open(target, "_blank", "noopener,noreferrer");
  };

  const downloadVideo = async () => {
    if (!activeVideo?.mediaUrl) {
      alert("Video URL available nahi hai");
      return;
    }

    try {
      const safeTitle = (activeVideo.title || "video")
        .trim()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

      const extMatch = activeVideo.mediaUrl.match(/\.([a-z0-9]{2,6})(?:\?|$)/i);
      const ext = extMatch ? extMatch[1] : "mp4";
      const fileName = `${safeTitle || "video"}.${ext}`;

      const response = await fetch(activeVideo.mediaUrl, { mode: "cors" });
      if (!response.ok) throw new Error("Failed to fetch video");

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      alert("Download start ho gaya");
    } catch (err) {
      console.error(err);
      alert("Download fail hua");
    }
  };

  const showNextVideo = () => {
    if (videos.length <= 1) return;
    setActiveIndex((current) => (current + 1) % videos.length);
  };

  if (isLoading) {
    return <div className="video-empty">Videos load ho rahe hain...</div>;
  }

  if (!activeVideo) {
    return <div className="video-empty">Video not found.</div>;
  }

  return (
    <div className="video-page">
      <div className="video-feed-shell" ref={feedRef}>
        {videos.map((video, index) => {
          const isActive = index === activeIndex;

          return (
            <article
              key={video.id || video._id || index}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
              data-index={index}
              className={`video-feed-item ${isActive ? "is-active" : ""}`}
            >
              <div className="video-player">
                <video
                  ref={(node) => {
                    videoRefs.current[index] = node;
                  }}
                  src={video.mediaUrl}
                  controls
                  playsInline
                  preload={isActive ? "auto" : "metadata"}
                  onEnded={showNextVideo}
                />

                <div className="video-overlay video-overlay-top">
                  <button
                    type="button"
                    className="video-icon-btn video-back-btn"
                    onClick={goBackSafe}
                  >
                    &larr;
                  </button>
                  <div className="video-brand">गरुड़ समाचार</div>
                  <button
                    type="button"
                    className="video-read-btn"
                    onClick={() => openRelatedNews(video.newsId)}
                  >
                    न्यूज पढ़ें
                  </button>
                </div>

                <div className="video-overlay video-overlay-side">
                  <button
                    type="button"
                    className="video-action-btn"
                    onClick={downloadVideo}
                  >
                    <span className="video-action-icon">↓</span>
                    <span>डाउनलोड</span>
                  </button>
                  <button
                    type="button"
                    className="video-action-btn"
                    onClick={handleFacebookShare}
                  >
                    <span className="video-action-icon">f</span>
                    <span>शेयर</span>
                  </button>
                  <button
                    type="button"
                    className="video-action-btn"
                    onClick={copyVideoLink}
                  >
                    <span className="video-action-icon">⤴</span>
                    <span>कॉपी</span>
                  </button>
                  <button
                    type="button"
                    className="video-action-btn"
                    onClick={handleTwitterShare}
                  >
                    <span className="video-action-icon">⋯</span>
                    <span>More</span>
                  </button>
                </div>

                <div className="video-overlay video-overlay-bottom">
                  <div className="video-chip">{video.category || "Article"}</div>
                  <div className="video-meta">
                    <h1>{video.title || "Video"}</h1>
                    {video.summary ? <p>{video.summary}</p> : null}
                    <small>{isActive ? activeVideoCreatedAt : ""}</small>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
