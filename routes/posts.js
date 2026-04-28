const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../lib/db');
const { isAuthenticated } = require('./admin');
const { getCommonData } = require('../lib/data');
const { getCurrentTime } = require('../lib/time');

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'public/uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

router.get('/', isAuthenticated, async (req, res) => {
    const posts = db.prepare('SELECT posts.*, categories.name as category_name FROM posts LEFT JOIN categories ON posts.category_id = categories.id ORDER BY created_at DESC').all();
    const commonData = await getCommonData();
    res.render('admin/posts/index', { ...commonData, posts, user: req.session.username });
});

router.get('/create', isAuthenticated, (req, res) => {
    const draftId = req.query.draft_id;
    let draft = null;
    if (draftId) {
        draft = db.prepare('SELECT * FROM drafts WHERE id = ? AND type = ?').get(draftId, 'post');
    }
    const drafts = db.prepare('SELECT * FROM drafts WHERE type = ? ORDER BY updated_at DESC').all('post');
    const draftTags = draft && draft.tag_ids ? draft.tag_ids.split(',').filter(Boolean) : [];
    res.render('admin/posts/create', { ...getCommonData(), user: req.session.username, draft, drafts, draftTags });
});

router.post('/draft', isAuthenticated, (req, res) => {
    const { draft_id, title, slug, content, summary, category_id, tags, new_tags } = req.body;
    const tag_ids = tags ? (Array.isArray(tags) ? tags.join(',') : tags) : '';
    const now = new Date().toISOString();
    if (draft_id) {
        db.prepare(`UPDATE drafts SET title = ?, slug = ?, content = ?, summary = ?, category_id = ?, tag_ids = ?, new_tags = ?, updated_at = ? WHERE id = ?`).run(
            title || '',
            slug || '',
            content || '',
            summary || '',
            category_id || null,
            tag_ids,
            new_tags || '',
            now,
            draft_id
        );
        return res.json({ status: 'ok', id: draft_id });
    }
    const info = db.prepare(`INSERT INTO drafts (type, title, slug, content, summary, category_id, tag_ids, new_tags, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run('post', title || '', slug || '', content || '', summary || '', category_id || null, tag_ids, new_tags || '', now);
    res.json({ status: 'ok', id: info.lastInsertRowid });
});

router.post('/draft/delete/:id', isAuthenticated, (req, res) => {
    db.prepare('DELETE FROM drafts WHERE id = ?').run(req.params.id);
    res.redirect('/admin/posts/create');
});

router.post('/create', isAuthenticated, upload.single('image'), async (req, res) => {
    const { title, slug, content, summary, category_id, tags, new_tags, draft_id } = req.body;
    let finalContent = content;
    if (req.file) finalContent = `![Image](/uploads/${req.file.filename})\n\n${content}`;
    const settings = db.prepare('SELECT key, value FROM settings').all().reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {});
    const createdAt = await getCurrentTime(settings);
    const info = db.prepare('INSERT INTO posts (title, slug, content, summary, category_id, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(title, slug, finalContent, summary, category_id || null, createdAt.toISOString());
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
    if (draft_id) {
        db.prepare('DELETE FROM drafts WHERE id = ?').run(draft_id);
    }
    res.redirect('/admin/posts');
});

router.get('/edit/:id', isAuthenticated, async (req, res) => {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).send('Post not found');
    const postTags = db.prepare('SELECT tag_id FROM post_tags WHERE post_id = ?').all(req.params.id).map(t => t.tag_id);
    const commonData = await getCommonData();
    res.render('admin/posts/edit', { ...commonData, post, postTags, user: req.session.username });
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
