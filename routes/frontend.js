const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { getCommonData } = require('../lib/data');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

router.get('/', async (req, res) => {
    const posts = db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
    const commonData = await getCommonData();
    res.render('index', { ...commonData, posts, title: 'LATEST POSTS' });
});

router.get('/post/:slug', async (req, res) => {
    const post = db.prepare(`
        SELECT posts.*, categories.name as category_name, categories.slug as category_slug
        FROM posts
        LEFT JOIN categories ON posts.category_id = categories.id
        WHERE posts.slug = ?
    `).get(req.params.slug);

    if (!post) return res.status(404).send('Post not found');

    const postTags = db.prepare('SELECT tags.* FROM tags JOIN post_tags ON tags.id = post_tags.tag_id WHERE post_tags.post_id = ?').all(post.id);
    const comments = db.prepare("SELECT * FROM comments WHERE post_id = ? AND status = 'approved' ORDER BY created_at ASC").all(post.id);
    post.renderedContent = md.render(post.content);

    const commonData = await getCommonData();
    res.render('post', { ...commonData, post, postTags, comments });
});

router.post('/post/:id/comment', (req, res) => {
    const { author, content } = req.body;
    db.prepare('INSERT INTO comments (post_id, author, content) VALUES (?, ?, ?)').run(req.params.id, author, content);
    const post = db.prepare('SELECT slug FROM posts WHERE id = ?').get(req.params.id);
    res.redirect(post ? `/post/${post.slug}` : '/');
});

router.get('/category/:slug', async (req, res) => {
    const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.slug);
    if (!category) return res.status(404).send('Category not found');
    const posts = db.prepare('SELECT * FROM posts WHERE category_id = ? ORDER BY created_at DESC').all(category.id);
    const commonData = await getCommonData();
    res.render('index', { ...commonData, posts, title: `CATEGORY: ${category.name.toUpperCase()}` });
});

router.get('/tag/:slug', async (req, res) => {
    const tag = db.prepare('SELECT * FROM tags WHERE slug = ?').get(req.params.slug);
    if (!tag) return res.status(404).send('Tag not found');
    const posts = db.prepare("SELECT posts.* FROM posts JOIN post_tags ON posts.id = post_tags.post_id WHERE post_tags.tag_id = ? ORDER BY created_at DESC").all(tag.id);
    const commonData = await getCommonData();
    res.render('index', { ...commonData, posts, title: `TAG: ${tag.name.toUpperCase()}` });
});

router.get('/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        const posts = db.prepare("SELECT * FROM posts WHERE title LIKE ? OR content LIKE ? ORDER BY created_at DESC").all(`%${query}%`, `%${query}%`);
        const commonData = await getCommonData();
        console.log('SEARCH route commonData keys', Object.keys(commonData));
        res.render('index', { ...commonData, posts, title: `SEARCH RESULTS FOR: ${query.toUpperCase()}` }, (err, html) => {
            if (err) {
                console.error('SEARCH render error:', err);
                return res.status(500).send('Internal Server Error');
            }
            res.send(html);
        });
    } catch (err) {
        console.error('SEARCH route error:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/archive/:year/:month', async (req, res) => {
    try {
        const { year, month } = req.params;
        const posts = db.prepare("SELECT * FROM posts WHERE strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ? ORDER BY created_at DESC").all(year, month);
        const date = new Date(year, parseInt(month) - 1);
        const monthName = date.toLocaleString('default', { month: 'long' }).toUpperCase();
        const commonData = await getCommonData();
        console.log('ARCHIVE route commonData keys', Object.keys(commonData));
        res.render('index', { ...commonData, posts, title: `ARCHIVE: ${monthName} ${year}` }, (err, html) => {
            if (err) {
                console.error('ARCHIVE render error:', err);
                return res.status(500).send('Internal Server Error');
            }
            res.send(html);
        });
    } catch (err) {
        console.error('ARCHIVE route error:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/page/:slug', async (req, res) => {
    try {
        const page = db.prepare('SELECT * FROM pages WHERE slug = ?').get(req.params.slug);
        if (!page) return res.status(404).send('Page not found');
        page.renderedContent = md.render(page.content);
        const commonData = await getCommonData();
        console.log('PAGE route commonData keys', Object.keys(commonData));
        res.render('page', { ...commonData, page }, (err, html) => {
            if (err) {
                console.error('PAGE render error:', err);
                return res.status(500).send('Internal Server Error');
            }
            res.send(html);
        });
    } catch (err) {
        console.error('PAGE route error:', err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
