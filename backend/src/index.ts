import express from 'express';
import cors from 'cors';
import path from 'path';

import publicRoutes from './routes/public.routes';
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';

import { authMiddleware } from './middlewares/auth.middleware';

export const app = express();
const PORT = process.env.PORT || 3000;

const parseAllowedOrigins = () => {
  const envVal = process.env.CORS_ORIGIN;
  if (envVal) {
    return envVal.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://localhost:3000'];
};

const allowedOrigins = parseAllowedOrigins();

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server or same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

// Static files (frontend & audio uploads)
// Cache control for audio files as requested in plan
app.use('/uploads', express.static(path.join(__dirname, '../../uploads'), {
  maxAge: '1y',
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

app.use('/assets', express.static(path.join(__dirname, '../../assets')));

// API Routes
app.use('/api', publicRoutes);
app.use('/api', authRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);

// Optional Static Serve for built React frontend
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// We map frontend routes to index.html to allow React Router to handle them.
// But we must NOT intercept /api routes, which we haven't here since it's at the end.
app.get(/(.*)/, (req, res) => {
  // Only send index.html if it exists, otherwise it will crash in dev mode
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Not Found');
    }
  });
});

if (process.env.NODE_ENV !== 'test' && !process.argv.some(arg => arg.includes('test'))) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
