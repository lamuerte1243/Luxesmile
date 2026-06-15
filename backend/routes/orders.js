'use strict';
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ── PLACE ORDER (customer) ────────────────────────────────────────────────────
router.post('/', authMiddleware, (req, res) => {
  try {
    const { items, payment_method, payment_ref, notes, total } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must have at least one item' });
    }

    const orderId = uuidv4();
    const calculatedTotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);

    db.prepare(`INSERT INTO orders (id, user_id, total, payment_method, payment_ref, notes) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(orderId, req.user.id, calculatedTotal, payment_method || 'mpesa', payment_ref || null, notes || null);

    const insertItem = db.prepare(`INSERT INTO order_items (id, order_id, product_id, course_id, name, price, qty, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    items.forEach(item => {
      insertItem.run(uuidv4(), orderId, item.product_id || null, item.course_id || null, item.name, item.price, item.qty, item.type || 'product');
    });

    const order = db.prepare(`
      SELECT o.*, u.name as customer_name, u.email as customer_email
      FROM orders o JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(orderId);

    const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

    res.status(201).json({ success: true, message: 'Order placed successfully', order: { ...order, items: orderItems } });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ success: false, message: 'Failed to place order' });
  }
});

// ── MY ORDERS (customer) ──────────────────────────────────────────────────────
router.get('/mine', authMiddleware, (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, 
      json_group_array(json_object('id', oi.id, 'name', oi.name, 'price', oi.price, 'qty', oi.qty, 'type', oi.type, 'course_id', oi.course_id)) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `).all(req.user.id);

  const parsed = orders.map(o => ({ ...o, items: JSON.parse(o.items || '[]') }));
  res.json({ success: true, orders: parsed });
});

// ── ALL ORDERS (admin) ────────────────────────────────────────────────────────
router.get('/all', authMiddleware, adminOnly, (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
      json_group_array(json_object('id', oi.id, 'name', oi.name, 'price', oi.price, 'qty', oi.qty, 'type', oi.type, 'course_id', oi.course_id)) as items
    FROM orders o
    JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `).all();

  const parsed = orders.map(o => ({ ...o, items: JSON.parse(o.items || '[]') }));
  res.json({ success: true, orders: parsed });
});

// ── GET SINGLE ORDER ──────────────────────────────────────────────────────────
router.get('/:id', authMiddleware, (req, res) => {
  const order = db.prepare(`
    SELECT o.*, u.name as customer_name, u.email as customer_email
    FROM orders o JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `).get(req.params.id);

  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (order.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
  res.json({ success: true, order: { ...order, items } });
});

// ── UPDATE ORDER STATUS (admin) ───────────────────────────────────────────────
router.put('/:id/status', authMiddleware, adminOnly, (req, res) => {
  const { status, payment_ref } = req.body;
  const validStatuses = ['pending', 'confirmed', 'paid', 'processing', 'dispatched', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  db.prepare(`UPDATE orders SET status = ?, payment_ref = COALESCE(?, payment_ref), updated_at = datetime('now') WHERE id = ?`)
    .run(status, payment_ref || null, req.params.id);

  // If paid — auto-unlock any courses in this order
  if (status === 'paid') {
    const items = db.prepare(`SELECT * FROM order_items WHERE order_id = ? AND type = 'course' AND course_id IS NOT NULL`).all(req.params.id);
    const insertAccess = db.prepare(`INSERT OR IGNORE INTO course_access (id, user_id, course_id, order_id) VALUES (?, ?, ?, ?)`);
    items.forEach(item => {
      insertAccess.run(uuidv4(), order.user_id, item.course_id, req.params.id);
    });
  }

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json({ success: true, message: 'Order status updated', order: updated });
});

// ── UNLOCK COURSE MANUALLY (admin) ───────────────────────────────────────────
router.post('/:id/unlock-course', authMiddleware, adminOnly, (req, res) => {
  const { course_id } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  try {
    db.prepare(`INSERT OR IGNORE INTO course_access (id, user_id, course_id, order_id) VALUES (?, ?, ?, ?)`)
      .run(uuidv4(), order.user_id, course_id, req.params.id);
    res.json({ success: true, message: 'Course access granted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to grant course access' });
  }
});

// ── ADMIN STATS ───────────────────────────────────────────────────────────────
router.get('/admin/stats', authMiddleware, adminOnly, (req, res) => {
  const totalOrders = db.prepare("SELECT COUNT(*) as c FROM orders").get().c;
  const totalRevenue = db.prepare("SELECT SUM(total) as t FROM orders WHERE status IN ('paid','delivered')").get().t || 0;
  const pendingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").get().c;
  const totalCustomers = db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'customer'").get().c;
  const totalAppointments = db.prepare("SELECT COUNT(*) as c FROM appointments").get().c;
  const newMessages = db.prepare("SELECT COUNT(*) as c FROM contact_messages WHERE status = 'new'").get().c;
  const openChats = db.prepare("SELECT COUNT(*) as c FROM chat_rooms WHERE status = 'open'").get().c;

  res.json({
    success: true,
    stats: { totalOrders, totalRevenue, pendingOrders, totalCustomers, totalAppointments, newMessages, openChats }
  });
});

module.exports = router;
