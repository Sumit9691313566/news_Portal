import MainLayout from "../layouts/MainLayout";
import NewsCard from "../components/NewsCard";

export default function Home() {
  return (
    <MainLayout>
      <NewsCard
        id={1}
        title="AI tools se badal rahi hai software industry"
        summary="Naye AI tools developers ki productivity ko kaafi had tak improve kar rahe hain."
        time="1h ago"
        category="Tech"
      />

      <NewsCard
        id={2}
        title="India me startup funding me fir se tezi"
        summary="2026 ke shuruaati mahino me startup funding me positive growth dekhi gayi hai."
        time="3h ago"
        category="Tech"
      />

      <NewsCard
        id={3}
        title="Smartphones me aayega naya AI feature"
        summary="Aane wale smartphones me on-device AI features users ke experience ko better banayenge."
        time="5h ago"
        category="Tech"
      />
    </MainLayout>
  );
}
