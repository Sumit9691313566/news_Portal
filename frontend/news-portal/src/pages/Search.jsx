import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import "../styles/category.css";
import { fetchWithTimeout } from "../services/api";
import { searchNews } from "../utils/searchNews";

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
  const location = useLocation();
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
  const topSuggestions = useMemo(() => results.slice(0, 8), [results]);

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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const nextQuery = params.get("q") || "";
    setQuery(nextQuery);
  }, [allNews, location.search]);

  useEffect(() => {
    if (!query.trim()) {
      setSearched(false);
      setResults([]);
      return;
    }

    setSearched(true);
    setResults(searchNews(allNews, query));
  }, [allNews, query]);

  const handleSearch = (rawQuery = query) => {
    const nextQuery = rawQuery.trim();
    const params = new URLSearchParams(location.search);

    if (!nextQuery) {
      params.delete("q");
    } else {
      params.set("q", nextQuery);
    }

    navigate(
      {
        pathname: "/search",
        search: params.toString(),
      },
      { replace: true }
    );
  };

  const handleChipClick = (cat) => {
    setQuery(cat);
    handleSearch(cat);
  };

  const openResult = (news) => {
    const nextCategory = news.category || "All";
    navigate(`/?cat=${encodeURIComponent(nextCategory)}`, {
      state: { openNewsId: news._id || news.id },
    });
  };

  return (
    <div className="layout">
      <Helmet>
        <title>Search News - Garud Samachar</title>
        <meta name="description" content="Search for the latest news articles on Garud Samachar. Find breaking news on politics, business, tech, sports, and more in Hindi." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

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
              Type any news name or keyword to instantly see matching stories from title, content, and category.
            </p>
          </div>

          <div className="search-surface">
            <div className="search-bar">
              <input
                type="text"
                className="search-input"
                placeholder="Search news by title, keyword, or category..."
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
              {query.trim() && topSuggestions.length > 0 && (
                <div className="search-suggestions">
                  {topSuggestions.map((news) => (
                    <button
                      key={`suggestion-${news._id || news.id}`}
                      type="button"
                      className="search-suggestion-item"
                      onClick={() => openResult(news)}
                    >
                      <span className="search-suggestion-title">{news.title}</span>
                      <span className="search-suggestion-meta">
                        {news.category || "General"} • {formatSearchDate(news.createdAt)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
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
            No matching news found. Try a news title, topic keyword, category, or one of the chips above.
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
