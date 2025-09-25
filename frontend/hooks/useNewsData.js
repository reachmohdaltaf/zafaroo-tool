// hooks/useNewsData.js
import { useState } from 'react';

export const useNewsData = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async (location) => {
    setLoading(true);
    try {
      const query = location ? `?location=${encodeURIComponent(location)}` : "";
      
      const baseURL = window.location.hostname === "localhost"
        ? "http://localhost:5000/api/news"
        : "/api/news";

      const response = await fetch(`${baseURL}${query}`);
      const data = await response.json();
      setNews(data);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  return { news, loading, fetchNews };
};
