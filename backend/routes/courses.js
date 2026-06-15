'use strict';
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ── ALL COURSES (public) ──────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const courses = db.prepare('SELECT id, title, description, price, currency, category, image, is_active FROM courses WHERE is_active = 1').all();
  res.json({ success: true, courses });
});

// ── MY ACCESSIBLE COURSES ─────────────────────────────────────────────────────
router.get('/my-access', authMiddleware, (req, res) => {
  const courses = db.prepare(`
    SELECT c.*, ca.granted_at
    FROM course_access ca
    JOIN courses c ON ca.course_id = c.id
    WHERE ca.user_id = ?
    ORDER BY ca.granted_at DESC
  `).all(req.user.id);
  res.json({ success: true, courses });
});

// ── CHECK ACCESS TO SPECIFIC COURSE ──────────────────────────────────────────
router.get('/:id/access', authMiddleware, (req, res) => {
  const access = db.prepare(`SELECT * FROM course_access WHERE user_id = ? AND course_id = ?`).get(req.user.id, req.params.id);
  if (!access) return res.status(403).json({ success: false, message: 'No access. Please purchase this course.' });
  
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

  res.json({ success: true, course, access });
});

// ── ADD COURSE (admin) ────────────────────────────────────────────────────────
router.post('/', authMiddleware, adminOnly, (req, res) => {
  const { title, description, price, category, image, download_url } = req.body;
  if (!title || !price) return res.status(400).json({ success: false, message: 'Title and price required' });

  const id = uuidv4();
  db.prepare(`INSERT INTO courses (id, title, description, price, category, image, download_url) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, title, description || null, price, category || null, image || null, download_url || null);

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
  res.status(201).json({ success: true, course });
});

// ── UPDATE COURSE (admin) ─────────────────────────────────────────────────────
router.put('/:id', authMiddleware, adminOnly, (req, res) => {
  const { title, description, price, category, image, download_url, is_active } = req.body;
  db.prepare(`UPDATE courses SET title = COALESCE(?, title), description = COALESCE(?, description), price = COALESCE(?, price), category = COALESCE(?, category), image = COALESCE(?, image), download_url = COALESCE(?, download_url), is_active = COALESCE(?, is_active) WHERE id = ?`)
    .run(title, description, price, category, image, download_url, is_active, req.params.id);
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  res.json({ success: true, course });
});

// ── GRANT MANUAL ACCESS (admin) ───────────────────────────────────────────────
router.post('/:id/grant', authMiddleware, adminOnly, (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ success: false, message: 'user_id required' });
  db.prepare(`INSERT OR IGNORE INTO course_access (id, user_id, course_id) VALUES (?, ?, ?)`)
    .run(uuidv4(), user_id, req.params.id);
  res.json({ success: true, message: 'Access granted' });
});

module.exports = router;
