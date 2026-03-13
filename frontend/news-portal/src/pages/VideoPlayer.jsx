import { useLocation, useNavigate } from "react-router-dom";
import "../styles/videoPlayer.css";

export default function VideoPlayer() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const title = state?.title || "Video";
  const url = state?.url || "";
  const summary = (state?.summary || "").trim();
  const category = state?.category || "Article";
  const newsId = state?.newsId || null;
  const shortTitle = (summary || title)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");

  const categoryLabelMap = {
    National: "राष्ट्रीय",
    Business: "बिज़नेस",
    Politics: "राजनीति",
    Sports: "खेल",
    Tech: "टेक",
    Entertainment: "मनोरंजन",
    World: "दुनिया",
    Article: "आर्टिकल",
  };
  const categoryLabel = categoryLabelMap[category] || "आर्टिकल";

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
      alert("लिंक कॉपी हो गया");
    } catch {
      alert("लिंक कॉपी नहीं हो पाया");
    }
  };

  const openRelatedNews = () => {
    if (!newsId) {
      navigate("/");
      return;
    }
    navigate("/", { state: { openNewsId: newsId } });
  };

  const shareUrl = newsId
    ? `${window.location.origin}/videos/${newsId}`
    : window.location.href;

  const handleFacebookShare = () => {
    const target = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl
    )}`;
    window.open(target, "_blank", "noopener,noreferrer");
  };

  const downloadVideo = async () => {
    if (!url) {
      alert("Video URL उपलब्ध नहीं है");
      return;
    }

    try {
      const safeTitle = (title || "video")
        .trim()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

      const extMatch = url.match(/\.([a-z0-9]{2,6})(?:\?|$)/i);
      const ext = extMatch ? extMatch[1] : "mp4";
      const fileName = `${safeTitle || "video"}.${ext}`;

      const response = await fetch(url, { mode: "cors" });
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
      alert("डाउनलोड शुरू हो गया");
    } catch (err) {
      console.error(err);
      alert("डाउनलोड विफल हुआ");
    }
  };

  const handleTwitterShare = () => {
    const target = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      shareUrl
    )}&text=${encodeURIComponent(title)}`;
    window.open(target, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="video-page">
      <div className="video-header">
        <button className="video-back" onClick={goBackSafe}>
          &larr; Back
        </button>
        <h1>{title}</h1>
      </div>

      {!url && <div className="video-empty">Video not found.</div>}

      {url && (
        <div className="video-stage">
          <div className="video-player">
            <video src={url} controls playsInline />

            <div className="video-top-overlay">
              <button
                type="button"
                className="video-read-btn"
                onClick={openRelatedNews}
              >
                खबर पढ़ें
              </button>
            </div>

            <button
              type="button"
              className="video-tag-chip"
              onClick={openRelatedNews}
            >
              {shortTitle || categoryLabel}
            </button>
          </div>

          <div className="video-share-rail">
            <button type="button" className="share-item" onClick={handleFacebookShare}>
              <span className="share-icon">f</span>
              <span>फेसबुक</span>
            </button>
            <button type="button" className="share-item" onClick={downloadVideo}>
              <span className="share-icon">⬇</span>
              <span>डाउनलोड</span>
            </button>
            <button type="button" className="share-item" onClick={handleTwitterShare}>
              <span className="share-icon">X</span>
              <span>ट्विटर</span>
            </button>
            <button type="button" className="share-item" onClick={copyVideoLink}>
              <span className="share-icon">🔗</span>
              <span>कॉपी लिंक</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
