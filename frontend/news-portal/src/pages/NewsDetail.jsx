import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

const NEWS_DATA = [
  {
    id: "1",
    title: "AI tools se badal rahi hai software industry",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995",
    content:
      "Naye AI tools developers ki productivity ko kaafi had tak improve kar rahe hain. AI software development ko fast aur efficient bana raha hai.",
    meta: "1h ago · Tech",
  },
  {
    id: "2",
    title: "India me startup funding me fir se tezi",
    image: "https://images.unsplash.com/photo-1556761175-4b46a572b786",
    content:
      "2026 ke shuruaati mahino me startup funding me positive growth dekhi gayi hai. Investors ka confidence wapas aa raha hai.",
    meta: "3h ago · Tech",
  },
  {
    id: "3",
    title: "Smartphones me aayega naya AI feature",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
    content:
      "Aane wale smartphones me on-device AI features honge jo privacy aur performance dono improve karenge.",
    meta: "5h ago · Tech",
  },
];

export default function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const news = NEWS_DATA.find((n) => n.id === id);

  if (!news) return <p>News not found</p>;

  return (
    <MainLayout>
      <div className="news-detail">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Back
        </button>

        <h1>{news.title}</h1>
        <small>{news.meta}</small>

        <img src={news.image} alt="" className="detail-image" />

        <p className="detail-content">{news.content}</p>
      </div>
    </MainLayout>
  );
}
