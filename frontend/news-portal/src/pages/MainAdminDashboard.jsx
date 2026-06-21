import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithTimeout } from "../services/api";
import { fetchVisitorSummary } from "../services/analytics";
import { uploadMediaDirectToCloudinary } from "../utils/cloudinaryUpload";
import RichTextEditor from "../components/RichTextEditor";
import {
  buildStyledTitleHtml,
  getPlainTextTitle,
  sanitizeRichTextHtml,
  sanitizeTitleHtml,
  stripHtml,
} from "../utils/richText";
import "../styles/admin.css";
import {
  getCategoryTitleColor,
  CATEGORY_LIST as SHARED_CATEGORY_LIST,
  DEFAULT_CATEGORY,
  getCategoryLabel,
  normalizeCategoryValue,
} from "../utils/categories";

const CATEGORY_LIST = [
  { value: "National", label: "National" },
  { value: "Business", label: "Business" },
  { value: "Politics", label: "Politics" },
  { value: "Crime", label: "Crime" },
  { value: "World", label: "World" },
  { value: "Article", label: "Article" },
];

const deriveContentFromBlocks = (blocks) =>
  blocks
    .filter((block) => block.type === "text" && block.text)
    .map((block) => stripHtml(block.text))
    .filter(Boolean)
    .join("\n\n");

