import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import apiRoutes from './routes/api';
import { errorHandler } from './middleware/errorMiddleware';
import { socketService } from './services/socketService';

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT) || 5000;

// Allowed CORS origins (Development + Production Firebase Hosting domains)
const allowedOrigins = [
  'http://localhost:3005',
  'http://localhost:5000',
  'http://127.0.0.1:3005',
  'http://127.0.0.1:5000',
  'https://dark-falcon-966bc.web.app',
  'https://dark-falcon-966bc.firebaseapp.com',
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
}

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server, webhooks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy violation: Origin ${origin} not allowed.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));
// Static brand assets directory
app.use('/assets', express.static(path.resolve(process.cwd(), 'public/assets')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'Dark Falcon🦅', version: '1.0.0', time: new Date().toISOString() });
});

// Mount API router
app.use('/api', apiRoutes);

// Serve compiled client bundle from dist directory (Single-Page App fallback)
const distDir = path.resolve(process.cwd(), 'dist');
app.use(express.static(distDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/uploads') || req.path.startsWith('/assets')) {
    return next();
  }
  res.sendFile(path.join(distDir, 'index.html'), (err) => {
    if (err) next();
  });
});

// Error handling middleware
app.use(errorHandler);

// Attach Realtime WebSockets to server
socketService.initialize(server);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
🦅 ===================================================
   DARK FALCON SERVER ONLINE
   Connect. Create. Communicate.
   Port: http://localhost:${PORT}
   WebSocket: ws://localhost:${PORT}/ws
   Environment: ${process.env.NODE_ENV || 'development'}
===================================================
  `);
});

export { app, server };


