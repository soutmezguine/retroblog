const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const db = require('./lib/db');
const blockMiddleware = require('./lib/blocker');

const app = express();
const PORT = process.env.PORT || 3000;

fs.mkdirSync(path.join(__dirname, 'public', 'uploads'), { recursive: true });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(blockMiddleware);

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

app.use('/admin', adminRouter);
app.use('/admin/posts', postsRouter);
app.use('/admin/pages', pagesRouter);
app.use('/admin/comments', commentsRouter);
app.use('/admin/settings', settingsRouter);
app.use('/admin', taxonomyRouter);
app.use('/', frontendRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
