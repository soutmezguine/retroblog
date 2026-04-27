const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { isAuthenticated } = require('./admin');
const { getCommonData } = require('../lib/data');

router.get('/', isAuthenticated, (req, res) => {
    res.render('admin/pages/index', { ...getCommonData(), user: req.session.username });
});

router.get('/create', isAuthenticated, (req, res) => {
    const draftId = req.query.draft_id;
    let draft = null;
    if (draftId) {
        draft = db.prepare('SELECT * FROM drafts WHERE id = ? AND type = ?').get(draftId, 'page');
    }
    const drafts = db.prepare('SELECT * FROM drafts WHERE type = ? ORDER BY updated_at DESC').all('page');
    res.render('admin/pages/create', { ...getCommonData(), user: req.session.username, draft, drafts });
});

router.post('/draft', isAuthenticated, (req, res) => {
    const { draft_id, title, slug, content, navigation_order } = req.body;
    const now = new Date().toISOString();
    if (draft_id) {
        db.prepare(`UPDATE drafts SET title = ?, slug = ?, content = ?, navigation_order = ?, updated_at = ? WHERE id = ?`).run(
            title || '',
            slug || '',
            content || '',
            navigation_order || 0,
            now,
            draft_id
        );
        return res.json({ status: 'ok', id: draft_id });
    }
    const info = db.prepare(`INSERT INTO drafts (type, title, slug, content, navigation_order, updated_at) VALUES (?, ?, ?, ?, ?, ?)`)
        .run('page', title || '', slug || '', content || '', navigation_order || 0, now);
    res.json({ status: 'ok', id: info.lastInsertRowid });
});

router.post('/draft/delete/:id', isAuthenticated, (req, res) => {
    db.prepare('DELETE FROM drafts WHERE id = ?').run(req.params.id);
    res.redirect('/admin/pages/create');
});

router.post('/create', isAuthenticated, (req, res) => {
    const { title, slug, content, navigation_order, draft_id } = req.body;
    db.prepare('INSERT INTO pages (title, slug, content, navigation_order) VALUES (?, ?, ?, ?)').run(title, slug, content, navigation_order || 0);
    if (draft_id) {
        db.prepare('DELETE FROM drafts WHERE id = ?').run(draft_id);
    }
    res.redirect('/admin/pages');
});

router.get('/edit/:id', isAuthenticated, (req, res) => {
    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);
    res.render('admin/pages/edit', { ...getCommonData(), page, user: req.session.username });
});

router.post('/edit/:id', isAuthenticated, (req, res) => {
    const { title, slug, content, navigation_order } = req.body;
    db.prepare('UPDATE pages SET title = ?, slug = ?, content = ?, navigation_order = ? WHERE id = ?').run(title, slug, content, navigation_order || 0, req.params.id);
    res.redirect('/admin/pages');
});

router.post('/delete/:id', isAuthenticated, (req, res) => {
    db.prepare('DELETE FROM pages WHERE id = ?').run(req.params.id);
    res.redirect('/admin/pages');
});

module.exports = router;
