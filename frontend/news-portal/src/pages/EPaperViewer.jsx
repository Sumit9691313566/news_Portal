import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../styles/category.css";
import { buildApiUrl, fetchWithTimeout } from "../services/api";
import workerSrc from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

const clampZoom = (value) => Math.min(3, Math.max(0.8, +value.toFixed(2)));

const getTouchDistance = (touches) => {
  if (touches.length < 2) return 0;
  const [first, second] = touches;
  const dx = first.clientX - second.clientX;
  const dy = first.clientY - second.clientY;
  return Math.hypot(dx, dy);
};

const isHandheldDevice = () => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const coarsePointer = window.matchMedia?.("(pointer: coarse)")?.matches;
  const mobileUa =
    /Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(
      navigator.userAgent || ""
    );

  return Boolean(coarsePointer || mobileUa);
};

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
  const [isMobileView, setIsMobileView] = useState(() => isHandheldDevice());
  const [mobilePdfPages, setMobilePdfPages] = useState([]);
  const pinchStateRef = useRef({ distance: 0, zoom: 1 });

  const goBackSafe = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/epaper");
  };

  const pdfSrc = useMemo(() => {
    if (!epaper) return "";
    if (epaper.fileType !== "pdf") return epaper.fileUrl || "";
    if (!pdfBlobUrl) return "";
    return `${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
  }, [epaper, pdfBlobUrl]);

  const directFileUrl = useMemo(() => {
    if (!epaper?._id) return "";
    return buildApiUrl(`epaper/${epaper._id}/file`);
  }, [epaper]);

  useEffect(() => {
    const handleResize = () => setIsMobileView(isHandheldDevice());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    if (!epaper?.fileUrl || epaper.fileType !== "pdf" || isMobileView) {
      setPdfBlobUrl("");
      setPreparingPdf(false);
      return undefined;
    }

    let active = true;
    let nextBlobUrl = "";

    const loadPdfBlob = async () => {
      try {
        setPreparingPdf(true);
        setError("");

        const response = await fetch(epaper.fileUrl, { mode: "cors" });
        if (!response.ok) {
          throw new Error("PDF file open nahi ho pa raha");
        }

        const sourceBlob = await response.blob();
        nextBlobUrl = URL.createObjectURL(
          new Blob([sourceBlob], { type: "application/pdf" })
        );

        if (active) {
          setPdfBlobUrl(nextBlobUrl);
        }
      } catch (err) {
        if (active) {
          setPdfBlobUrl("");
          setError(err.message || "PDF load nahi ho pa raha");
        }
      } finally {
        if (active) {
          setPreparingPdf(false);
        }
      }
    };

    loadPdfBlob();

    return () => {
      active = false;
      if (nextBlobUrl) {
        URL.revokeObjectURL(nextBlobUrl);
      }
    };
  }, [epaper, isMobileView]);

  useEffect(() => {
    if (!epaper?.fileUrl || epaper.fileType !== "pdf" || !isMobileView) {
      setMobilePdfPages([]);
      return undefined;
    }

    let active = true;

    const renderMobilePdf = async () => {
      try {
        setPreparingPdf(true);
        setError("");
        setMobilePdfPages([]);

        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
        const candidateUrls = [directFileUrl, epaper.fileUrl].filter(Boolean);
        let pdfData = null;
        let lastError = null;

        for (const url of candidateUrls) {
          try {
            const response = await fetch(url, { mode: "cors" });
            if (!response.ok) {
              throw new Error(`PDF response ${response.status}`);
            }
            pdfData = new Uint8Array(await response.arrayBuffer());
            break;
          } catch (err) {
            lastError = err;
          }
        }

        if (!pdfData) {
          throw lastError || new Error("PDF file fetch nahi ho pa raha");
        }

        const loadingTask = pdfjs.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;
        const renderedPages = [];
        const targetWidth =
          typeof window !== "undefined"
            ? Math.max(280, Math.min(window.innerWidth - 32, 900))
            : 360;

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const scale = targetWidth / baseViewport.width;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d", { alpha: false });

          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);

          await page.render({
            canvasContext: context,
            viewport,
          }).promise;

          renderedPages.push({
            pageNumber,
            src: canvas.toDataURL("image/jpeg", 0.92),
            width: viewport.width,
            height: viewport.height,
          });
        }

        if (active) {
          setMobilePdfPages(renderedPages);
        }
      } catch (err) {
        if (active) {
          setMobilePdfPages([]);
          setError(err.message || "PDF load nahi ho pa raha");
        }
      } finally {
        if (active) {
          setPreparingPdf(false);
        }
      }
    };

    renderMobilePdf();

    return () => {
      active = false;
    };
  }, [directFileUrl, epaper, isMobileView]);

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

      const downloadUrl = epaper.fileUrl;
      const blob =
        epaper.fileType === "pdf" && pdfBlobUrl
          ? await (await fetch(pdfBlobUrl)).blob()
          : await (await fetch(downloadUrl)).blob();

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

  const openPdfDirect = () => {
    const openUrl = directFileUrl || pdfBlobUrl || epaper?.fileUrl;
    if (!openUrl) return;

    if (isMobileView) {
      window.location.href = openUrl;
      return;
    }

    const popup = window.open(openUrl, "_blank", "noopener,noreferrer");
    if (!popup) {
      window.location.href = openUrl;
    }
  };

  const handleTouchStart = (event) => {
    if (event.touches.length !== 2) return;
    pinchStateRef.current = {
      distance: getTouchDistance(event.touches),
      zoom,
    };
  };

  const handleTouchMove = (event) => {
    if (event.touches.length !== 2) return;
    const nextDistance = getTouchDistance(event.touches);
    const startDistance = pinchStateRef.current.distance;
    if (!startDistance) return;

    event.preventDefault();
    const scaleFactor = nextDistance / startDistance;
    setZoom(clampZoom(pinchStateRef.current.zoom * scaleFactor));
  };

  const handleTouchEnd = (event) => {
    if (event.touches.length >= 2) {
      pinchStateRef.current = {
        distance: getTouchDistance(event.touches),
        zoom,
      };
      return;
    }

    pinchStateRef.current = {
      distance: 0,
      zoom,
    };
  };

  const handleWheel = (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.12 : -0.12;
    setZoom((current) => clampZoom(current + delta));
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
          <button type="button" onClick={openPdfDirect}>
            Open
          </button>
        </div>
        <div className="epaper-zoom-controls">
          <button
            type="button"
            onClick={() => setZoom((z) => clampZoom(z - 0.1))}
          >
            -
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => clampZoom(z + 0.1))}
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
        <div
          className="epaper-frame"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
        >
          <div
            className={`epaper-zoom${zoom > 1 ? " epaper-zoom-active" : ""}`}
            style={{ transform: `scale(${zoom})` }}
          >
            {epaper.fileType === "pdf" && isMobileView && mobilePdfPages.length > 0 ? (
              <div className="epaper-mobile-pages">
                {mobilePdfPages.map((page) => (
                  <img
                    key={page.pageNumber}
                    src={page.src}
                    alt={`${epaper.title} page ${page.pageNumber}`}
                    className="epaper-mobile-page"
                  />
                ))}
              </div>
            ) : epaper.fileType === "pdf" && !isMobileView && pdfSrc ? (
              <iframe title={epaper.title} src={pdfSrc} />
            ) : epaper.fileType === "pdf" ? (
              <div className="epaper-native-fallback">
                <div className="pdf-thumb">PDF</div>
                <p>
                  Preview abhi load nahi ho pa raha. Open PDF par click karke
                  file ko direct viewer me kholo.
                </p>
                <button type="button" onClick={openPdfDirect}>
                  Open PDF
                </button>
              </div>
            ) : (
              <img src={epaper.fileUrl} alt={epaper.title} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
