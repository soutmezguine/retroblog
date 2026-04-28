const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../lib/db');
const { getCommonData } = require('../lib/data');
const logger = require('../lib/logger');

const isAuthenticated = (req, res, next) => {
    if (req.session.userId) return next();
    logger.warn('Unauthorized access attempt', { ip: req.ip, path: req.path });
    res.redirect('/admin/login');
};

router.get('/login', async (req, res) => {
    try {
        if (req.session.userId) return res.redirect('/admin');
        const commonData = await getCommonData();
        res.render('admin/login', { ...commonData, error: null });
    } catch (err) {
        logger.logError(err, { context: 'Admin login GET' });
        res.status(500).send('Error loading login page');
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            logger.warn('Login attempt with missing credentials', { ip: req.ip });
            const commonData = await getCommonData();
            return res.render('admin/login', { ...commonData, error: 'Username and password required' });
        }
        
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (user && bcrypt.compareSync(password, user.password)) {
            req.session.userId = user.id;
            req.session.username = user.username;
            logger.info('User logged in', { username, ip: req.ip });
            res.redirect('/admin');
        } else {
            logger.warn('Failed login attempt', { username, ip: req.ip });
            const commonData = await getCommonData();
            res.render('admin/login', { ...commonData, error: 'Invalid username or password' });
        }
    } catch (err) {
        logger.logError(err, { context: 'Admin login POST' });
        res.status(500).send('Error processing login');
    }
});

router.get('/logout', (req, res) => {
    const username = req.session.username;
    req.session.destroy((err) => {
        if (err) {
            logger.logError(err, { context: 'Session destroy on logout', username });
        } else {
            logger.info('User logged out', { username, ip: req.ip });
        }
        res.redirect('/admin/login');
    });
});

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const commonData = await getCommonData();
        res.render('admin/index', { ...commonData, user: req.session.username });
    } catch (err) {
        logger.logError(err, { context: 'Admin dashboard' });
        res.status(500).send('Error loading dashboard');
    }
});

module.exports = { router, isAuthenticated };
