import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithTimeout } from "../services/api";
import RichTextEditor from "../components/RichTextEditor";
import { sanitizeRichTextHtml, stripHtml } from "../utils/richText";
import "../styles/admin.css";

const CATEGORY_LIST = [
  { value: "National", label: "राष्ट्रीय" },
  { value: "Business", label: "बिजनेस" },
  { value: "Politics", label: "राजनीति" },
  { value: "Sports", label: "खेल" },
  { value: "Tech", label: "टेक" },
  { value: "Entertainment", label: "मनोरंजन" },
  { value: "World", label: "दुनिया" },
  { value: "Article", label: "आर्टिकल" },
];

const deriveContentFromBlocks = (blocks) =>
  blocks
    .filter((b) => b.type === "text" && b.text)
    .map((b) => stripHtml(b.text))
    .filter(Boolean)
    .join("\n\n");

export default function MainAdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");
  const [newsList, setNewsList] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("review");

  const [selectedNews, setSelectedNews] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editTitleColor, setEditTitleColor] = useState("#1f2937");
  const [editCategory, setEditCategory] = useState("Tech");
  const [editContent, setEditContent] = useState("");
  const [editFeatured, setEditFeatured] = useState(false);
  const [editBreaking, setEditBreaking] = useState(false);
  const [editBlocks, setEditBlocks] = useState([]);
  const [saving, setSaving] = useState(false);

  const loadNews = async () => {
    const res = await fetchWithTimeout("news", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setNewsList(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadNews();
  }, []);

  const reviewNews = useMemo(
    () =>
      newsList.filter(
        (n) =>
          (n.status === "draft" || n.status === "pending") &&
          (!search || n.title.toLowerCase().includes(search.toLowerCase()))
      ),
    [newsList, search]
  );

  const publishedNews = useMemo(
    () =>
      newsList.filter(
        (n) =>
          n.status === "published" &&
          (!search || n.title.toLowerCase().includes(search.toLowerCase()))
      ),
    [newsList, search]
  );

  const draftNews = useMemo(
    () =>
      newsList.filter(
        (n) =>
          n.status === "draft" &&
          (!search || n.title.toLowerCase().includes(search.toLowerCase()))
      ),
    [newsList, search]
  );

  const pendingNews = useMemo(
    () =>
      newsList.filter(
        (n) =>
          n.status === "pending" &&
          (!search || n.title.toLowerCase().includes(search.toLowerCase()))
      ),
    [newsList, search]
  );

  const currentList =
    activeTab === "review"
      ? reviewNews
      : activeTab === "published"
      ? publishedNews
      : activeTab === "draft"
      ? draftNews
      : pendingNews;

  const openNewsDetail = (news) => {
    setSelectedNews(news);
    setEditMode(false);
    setEditTitle(news.title || "");
    setEditTitleColor(news.titleColor || "#1f2937");
    setEditCategory(news.category || "Tech");
    setEditContent(news.content || "");
    setEditFeatured(Boolean(news.featured));
    setEditBreaking(Boolean(news.breaking));
    setEditBlocks(
      Array.isArray(news.blocks)
        ? news.blocks.map((b, i) => ({
            id: `${news._id}-${i}`,
            type: b.type,
            text: b.text || "",
            url: b.url || "",
          }))
        : []
    );
  };

  const closeDetail = () => {
    setSelectedNews(null);
    setEditMode(false);
  };

  const updateStatus = async (id, status) => {
    const res = await fetchWithTimeout(`news/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.message || "Status update failed");
      return;
    }

    const updated = await res.json().catch(() => null);
    await loadNews();
    if (updated?._id && selectedNews?._id === updated._id) {
      openNewsDetail(updated);
    }
  };

  const saveEdits = async () => {
    if (!selectedNews?._id) return;
    if (!editTitle.trim()) {
      alert("Title required hai");
      return;
    }

    const payload = {
      title: editTitle.trim(),
      titleColor: editTitleColor,
      category: editCategory,
      featured: editFeatured,
      breaking: editBreaking,
      status: selectedNews.status || "draft",
    };

    if (editBlocks.length > 0) {
      const normalizedBlocks = editBlocks.map((b) =>
        b.type === "text"
          ? { type: "text", text: sanitizeRichTextHtml(b.text || "") }
          : { type: b.type, url: b.url || "" }
      );
      payload.blocks = normalizedBlocks;
      payload.content = deriveContentFromBlocks(normalizedBlocks) || "Media content";
    } else {
      payload.content = sanitizeRichTextHtml(editContent || "");
    }

    try {
      setSaving(true);
      const res = await fetchWithTimeout(`news/${selectedNews._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Update failed");
      }

      const updated = await res.json().catch(() => null);
      await loadNews();
      if (updated?._id) {
        openNewsDetail(updated);
      }
      setEditMode(false);
      alert("News updated successfully");
    } catch (error) {
      alert(error.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminEmail");
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-wrapper">
      <div className="admin-header">
        <div>
          <h1>Main Admin</h1>
          <p>Sub-admin uploads stay in draft until you publish</p>
        </div>
        <div className="admin-actions">
          <button className="btn" onClick={() => navigate("/admin-dashboard")}>
            Sub Admin Dashboard
          </button>
          <button className="btn danger" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Review Queue</h3>
          <p>{reviewNews.length}</p>
        </div>
        <div className="stat-card">
          <h3>Published</h3>
          <p>{publishedNews.length}</p>
        </div>
        <div className="stat-card">
          <h3>Draft</h3>
          <p>{draftNews.length}</p>
        </div>
      </div>

      <div className="card filter-bar">
        <input
          placeholder="Search title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="status-tabs">
        {[
          { key: "review", label: "REVIEW" },
          { key: "published", label: "PUBLISHED" },
          { key: "draft", label: "DRAFT" },
          { key: "pending", label: "PENDING" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? "active" : ""}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card">
        <h2>
          {activeTab === "review"
            ? "Review Queue (Draft + Pending)"
            : activeTab === "published"
            ? "Published News"
            : activeTab === "draft"
            ? "Draft News"
            : "Pending News"}
        </h2>

        <div className="news-list">
          {currentList.length === 0 && <p className="muted">No news found.</p>}

          {currentList.map((n) => (
            <div
              className="news-card"
              key={n._id}
              onClick={() => openNewsDetail(n)}
              style={{ cursor: "pointer" }}
            >
              <div>
                <h3>{n.title}</h3>
                <small>
                  {n.category || "All"} • {n.author || "Admin"} •{" "}
                  {new Date(n.createdAt).toLocaleString()}
                </small>
                <div className="badges">
                  {n.status === "pending" && (
                    <span className="badge featured">Pending</span>
                  )}
                  {n.status === "published" && (
                    <span className="badge breaking">Published</span>
                  )}
                  {n.status === "draft" && <span className="badge draft">Draft</span>}
                </div>
              </div>

              <div className="actions">
                {n.status !== "published" && (
                  <button
                    className="btn small"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatus(n._id, "published");
                    }}
                  >
                    Publish
                  </button>
                )}
                {n.status !== "draft" && (
                  <button
                    className="btn small"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatus(n._id, "draft");
                    }}
                  >
                    Move Draft
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedNews && (
        <div className="card">
          <div className="admin-header" style={{ marginBottom: 12 }}>
            <div>
              <h2>News Detail</h2>
              <p>
                {selectedNews.category || "All"} • {selectedNews.author || "Admin"} •{" "}
                {new Date(selectedNews.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="admin-actions">
              {!editMode && (
                <button className="btn" onClick={() => setEditMode(true)}>
                  Edit
                </button>
              )}
              <button className="btn" onClick={closeDetail}>
                Close
              </button>
            </div>
          </div>

          {!editMode && (
            <div className="preview-body">
              <div
                className="preview-title"
                style={{ color: selectedNews.titleColor || undefined }}
              >
                {selectedNews.title}
              </div>

              {Array.isArray(selectedNews.blocks) && selectedNews.blocks.length > 0 ? (
                <div className="preview-content">
                  {selectedNews.blocks.map((b, i) => (
                    <div key={`view-${i}`} className="preview-block">
                      {b.type === "text" && (
                        <div
                          className="rich-output"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeRichTextHtml(b.text || ""),
                          }}
                        />
                      )}
                      {b.type === "image" && b.url && <img src={b.url} alt="" />}
                      {b.type === "video" && b.url && <video src={b.url} controls />}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="rich-output"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeRichTextHtml(selectedNews.content || ""),
                  }}
                />
              )}
            </div>
          )}

          {editMode && (
            <div className="add-news-grid">
              <div className="form-left">
                <label className="field-label">Title</label>
                <div className="title-editor-row">
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="News Title"
                  />
                  <label className="title-color-control" title="Title color">
                    <span>Color</span>
                    <input
                      type="color"
                      value={editTitleColor}
                      onChange={(e) => setEditTitleColor(e.target.value)}
                    />
                  </label>
                </div>

                {editBlocks.length > 0 ? (
                  <div className="blocks-editor">
                    {editBlocks.map((block) => (
                      <div key={block.id} className="block">
                        <div className="block-header">
                          <span className="block-type">{block.type}</span>
                        </div>

                        {block.type === "text" && (
                          <RichTextEditor
                            value={block.text}
                            onChange={(nextHtml) =>
                              setEditBlocks((prev) =>
                                prev.map((b) =>
                                  b.id === block.id ? { ...b, text: nextHtml } : b
                                )
                              )
                            }
                            placeholder="Edit text block..."
                          />
                        )}

                        {block.type === "image" && block.url && (
                          <img src={block.url} alt="" style={{ width: "100%", borderRadius: 8 }} />
                        )}
                        {block.type === "video" && block.url && (
                          <video
                            src={block.url}
                            controls
                            style={{ width: "100%", borderRadius: 8 }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <label className="field-label">Content</label>
                    <RichTextEditor
                      value={editContent}
                      onChange={setEditContent}
                      placeholder="Edit full news content..."
                    />
                  </>
                )}
              </div>

              <div className="form-right">
                <label className="field-label">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                >
                  {CATEGORY_LIST.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>

                <label className="checkbox field-label">
                  <input
                    type="checkbox"
                    checked={editFeatured}
                    onChange={(e) => setEditFeatured(e.target.checked)}
                  />
                  Featured News
                </label>

                <label className="checkbox field-label">
                  <input
                    type="checkbox"
                    checked={editBreaking}
                    onChange={(e) => setEditBreaking(e.target.checked)}
                  />
                  Breaking News
                </label>

                <button className="btn primary full-btn" onClick={saveEdits} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button className="btn" onClick={() => setEditMode(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
