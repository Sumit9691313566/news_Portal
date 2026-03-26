import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithTimeout } from "../services/api";
import "../styles/admin.css";
import "../styles/userNews.css";

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "समय उपलब्ध नहीं";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function UserNewsInbox() {
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [savingId, setSavingId] = useState("");
  const [copyId, setCopyId] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    mobileNumber: "",
    city: "",
    message: "",
    status: "new",
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchWithTimeout("user-news", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json().catch(() => []);
        if (!res.ok) {
          throw new Error(data?.message || "यूज़र न्यूज़ लोड नहीं हो पाई।");
        }
        setItems(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setActiveId((prev) => prev || data[0]._id);
        }
        setError("");
      } catch (err) {
        setError(err.message || "यूज़र न्यूज़ लोड नहीं हो पाई।");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      [item.name, item.city, item.mobileNumber, item.message]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [items, search]);

  const activeItem = useMemo(
    () => filteredItems.find((item) => item._id === activeId) || filteredItems[0] || null,
    [activeId, filteredItems]
  );

  const startEditing = (item) => {
    setEditingId(item._id);
    setEditForm({
      name: item.name || "",
      mobileNumber: item.mobileNumber || "",
      city: item.city || "",
      message: item.message || "",
      status: item.status || "new",
    });
  };

  const cancelEditing = () => {
    setEditingId("");
    setEditForm({
      name: "",
      mobileNumber: "",
      city: "",
      message: "",
      status: "new",
    });
  };

  const saveEdit = async (id) => {
    try {
      setSavingId(id);
      const res = await fetchWithTimeout(`user-news/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "यूज़र न्यूज़ अपडेट नहीं हो पाई।");
      }

      setItems((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, ...data.submission } : item
        )
      );
      setActiveId(id);
      cancelEditing();
    } catch (err) {
      setError(err.message || "यूज़र न्यूज़ अपडेट नहीं हो पाई।");
    } finally {
      setSavingId("");
    }
  };

  const deleteItem = async (id) => {
    const confirmed = window.confirm("क्या आप इस यूज़र न्यूज़ को हटाना चाहते हैं?");
    if (!confirmed) return;

    try {
      const res = await fetchWithTimeout(`user-news/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "यूज़र न्यूज़ हटाई नहीं जा सकी।");
      }

      setItems((prev) => prev.filter((item) => item._id !== id));
      setActiveId((prev) => (prev === id ? "" : prev));
      if (editingId === id) cancelEditing();
    } catch (err) {
      setError(err.message || "यूज़र न्यूज़ हटाई नहीं जा सकी।");
    }
  };

  const copyItem = async (item) => {
    const lines = [
      `नाम: ${item.name || "उपलब्ध नहीं"}`,
      `मोबाइल: ${item.mobileNumber || "उपलब्ध नहीं"}`,
      `शहर: ${item.city || "उपलब्ध नहीं"}`,
      `समय: ${formatDateTime(item.createdAt)}`,
      `स्थिति: ${item.status === "reviewed" ? "देख लिया गया" : "नया"}`,
      "",
      `खबर: ${item.message || "कोई टेक्स्ट नहीं दिया गया"}`,
      item.mediaUrl ? `मीडिया: ${item.mediaUrl}` : "",
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyId(item._id);
      window.setTimeout(() => setCopyId(""), 1800);
    } catch {
      setError("कॉपी नहीं हो पाया।");
    }
  };

  const markAsRead = async (item) => {
    try {
      const nextStatus = item.status === "reviewed" ? "new" : "reviewed";
      const res = await fetchWithTimeout(`user-news/${item._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "स्थिति अपडेट नहीं हो पाई।");
      }
      setItems((prev) =>
        prev.map((entry) =>
          entry._id === item._id ? { ...entry, ...data.submission } : entry
        )
      );
    } catch (err) {
      setError(err.message || "स्थिति अपडेट नहीं हो पाई।");
    }
  };

  return (
    <div className="admin-wrapper">
      <div className="admin-header">
        <div>
          <h1>यूज़र न्यूज़</h1>
          <p>पब्लिक यूज़र द्वारा भेजी गई खबरें, फोटो और वीडियो यहां दिखाई देंगी।</p>
        </div>
        <div className="admin-actions">
          <button className="btn" onClick={() => navigate("/main-admin")}>
            मुख्य एडमिन पर वापस जाएं
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>कुल प्रविष्टियां</h3>
          <p>{items.length}</p>
        </div>
        <div className="stat-card">
          <h3>मीडिया सहित</h3>
          <p>{items.filter((item) => item.mediaType && item.mediaType !== "none").length}</p>
        </div>
        <div className="stat-card">
          <h3>सिर्फ टेक्स्ट</h3>
          <p>{items.filter((item) => !item.mediaType || item.mediaType === "none").length}</p>
        </div>
      </div>

      <div className="card filter-bar">
        <input
          type="text"
          placeholder="नाम, शहर, मोबाइल या खबर खोजें..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {activeItem && (
        <div className="card user-news-workbench">
          <div className="user-news-detail-top">
            <div>
              <h2>{activeItem.name || "अज्ञात उपयोगकर्ता"}</h2>
              <div className="user-news-admin-meta">
                <span>{activeItem.city || "शहर साझा नहीं किया गया"}</span>
                <span>{activeItem.mobileNumber || "मोबाइल नंबर साझा नहीं किया गया"}</span>
                <span>{formatDateTime(activeItem.createdAt)}</span>
                <span>
                  {activeItem.status === "reviewed" ? "देख लिया गया" : "नई प्रविष्टि"}
                </span>
              </div>
            </div>
            <span className="user-news-admin-badge">
              {activeItem.mediaType === "image"
                ? "फोटो"
                : activeItem.mediaType === "video"
                ? "वीडियो"
                : "टेक्स्ट"}
            </span>
          </div>

          <div className="user-news-toolbar">
            <button className="btn" type="button" onClick={() => markAsRead(activeItem)}>
              {activeItem.status === "reviewed" ? "फिर से नया करें" : "पढ़ लिया"}
            </button>
            <button className="btn" type="button" onClick={() => copyItem(activeItem)}>
              {copyId === activeItem._id ? "कॉपी हो गया" : "कॉपी करें"}
            </button>
            <button className="btn" type="button" onClick={() => startEditing(activeItem)}>
              संपादित करें
            </button>
            <button className="btn danger" type="button" onClick={() => deleteItem(activeItem._id)}>
              हटाएं
            </button>
          </div>

          {editingId === activeItem._id ? (
            <div className="user-news-edit-grid">
              <label>
                <span>नाम</span>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>मोबाइल नंबर</span>
                <input
                  type="text"
                  value={editForm.mobileNumber}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, mobileNumber: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>शहर / कस्बा</span>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, city: event.target.value }))
                  }
                />
              </label>
              <label>
                <span>स्थिति</span>
                <select
                  value={editForm.status}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, status: event.target.value }))
                  }
                >
                  <option value="new">नई प्रविष्टि</option>
                  <option value="reviewed">देख लिया गया</option>
                </select>
              </label>
              <label className="user-news-edit-message">
                <span>खबर का विवरण</span>
                <textarea
                  rows={8}
                  value={editForm.message}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, message: event.target.value }))
                  }
                />
              </label>
              <div className="user-news-edit-actions">
                <button
                  className="btn primary"
                  type="button"
                  onClick={() => saveEdit(activeItem._id)}
                  disabled={savingId === activeItem._id}
                >
                  {savingId === activeItem._id ? "सहेजा जा रहा है..." : "सहेजें"}
                </button>
                <button className="btn" type="button" onClick={cancelEditing}>
                  रद्द करें
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="user-news-admin-message">
                {activeItem.message || "कोई टेक्स्ट संदेश उपलब्ध नहीं है।"}
              </p>

              {activeItem.mediaUrl && activeItem.mediaType === "image" && (
                <img
                  className="user-news-admin-media"
                  src={activeItem.mediaUrl}
                  alt={activeItem.name || "यूज़र सबमिशन"}
                />
              )}
              {activeItem.mediaUrl && activeItem.mediaType === "video" && (
                <video className="user-news-admin-media" src={activeItem.mediaUrl} controls />
              )}
            </>
          )}
        </div>
      )}

      <div className="card">
        {loading && <p className="muted">यूज़र न्यूज़ लोड हो रही है...</p>}
        {!loading && error && <p className="muted">{error}</p>}
        {!loading && !error && filteredItems.length === 0 && (
          <p className="muted">अभी तक कोई यूज़र न्यूज़ प्राप्त नहीं हुई है।</p>
        )}

        <div className="user-news-admin-list">
          {filteredItems.map((item) => (
            <article
              key={item._id}
              className={`user-news-admin-card ${
                activeItem?._id === item._id ? "user-news-admin-card-active" : ""
              }`}
            >
              <div className="user-news-admin-top">
                <div>
                  <h3>{item.name || "अज्ञात उपयोगकर्ता"}</h3>
                  <div className="user-news-admin-meta">
                    <span>{item.city || "शहर साझा नहीं किया गया"}</span>
                    <span>{item.mobileNumber || "मोबाइल नंबर साझा नहीं किया गया"}</span>
                    <span>{formatDateTime(item.createdAt)}</span>
                  </div>
                </div>
                <span className="user-news-admin-badge">
                  {item.mediaType === "image"
                    ? "फोटो"
                    : item.mediaType === "video"
                    ? "वीडियो"
                    : "टेक्स्ट"}
                </span>
              </div>

              <p className="user-news-admin-message">
                {item.message || "कोई टेक्स्ट संदेश नहीं दिया गया।"}
              </p>

              <div className="user-news-card-actions">
                <button className="btn small" type="button" onClick={() => setActiveId(item._id)}>
                  पढ़ें
                </button>
                <button className="btn small" type="button" onClick={() => copyItem(item)}>
                  {copyId === item._id ? "कॉपी हो गया" : "कॉपी"}
                </button>
                <button className="btn small" type="button" onClick={() => startEditing(item)}>
                  एडिट
                </button>
                <button className="btn danger small" type="button" onClick={() => deleteItem(item._id)}>
                  डिलीट
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
