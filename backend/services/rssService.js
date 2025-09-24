const Parser = require("rss-parser");
const parser = new Parser();

async function getNewsByLocation(location) {
  const RSS_URL = `https://news.google.com/rss/search?q=${encodeURIComponent(
    location
  )}&hl=hi&gl=IN&ceid=IN:hi`;

  const feed = await parser.parseURL(RSS_URL);

  const newsItems = feed.items.map((item, index) => ({
    id: index + 1,
    title: item.title,
    link: item.link,
    date: item.pubDate,
    content: item.contentSnippet || "",
    location: location,
  }));

  return newsItems;
}

module.exports = { getNewsByLocation };
