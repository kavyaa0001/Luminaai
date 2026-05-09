import express from "express";
const app = express();

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is working - Connection Stable!" });
});

export default app;
