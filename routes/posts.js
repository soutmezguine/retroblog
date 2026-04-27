const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../lib/db');
const { isAuthenticated } = require('./admin');
const { getCommonData } = require('../lib/data');

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'public/uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

router.get('/', isAuthenticated, (req, res) => {
    const posts = db.prepare('SELECT posts.*, categories.name as category_name FROM posts LEFT JOIN categories ON posts.category_id = categories.id ORDER BY created_at DESC').all();
    res.render('admin/posts/index', { ...getCommonData(), posts, user: req.session.username });
});

router.get('/create', isAuthenticated, (req, res) => {
    res.render('admin/posts/create', { ...getCommonData(), user: req.session.username });
});

router.post('/create', isAuthenticated, upload.single('image'), (req, res) => {
    const { title, slug, content, summary, category_id, tags, new_tags } = req.body;
    let finalContent = content;
    if (req.file) finalContent = `![Image](/uploads/${req.file.filename})\n\n${content}`;
    const info = db.prepare('INSERT INTO posts (title, slug, content, summary, category_id) VALUES (?, ?, ?, ?, ?)').run(title, slug, finalContent, summary, category_id || null);
    const postId = info.lastInsertRowid;
    let tagList = [];
    if (tags) {
        tagList = Array.isArray(tags) ? tags : [tags];
    }
    if (new_tags) {
        const newTagNames = new_tags.split(',').map(t => t.trim()).filter(t => t);
        const insertTagStmt = db.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)');
        const selectTagStmt = db.prepare('SELECT id FROM tags WHERE name = ?');
        newTagNames.forEach(name => {
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            insertTagStmt.run(name, slug);
            const tag = selectTagStmt.get(name);
            if (tag) tagList.push(tag.id.toString());
        });
    }
    const insertTag = db.prepare('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)');
    tagList.forEach(tagId => insertTag.run(postId, tagId));
    res.redirect('/admin/posts');
});

router.get('/edit/:id', isAuthenticated, (req, res) => {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).send('Post not found');
    const postTags = db.prepare('SELECT tag_id FROM post_tags WHERE post_id = ?').all(req.params.id).map(t => t.tag_id);
    res.render('admin/posts/edit', { ...getCommonData(), post, postTags, user: req.session.username });
});

router.post('/edit/:id', isAuthenticated, upload.single('image'), (req, res) => {
    const { title, slug, content, summary, category_id, tags, new_tags } = req.body;
    const postId = req.params.id;
    let finalContent = content;
    if (req.file) finalContent = `![Image](/uploads/${req.file.filename})\n\n${content}`;
    db.prepare('UPDATE posts SET title = ?, slug = ?, content = ?, summary = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(title, slug, finalContent, summary, category_id || null, postId);
    db.prepare('DELETE FROM post_tags WHERE post_id = ?').run(postId);
    let tagList = [];
    if (tags) {
        tagList = Array.isArray(tags) ? tags : [tags];
    }
    if (new_tags) {
        const newTagNames = new_tags.split(',').map(t => t.trim()).filter(t => t);
        const insertTagStmt = db.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)');
        const selectTagStmt = db.prepare('SELECT id FROM tags WHERE name = ?');
        newTagNames.forEach(name => {
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            insertTagStmt.run(name, slug);
            const tag = selectTagStmt.get(name);
            if (tag) tagList.push(tag.id.toString());
        });
    }
    const insertTag = db.prepare('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)');
    tagList.forEach(tagId => insertTag.run(postId, tagId));
    res.redirect('/admin/posts');
});

router.post('/delete/:id', isAuthenticated, (req, res) => {
    db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
    res.redirect('/admin/posts');
});

module.exports = router;
