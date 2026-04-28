const express = require('express');
const router = express.Router();
const RSS = require('rss');
const db = require('../lib/db');

router.get('/feed', (req, res) => {
    const feed = new RSS({
        title: 'Retro Blog',
        description: 'A retro-styled blog engine',
        feed_url: `${req.protocol}://${req.get('host')}/rss/feed`,
        site_url: `${req.protocol}://${req.get('host')}`,
        language: 'en'
    });

    const posts = db.prepare('SELECT * FROM posts ORDER BY created_at DESC LIMIT 20').all();

    posts.forEach(post => {
        feed.item({
            title: post.title,
            description: post.summary || post.content,
            url: `${req.protocol}://${req.get('host')}/post/${post.slug}`,
            author: 'Retro Blog',
            date: new Date(post.created_at)
        });
    });

    res.set('Content-Type', 'application/rss+xml');
    res.send(feed.xml());
});

module.exports = router;
