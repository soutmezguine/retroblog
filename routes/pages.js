const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { isAuthenticated } = require('./admin');
const { getCommonData } = require('../lib/data');

router.get('/', isAuthenticated, (req, res) => {
    res.render('admin/pages/index', { ...getCommonData(), user: req.session.username });
});

router.get('/create', isAuthenticated, (req, res) => {
    res.render('admin/pages/create', { ...getCommonData(), user: req.session.username });
});

router.post('/create', isAuthenticated, (req, res) => {
    const { title, slug, content, navigation_order } = req.body;
    db.prepare('INSERT INTO pages (title, slug, content, navigation_order) VALUES (?, ?, ?, ?)').run(title, slug, content, navigation_order || 0);
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
