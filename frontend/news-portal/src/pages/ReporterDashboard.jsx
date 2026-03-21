import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";
import RichTextEditor from "../components/RichTextEditor";
import {
  countWordsFromHtml,
  sanitizeRichTextHtml,
  stripHtml,
} from "../utils/richText";
import { fetchWithTimeout } from "../services/api";

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

export default function ReporterDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");
  const reporterName = localStorage.getItem("adminName") || "Reporter";

  const [newsList, setNewsList] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [todayOnly, setTodayOnly] = useState(false);
  const [statusTab, setStatusTab] = useState("all");

  const [title, setTitle] = useState("");
  const [titleColor, setTitleColor] = useState("#1f2937");
  const [category, setCategory] = useState("Tech");
  const [status, setStatus] = useState("pending");
  const [editId, setEditId] = useState(null);
  const [blocks, setBlocks] = useState([{ id: Date.now(), type: "text", text: "" }]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const addArticleRef = useRef(null);

  const loadNews = async () => {
    const res = await fetchWithTimeout("news", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setNewsList(Array.isArray(data) ? data : data.news || []);
  };

  useEffect(() => {
    loadNews();
  }, []);

  useEffect(() => {
    const payload = {
      title,
      titleColor,
      category,
      status,
      blocks,
    };
    localStorage.setItem("reporterDraft", JSON.stringify(payload));
    setLastSaved(new Date());
  }, [title, titleColor, category, status, blocks]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("reporterDraft");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.title) setTitle(saved.title);
      if (saved?.titleColor) setTitleColor(saved.titleColor);
      if (saved?.category) setCategory(saved.category);
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
    } catch {}
  }, []);

  const todayCount = newsList.filter((n) => isToday(n.createdAt)).length;
  const categoryCount = new Set(newsList.map((n) => n.category).filter(Boolean)).size;

  const filteredNews = useMemo(() => {
    return newsList.filter((n) => {
      if (statusTab !== "all" && n.status !== statusTab) return false;
      if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory !== "All" && n.category !== filterCategory) return false;
      if (todayOnly && !isToday(n.createdAt)) return false;
      return true;
    });
  }, [newsList, search, filterCategory, todayOnly, statusTab]);

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
    formData.append("title", title);
    formData.append("titleColor", titleColor);
    formData.append("content", deriveContentFromBlocks(blocks) || "Media content");
    formData.append("category", category);
    formData.append("status", "pending");

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
      alert(editId ? "News updated and sent again for approval" : "News sent to main admin for approval");
    } catch (error) {
      alert(`Upload failed: ${error.message}`);
    }
  };

  const editNews = (n) => {
    setEditId(n._id);
    setTitle(n.title);
    setTitleColor(n.titleColor || "#1f2937");
    setCategory(n.category);
    setStatus(n.status || "pending");
    setBlocks(
      Array.isArray(n.blocks) && n.blocks.length > 0
        ? n.blocks.map((b, i) => ({
            id: Date.now() + i,
            type: b.type,
            text: b.text || "",
            url: b.url || "",
            file: null,
          }))
        : [{ id: Date.now(), type: "text", text: n.content || "" }]
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setTitle("");
    setTitleColor("#1f2937");
    setCategory("Tech");
    setStatus("pending");
    setEditId(null);
    setBlocks([{ id: Date.now(), type: "text", text: "" }]);
    localStorage.removeItem("reporterDraft");
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
      prev.map((b) => (b.id === id ? { ...b, text: sanitizeRichTextHtml(value) } : b))
    );
  };

  const updateBlockFile = (id, file) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, file, url: file ? URL.createObjectURL(file) : "" } : b
      )
    );
  };

  const updateBlockUrl = (id, url) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, url, file: null } : b)));
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
        b.id === id ? { ...b, text: "", url: "", file: null } : b
      );

      if (!isBlockEmpty(targetBlock)) {
        return clearedBlocks;
      }

      if (prev.length > 1) {
        return prev.filter((b) => b.id !== id);
      }

      return prev.map((b) =>
        b.id === id ? { ...b, type: "text", text: "", url: "", file: null } : b
      );
    });
  };

  const duplicateBlock = (id) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const source = prev[idx];
      const copy = { ...source, id: Date.now() + Math.random(), file: null };
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

  const deleteNews = async (id) => {
    if (!window.confirm("Delete this news?")) return;
    const res = await fetchWithTimeout(`news/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      alert(errorData.message || "Delete failed");
      return;
    }
    loadNews();
  };

  return (
    <div className="admin-wrapper">
      <div className="admin-header">
        <div>
          <h1>Reporter Dashboard</h1>
          <p>Welcome {reporterName}. Aapki news main admin approve karke publish karega.</p>
        </div>
        <div className="admin-actions">
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

      <div className="stats-grid summary-grid">
        <div className="stat-card big">
          <h3>Total News</h3>
          <p>{newsList.length}</p>

          <div className="category-breakdown">
            {CATEGORY_LIST.map((c) => (
              <div className="cat-row" key={c.value}>
                <span>{c.label}</span>
                <strong>{newsList.filter((n) => n.category === c.value).length}</strong>
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

      <div className="card filter-bar">
        <input
          placeholder="Search title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="All">All</option>
          {CATEGORY_LIST.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="card add-news-card" ref={addArticleRef}>
        <h2>{editId ? "Edit News" : "Add News"}</h2>
        <p className="form-hint">
          Tip: Add multiple blocks (text, image, video). You can paste an image/video or URL
          directly into the editor.
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
          {lastSaved && <span>Autosaved: {lastSaved.toLocaleTimeString()}</span>}
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
              <span>{titleLength < 20 ? "Try a more descriptive headline" : "Headline looks strong"}</span>
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
                        onChange={(e) => updateBlockFile(block.id, e.target.files[0])}
                      />
                      <input
                        type="text"
                        placeholder="Paste image/video URL (optional)"
                        value={block.url || ""}
                        onChange={(e) => updateBlockUrl(block.id, e.target.value)}
                      />
                      {block.url && block.type === "image" && <img src={block.url} alt="preview" />}
                      {block.url && block.type === "video" && <video src={block.url} controls />}
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
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORY_LIST.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <label className="field-label">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="pending">Send To Main Admin Review</option>
            </select>

            <button className="btn primary full-btn" onClick={saveNews}>
              {editId ? "Update News" : "Send To Main Admin"}
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
                </div>
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
                      {b.type === "image" && (b.fileUrl || b.url) && <img src={b.fileUrl || b.url} alt="" />}
                      {b.type === "video" && (b.fileUrl || b.url) && <video src={b.fileUrl || b.url} controls />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>News List</h2>

        <div className="news-list">
          {filteredNews.map((n) => (
            <div className="news-card" key={n._id}>
              <div>
                <h3>{n.title}</h3>
                <small>
                  {n.category} • {new Date(n.createdAt).toLocaleString()}
                </small>

                <div className="badges">
                  {n.status === "pending" && <span className="badge featured">Pending</span>}
                  {n.status === "draft" && <span className="badge draft">Draft</span>}
                  {n.status === "published" && <span className="badge breaking">Published</span>}
                </div>
              </div>

              <div className="actions">
                {n.status !== "published" && (
                  <>
                    <button className="btn small" onClick={() => editNews(n)}>
                      Edit
                    </button>
                    <button className="btn danger small" onClick={() => deleteNews(n._id)}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
