import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";
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
    .map((b) => b.text.trim())
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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

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
  const [category, setCategory] = useState("Tech");
  const [status, setStatus] = useState("published");
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
      category,
      status,
      featured,
      breaking,
      blocks,
    };
    localStorage.setItem("adminDraft", JSON.stringify(payload));
    setLastSaved(new Date());
  }, [title, category, status, featured, breaking, blocks]);

  // Load draft once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("adminDraft");
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.title) setTitle(saved.title);
      if (saved?.category) setCategory(saved.category);
      if (saved?.status) setStatus(saved.status);
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
    formData.append("content", derivedContent);
    formData.append("category", category);
    formData.append("status", status);
    formData.append("featured", featured);
    formData.append("breaking", breaking);

    const blocksPayload = blocks.map((b, index) => {
      if (b.type === "text") {
        return { type: "text", text: b.text || "" };
      }
      const fileKey = `block_file_${index}`;
      if (b.file) {
        formData.append(fileKey, b.file);
      }
      return { type: b.type, url: b.url || "", fileKey: b.file ? fileKey : "" };
    });

    formData.append("blocks", JSON.stringify(blocksPayload));

    await fetchWithTimeout(editId ? `news/${editId}` : "news", {
      method: editId ? "PUT" : "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    resetForm();
    loadNews();
    alert(editId ? "News updated successfully ✅" : "News published successfully ✅");
  };

  /* ================= EDIT ================= */
  const editNews = (n) => {
    setEditId(n._id);
    setTitle(n.title);
    setCategory(n.category);
    setStatus(n.status || "published");
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
    setCategory("Tech");
    setStatus("published");
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
      prev.map((b) => (b.id === id ? { ...b, text: value } : b))
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

  const removeBlock = (id) => {
    setBlocks((prev) =>
      prev.length > 1 ? prev.filter((b) => b.id !== id) : prev
    );
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
    const text = blocks
      .filter((b) => b.type === "text")
      .map((b) => b.text || "")
      .join(" ");
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }, [blocks]);

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
    const res = await fetchWithTimeout("epaper");
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

    await fetchWithTimeout("epaper", {
      method: "POST",
      body: formData,
    });

    setEpaperTitle("");
    setEpaperFile(null);
    loadEpaper();
    alert("E-paper uploaded successfully ✅");
  };

  const deleteEpaper = async (id) => {
    if (!window.confirm("Delete this e-paper?")) return;
    await fetchWithTimeout(`epaper/${id}`, {
      method: "DELETE",
    });
    loadEpaper();
  };

  /* ================= QUICK TOGGLE ================= */
  const togglePublish = async (n) => {
    await fetchWithTimeout(`news/${n._id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: n.status === "published" ? "draft" : "published",
      }),
    });
    loadNews();
  };

  return (
    <div className="admin-wrapper">
      {/* HEADER */}
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome Admin</p>
        </div>
        <div className="admin-actions">
          <button
            className="btn"
            onClick={() => {
              addArticleRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Add Article
          </button>
          <button
            className="btn danger"
            onClick={() => {
              localStorage.removeItem("adminToken");
              navigate("/");
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
        {["all", "published", "draft"].map((s) => (
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
          {lastSaved && (
            <span>Autosaved: {lastSaved.toLocaleTimeString()}</span>
          )}
        </div>

        <div className="add-news-grid">
          <div className="form-left">
            <label className="field-label">Title</label>
            <input
              placeholder="News Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

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
                        ↑
                      </button>
                      <button
                        type="button"
                        className="block-move"
                        onClick={() => moveBlock(block.id, 1)}
                        title="Move down"
                      >
                        ↓
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
                    <textarea
                      rows="5"
                      placeholder="Write text..."
                      value={block.text}
                      onChange={(e) => updateBlockText(block.id, e.target.value)}
                    />
                  )}

                  {(block.type === "image" || block.type === "video") && (
                    <div className="block-media">
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
                        onChange={(e) =>
                          setBlocks((prev) =>
                            prev.map((b) =>
                              b.id === block.id ? { ...b, url: e.target.value } : b
                            )
                          )
                        }
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
              <option value="published">Publish</option>
              <option value="draft">Save as Draft</option>
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
              {editId ? "Update News" : "Publish News"}
            </button>

            {editId && (
              <button className="btn" onClick={resetForm}>
                Cancel Edit
              </button>
            )}

            <div className="preview-card">
              <div className="preview-head">Live Preview</div>
              <div className="preview-body">
                <div className="preview-title">
                  {title || "News Title Preview"}
                </div>
                <div className="preview-meta">
                  {category} • {status}
                  {featured ? " • Featured" : ""}
                  {breaking ? " • Breaking" : ""}
                </div>
                <div className="preview-content">
                  {previewBlocks.length === 0 && (
                    <div className="preview-empty">Add content blocks to preview.</div>
                  )}
                  {previewBlocks.map((b, i) => (
                    <div key={i} className="preview-block">
                      {b.type === "text" && <p>{b.text || "..."}</p>}
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
                  className="btn small"
                  onClick={() => togglePublish(n)}
                >
                  {n.status === "published" ? "Unpublish" : "Publish"}
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
    </div>
  );
}