export default function MainAdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  const [newsList, setNewsList] = useState([]);
  const [deletedNewsList, setDeletedNewsList] = useState([]);
  const [selectedDeletedIds, setSelectedDeletedIds] = useState([]);
  const [reporters, setReporters] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedNews, setSelectedNews] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editTitleColor, setEditTitleColor] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCategory, setEditCategory] = useState(DEFAULT_CATEGORY);
  const [editContent, setEditContent] = useState("");
  const [editFeatured, setEditFeatured] = useState(false);
  const [editBreaking, setEditBreaking] = useState(false);
  const [editBlocks, setEditBlocks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [reporterName, setReporterName] = useState("");
  const [reporterId, setReporterId] = useState("");
  const [reporterPassword, setReporterPassword] = useState("");
  const detailRef = useRef(null);
  const [visitorStats, setVisitorStats] = useState({
    totalVisitors: 0,
    uniqueReaders: 0,
    todayVisitors: 0,
  });

  const loadNews = async () => {
    const res = await fetchWithTimeout("news", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => []);
    setNewsList(Array.isArray(data) ? data : []);
  };

  const loadVisitorStats = async () => {
    try {
      const res = await fetchVisitorSummary(token);
      if (!res.ok) return;
      const data = await res.json();
      setVisitorStats({
        totalVisitors: Number(data?.totalVisitors) || 0,
        uniqueReaders: Number(data?.uniqueReaders) || 0,
        todayVisitors: Number(data?.todayVisitors) || 0,
      });
    } catch {}
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
      const data = await res.json().catch(() => []);
      setDeletedNewsList(Array.isArray(data) ? data : []);
    } catch {
      setDeletedNewsList([]);
    }
  };

  const loadReporters = async () => {
    const res = await fetchWithTimeout("auth/reporters", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => []);
    setReporters(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadNews();
    loadVisitorStats();
    loadReporters();
    loadDeletedNews();
  }, []);

  useEffect(() => {
    if (!selectedNews || !detailRef.current) return;
    detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [selectedNews]);

  const filteredNews = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const byTab = newsList.filter((news) => {
      if (activeTab === "all") return true;
      if (activeTab === "review") {
        return news.status === "draft" || news.status === "pending";
      }
      return news.status === activeTab;
    });

    return byTab.filter((news) => {
      if (!normalizedSearch) return true;
      return getPlainTextTitle(news.title || "").toLowerCase().includes(normalizedSearch);
    });
  }, [activeTab, newsList, search]);

  const publishedNews = newsList.filter((news) => news.status === "published");
  const draftNews = newsList.filter((news) => news.status === "draft");
  const pendingNews = newsList.filter((news) => news.status === "pending");

  const openNewsDetail = (news) => {
    setSelectedNews(news);
    setEditMode(false);
    setEditTitle(news.title || "");
    setEditTitleColor(news.titleColor || "");
    setEditLocation(news.location || "");
    setEditCategory(normalizeCategoryValue(news.category || DEFAULT_CATEGORY));
    setEditContent(news.content || "");
    setEditFeatured(Boolean(news.featured));
    setEditBreaking(Boolean(news.breaking));
    setEditBlocks(
      Array.isArray(news.blocks)
        ? news.blocks.map((block, index) => ({
          id: `${news._id}-${index}`,
            type: block.type,
            text: block.text || "",
            url: block.url || "",
            publicId: block.publicId || "",
            resourceType: block.resourceType || (block.type === "video" ? "video" : "image"),
            thumbnailUrl: block.thumbnailUrl || "",
            thumbnailPublicId: block.thumbnailPublicId || "",
            file: null,
            thumbnailFile: null,
          }))
        : []
    );
  };

  const closeDetail = () => {
    setSelectedNews(null);
    setEditMode(false);
  };

  const refreshAfterMutation = async (preferredId = "") => {
    await loadNews();
    if (!preferredId) return;
    const res = await fetchWithTimeout("news", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => []);
    const updatedNews = Array.isArray(data) ? data.find((item) => item._id === preferredId) : null;
    if (updatedNews) openNewsDetail(updatedNews);
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
      const errorData = await res.json().catch(() => ({}));
      alert(errorData.message || "Status update failed");
      return;
    }

    await refreshAfterMutation(id);
  };

  const saveEdits = async () => {
    if (!selectedNews?._id) return;
    if (!getPlainTextTitle(editTitle).trim()) {
      alert("Title required hai");
      return;
    }

    const formData = new FormData();
    formData.append("title", sanitizeTitleHtml(editTitle));
    formData.append("titleColor", editTitleColor);
    formData.append("location", editLocation);
    formData.append("category", editCategory);
    formData.append("featured", editFeatured);
    formData.append("breaking", editBreaking);
    formData.append("status", selectedNews.status || "draft");

    if (editBlocks.length > 0) {
      const normalizedBlocks = await Promise.all(editBlocks.map(async (block) => {
        if (block.type === "text") {
          return { type: "text", text: sanitizeRichTextHtml(block.text || "") };
        }

        const uploadedMedia = block.file
          ? await uploadMediaDirectToCloudinary(block.file, block.type, token)
          : null;
        const uploadedThumbnail =
          block.type === "video" && block.thumbnailFile
            ? await uploadMediaDirectToCloudinary(block.thumbnailFile, "image", token, {
                portraitImage: true,
              })
            : null;

        return {
          type: block.type,
          url: uploadedMedia?.url || block.url || "",
          publicId: uploadedMedia?.publicId || block.publicId || "",
          resourceType:
            uploadedMedia?.resourceType ||
            block.resourceType ||
            (block.type === "video" ? "video" : "image"),
          fileKey: "",
          thumbnailPublicId:
            block.type === "video"
              ? uploadedThumbnail?.publicId || block.thumbnailPublicId || ""
              : "",
          thumbnailUrl:
            block.type === "video"
              ? uploadedThumbnail?.url || block.thumbnailUrl || ""
              : "",
          thumbnailFileKey: "",
        };
      }));
      formData.append("blocks", JSON.stringify(normalizedBlocks));
      formData.append("content", deriveContentFromBlocks(normalizedBlocks) || "Media content");
    } else {
      formData.append("content", sanitizeRichTextHtml(editContent || ""));
    }

    try {
      setSaving(true);
      const res = await fetchWithTimeout(`news/${selectedNews._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }, editBlocks.some((block) => block.type === "video" && block.file) ? 600000 : 30000);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Update failed");
      }

      await refreshAfterMutation(selectedNews._id);
      setEditMode(false);
      alert("News updated successfully");
    } catch (error) {
      alert(error.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteNews = async (id) => {
    if (!window.confirm("Is news ko delete karna hai?")) return;

    const res = await fetchWithTimeout(`news/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      alert(errorData.message || "Delete failed");
      return;
    }

    if (selectedNews?._id === id) closeDetail();
    await loadNews();
    await loadDeletedNews();
  };

  const deleteDeletedNews = async (id) => {
    if (!window.confirm("Is deleted item ko permanently remove karna hai?")) return;

    const res = await fetchWithTimeout(`news/deleted/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      alert(errorData.message || "Permanent delete failed");
      return;
    }

    await loadDeletedNews();
  };

  const deleteDeletedNewsBulk = async () => {
    if (selectedDeletedIds.length === 0) return;
    if (!window.confirm("Selected deleted news ko permanently delete karna hai?")) return;

    const res = await fetchWithTimeout("news/deleted", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids: selectedDeletedIds }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      alert(errorData.message || "Bulk delete failed");
      return;
    }

    setSelectedDeletedIds([]);
    await loadDeletedNews();
  };

  const createReporter = async () => {
    if (!reporterId.trim() || !reporterPassword.trim()) {
      alert("Reporter ID aur password required hai");
      return;
    }

    const res = await fetchWithTimeout("auth/reporters", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        adminId: reporterId.trim(),
        password: reporterPassword.trim(),
        name: reporterName.trim(),
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      alert(errorData.message || "Reporter create failed");
      return;
    }

    setReporterName("");
    setReporterId("");
    setReporterPassword("");
    await loadReporters();
    alert("Reporter created successfully");
  };

  const deleteReporter = async (id) => {
    if (!window.confirm("Is reporter ko remove karna hai?")) return;

    const res = await fetchWithTimeout(`auth/reporters/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      alert(errorData.message || "Reporter delete failed");
      return;
    }

    await loadReporters();
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
          <p>Approve reporter and sub-admin news, manage all stories, and create reporter accounts.</p>
        </div>
        <div className="visitor-banner" aria-label="Visitor summary">
          <div className="visitor-banner-item">
            <span className="visitor-banner-label">Total Visitors</span>
            <strong>{visitorStats.totalVisitors}</strong>
          </div>
          <div className="visitor-banner-item">
            <span className="visitor-banner-label">Readers</span>
            <strong>{visitorStats.uniqueReaders}</strong>
          </div>
          <div className="visitor-banner-item">
            <span className="visitor-banner-label">Today</span>
            <strong>{visitorStats.todayVisitors}</strong>
          </div>
        </div>
        <div className="admin-actions">
          <button className="btn" onClick={() => navigate("/main-admin/users-news")}>
            यूज़र न्यूज़
          </button>
          <button className="btn" onClick={() => navigate("/admin-dashboard")}>
            Sub Admin Dashboard
          </button>
          <button className="btn" onClick={() => navigate("/login?role=reporter")}>
            Reporter Login
          </button>
          <button className="btn danger" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>All News</h3>
          <p>{newsList.length}</p>
        </div>
        <div className="stat-card">
          <h3>Published</h3>
          <p>{publishedNews.length}</p>
        </div>
        <div className="stat-card">
          <h3>Draft</h3>
          <p>{draftNews.length}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p>{pendingNews.length}</p>
        </div>
      </div>

      <div className="card">
        <h2>Create Reporter</h2>
        <div className="epaper-upload">
          <input
            placeholder="Reporter Name"
            value={reporterName}
            onChange={(event) => setReporterName(event.target.value)}
          />
          <input
            placeholder="Reporter ID"
            value={reporterId}
            onChange={(event) => setReporterId(event.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={reporterPassword}
            onChange={(event) => setReporterPassword(event.target.value)}
          />
          <button className="btn primary" onClick={createReporter}>
            Create Reporter
          </button>
        </div>

        <div className="news-list">
          {reporters.length === 0 && <p className="muted">No reporters created yet.</p>}
          {reporters.map((reporter) => (
            <div className="news-card" key={reporter._id}>
              <div>
                <h3>{reporter.name || reporter.adminId}</h3>
                <small>
                  ID: {reporter.adminId} | Email: {reporter.email}
                </small>
              </div>
              <div className="actions">
                <button className="btn danger small" onClick={() => deleteReporter(reporter._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card filter-bar">
        <input
          placeholder="Search title..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="status-tabs">
        {[
          { key: "all", label: "ALL" },
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
        <h2>All News Management</h2>
        <div className="news-list">
          {filteredNews.length === 0 && <p className="muted">No news found.</p>}

          {filteredNews.map((news) => (
            <div
              className="news-card"
              key={news._id}
              onClick={() => openNewsDetail(news)}
              style={{ cursor: "pointer" }}
            >
              <div>
                <h3>{getPlainTextTitle(news.title) || "Untitled"}</h3>
                <small>
                  {getCategoryLabel(news.category)} | {news.author || news.createdByName || "Admin"} |{" "}
                  {news.createdByRole || "unknown"} | {new Date(news.createdAt).toLocaleString()}
                </small>
                <div className="badges">
                  {news.status === "published" && <span className="badge breaking">Published</span>}
                  {news.status === "draft" && <span className="badge draft">Draft</span>}
                  {news.status === "pending" && <span className="badge featured">Pending</span>}
                </div>
              </div>
              <div className="actions">
                {news.status !== "published" && (
                  <button
                    className="btn small"
                    onClick={(event) => {
                      event.stopPropagation();
                      updateStatus(news._id, "published");
                    }}
                  >
                    Publish
                  </button>
                )}
                <button
                  className="btn small"
                  onClick={(event) => {
                    event.stopPropagation();
                    openNewsDetail(news);
                    setEditMode(true);
                  }}
                >
                  Edit
                </button>
                <button
                  className="btn danger small"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteNews(news._id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedNews && (
        <div className="card" ref={detailRef}>
          <div className="admin-header" style={{ marginBottom: 12 }}>
            <div>
              <h2>News Detail</h2>
              <p>
                {selectedNews.category || "All"} | {selectedNews.author || "Admin"} |{" "}
                {selectedNews.createdByRole || "unknown"} | {new Date(selectedNews.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="admin-actions">
              {!editMode && (
                <button className="btn" onClick={() => setEditMode(true)}>
                  Edit
                </button>
              )}
              <button className="btn danger" onClick={() => deleteNews(selectedNews._id)}>
                Delete
              </button>
              <button className="btn" onClick={closeDetail}>
                Close
              </button>
            </div>
          </div>

          {!editMode && (
            <div className="preview-body">
              <div
                className="preview-title title-rich-output"
                dangerouslySetInnerHTML={{
                  __html:
                    buildStyledTitleHtml(
                      selectedNews.title,
                      selectedNews.titleColor,
                      getCategoryTitleColor(selectedNews.category)
                    ) || "News Title Preview",
                }}
              />
              {selectedNews.location && (
                <div className="preview-location">{selectedNews.location}</div>
              )}

              {Array.isArray(selectedNews.blocks) && selectedNews.blocks.length > 0 ? (
                <div className="preview-content">
                  {selectedNews.blocks.map((block, index) => (
                    <div key={`preview-${index}`} className="preview-block">
                      {block.type === "text" && (
                        <div
                          className="rich-output"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeRichTextHtml(block.text || ""),
                          }}
                        />
                      )}
                      {block.type === "image" && block.url && <img src={block.url} alt="" />}
                      {block.type === "video" && block.url && <video src={block.url} controls />}
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
                  <RichTextEditor
                    value={editTitle}
                    onChange={setEditTitle}
                    placeholder="News Title"
                  />
                </div>

                <label className="field-label">Location</label>
                <input
                  className="location-input"
                  value={editLocation}
                  onChange={(event) => setEditLocation(event.target.value)}
                  placeholder="भिंड, मध्य प्रदेश |"
                />
                <div className="field-help">Example: भिंड, मध्य प्रदेश |</div>

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
                                prev.map((item) =>
                                  item.id === block.id ? { ...item, text: nextHtml } : item
                                )
                              )
                            }
                            placeholder="Edit text block..."
                          />
                        )}

                        {(block.type === "image" || block.type === "video") && (
                          <div className="block-media">
                            <input
                              type="file"
                              accept={block.type === "image" ? "image/*" : "video/*"}
                              onChange={(event) => {
                                const file = event.target.files?.[0] || null;
                                setEditBlocks((prev) =>
                                  prev.map((item) =>
                                    item.id === block.id
                                      ? {
                                          ...item,
                                          file,
                                          url: file ? URL.createObjectURL(file) : item.url,
                                          publicId: file ? "" : item.publicId,
                                        }
                                      : item
                                  )
                                );
                              }}
                            />
                            <input
                              type="text"
                              placeholder="Image/video URL"
                              value={block.url || ""}
                              onChange={(event) =>
                                setEditBlocks((prev) =>
                                  prev.map((item) =>
                                    item.id === block.id
                                      ? {
                                          ...item,
                                          url: event.target.value,
                                          file: null,
                                        }
                                      : item
                                  )
                                )
                              }
                            />
                            {block.type === "video" && (
                              <div className="video-thumbnail-row">
                                <label className="field-label">Video thumbnail (optional)</label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) => {
                                    const file = event.target.files?.[0] || null;
                                    setEditBlocks((prev) =>
                                      prev.map((item) =>
                                        item.id === block.id
                                          ? {
                                              ...item,
                                              thumbnailFile: file,
                                              thumbnailUrl: file
                                                ? URL.createObjectURL(file)
                                                : item.thumbnailUrl,
                                              thumbnailPublicId: file ? "" : item.thumbnailPublicId,
                                            }
                                          : item
                                      )
                                    );
                                  }}
                                />
                                {block.thumbnailUrl && (
                                  <button
                                    type="button"
                                    className="btn small"
                                    onClick={() =>
                                      setEditBlocks((prev) =>
                                        prev.map((item) =>
                                          item.id === block.id
                                            ? {
                                                ...item,
                                                thumbnailFile: null,
                                                thumbnailUrl: "",
                                                thumbnailPublicId: "",
                                              }
                                            : item
                                        )
                                      )
                                    }
                                  >
                                    Remove thumbnail
                                  </button>
                                )}
                              </div>
                            )}
                            {block.type === "image" && block.url && (
                              <img src={block.url} alt="" />
                            )}
                            {block.type === "video" && block.thumbnailUrl && (
                              <img
                                className="video-thumbnail-preview"
                                src={block.thumbnailUrl}
                                alt="video thumbnail preview"
                              />
                            )}
                            {block.type === "video" && block.url && (
                              <video
                                src={block.url}
                                poster={block.thumbnailUrl || undefined}
                                controls
                              />
                            )}
                          </div>
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
                <select value={editCategory} onChange={(event) => setEditCategory(event.target.value)}>
                  {SHARED_CATEGORY_LIST.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>

                <label className="checkbox field-label">
                  <input
                    type="checkbox"
                    checked={editFeatured}
                    onChange={(event) => setEditFeatured(event.target.checked)}
                  />
                  Featured News
                </label>

                <label className="checkbox field-label">
                  <input
                    type="checkbox"
                    checked={editBreaking}
                    onChange={(event) => setEditBreaking(event.target.checked)}
                  />
                  Breaking News
                </label>

                <button className="btn primary full-btn" onClick={saveEdits} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                {selectedNews.status !== "published" && (
                  <button className="btn" onClick={() => updateStatus(selectedNews._id, "published")}>
                    Publish This News
                  </button>
                )}
                <button className="btn" onClick={() => setEditMode(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
                  onChange={(event) => {
                    if (event.target.checked) {
                      setSelectedDeletedIds(deletedNewsList.map((item) => item._id));
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
              {deletedNewsList.map((item) => (
                <div className="news-card" key={item._id}>
                  <div>
                    <h3>{item.title}</h3>
                    <small>
                      {item.category || "All"} |{" "}
                      {item.deletedAt ? new Date(item.deletedAt).toLocaleString() : "Deleted"}
                    </small>
                    <div className="badges">
                      <span className="badge draft">Deleted</span>
                      {item.deletedReason === "retention" && (
                        <span className="badge featured">Auto</span>
                      )}
                    </div>
                  </div>
                  <div className="actions">
                    <label className="deleted-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedDeletedIds.includes(item._id)}
                        onChange={(event) => {
                          setSelectedDeletedIds((prev) =>
                            event.target.checked
                              ? [...prev, item._id]
                              : prev.filter((id) => id !== item._id)
                          );
                        }}
                      />
                    </label>
                    <button
                      className="btn danger small"
                      onClick={() => deleteDeletedNews(item._id)}
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
    </div>
  );
}
