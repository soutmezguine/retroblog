const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    slug TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    slug TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    slug TEXT UNIQUE,
    content TEXT,
    summary TEXT,
    category_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER,
    tag_id INTEGER,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER,
    author TEXT,
    content TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    slug TEXT UNIQUE,
    content TEXT,
    navigation_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS blocked_ips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT UNIQUE,
    country_code TEXT,
    reason TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    title TEXT,
    slug TEXT,
    content TEXT,
    summary TEXT,
    category_id INTEGER,
    tag_ids TEXT,
    new_tags TEXT,
    navigation_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT,
    country_code TEXT,
    latitude REAL,
    longitude REAL,
    city TEXT,
    visited_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER,
    page_id INTEGER,
    ip TEXT,
    visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_page_views_visited_at ON page_views(visited_at);
  CREATE INDEX IF NOT EXISTS idx_page_views_post_id ON page_views(post_id);
  CREATE INDEX IF NOT EXISTS idx_page_views_page_id ON page_views(page_id);
  CREATE INDEX IF NOT EXISTS idx_visitors_visited_at ON visitors(visited_at);
`);

const adminUser = process.env.ADMIN_USER || 'admin';
const adminPass = process.env.ADMIN_PASS || 'password123';
const userExists = db.prepare('SELECT * FROM users WHERE username = ?').get(adminUser);
if (!userExists) {
    const hash = bcrypt.hashSync(adminPass, 10);
    db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(adminUser, hash);
}

const defaultSettings = [
    { key: 'bg_color', value: '#0000AA' },
    { key: 'text_color', value: '#AAAAAA' },
    { key: 'border_color', value: '#FFFFFF' },
    { key: 'highlight_color', value: '#FFFF55' },
    { key: 'shadow_color', value: '#000000' },
    { key: 'blog_width', value: '1200px' },
    { key: 'time_server', value: 'pool.ntp.org' },
    { key: 'time_zone', value: 'UTC' },
    { key: 'hide_admin_link', value: 'false' },
    // Menu customization
    { key: 'menu_bg_color', value: '#0000AA' },
    { key: 'menu_text_color', value: '#AAAAAA' },
    { key: 'menu_border_color', value: '#FFFFFF' },
    { key: 'menu_highlight_color', value: '#FFFF55' },
    { key: 'menu_hover_bg', value: '#AAAAAA' },
    { key: 'menu_hover_text', value: '#0000AA' },
    // Post customization
    { key: 'post_bg_color', value: '#0000AA' },
    { key: 'post_text_color', value: '#AAAAAA' },
    { key: 'post_border_color', value: '#FFFFFF' },
    { key: 'post_title_color', value: '#FFFF55' },
    { key: 'post_meta_color', value: '#AAAAAA' },
    { key: 'post_link_color', value: '#FFFF55' },
    // Footer customization
    { key: 'footer_bg_color', value: '#0000AA' },
    { key: 'footer_text_color', value: '#AAAAAA' },
    { key: 'footer_border_color', value: '#FFFFFF' },
    { key: 'footer_link_color', value: '#FFFF55' },
    // Sidebar customization
    { key: 'sidebar_bg_color', value: '#0000AA' },
    { key: 'sidebar_text_color', value: '#AAAAAA' },
    { key: 'sidebar_border_color', value: '#FFFFFF' },
    { key: 'sidebar_title_color', value: '#FFFF55' },
    { key: 'sidebar_link_color', value: '#FFFF55' },
    // Admin customization
    { key: 'admin_bg_color', value: '#AAAAAA' },
    { key: 'admin_text_color', value: '#0000AA' },
    { key: 'admin_border_color', value: '#FFFFFF' },
    { key: 'admin_link_color', value: '#0000AA' },
    { key: 'admin_box_bg', value: '#0000AA' },
    { key: 'admin_box_text', value: '#AAAAAA' },
    { key: 'admin_box_border', value: '#FFFFFF' },
    { key: 'admin_button_bg', value: '#AAAAAA' },
    { key: 'admin_button_text', value: '#0000AA' },
    { key: 'admin_button_hover_bg', value: '#FFFF55' }
];
const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
defaultSettings.forEach(s => insertSetting.run(s.key, s.value));

module.exports = db;
