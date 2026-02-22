import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/category.css";
import { fetchWithTimeout } from "../services/api";

export default function EPaper() {
  const navigate = useNavigate();
  const [epapers, setEpapers] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithTimeout("epaper");
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setEpapers(list);
      } catch {
        setEpapers([]);
      }
    };
    load();
  }, []);

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

      <main className="content media-page">
        <h2>E-Paper</h2>

        {epapers.length === 0 && <p>No e-paper uploaded yet.</p>}

        {epapers.length > 0 && (
          <div className="media-grid">
            {epapers.map((e) => (
              <div
                key={e._id}
                className="media-card"
                onClick={() =>
                  navigate(`/epaper/${e._id}`, {
                    state: { epaper: e },
                  })
                }
                style={{ cursor: "pointer" }}
              >
                <div className="media-thumb">
                  {e.fileType === "image" ? (
                    <img src={e.fileUrl} alt={e.title} />
                  ) : (
                    <div className="pdf-thumb">PDF</div>
                  )}
                </div>
                <h3>{e.title}</h3>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
