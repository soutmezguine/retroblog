const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { getCommonData } = require('../lib/data');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

router.get('/', (req, res) => {
    const posts = db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
    res.render('index', { ...getCommonData(), posts, title: 'LATEST POSTS' });
});

router.get('/post/:slug', (req, res) => {
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

    res.render('post', { ...getCommonData(), post, postTags, comments });
});

router.post('/post/:id/comment', (req, res) => {
    const { author, content } = req.body;
    db.prepare('INSERT INTO comments (post_id, author, content) VALUES (?, ?, ?)').run(req.params.id, author, content);
    res.redirect('back');
});

router.get('/category/:slug', (req, res) => {
    const category = db.prepare('SELECT * FROM categories WHERE slug = ?').get(req.params.slug);
    if (!category) return res.status(404).send('Category not found');
    const posts = db.prepare('SELECT * FROM posts WHERE category_id = ? ORDER BY created_at DESC').all(category.id);
    res.render('index', { ...getCommonData(), posts, title: `CATEGORY: ${category.name.toUpperCase()}` });
});

router.get('/tag/:slug', (req, res) => {
    const tag = db.prepare('SELECT * FROM tags WHERE slug = ?').get(req.params.slug);
    if (!tag) return res.status(404).send('Tag not found');
    const posts = db.prepare("SELECT posts.* FROM posts JOIN post_tags ON posts.id = post_tags.post_id WHERE post_tags.tag_id = ? ORDER BY created_at DESC").all(tag.id);
    res.render('index', { ...getCommonData(), posts, title: `TAG: ${tag.name.toUpperCase()}` });
});

router.get('/search', (req, res) => {
    const query = req.query.q || '';
    const posts = db.prepare("SELECT * FROM posts WHERE title LIKE ? OR content LIKE ? ORDER BY created_at DESC").all(`%${query}%`, `%${query}%`);
    res.render('index', { ...getCommonData(), posts, title: `SEARCH RESULTS FOR: ${query.toUpperCase()}` });
});

router.get('/archive/:year/:month', (req, res) => {
    const { year, month } = req.params;
    const posts = db.prepare("SELECT * FROM posts WHERE strftime('%Y', created_at) = ? AND strftime('%m', created_at) = ? ORDER BY created_at DESC").all(year, month);
    const date = new Date(year, parseInt(month) - 1);
    const monthName = date.toLocaleString('default', { month: 'long' }).toUpperCase();
    res.render('index', { ...getCommonData(), posts, title: `ARCHIVE: ${monthName} ${year}` });
});

router.get('/page/:slug', (req, res) => {
    const page = db.prepare('SELECT * FROM pages WHERE slug = ?').get(req.params.slug);
    if (!page) return res.status(404).send('Page not found');
    page.renderedContent = md.render(page.content);
    res.render('page', { ...getCommonData(), page });
});

module.exports = router;
