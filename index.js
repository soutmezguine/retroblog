const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const db = require('./lib/db');
const blockMiddleware = require('./lib/blocker');
const { getCommonData } = require('./lib/data');
const logger = require('./lib/logger');

const app = express();
const PORT = process.env.PORT || 3000;

fs.mkdirSync(path.join(__dirname, 'public', 'uploads'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(blockMiddleware);

// Structured request logging
app.use((req, res, next) => {
    logger.logRequest(req.method, req.path, {
        query: req.query,
        ip: req.ip
    });
    next();
});

app.use(async (req, res, next) => {
    try {
        const commonData = await getCommonData();
        Object.assign(res.locals, commonData);
    } catch (err) {
        logger.logError(err, { context: 'Failed to load common data' });
        res.locals.settings = res.locals.settings || {};
        res.locals.pages = res.locals.pages || [];
        res.locals.categories = res.locals.categories || [];
        res.locals.tags = res.locals.tags || [];
        res.locals.archives = res.locals.archives || [];
        res.locals.currentTime = res.locals.currentTime || new Date();
        res.locals.formatDate = res.locals.formatDate || ((date) => date);
    }
    next();
});

app.use(session({
    secret: process.env.SESSION_SECRET || 'retro-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

const { router: adminRouter } = require('./routes/admin');
const postsRouter = require('./routes/posts');
const taxonomyRouter = require('./routes/taxonomy');
const pagesRouter = require('./routes/pages');
const commentsRouter = require('./routes/comments');
const settingsRouter = require('./routes/settings');
const frontendRouter = require('./routes/frontend');
const draftsRouter = require('./routes/drafts');
const rssRouter = require('./routes/rss');

app.use('/admin', adminRouter);
app.use('/admin/posts', postsRouter);
app.use('/admin/pages', pagesRouter);
app.use('/admin/drafts', draftsRouter);
app.use('/admin/comments', commentsRouter);
app.use('/admin/settings', settingsRouter);
app.use('/admin', taxonomyRouter);
app.use('/rss', rssRouter);
app.use('/', frontendRouter);

app.use((err, req, res, next) => {
    logger.logError(err, {
        method: req.method,
        path: req.path,
        ip: req.ip
    });
    res.status(500).send('Internal Server Error');
});

app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
});

module.exports = app;
