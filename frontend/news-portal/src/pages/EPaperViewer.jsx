import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../styles/category.css";
import { fetchWithTimeout } from "../services/api";


export default function EPaperViewer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [epaper, setEpaper] = useState(location.state?.epaper || null);
  const [loading, setLoading] = useState(!location.state?.epaper);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pdfBlobUrl, setPdfBlobUrl] = useState("");
  const [preparingPdf, setPreparingPdf] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const goBackSafe = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/epaper");
  };

  const pdfSrc = useMemo(() => {
    if (epaper?.fileType !== "pdf") return epaper?.fileUrl || "";
    if (!pdfBlobUrl) return "";
    return `${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
  }, [epaper, pdfBlobUrl]);

  useEffect(() => {
    if (epaper || !id) return;
    const load = async () => {
      try {
        const res = await fetchWithTimeout(`epaper/${id}`, {}, 20000);
        if (!res.ok) {
          throw new Error("E-paper not found");
        }
        const data = await res.json();
        setEpaper(data);
      } catch (err) {
        setError(err.message || "Failed to load e-paper");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, epaper]);

  useEffect(() => {
    if (!epaper?.fileUrl || epaper.fileType !== "pdf") return undefined;

    let isMounted = true;
    let createdBlobUrl = "";

    const loadPdfBlob = async () => {
      try {
        setPreparingPdf(true);
        setError("");

        const res = await fetch(epaper.fileUrl);
        if (!res.ok) {
          throw new Error("Unable to open PDF");
        }

        const blob = await res.blob();
        createdBlobUrl = URL.createObjectURL(
          new Blob([blob], { type: "application/pdf" })
        );

        if (isMounted) {
          setPdfBlobUrl(createdBlobUrl);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load PDF");
        }
      } finally {
        if (isMounted) {
          setPreparingPdf(false);
        }
      }
    };

    loadPdfBlob();

    return () => {
      isMounted = false;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [epaper]);

  useEffect(() => {
    if (!actionMessage) return undefined;
    const timer = setTimeout(() => setActionMessage(""), 2500);
    return () => clearTimeout(timer);
  }, [actionMessage]);

  const downloadEpaper = async () => {
    if (!epaper?.fileUrl) return;

    try {
      const fileExt = epaper.fileType === "pdf" ? "pdf" : "jpg";
      const safeTitle = (epaper.title || "epaper")
        .trim()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
      const fileName = `${safeTitle || "epaper"}.${fileExt}`;

      const blob =
        epaper.fileType === "pdf" && pdfBlobUrl
          ? await (await fetch(pdfBlobUrl)).blob()
          : await (await fetch(epaper.fileUrl)).blob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setActionMessage("Download started");
    } catch {
      setActionMessage("Download failed");
    }
  };

  const shareEpaper = async () => {
    if (!epaper?.fileUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: epaper.title || "E-Paper",
          text: epaper.title || "E-Paper",
          url: epaper.fileUrl,
        });
        setActionMessage("Shared successfully");
        return;
      }

      await navigator.clipboard.writeText(epaper.fileUrl);
      setActionMessage("Link copied");
    } catch {
      setActionMessage("Share cancelled");
    }
  };

  return (
    <div className="epaper-viewer">
      <div className="epaper-toolbar">
        <button type="button" onClick={goBackSafe}>
          {"<-"} Back
        </button>
        <div className="epaper-title">{epaper?.title || "E-Paper"}</div>
        <div className="epaper-action-controls">
          <button type="button" onClick={shareEpaper}>
            Share
          </button>
          <button type="button" onClick={downloadEpaper}>
            Download
          </button>
        </div>
        <div className="epaper-zoom-controls">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)))}
          >
            -
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.1).toFixed(2)))}
          >
            +
          </button>
          <button type="button" onClick={() => setZoom(1)}>
            Fit
          </button>
        </div>
      </div>

      {loading && <div className="epaper-status">Loading...</div>}
      {!loading && preparingPdf && (
        <div className="epaper-status">Preparing PDF...</div>
      )}
      {error && <div className="epaper-status error">{error}</div>}
      {!error && actionMessage && (
        <div className="epaper-status">{actionMessage}</div>
      )}

      {!loading && !error && epaper && !preparingPdf && (
        <div className="epaper-frame">
          <div className="epaper-zoom" style={{ transform: `scale(${zoom})` }}>
            {epaper.fileType === "pdf" ? (
              <iframe title={epaper.title} src={pdfSrc} />
            ) : (
              <img src={epaper.fileUrl} alt={epaper.title} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
