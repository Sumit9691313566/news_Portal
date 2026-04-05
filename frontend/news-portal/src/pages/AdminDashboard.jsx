import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";
import { API_FALLBACK_URL, buildApiUrl, fetchWithTimeout } from "../services/api";
import RichTextEditor from "../components/RichTextEditor";
import {
  countWordsFromHtml,
  sanitizeRichTextHtml,
  stripHtml,
} from "../utils/richText";

const CATEGORY_LIST = [
  { value: "National", label: "राष्ट्रीय" },
  { value: "Business", label: "बिज़नेस" },
  { value: "Politics", label: "राजनीति" },
  { value: "Sports", label: "खेल" },
  { value: "Tech", label: "टेक" },
  { value: "Entertainment", label: "मनोरंजन" },
  { value: "World", label: "दुनिया" },
  { value: "Article", label: "आर्टिकल" },
];

const isToday = (date) =>
  new Date(date).toDateString() === new Date().toDateString();

const deriveContentFromBlocks = (blocks) =>
  blocks
    .filter((b) => b.type === "text" && b.text)
    .map((b) => stripHtml(b.text))
    .filter(Boolean)
    .join("\n\n");

const mediaTypeFromUrl = (url) => {
  const clean = url.split("?")[0].toLowerCase();
  if (
    clean.endsWith(".jpg") ||
    clean.endsWith(".jpeg") ||
    clean.endsWith(".png") ||
    clean.endsWith(".gif") ||
    clean.endsWith(".webp") ||
    clean.endsWith(".bmp") ||
    clean.endsWith(".svg")
  ) {
    return "image";
  }
  if (
    clean.endsWith(".mp4") ||
    clean.endsWith(".webm") ||
    clean.endsWith(".mov") ||
    clean.endsWith(".mkv") ||
    clean.endsWith(".avi") ||
    clean.endsWith(".m4v")
  ) {
    return "video";
  }
  if (clean.includes("youtube.com") || clean.includes("youtu.be")) {
    return "video";
  }
  return null;
};

const readingMinutes = (words = 0) => Math.max(1, Math.ceil(words / 220));
const isBlockEmpty = (block) => {
  if (!block) return true;
  if (block.type === "text") {
    return !String(block.text || "").replace(/<[^>]*>/g, "").trim();
  }
  return !String(block.url || "").trim() && !block.file;
};


