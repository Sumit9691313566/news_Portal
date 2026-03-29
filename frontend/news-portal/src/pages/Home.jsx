import { Helmet } from "react-helmet-async";
import MainLayout from "../layouts/MainLayout";
import NewsCard from "../components/NewsCard";

export default function Home() {
  return (
    <>
    <Helmet>
      <title>Garud Samachar | Latest Hindi News & Breaking News</title>
      <meta name="description" content="Garud Samachar (गरुड़ समाचार) is your trusted source for the latest news in Hindi. Get breaking news on politics, business, tech, sports, and more." />
      <meta name="keywords" content="Garud Samachar, गरुड़ समाचार, Hindi News, Latest News, Breaking News, Today News, E-Paper, Tech News, Politics News, Garud News" />
    </Helmet>
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
    </>
  );
}
