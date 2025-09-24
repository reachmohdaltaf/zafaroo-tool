const express = require("express");
const cors = require("cors");
const newsRoutes = require("./routes/news");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/news", newsRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
