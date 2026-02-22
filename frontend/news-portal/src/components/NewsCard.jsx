export default function NewsCard({ title, summary, time, category }) {
  return (
    <div className="news-card">
      <h3>{title}</h3>
      <p>{summary}</p>
      <small>
        {time} · {category}
      </small>
    </div>
  );
}
