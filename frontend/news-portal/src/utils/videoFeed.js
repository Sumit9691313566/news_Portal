export const fallbackVideos = [
  {
    id: "fallback-1",
    title: "डेमो वीडियो 1",
    summary: "यह डेमो वीडियो कार्ड लेआउट है।",
    category: "Article",
    mediaUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    mediaType: "video",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    title: "डेमो वीडियो 2",
    summary: "यह डेमो वीडियो कार्ड लेआउट है।",
    category: "Article",
    mediaUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    mediaType: "video",
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-3",
    title: "डेमो वीडियो 3",
    summary: "यह डेमो वीडियो कार्ड लेआउट है।",
    category: "Article",
    mediaUrl: "https://images.unsplash.com/photo-1522199710521-72d69614c702",
    mediaType: "video",
    createdAt: new Date().toISOString(),
  },
];

export const normalizeVideosFromNews = (list = []) => {
  return list.flatMap((newsItem) => {
    const blocks = Array.isArray(newsItem.blocks) ? newsItem.blocks : [];
    const summaryFromBlocks = blocks
      .filter((block) => block.type === "text" && block.text)
      .map((block) => block.text.trim())
      .filter(Boolean)
      .join(" ");

    const summary = (newsItem.content || summaryFromBlocks || "").trim();
    const baseId = newsItem._id || newsItem.id;
    const items = [];

    if (newsItem.mediaType === "video" && newsItem.mediaUrl) {
      items.push({
        id: `${baseId || "video"}-main`,
        title: newsItem.title,
        summary,
        mediaUrl: newsItem.mediaUrl,
        mediaType: "video",
        category: newsItem.category || "Article",
        createdAt: newsItem.createdAt,
        newsId: baseId,
      });
    }

    blocks.forEach((block, index) => {
      if (block.type === "video" && block.url) {
        items.push({
          id: `${baseId || "block"}-${index}`,
          title: newsItem.title,
          summary,
          mediaUrl: block.url,
          mediaType: "video",
          category: newsItem.category || "Article",
          createdAt: newsItem.createdAt,
          newsId: baseId,
        });
      }
    });

    return items;
  });
};
