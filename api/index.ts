import express from "express";
const app = express();

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is working!" });
});

// Re-importing our actual app logic to see if it bundles
import realApp from "../artifacts/api-server/src/app.js";
app.use(realApp);

export default app;
