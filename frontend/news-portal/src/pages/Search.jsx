import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/category.css";
import { fetchWithTimeout } from "../services/api";

const formatSearchDate = (value) => {
  if (!value) return "Latest";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Latest";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

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

  const highlightedResults = useMemo(() => results.slice(0, 3), [results]);

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
    const filtered = allNews.filter((n) => n.category?.toLowerCase() === q);
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

  const openResult = (news) => {
    const nextCategory = news.category || "All";
    navigate(`/?cat=${encodeURIComponent(nextCategory)}`, {
      state: { selectedNewsId: news._id || news.id },
    });
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">News Portal</div>
        <ul className="menu">
          <li onClick={() => navigate("/")}>Home</li>
          <li onClick={() => navigate("/videos")}>Videos</li>
          <li onClick={() => navigate("/search")}>Search</li>
          <li onClick={() => navigate("/epaper")}>E-Paper</li>
        </ul>
      </aside>

      <main className="content search-page">
        <section className="search-hero">
          <div className="search-hero-copy">
            <p className="search-kicker">Discover</p>
            <h2>Search News</h2>
            <p className="search-subtitle">
              Find stories by category and jump straight into the latest coverage.
            </p>
          </div>

          <div className="search-surface">
            <div className="search-bar">
              <input
                type="text"
                className="search-input"
                placeholder="Search by category..."
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
                  x
                </button>
              )}
              <button className="search-btn" onClick={handleSearch}>
                Search
              </button>
            </div>

            {!searched && (
              <>
                <div className="trend-label">Popular Categories</div>
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
          </div>
        </section>

        {loading && <div className="search-empty">Loading latest news...</div>}

        {searched && !loading && results.length === 0 && (
          <div className="search-empty">
            No matching news found. Try another category or pick one of the chips above.
          </div>
        )}

        {searched && results.length > 0 && (
          <>
            <div className="search-summary">
              <div>
                <span className="search-summary-label">Results</span>
                <strong>{results.length} stories found</strong>
              </div>
              <span className="search-summary-query">for "{query}"</span>
            </div>

            <div className="search-results-grid">
              {highlightedResults.map((n) => (
                <button
                  key={`featured-${n._id || n.id}`}
                  type="button"
                  className="search-feature-card"
                  onClick={() => openResult(n)}
                >
                  {n.mediaUrl ? (
                    <img className="search-feature-thumb" src={n.mediaUrl} alt={n.title} />
                  ) : (
                    <div className="search-feature-fallback">{n.category || "News"}</div>
                  )}
                  <div className="search-feature-copy">
                    <span>{n.category || "General"}</span>
                    <h3>{n.title}</h3>
                    <small>{formatSearchDate(n.createdAt)}</small>
                  </div>
                </button>
              ))}
            </div>

            <div className="search-results">
              {results.map((n) => (
                <button
                  key={n._id || n.id}
                  type="button"
                  className="search-card"
                  onClick={() => openResult(n)}
                >
                  <div>
                    <div className="search-title">{n.title}</div>
                    <div className="search-meta">
                      {(n.category || "General")} • {formatSearchDate(n.createdAt)}
                    </div>
                  </div>
                  {n.mediaUrl ? (
                    <img className="search-thumb" src={n.mediaUrl} alt={n.title} />
                  ) : (
                    <div className="search-thumb search-thumb-fallback">
                      {n.category || "News"}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
