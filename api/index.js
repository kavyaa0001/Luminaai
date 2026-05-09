import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend is working via Isolated API folder!',
    timestamp: new Date().toISOString()
  });
});

// For testing purposes, we'll add the real routes back if this works.
export default app;
