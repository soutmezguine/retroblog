const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { isAuthenticated } = require('./admin');
const { getCommonData } = require('../lib/data');

router.get('/categories', isAuthenticated, async (req, res) => {
    const commonData = await getCommonData();
    res.render('admin/categories', { ...commonData, user: req.session.username });
});

router.post('/categories', isAuthenticated, (req, res) => {
    const { name, slug } = req.body;
    db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)').run(name, slug);
    res.redirect('/admin/categories');
});

router.post('/categories/delete/:id', isAuthenticated, (req, res) => {
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.redirect('/admin/categories');
});

router.get('/tags', isAuthenticated, async (req, res) => {
    const commonData = await getCommonData();
    res.render('admin/tags', { ...commonData, user: req.session.username });
});

router.post('/tags', isAuthenticated, (req, res) => {
    const { name, slug } = req.body;
    db.prepare('INSERT INTO tags (name, slug) VALUES (?, ?)').run(name, slug);
    res.redirect('/admin/tags');
});

router.post('/tags/delete/:id', isAuthenticated, (req, res) => {
    db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
    res.redirect('/admin/tags');
});

module.exports = router;
