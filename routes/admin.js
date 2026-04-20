const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../lib/db');
const { getCommonData } = require('../lib/data');

const isAuthenticated = (req, res, next) => {
    if (req.session.userId) return next();
    res.redirect('/admin/login');
};

router.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/admin');
    res.render('admin/login', { ...getCommonData(), error: null });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.userId = user.id;
        req.session.username = user.username;
        res.redirect('/admin');
    } else {
        res.render('admin/login', { ...getCommonData(), error: 'Invalid username or password' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

router.get('/', isAuthenticated, (req, res) => {
    res.render('admin/index', { ...getCommonData(), user: req.session.username });
});

module.exports = { router, isAuthenticated };
