import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

import invoiceRoutes from './routes/invoiceRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure required directories exist
['uploads', 'logs'].forEach(dir => {
  const dirPath = join(__dirname, dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/invoices', invoiceRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    service: 'FinFlow AI Backend',
    version: '1.0.0',
    model: process.env.OPENROUTER_MODEL || '~google/gemini-flash-latest',
    apiConfigured: !!process.env.OPENROUTER_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[FinFlow Error]', err.message);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 FinFlow AI Server running on port ${PORT}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🤖 AI Model: ${process.env.OPENROUTER_MODEL || '~google/gemini-flash-latest'}`);
  console.log(`🔑 API Key: ${process.env.OPENROUTER_API_KEY ? 'Configured ✓' : 'Not configured ✗'}\n`);
});

export default app;