export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");
  const adminName = localStorage.getItem("adminName") || "Admin";

  const [newsList, setNewsList] = useState([]);
  const [deletedNewsList, setDeletedNewsList] = useState([]);
  const [selectedDeletedIds, setSelectedDeletedIds] = useState([]);

  // filters
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [todayOnly, setTodayOnly] = useState(false);
  const [statusTab, setStatusTab] = useState("all");

  // form
  const [title, setTitle] = useState("");
  const [titleColor, setTitleColor] = useState("#1f2937");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("Tech");
  const [status, setStatus] = useState("draft");
  const [featured, setFeatured] = useState(false);
  const [breaking, setBreaking] = useState(false);
  const [editId, setEditId] = useState(null);
  const [blocks, setBlocks] = useState([
    { id: Date.now(), type: "text", text: "" },
  ]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [epaperTitle, setEpaperTitle] = useState("");
  const [epaperFile, setEpaperFile] = useState(null);
  const [epaperList, setEpaperList] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);
  const addArticleRef = useRef(null);

  /* ================= LOAD ================= */
  const loadNews = async () => {
    const res = await fetchWithTimeout("news", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setNewsList(Array.isArray(data) ? data : data.news || []);
  };

  const loadDeletedNews = async () => {
    try {
      const res = await fetchWithTimeout("news/deleted", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setDeletedNewsList([]);
        return;
      }
      const data = await res.json();
      setDeletedNewsList(Array.isArray(data) ? data : []);
    } catch {
      setDeletedNewsList([]);
    }
  };

  useEffect(() => {
    loadNews();
    loadEpaper();
    loadDeletedNews();
  }, []);

  // Auto-save draft to localStorage (editor safety)
  useEffect(() => {
    const payload = {
      title,
      titleColor,
      location,
      category,
      status,
      featured,
      breaking,
      blocks,
    };
    localStorage.setItem("adminDraft", JSON.stringify(payload));
    setLastSaved(new Date());
  }, [title, titleColor, location, category, status, featured, breaking, blocks]);

  // Load draft once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("adminDraft");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.title) setTitle(saved.title);
      if (saved?.titleColor) setTitleColor(saved.titleColor);
      if (saved?.location) setLocation(saved.location);
      if (saved?.category) setCategory(saved.category);
      if (saved?.status) {
        const draftStatus = String(saved.status).toLowerCase();
        setStatus("draft");
      }
      if (typeof saved?.featured === "boolean") setFeatured(saved.featured);
      if (typeof saved?.breaking === "boolean") setBreaking(saved.breaking);
      if (Array.isArray(saved?.blocks) && saved.blocks.length > 0) {
        setBlocks(
          saved.blocks.map((b) => ({
            id: Date.now() + Math.random(),
            type: b.type,
            text: b.text || "",
            url: b.url || "",
            file: null,
          }))
        );
      }
    } catch {
      // ignore corrupted draft
    }
  }, []);

  /* ================= STATS ================= */
  const todayCount = newsList.filter((n) => isToday(n.createdAt)).length;
  const categoryCount = new Set(
    newsList.map((n) => n.category).filter(Boolean)
  ).size;

  /* ================= FILTER ================= */
  const filteredNews = useMemo(() => {
    return newsList.filter((n) => {
      if (statusTab !== "all" && n.status !== statusTab) return false;
      if (search && !n.title.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (filterCategory !== "All" && n.category !== filterCategory)
        return false;
      if (todayOnly && !isToday(n.createdAt)) return false;
      return true;
    });
  }, [newsList, search, filterCategory, todayOnly, statusTab]);

  /* ================= SAVE ================= */
  const saveNews = async () => {
    const hasContent = blocks.some(
      (b) =>
        (b.type === "text" && b.text?.trim()) ||
        (b.type !== "text" && (b.file || b.url))
    );

    const missingMedia = blocks.find(
      (b) => (b.type === "image" || b.type === "video") && !b.file && !b.url
    );

    if (!title || !hasContent) {
      alert("Title aur content required hai");
      return;
    }

    if (missingMedia) {
      alert("Kisi media block me file/select ya URL missing hai");
      return;
    }

    const formData = new FormData();
    const derivedContent =
      deriveContentFromBlocks(blocks) || "Media content";

    formData.append("title", title);
    formData.append("titleColor", titleColor);
    formData.append("content", derivedContent);
    formData.append("location", location);
    formData.append("category", category);
    const safeStatus = "draft";
    formData.append("status", safeStatus);
    formData.append("featured", featured);
    formData.append("breaking", breaking);

    const blocksPayload = blocks.map((b, index) => {
      if (b.type === "text") {
        return { type: "text", text: sanitizeRichTextHtml(b.text || "") };
      }
      const fileKey = `block_file_${index}`;
      if (b.file) {
        formData.append(fileKey, b.file);
      }
      return { type: b.type, url: b.url || "", fileKey: b.file ? fileKey : "" };
    });

    formData.append("blocks", JSON.stringify(blocksPayload));

    try {
      // Increase timeout for video/large file uploads (60 seconds)
      const timeout = blocks.some((b) => b.type === "video") ? 60000 : 30000;
      const res = await fetchWithTimeout(editId ? `news/${editId}` : "news", {
        method: editId ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }, timeout);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed: ${res.status} ${res.statusText}`);
      }

      resetForm();
      loadNews();
      alert(
        editId
          ? "News updated successfully"
          : "News saved in draft for main admin review"
      );
    } catch (error) {
      console.error("Upload error:", error);
      alert(`❌ Upload failed: ${error.message}`);
    }
  };

  /* ================= EDIT ================= */
  const editNews = (n) => {
    setEditId(n._id);
    setTitle(n.title);
    setTitleColor(n.titleColor || "#1f2937");
    setLocation(n.location || "");
    setCategory(n.category);
    setStatus("draft");
    setFeatured(!!n.featured);
    setBreaking(!!n.breaking);
    setBlocks(
      Array.isArray(n.blocks) && n.blocks.length > 0
        ? n.blocks.map((b, i) => ({
            id: Date.now() + i,
            type: b.type,
            text: b.text || "",
            url: b.url || "",
            file: null,
          }))
        : [
            { id: Date.now(), type: "text", text: n.content || "" },
            ...(n.mediaUrl
              ? [
                  {
                    id: Date.now() + 1,
                    type: n.mediaType === "video" ? "video" : "image",
                    text: "",
                    url: n.mediaUrl,
                    file: null,
                  },
                ]
              : []),
          ]
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setTitle("");
    setTitleColor("#1f2937");
    setLocation("");
    setCategory("Tech");
    setStatus("draft");
    setFeatured(false);
    setBreaking(false);
    setEditId(null);
    setBlocks([{ id: Date.now(), type: "text", text: "" }]);
    localStorage.removeItem("adminDraft");
  };

  const addBlock = (type) => {
    setBlocks((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), type, text: "", url: "", file: null },
    ]);
    setShowAddMenu(false);
  };

  const updateBlockText = (id, value) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, text: sanitizeRichTextHtml(value) } : b
      )
    );
  };

  const updateBlockFile = (id, file) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, file, url: file ? URL.createObjectURL(file) : "" }
          : b
      )
    );
  };

  const updateBlockUrl = (id, url) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, url, file: null } : b
      )
    );
  };

  const addMediaBlockFromFile = (file) => {
    const type = file.type.startsWith("image/") ? "image" : "video";
    setBlocks((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        type,
        text: "",
        url: URL.createObjectURL(file),
        file,
      },
    ]);
  };

  const addMediaBlockFromUrl = (url) => {
    const type = mediaTypeFromUrl(url);
    if (!type) return false;
    setBlocks((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), type, text: "", url, file: null },
    ]);
    return true;
  };

  const handlePaste = (e) => {
    const target = e.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target?.isContentEditable
    ) {
      return;
    }

    const items = e.clipboardData?.items || [];
    for (const item of items) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (!file) continue;
        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
          e.preventDefault();
          addMediaBlockFromFile(file);
          return;
        }
      }
    }

    const text = e.clipboardData?.getData("text")?.trim();
    if (!text) return;
    if (addMediaBlockFromUrl(text)) {
      e.preventDefault();
    }
  };

  const handleMediaPaste = (blockId, expectedType, e) => {
    const items = e.clipboardData?.items || [];
    for (const item of items) {
      if (item.kind !== "file") continue;
      const file = item.getAsFile();
      if (!file) continue;

      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) continue;

      if (
        (expectedType === "image" && !isImage) ||
        (expectedType === "video" && !isVideo)
      ) {
        window.alert(
          expectedType === "image"
            ? "Yahaan sirf image paste ho sakti hai."
            : "Yahaan sirf video paste ho sakta hai."
        );
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      updateBlockFile(blockId, file);
      return;
    }
  };

  const removeBlock = (id) => {
    setBlocks((prev) => {
      const targetBlock = prev.find((b) => b.id === id);
      if (!targetBlock) return prev;

      const clearedBlocks = prev.map((b) =>
        b.id === id
          ? {
              ...b,
              text: "",
              url: "",
              file: null,
            }
          : b
      );

      if (!isBlockEmpty(targetBlock)) {
        return clearedBlocks;
      }

      if (prev.length > 1) {
        return prev.filter((b) => b.id !== id);
      }

      return prev.map((b) =>
        b.id === id
          ? {
              ...b,
              type: "text",
              text: "",
              url: "",
              file: null,
            }
          : b
      );
    });
  };

  const duplicateBlock = (id) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const source = prev[idx];
      const copy = {
        ...source,
        id: Date.now() + Math.random(),
        file: null,
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const moveBlock = (id, dir) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      const temp = next[idx];
      next[idx] = next[target];
      next[target] = temp;
      return next;
    });
  };

  const wordCount = useMemo(() => {
    return blocks
      .filter((b) => b.type === "text")
      .reduce((sum, b) => sum + countWordsFromHtml(b.text || ""), 0);
  }, [blocks]);

  const titleLength = title.trim().length;
  const mediaCount = useMemo(
    () => blocks.filter((b) => b.type === "image" || b.type === "video").length,
    [blocks]
  );
  const textBlockCount = useMemo(
    () => blocks.filter((b) => b.type === "text").length,
    [blocks]
  );
  const qualityScore = useMemo(() => {
    let score = 0;
    if (titleLength >= 20) score += 30;
    if (wordCount >= 120) score += 35;
    if (mediaCount >= 1) score += 20;
    if (textBlockCount >= 2) score += 15;
    return Math.min(100, score);
  }, [titleLength, wordCount, mediaCount, textBlockCount]);

  const previewBlocks = useMemo(
    () =>
      blocks.map((b) => ({
        type: b.type,
        text: b.text || "",
        url: b.url || "",
        fileUrl: b.file ? URL.createObjectURL(b.file) : "",
      })),
    [blocks]
  );

  /* ================= DELETE ================= */
  const deleteNews = async (id) => {
    if (!window.confirm("Delete this news?")) return;
    await fetchWithTimeout(`news/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadNews();
  };

  const deleteDeletedNews = async (id) => {
    if (!window.confirm("Permanently delete this item?")) return;
    await fetchWithTimeout(`news/deleted/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadDeletedNews();
  };

  const deleteDeletedNewsBulk = async () => {
    if (selectedDeletedIds.length === 0) return;
    if (!window.confirm("Permanently delete selected items?")) return;
    await fetchWithTimeout("news/deleted", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids: selectedDeletedIds }),
    });
    setSelectedDeletedIds([]);
    loadDeletedNews();
  };

  const loadEpaper = async () => {
    const res = await fetchWithTimeout("epaper", {}, 20000);
    const data = await res.json();
    setEpaperList(Array.isArray(data) ? data : []);
  };

  const uploadEpaper = async () => {
    if (!epaperTitle || !epaperFile) {
      alert("Title aur file required hai");
      return;
    }

    const formData = new FormData();
    formData.append("title", epaperTitle);
    formData.append("file", epaperFile);

    try {
      const res = await fetchWithTimeout(
        "epaper",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
        120000
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Upload failed: ${res.status} ${res.statusText}`
        );
      }

      setEpaperTitle("");
      setEpaperFile(null);
      await loadEpaper();
      alert("E-paper uploaded successfully");
    } catch (error) {
      console.error("EPAPER UPLOAD ERROR:", error);
      alert(`E-paper upload failed: ${error.message}`);
    }
  };

  const deleteEpaper = async (id) => {
    if (!window.confirm("Delete this e-paper?")) return;
    try {
      let res = await fetchWithTimeout(`epaper/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (
        !res.ok &&
        API_FALLBACK_URL &&
        !String(API_FALLBACK_URL).includes("localhost")
      ) {
        res = await fetch(buildApiUrl(`epaper/${id}`, API_FALLBACK_URL), {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Delete failed: ${res.status} ${res.statusText}`
        );
      }

      await loadEpaper();
      alert("E-paper deleted successfully");
    } catch (error) {
      console.error("EPAPER DELETE ERROR:", error);
      alert(`E-paper delete failed: ${error.message}`);
    }
  };

  /* ================= QUICK TOGGLE ================= */
  return (
    <div className="admin-wrapper">
      {/* HEADER */}
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome {adminName}</p>
        </div>
        <div className="admin-actions">
          <button
            className="btn"
            onClick={() => {
              localStorage.removeItem("adminToken");
              localStorage.removeItem("adminRole");
              localStorage.removeItem("adminName");
              localStorage.removeItem("adminEmail");
              navigate("/login?role=main-admin", { replace: true });
            }}
          >
            Main Admin Login
          </button>
          <button
            className="btn danger"
            onClick={() => {
              localStorage.removeItem("adminToken");
              localStorage.removeItem("adminRole");
              localStorage.removeItem("adminName");
              localStorage.removeItem("adminEmail");
              navigate("/login", { replace: true });
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ===== STATS ===== */}
      <div className="stats-grid summary-grid">
        <div className="stat-card big">
          <h3>Total News</h3>
          <p>{newsList.length}</p>

          <div className="category-breakdown">
            {CATEGORY_LIST.map((c) => (
              <div className="cat-row" key={c.value}>
                <span>{c.label}</span>
                <strong>
                  {newsList.filter((n) => n.category === c.value).length}
                </strong>
              </div>
            ))}
          </div>
        </div>

        <div className="stat-card">
          <h3>Categories</h3>
          <p>{categoryCount}</p>
        </div>

        <div className="stat-card">
          <h3>Today</h3>
          <p>{todayCount}</p>
        </div>
      </div>

      {/* ===== STATUS TABS ===== */}
      <div className="status-tabs">
        {["all", "draft", "published", "pending"].map((s) => (
          <button
            key={s}
            className={statusTab === s ? "active" : ""}
            onClick={() => setStatusTab(s)}
          >
            {s.toUpperCase()}
          </button>
        ))}
        <button
          className={todayOnly ? "active" : ""}
          onClick={() => setTodayOnly((v) => !v)}
          type="button"
        >
          TODAY
        </button>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="card filter-bar">
        <input
          placeholder="Search title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="All">All</option>
          {CATEGORY_LIST.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

      </div>

      {/* ===== ADD / EDIT ===== */}
      <div className="card add-news-card" ref={addArticleRef}>
        <h2>{editId ? "Edit News" : "Add News"}</h2>
        <p className="form-hint">
          Tip: Add multiple blocks (text, image, video). You can paste an
          image/video or URL directly into the editor.
        </p>
        <div className="editor-meta">
          <span>Words: {wordCount}</span>
          <span>Read Time: {readingMinutes(wordCount)} min</span>
          <span>Media: {mediaCount}</span>
          <span
            className={`quality-badge q-${
              qualityScore >= 70 ? "good" : qualityScore >= 40 ? "mid" : "low"
            }`}
          >
            Quality: {qualityScore}%
          </span>
          {lastSaved && (
            <span>Autosaved: {lastSaved.toLocaleTimeString()}</span>
          )}
        </div>

        <div className="add-news-grid">
          <div className="form-left">
            <label className="field-label">Title</label>
            <div className="title-editor-row">
              <input
                placeholder="News Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <label className="title-color-control" title="Title color">
                <span>Color</span>
                <input
                  type="color"
                  value={titleColor}
                  onChange={(e) => setTitleColor(e.target.value)}
                />
              </label>
            </div>
            <div className="title-help">
              <span>{titleLength}/120 chars</span>
              <span>
                {titleLength < 20
                  ? "Try a more descriptive headline"
                  : "Headline looks strong"}
              </span>
            </div>

            <label className="field-label">Location</label>
            <input
              className="location-input"
              placeholder="भिंड, मध्य प्रदेश |"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <div className="field-help">
              Example: भिंड, मध्य प्रदेश |
            </div>

            <label className="field-label">Content Blocks</label>
            <div className="blocks-editor" onPaste={handlePaste}>
              {blocks.map((block) => (
                <div key={block.id} className="block">
                  <div className="block-header">
                    <span className="block-type">{block.type}</span>
                    <div className="block-actions">
                      <button
                        type="button"
                        className="block-move"
                        onClick={() => moveBlock(block.id, -1)}
                        title="Move up"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="block-move"
                        onClick={() => moveBlock(block.id, 1)}
                        title="Move down"
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        className="block-move"
                        onClick={() => duplicateBlock(block.id)}
                        title="Duplicate block"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        className="block-remove"
                        onClick={() => removeBlock(block.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {block.type === "text" && (
                    <RichTextEditor
                      placeholder="Write and format text..."
                      value={block.text}
                      onChange={(nextHtml) => updateBlockText(block.id, nextHtml)}
                    />
                  )}

                  {(block.type === "image" || block.type === "video") && (
                    <div
                      className="block-media"
                      onPaste={(e) => handleMediaPaste(block.id, block.type, e)}
                    >
                      <input
                        type="file"
                        accept={block.type === "image" ? "image/*" : "video/*"}
                        onChange={(e) =>
                          updateBlockFile(block.id, e.target.files[0])
                        }
                      />
                      <input
                        type="text"
                        placeholder="Paste image/video URL (optional)"
                        value={block.url || ""}
                        onChange={(e) => updateBlockUrl(block.id, e.target.value)}
                      />
                      {block.url && block.type === "image" && (
                        <img src={block.url} alt="preview" />
                      )}
                      {block.url && block.type === "video" && (
                        <video src={block.url} controls />
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div className="block-toolbar">
                <button
                  type="button"
                  className="block-plus"
                  onClick={() => setShowAddMenu((v) => !v)}
                >
                  +
                </button>

                {showAddMenu && (
                  <div className="block-menu">
                    <button type="button" onClick={() => addBlock("text")}>
                      Text
                    </button>
                    <button type="button" onClick={() => addBlock("image")}>
                      Image
                    </button>
                    <button type="button" onClick={() => addBlock("video")}>
                      Video
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-right">
            <label className="field-label">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORY_LIST.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <label className="field-label">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="draft">Send To Main Admin Review</option>
            </select>

            <label className="checkbox field-label">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              Featured News 
            </label>

            <label className="checkbox field-label">
              <input
                type="checkbox"
                checked={breaking}
                onChange={(e) => setBreaking(e.target.checked)}
              />
              Breaking News
            </label>

            <button className="btn primary full-btn" onClick={saveNews}>
              {editId
                ? "Update News"
                : "Send To Main Admin"}
            </button>

            {editId && (
              <button className="btn" onClick={resetForm}>
                Cancel Edit
              </button>
            )}

            <div className="preview-card">
              <div className="preview-head">Live Preview</div>
              <div className="preview-body">
                <div className="preview-title" style={{ color: titleColor || undefined }}>
                  {title || "News Title Preview"}
                </div>
                <div className="preview-meta">
                  {category} | {status}
                  {featured ? " | Featured" : ""}
                  {breaking ? " | Breaking" : ""}
                </div>
                {location.trim() && (
                  <div className="preview-location">{location.trim()}</div>
                )}
                <div className="preview-content">
                  {previewBlocks.length === 0 && (
                    <div className="preview-empty">Add content blocks to preview.</div>
                  )}
                  {previewBlocks.map((b, i) => (
                    <div key={i} className="preview-block">
                      {b.type === "text" && (
                        <div
                          className="rich-output"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeRichTextHtml(b.text || "<p>...</p>"),
                          }}
                        />
                      )}
                      {b.type === "image" && (b.fileUrl || b.url) && (
                        <img src={b.fileUrl || b.url} alt="" />
                      )}
                      {b.type === "video" && (b.fileUrl || b.url) && (
                        <video src={b.fileUrl || b.url} controls />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== NEWS LIST ===== */}
      <div className="card">
        <h2>News List</h2>

        <div className="news-list">
          {filteredNews.map((n) => (
            <div className="news-card" key={n._id}>
              <div>
                <h3>{n.title}</h3>
                <small>
                  {n.category} â€¢ {new Date(n.createdAt).toLocaleString()}
                </small>

                <div className="badges">
                  {n.status === "pending" && (
                    <span className="badge featured">Pending</span>
                  )}
                  {n.status === "draft" && (
                    <span className="badge draft">Draft</span>
                  )}
                  {n.featured && (
                    <span className="badge featured">Featured</span>
                  )}
                  {n.breaking && (
                    <span className="badge breaking">Breaking</span>
                  )}
                </div>
              </div>

              <div className="actions">
                <button className="btn small" onClick={() => editNews(n)}>
                  Edit
                </button>

                <button
                  className="btn danger small"
                  onClick={() => deleteNews(n._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== DELETED NEWS LIST (ADMIN ONLY) ===== */}
      <div className="card">
        <h2>Deleted News</h2>

        {deletedNewsList.length === 0 ? (
          <p className="muted">No deleted news yet.</p>
        ) : (
          <>
            <div className="deleted-actions">
              <label className="deleted-select-all">
                <input
                  type="checkbox"
                  checked={
                    selectedDeletedIds.length > 0 &&
                    selectedDeletedIds.length === deletedNewsList.length
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDeletedIds(deletedNewsList.map((n) => n._id));
                    } else {
                      setSelectedDeletedIds([]);
                    }
                  }}
                />
                Select All
              </label>
              <button
                className="btn danger"
                type="button"
                onClick={deleteDeletedNewsBulk}
                disabled={selectedDeletedIds.length === 0}
              >
                Bulk Delete
              </button>
            </div>

            <div className="news-list">
            {deletedNewsList.map((n) => (
              <div className="news-card" key={n._id}>
                <div>
                  <h3>{n.title}</h3>
                  <small>
                    {n.category} •{" "}
                    {n.deletedAt
                      ? new Date(n.deletedAt).toLocaleString()
                      : "Deleted"}
                  </small>

                  <div className="badges">
                    <span className="badge draft">Deleted</span>
                    {n.deletedReason === "retention" && (
                      <span className="badge featured">Auto</span>
                    )}
                  </div>
                </div>
                <div className="actions">
                  <label className="deleted-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedDeletedIds.includes(n._id)}
                      onChange={(e) => {
                        setSelectedDeletedIds((prev) =>
                          e.target.checked
                            ? [...prev, n._id]
                            : prev.filter((id) => id !== n._id)
                        );
                      }}
                    />
                  </label>
                  <button
                    className="btn danger small"
                    onClick={() => deleteDeletedNews(n._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            </div>
          </>
        )}
      </div>

      {/* ===== EPAPER UPLOAD ===== */}
      <div className="card">
        <h2>E-Paper Upload</h2>

        <div className="epaper-upload">
          <input
            placeholder="E-Paper Title"
            value={epaperTitle}
            onChange={(e) => setEpaperTitle(e.target.value)}
          />
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => setEpaperFile(e.target.files[0])}
          />
          <button className="btn primary" onClick={uploadEpaper}>
            Upload E-Paper
          </button>
        </div>

        {epaperList.length === 0 ? (
          <p className="muted">No e-papers uploaded yet.</p>
        ) : (
          <div className="epaper-list">
            {epaperList.map((e) => (
              <div key={e._id} className="epaper-item">
                <div>
                  <strong>{e.title}</strong>
                  <div className="muted">{e.fileType?.toUpperCase()}</div>
                </div>
                <div className="actions">
                  <a
                    href={e.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn small"
                  >
                    View
                  </a>
                  <button
                    className="btn danger small"
                    onClick={() => deleteEpaper(e._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification panel removed from admin dashboard */}
    </div>
  );
}

