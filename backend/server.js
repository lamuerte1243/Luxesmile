'use strict';
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('./database/db');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'luxesmile_jwt_secret_2024';

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files — serve Luxesmile V3 assets (css, js, images)
const STATIC_SITE = path.join(__dirname, '..', 'Luxesmile V3');
app.use(express.static(STATIC_SITE));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API ROUTES ────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/contact', require('./routes/contact'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Luxesmile API is running', version: '2.0.0', time: new Date().toISOString() });
});

// ── HTML PAGE ROUTES ──────────────────────────────────────────────────────────
const STATIC_DIR = STATIC_SITE;

const pages = ['index', 'services', 'blog', 'blog_single', 'shop', 'contact', 'careers'];
pages.forEach(page => {
  app.get(`/${page === 'index' ? '' : page}`, (req, res) => {
    res.sendFile(path.join(STATIC_DIR, `${page}.html`));
  });
  app.get(`/${page}.html`, (req, res) => {
    res.sendFile(path.join(STATIC_DIR, `${page}.html`));
  });
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'dashboard.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'admin.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'login.html'));
});
app.get('/signup', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'signup.html'));
});

// Fallback to index
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

// ── SOCKET.IO — REAL-TIME CHAT ─────────────────────────────────────────────────
const connectedUsers = new Map(); // userId -> socketId

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(decoded.userId);
    if (!user) return next(new Error('User not found'));
    socket.user = user;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const user = socket.user;
  connectedUsers.set(user.id, socket.id);
  console.log(`🔌 ${user.name} (${user.role}) connected`);

  // Join personal room
  socket.join(`user:${user.id}`);
  if (user.role === 'admin') socket.join('admin-room');

  // Broadcast online status
  io.emit('user:online', { userId: user.id, name: user.name });

  // ── JOIN CHAT ROOM ──
  socket.on('chat:join', (roomId) => {
    const room = db.prepare('SELECT * FROM chat_rooms WHERE id = ?').get(roomId);
    if (!room) return socket.emit('error', 'Room not found');
    if (room.user_id !== user.id && user.role !== 'admin') return socket.emit('error', 'Access denied');
    socket.join(`room:${roomId}`);
    socket.emit('chat:joined', { roomId });
  });

  // ── SEND MESSAGE ──
  socket.on('chat:send', (data) => {
    const { roomId, message } = data;
    if (!message?.trim() || !roomId) return;

    const room = db.prepare('SELECT * FROM chat_rooms WHERE id = ?').get(roomId);
    if (!room) return socket.emit('error', 'Room not found');
    if (room.user_id !== user.id && user.role !== 'admin') return socket.emit('error', 'Access denied');

    const msgId = uuidv4();
    db.prepare(`INSERT INTO chat_messages (id, room_id, sender_id, sender_role, message) VALUES (?, ?, ?, ?, ?)`)
      .run(msgId, roomId, user.id, user.role, message.trim());
    db.prepare(`UPDATE chat_rooms SET updated_at = datetime('now') WHERE id = ?`).run(roomId);

    const msg = db.prepare(`
      SELECT m.*, u.name as sender_name
      FROM chat_messages m JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(msgId);

    // Broadcast to the room
    io.to(`room:${roomId}`).emit('chat:message', msg);

    // Notify admin room if customer sent message
    if (user.role === 'customer') {
      io.to('admin-room').emit('chat:new_customer_message', {
        roomId, customerName: user.name, message: message.trim(), time: msg.created_at
      });
    } else {
      // Notify the customer
      io.to(`user:${room.user_id}`).emit('chat:admin_reply', {
        roomId, message: message.trim(), time: msg.created_at
      });
    }
  });

  // ── TYPING INDICATOR ──
  socket.on('chat:typing', (data) => {
    socket.to(`room:${data.roomId}`).emit('chat:typing', { userId: user.id, name: user.name, isTyping: data.isTyping });
  });

  // ── DISCONNECT ──
  socket.on('disconnect', () => {
    connectedUsers.delete(user.id);
    io.emit('user:offline', { userId: user.id });
    console.log(`🔌 ${user.name} disconnected`);
  });
});

// ── START SERVER ──────────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🦷 Luxesmile API Server running on port ${PORT}`);
  console.log(`📦 Database: ${process.env.DB_PATH || './database/luxesmile.db'}`);
  console.log(`🌍 http://localhost:${PORT}\n`);
});

module.exports = { app, server, io };
