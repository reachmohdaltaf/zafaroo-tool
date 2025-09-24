const express = require("express");
const router = express.Router();
const { getNewsByLocation } = require("../services/rssService");

router.get("/", async (req, res) => {
  const locationQuery = req.query.location || "Paonta Sahib";
  try {
    const newsItems = await getNewsByLocation(locationQuery);
    res.json(newsItems);
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

module.exports = router;
