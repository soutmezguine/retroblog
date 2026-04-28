const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { isAuthenticated } = require('./admin');
const { getCommonData } = require('../lib/data');

router.get('/', isAuthenticated, async (req, res) => {
    const comments = db.prepare("SELECT comments.*, posts.title as post_title FROM comments JOIN posts ON comments.post_id = posts.id ORDER BY created_at DESC").all();
    const commonData = await getCommonData();
    res.render('admin/comments', { ...commonData, comments, user: req.session.username });
});

router.post('/approve/:id', isAuthenticated, (req, res) => {
    db.prepare("UPDATE comments SET status = 'approved' WHERE id = ?").run(req.params.id);
    res.redirect('/admin/comments');
});

router.post('/deny/:id', isAuthenticated, (req, res) => {
    db.prepare("UPDATE comments SET status = 'denied' WHERE id = ?").run(req.params.id);
    res.redirect('/admin/comments');
});

router.post('/delete/:id', isAuthenticated, (req, res) => {
    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
    res.redirect('/admin/comments');
});

module.exports = router;
