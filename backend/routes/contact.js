'use strict';
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ── SUBMIT CONTACT MESSAGE ────────────────────────────────────────────────────
router.post('/message', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Name, email and message are required' });
  }
  const id = uuidv4();
  db.prepare(`INSERT INTO contact_messages (id, name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(id, name.trim(), email.toLowerCase().trim(), phone || null, subject || 'General Inquiry', message.trim());
  res.status(201).json({ success: true, message: 'Message received! We\'ll get back to you within 24 hours.' });
});

// ── NEWSLETTER SUBSCRIBE ──────────────────────────────────────────────────────
router.post('/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
  try {
    db.prepare(`INSERT INTO newsletter (id, email) VALUES (?, ?)`).run(uuidv4(), email.toLowerCase().trim());
    res.json({ success: true, message: 'Subscribed! Welcome to the Luxesmile community.' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.json({ success: true, message: 'You\'re already subscribed!' });
    }
    res.status(500).json({ success: false, message: 'Subscription failed' });
  }
});

// ── ALL MESSAGES (admin) ──────────────────────────────────────────────────────
router.get('/messages', authMiddleware, adminOnly, (req, res) => {
  const messages = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
  res.json({ success: true, messages });
});

// ── MARK MESSAGE READ (admin) ─────────────────────────────────────────────────
router.put('/messages/:id/read', authMiddleware, adminOnly, (req, res) => {
  db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run('read', req.params.id);
  res.json({ success: true });
});

// ── ALL NEWSLETTER SUBS (admin) ───────────────────────────────────────────────
router.get('/newsletter/all', authMiddleware, adminOnly, (req, res) => {
  const subs = db.prepare('SELECT * FROM newsletter ORDER BY created_at DESC').all();
  res.json({ success: true, subscribers: subs, count: subs.length });
});

// ── ALL CUSTOMERS (admin) ─────────────────────────────────────────────────────
router.get('/customers', authMiddleware, adminOnly, (req, res) => {
  const customers = db.prepare(`SELECT id, name, email, phone, role, created_at, last_login FROM users WHERE role = 'customer' ORDER BY created_at DESC`).all();
  res.json({ success: true, customers });
});

module.exports = router;
