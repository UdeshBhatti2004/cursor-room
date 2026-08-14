import dns from 'node:dns';


dns.setServers(['8.8.8.8', '1.1.1.1']);

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import { attachYjsWebSocketServer } from './ws/yjsServer.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

// Serve React frontend
app.use(express.static('public'));

app.get("/api/health", (req, res) => {
  console.log("===== HEALTH CHECK HIT =====");

  res.status(200).json({
    ok: true,
    port: PORT,
    time: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// React Router fallback
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = http.createServer(app);

attachYjsWebSocketServer(server);

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`[server] listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[server] failed to connect to MongoDB", err);
    process.exit(1);
  });