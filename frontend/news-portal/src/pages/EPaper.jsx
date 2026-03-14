import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/category.css";
import { fetchWithTimeout } from "../services/api";

const formatIssueDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const getCloudinaryPdfPreviewUrl = (epaper) => {
  if (!epaper?.fileUrl || epaper.fileType !== "pdf") return "";

  const cloudMatch = epaper.fileUrl.match(/res\.cloudinary\.com\/([^/]+)/i);
  const cloudName = cloudMatch?.[1];
  if (!cloudName) return "";

  const rawPublicId = (epaper.publicId || "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/^\/+/, "");

  if (!rawPublicId) return "";

  return `https://res.cloudinary.com/${cloudName}/image/upload/pg_1,f_jpg,q_auto,w_1200/${rawPublicId}.jpg`;
};

export default function EPaper() {
  const navigate = useNavigate();
  const [epapers, setEpapers] = useState([]);
  const [epaperPreviewUrls, setEpaperPreviewUrls] = useState({});
  const [shareMessage, setShareMessage] = useState("");

  const goBackSafe = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithTimeout("epaper", {}, 20000);
        const data = await res.json();
        setEpapers(Array.isArray(data) ? data : []);
      } catch {
        try {
          const retryRes = await fetchWithTimeout("epaper", {}, 30000);
          const retryData = await retryRes.json();
          setEpapers(Array.isArray(retryData) ? retryData : []);
        } catch {
          setEpapers([]);
        }
      }
    };

    load();
  }, []);

  useEffect(() => {
    const pdfEpapers = epapers.filter(
      (epaper) => epaper.fileType === "pdf" && epaper.fileUrl
    );

    if (pdfEpapers.length === 0) {
      setEpaperPreviewUrls({});
      return undefined;
    }

    let active = true;
    const createdUrls = [];

    const loadPreviewUrls = async () => {
      const entries = await Promise.all(
        pdfEpapers.map(async (epaper) => {
          try {
            const response = await fetch(epaper.fileUrl, { mode: "cors" });
            if (!response.ok) {
              return [epaper._id, ""];
            }

            const sourceBlob = await response.blob();
            const blobUrl = URL.createObjectURL(
              new Blob([sourceBlob], { type: "application/pdf" })
            );
            createdUrls.push(blobUrl);
            return [epaper._id, `${blobUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`];
          } catch {
            return [epaper._id, ""];
          }
        })
      );

      if (active) {
        setEpaperPreviewUrls(Object.fromEntries(entries));
      }
    };

    loadPreviewUrls();

    return () => {
      active = false;
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [epapers]);

  const shareEdition = async (epaperId, title) => {
    const shareUrl = `${window.location.origin}/epaper/${epaperId}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: title || "E-Paper",
          text: title || "E-Paper",
          url: shareUrl,
        });
        setShareMessage("Shared successfully");
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareMessage("Link copied");
      }
    } catch {
      setShareMessage("Share cancelled");
    }

    window.setTimeout(() => setShareMessage(""), 2200);
  };

  return (
    <div className="epaper-hub">
      <header className="epaper-portal-header">
        <div className="epaper-portal-shell">
          <button
            type="button"
            className="epaper-portal-logo"
            onClick={() => navigate("/")}
            aria-label="Go to home page"
          >
            <span className="epaper-portal-mark">News Portal</span>
            <span className="epaper-portal-submark">ई-पेपर</span>
          </button>

          <div className="epaper-portal-actions">
            <button
              type="button"
              className="epaper-portal-action"
              onClick={goBackSafe}
            >
              Back
            </button>
            <button
              type="button"
              className="epaper-portal-avatar"
              onClick={() => navigate("/")}
              aria-label="Go to home page"
            >
              ○
            </button>
          </div>
        </div>
      </header>

      <div className="epaper-hub-shell">
        <div className="epaper-collection-head">
          <h1>प्रमुख शहर</h1>
        </div>

        {shareMessage && <div className="epaper-hub-message">{shareMessage}</div>}

        {epapers.length === 0 && (
          <div className="epaper-hub-empty">No e-paper uploaded yet.</div>
        )}

        {epapers.length > 0 && (
          <section className="epaper-hub-grid">
            {epapers.map((epaper) => (
              <article key={epaper._id} className="epaper-edition-card">
                <div className="epaper-edition-thumb">
                  {epaper.fileType === "image" ? (
                    <img src={epaper.fileUrl} alt={epaper.title} />
                  ) : epaperPreviewUrls[epaper._id] ? (
                    <iframe
                      src={epaperPreviewUrls[epaper._id]}
                      className="epaper-edition-frame"
                      title={epaper.title}
                    />
                  ) : getCloudinaryPdfPreviewUrl(epaper) ? (
                    <img
                      src={getCloudinaryPdfPreviewUrl(epaper)}
                      alt={`${epaper.title} preview`}
                    />
                  ) : (
                    <div className="pdf-thumb">PDF</div>
                  )}
                </div>

                <div className="epaper-edition-body">
                  <h2>{epaper.title}</h2>
                  <div className="epaper-edition-meta">
                    <span>
                      {formatIssueDate(epaper.createdAt) || "Latest edition"}
                    </span>
                    <div className="epaper-edition-actions">
                      <button
                        type="button"
                        className="epaper-open-btn"
                        onClick={() =>
                          navigate(`/epaper/${epaper._id}`, {
                            state: { epaper },
                          })
                        }
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        className="epaper-share-btn"
                        onClick={() => shareEdition(epaper._id, epaper.title)}
                      >
                        ↗
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
