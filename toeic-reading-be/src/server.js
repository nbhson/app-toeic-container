import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import toeicRoutes from './routes/toeic.routes.js';
import keysRoutes from './routes/keys.routes.js';
import statsRoutes from './routes/stats.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/toeic', toeicRoutes);
app.use('/api/toeic/keys', keysRoutes);
app.use('/api/toeic/stats', statsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`TOEIC Reading BE server is running on http://localhost:${PORT}`);
});