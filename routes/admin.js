const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../lib/db');
const { getCommonData } = require('../lib/data');
const { backupDatabase, getBackups, deleteBackup, restoreBackup } = require('../lib/backup');
const { getDashboardAnalytics } = require('../lib/analytics');

const isAuthenticated = (req, res, next) => {
    if (req.session.userId) return next();
    res.redirect('/admin/login');
};

router.get('/login', async (req, res) => {
    if (req.session.userId) return res.redirect('/admin');
    const commonData = await getCommonData();
    res.render('admin/login', { ...commonData, error: null });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.userId = user.id;
        req.session.username = user.username;
        res.redirect('/admin');
    } else {
        const commonData = await getCommonData();
        res.render('admin/login', { ...commonData, error: 'Invalid username or password' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

router.get('/', isAuthenticated, async (req, res) => {
    const commonData = await getCommonData();
    const analytics = getDashboardAnalytics();
    const backups = getBackups();
    res.render('admin/index', { ...commonData, user: req.session.username, analytics, backups });
});

// Backup routes
router.post('/backup', isAuthenticated, (req, res) => {
    const result = backupDatabase();
    res.json(result);
});

router.get('/backups', isAuthenticated, (req, res) => {
    const backups = getBackups();
    res.json(backups);
});

router.post('/backups/delete/:filename', isAuthenticated, (req, res) => {
    const result = deleteBackup(req.params.filename);
    res.json(result);
});

router.post('/backups/restore/:filename', isAuthenticated, (req, res) => {
    const result = restoreBackup(req.params.filename);
    res.json(result);
});

module.exports = { router, isAuthenticated };
