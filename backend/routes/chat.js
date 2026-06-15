'use strict';
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ── START / GET CHAT ROOM ─────────────────────────────────────────────────────
router.post('/room', authMiddleware, (req, res) => {
  const { subject } = req.body;
  // Each customer gets one open room; reuse if exists
  let room = db.prepare(`SELECT * FROM chat_rooms WHERE user_id = ? AND status = 'open' ORDER BY created_at DESC LIMIT 1`).get(req.user.id);

  if (!room) {
    const roomId = uuidv4();
    db.prepare(`INSERT INTO chat_rooms (id, user_id, subject) VALUES (?, ?, ?)`)
      .run(roomId, req.user.id, subject || 'General Inquiry');
    room = db.prepare('SELECT * FROM chat_rooms WHERE id = ?').get(roomId);
  }

  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name, u.role as sender_role_name
    FROM chat_messages m JOIN users u ON m.sender_id = u.id
    WHERE m.room_id = ?
    ORDER BY m.created_at ASC
  `).all(room.id);

  res.json({ success: true, room, messages });
});

// ── GET MY ROOMS (customer) ───────────────────────────────────────────────────
router.get('/my-rooms', authMiddleware, (req, res) => {
  const rooms = db.prepare(`
    SELECT r.*, 
      (SELECT COUNT(*) FROM chat_messages WHERE room_id = r.id AND is_read = 0 AND sender_role = 'admin') as unread
    FROM chat_rooms r
    WHERE r.user_id = ?
    ORDER BY r.updated_at DESC
  `).all(req.user.id);
  res.json({ success: true, rooms });
});

// ── GET ALL ROOMS (admin) ─────────────────────────────────────────────────────
router.get('/rooms', authMiddleware, adminOnly, (req, res) => {
  const rooms = db.prepare(`
    SELECT r.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
      (SELECT COUNT(*) FROM chat_messages WHERE room_id = r.id AND is_read = 0 AND sender_role = 'customer') as unread,
      (SELECT message FROM chat_messages WHERE room_id = r.id ORDER BY created_at DESC LIMIT 1) as last_message
    FROM chat_rooms r JOIN users u ON r.user_id = u.id
    ORDER BY r.updated_at DESC
  `).all();
  res.json({ success: true, rooms });
});

// ── GET MESSAGES FOR A ROOM ───────────────────────────────────────────────────
router.get('/room/:roomId/messages', authMiddleware, (req, res) => {
  const room = db.prepare('SELECT * FROM chat_rooms WHERE id = ?').get(req.params.roomId);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

  // Only room owner or admin can read
  if (room.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  // Mark messages as read
  if (req.user.role === 'admin') {
    db.prepare(`UPDATE chat_messages SET is_read = 1 WHERE room_id = ? AND sender_role = 'customer'`).run(req.params.roomId);
  } else {
    db.prepare(`UPDATE chat_messages SET is_read = 1 WHERE room_id = ? AND sender_role = 'admin'`).run(req.params.roomId);
  }

  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name
    FROM chat_messages m JOIN users u ON m.sender_id = u.id
    WHERE m.room_id = ?
    ORDER BY m.created_at ASC
  `).all(req.params.roomId);

  res.json({ success: true, messages });
});

// ── SEND MESSAGE ──────────────────────────────────────────────────────────────
router.post('/room/:roomId/send', authMiddleware, (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message cannot be empty' });
  }

  const room = db.prepare('SELECT * FROM chat_rooms WHERE id = ?').get(req.params.roomId);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  if (room.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const msgId = uuidv4();
  db.prepare(`INSERT INTO chat_messages (id, room_id, sender_id, sender_role, message) VALUES (?, ?, ?, ?, ?)`)
    .run(msgId, req.params.roomId, req.user.id, req.user.role, message.trim());

  db.prepare(`UPDATE chat_rooms SET updated_at = datetime('now') WHERE id = ?`).run(req.params.roomId);

  const msg = db.prepare(`
    SELECT m.*, u.name as sender_name
    FROM chat_messages m JOIN users u ON m.sender_id = u.id
    WHERE m.id = ?
  `).get(msgId);

  res.json({ success: true, message: msg });
});

// ── CLOSE ROOM (admin) ────────────────────────────────────────────────────────
router.put('/room/:roomId/close', authMiddleware, adminOnly, (req, res) => {
  db.prepare(`UPDATE chat_rooms SET status = 'closed', updated_at = datetime('now') WHERE id = ?`).run(req.params.roomId);
  res.json({ success: true, message: 'Chat room closed' });
});

// ── REOPEN ROOM (customer) ────────────────────────────────────────────────────
router.put('/room/:roomId/reopen', authMiddleware, (req, res) => {
  const room = db.prepare('SELECT * FROM chat_rooms WHERE id = ?').get(req.params.roomId);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
  if (room.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  db.prepare(`UPDATE chat_rooms SET status = 'open', updated_at = datetime('now') WHERE id = ?`).run(req.params.roomId);
  res.json({ success: true, message: 'Chat room reopened' });
});

module.exports = router;
