const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { isAuthenticated } = require('./admin');
const { getCommonData } = require('../lib/data');

router.get('/', isAuthenticated, async (req, res) => {
    const blocked_ips = db.prepare('SELECT * FROM blocked_ips').all();
    const commonData = await getCommonData();
    res.render('admin/settings', { ...commonData, blocked_ips, user: req.session.username });
});

router.post('/theme', isAuthenticated, (req, res) => {
    const updateSetting = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
    for (const [key, value] of Object.entries(req.body)) {
        updateSetting.run(value, key);
    }
    res.redirect('/admin/settings');
});

router.post('/ip-block', isAuthenticated, (req, res) => {
    const { ip, country_code, reason } = req.body;
    if (ip) {
        db.prepare('INSERT OR IGNORE INTO blocked_ips (ip, reason) VALUES (?, ?)').run(ip, reason);
    } else if (country_code) {
        db.prepare('INSERT OR IGNORE INTO blocked_ips (country_code, reason) VALUES (?, ?)').run(country_code, reason);
    }
    res.redirect('/admin/settings');
});

router.post('/ip-unblock/:id', isAuthenticated, (req, res) => {
    db.prepare('DELETE FROM blocked_ips WHERE id = ?').run(req.params.id);
    res.redirect('/admin/settings');
});

module.exports = router;
