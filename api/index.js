import express from 'express';
const app = express();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is working via ESM JS!' });
});

export default app;
