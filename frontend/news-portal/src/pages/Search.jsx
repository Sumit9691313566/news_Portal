import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/category.css";
import { fetchWithTimeout } from "../services/api";

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [allNews, setAllNews] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  const categories = useMemo(() => {
    const list = allNews
      .map((n) => n.category)
      .filter(Boolean)
      .map((c) => c.trim())
      .filter(Boolean);
    return Array.from(new Set(list));
  }, [allNews]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithTimeout("news");
        const data = await res.json();
        setAllNews(Array.isArray(data) ? data : []);
      } catch {
        setAllNews([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = () => {
    const q = query.trim().toLowerCase();
    setSearched(true);
    if (!q) {
      setResults([]);
      return;
    }
    const filtered = allNews.filter(
      (n) => n.category?.toLowerCase() === q
    );
    setResults(filtered);
  };

  const handleChipClick = (cat) => {
    setQuery(cat);
    setSearched(true);
    const filtered = allNews.filter(
      (n) => n.category?.toLowerCase() === cat.toLowerCase()
    );
    setResults(filtered);
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">News Portal</div>
        <ul className="menu">
          <li onClick={() => navigate("/")}>🏠 होम</li>
          <li onClick={() => navigate("/videos")}>▶️ वीडियो</li>
          <li onClick={() => navigate("/search")}>🔍 सर्च</li>
          <li onClick={() => navigate("/epaper")}>🗞️ ई-पेपर</li>
        </ul>
      </aside>

      <main className="content search-page">
        <h2>Search News</h2>

        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="खबर, टॉपिक, शहर या राज्य खोजें"
            value={query}
            onChange={(e) => {
              const next = e.target.value;
              setQuery(next);
              if (!next.trim()) {
                setSearched(false);
                setResults([]);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          {query && (
            <button
              type="button"
              className="search-clear"
              onClick={() => {
                setQuery("");
                setSearched(false);
                setResults([]);
              }}
            >
              ✕
            </button>
          )}
          <button className="search-btn" onClick={handleSearch}>
            Search
          </button>
        </div>

        {!searched && (
          <>
            <div className="trend-label">ट्रेंडिंग</div>
            <div className="trend-row">
              {(categories.length > 0
                ? categories
                : ["Tech", "Sports", "Politics", "Business", "Entertainment", "Article"]
              ).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className="trend-chip"
                  onClick={() => handleChipClick(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </>
        )}

        {searched && !loading && results.length === 0 && (
          <div className="search-empty">No matching news found.</div>
        )}

        {searched && results.length > 0 && (
          <div className="search-results">
            {results.map((n) => (
              <div key={n._id || n.id} className="search-card">
                <div>
                  <div className="search-title">{n.title}</div>
                  <div className="search-meta">
                    {n.category} • {new Date(n.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {n.mediaUrl && (
                  <img
                    className="search-thumb"
                    src={n.mediaUrl}
                    alt={n.title}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
