'use strict';
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'luxesmile.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── SCHEMA ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    phone       TEXT,
    password    TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'customer',
    avatar      TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    last_login  TEXT
  );

  CREATE TABLE IF NOT EXISTS courses (
    id            TEXT PRIMARY KEY,
    title         TEXT NOT NULL,
    description   TEXT,
    price         REAL NOT NULL,
    currency      TEXT DEFAULT 'KES',
    category      TEXT,
    image         TEXT,
    file_path     TEXT,
    download_url  TEXT,
    is_active     INTEGER DEFAULT 1,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL,
    total           REAL NOT NULL,
    currency        TEXT DEFAULT 'KES',
    status          TEXT NOT NULL DEFAULT 'pending',
    payment_method  TEXT DEFAULT 'mpesa',
    payment_ref     TEXT,
    notes           TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id          TEXT PRIMARY KEY,
    order_id    TEXT NOT NULL,
    product_id  TEXT,
    course_id   TEXT,
    name        TEXT NOT NULL,
    price       REAL NOT NULL,
    qty         INTEGER NOT NULL DEFAULT 1,
    type        TEXT NOT NULL DEFAULT 'product',
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS chat_rooms (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    subject     TEXT,
    status      TEXT NOT NULL DEFAULT 'open',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id          TEXT PRIMARY KEY,
    room_id     TEXT NOT NULL,
    sender_id   TEXT NOT NULL,
    sender_role TEXT NOT NULL DEFAULT 'customer',
    message     TEXT NOT NULL,
    is_read     INTEGER DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id)
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id            TEXT PRIMARY KEY,
    user_id       TEXT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL,
    phone         TEXT NOT NULL,
    service       TEXT NOT NULL,
    date          TEXT NOT NULL,
    time          TEXT NOT NULL,
    message       TEXT,
    status        TEXT NOT NULL DEFAULT 'pending',
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS newsletter (
    id         TEXT PRIMARY KEY,
    email      TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    phone      TEXT,
    subject    TEXT,
    message    TEXT NOT NULL,
    status     TEXT DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS course_access (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL,
    course_id   TEXT NOT NULL,
    order_id    TEXT,
    granted_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
  );
`);

// ── SEED DATA ─────────────────────────────────────────────────────────────────

function seedDatabase() {
  // Admin user
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@luxesmile.co.ke');
  if (!adminExists) {
    const hash = bcrypt.hashSync('Luxesmile@Admin2024', 12);
    db.prepare(`INSERT INTO users (id, name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(uuidv4(), 'Dr. Amara Osei', 'admin@luxesmile.co.ke', '+254700123456', hash, 'admin');
    console.log('✅ Admin user seeded');
  }

  // Demo customer
  const customerExists = db.prepare('SELECT id FROM users WHERE email = ?').get('patient@luxesmile.co.ke');
  if (!customerExists) {
    const hash = bcrypt.hashSync('Patient@2024', 12);
    db.prepare(`INSERT INTO users (id, name, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(uuidv4(), 'Jane Muthoni', 'patient@luxesmile.co.ke', '+254712345678', hash, 'customer');
    console.log('✅ Demo patient seeded');
  }

  // Courses / products
  const courseCount = db.prepare('SELECT COUNT(*) as c FROM courses').get().c;
  if (courseCount === 0) {
    const courses = [
      {
        id: uuidv4(), title: 'Complete Oral Hygiene Masterclass', category: 'education',
        description: 'Learn professional oral hygiene techniques from our expert dentists. Covers brushing, flossing, diet, and preventive care.',
        price: 2500, image: '../Luxesmile V3/Dental-image 1.jpg',
        download_url: 'https://example.com/courses/oral-hygiene.pdf'
      },
      {
        id: uuidv4(), title: 'Teeth Whitening at Home — Safe Guide', category: 'education',
        description: 'Professional guidance on safe at-home whitening. Includes product recommendations and step-by-step instructions.',
        price: 1500, image: '../Luxesmile V3/Teeth-whitening.jpg',
        download_url: 'https://example.com/courses/whitening-guide.pdf'
      },
      {
        id: uuidv4(), title: 'Kids Dental Care Package', category: 'education',
        description: 'A complete guide for parents on caring for children\'s teeth from infancy to teenage years.',
        price: 1800, image: '../Luxesmile V3/Child-dentistry.jpg',
        download_url: 'https://example.com/courses/kids-dental.pdf'
      },
      {
        id: uuidv4(), title: 'Dental Anxiety Management', category: 'education',
        description: 'Overcome dental anxiety with our evidence-based techniques. Ideal for patients with dental phobia.',
        price: 1200, image: '../Luxesmile V3/Anxiety.jpg',
        download_url: 'https://example.com/courses/anxiety.pdf'
      },
    ];
    const insertCourse = db.prepare(`INSERT INTO courses (id, title, description, price, category, image, download_url) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    courses.forEach(c => insertCourse.run(c.id, c.title, c.description, c.price, c.category, c.image, c.download_url));
    console.log('✅ Courses seeded');
  }
}

seedDatabase();

module.exports = db;
