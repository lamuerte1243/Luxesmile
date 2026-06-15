'use strict';
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ── BOOK APPOINTMENT ──────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { name, email, phone, service, date, time, message } = req.body;
  if (!name || !email || !phone || !service || !date || !time) {
    return res.status(400).json({ success: false, message: 'All required fields must be provided' });
  }

  // Link to user if logged in (optional)
  const authHeader = req.headers['authorization'];
  let userId = null;
  if (authHeader) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'luxesmile_jwt_secret_2024');
      userId = decoded.userId;
    } catch {}
  }

  const id = uuidv4();
  db.prepare(`INSERT INTO appointments (id, user_id, name, email, phone, service, date, time, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, userId, name.trim(), email.toLowerCase().trim(), phone.trim(), service, date, time, message || null);

  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
  res.status(201).json({ success: true, message: 'Appointment booked successfully! We will confirm within 2 hours.', appointment: appt });
});

// ── MY APPOINTMENTS (customer) ────────────────────────────────────────────────
router.get('/mine', authMiddleware, (req, res) => {
  const appts = db.prepare(`SELECT * FROM appointments WHERE user_id = ? ORDER BY created_at DESC`).all(req.user.id);
  res.json({ success: true, appointments: appts });
});

// ── ALL APPOINTMENTS (admin) ──────────────────────────────────────────────────
router.get('/all', authMiddleware, adminOnly, (req, res) => {
  const appts = db.prepare(`SELECT * FROM appointments ORDER BY date ASC, time ASC`).all();
  res.json({ success: true, appointments: appts });
});

// ── UPDATE STATUS (admin) ─────────────────────────────────────────────────────
router.put('/:id/status', authMiddleware, adminOnly, (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'];
  if (!valid.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true, message: `Appointment ${status}` });
});

module.exports = router;
