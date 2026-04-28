const express = require('express');
const router = express.Router();
const RSS = require('rss');
const db = require('../lib/db');
const logger = require('../lib/logger');

function generateRSSFeed(host, protocol) {
    const feed = new RSS({
        title: 'Retro Blog',
        description: 'A retro-styled blog engine',
        feed_url: `${protocol}://${host}/rss/feed`,
        site_url: `${protocol}://${host}`,
        language: 'en'
    });

    try {
        const posts = db.prepare('SELECT * FROM posts ORDER BY created_at DESC LIMIT 20').all();

        posts.forEach(post => {
            feed.item({
                title: post.title,
                description: post.summary || post.content,
                url: `${protocol}://${host}/post/${post.slug}`,
                author: 'Retro Blog',
                date: new Date(post.created_at)
            });
        });
    } catch (err) {
        logger.logError(err, { context: 'RSS feed generation' });
    }

    return feed;
}

router.get('/feed', (req, res) => {
    try {
        const host = req.get('host');
        const protocol = req.protocol;
        const format = req.query.format || 'xml';

        const feed = generateRSSFeed(host, protocol);

        if (format === 'html') {
            const htmlContent = generateHtmlFeed(feed, host, protocol);
            res.set('Content-Type', 'text/html; charset=utf-8');
            res.send(htmlContent);
        } else {
            res.set('Content-Type', 'application/rss+xml; charset=utf-8');
            res.send(feed.xml());
        }
    } catch (err) {
        logger.logError(err, { context: 'RSS feed request' });
        res.status(500).send('Error generating RSS feed');
    }
});

function generateHtmlFeed(feed, host, protocol) {
    const posts = db.prepare('SELECT * FROM posts ORDER BY created_at DESC LIMIT 20').all();
    
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Retro Blog RSS Feed</title>
    <style>
        body {
            font-family: monospace;
            background-color: #0000AA;
            color: #AAAAAA;
            padding: 20px;
            line-height: 1.6;
        }
        .feed-container {
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid #FFFFFF;
            padding: 20px;
        }
        .feed-title {
            color: #FFFF55;
            font-size: 24px;
            margin-bottom: 10px;
        }
        .feed-desc {
            color: #AAAAAA;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .post-item {
            border-bottom: 1px solid #AAAAAA;
            padding: 15px 0;
            margin-bottom: 15px;
        }
        .post-item:last-child {
            border-bottom: none;
        }
        .post-title {
            color: #FFFF55;
            text-decoration: none;
            font-weight: bold;
        }
        .post-title:hover {
            text-decoration: underline;
        }
        .post-date {
            color: #888888;
            font-size: 12px;
            margin-top: 5px;
        }
        .post-summary {
            color: #AAAAAA;
            margin-top: 8px;
            font-size: 13px;
        }
        .feed-meta {
            text-align: center;
            margin-top: 40px;
            font-size: 12px;
            color: #888888;
        }
        a {
            color: #FFFF55;
        }
    </style>
</head>
<body>
    <div class="feed-container">
        <div class="feed-title">Retro Blog</div>
        <div class="feed-desc">
            A retro-styled blog engine • <a href="${protocol}://${host}/rss/feed?format=xml">View as XML</a>
        </div>
`;

    posts.forEach(post => {
        const date = new Date(post.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const summary = post.summary || post.content.substring(0, 200);
        
        html += `
        <div class="post-item">
            <a href="${protocol}://${host}/post/${post.slug}" class="post-title">${post.title}</a>
            <div class="post-date">${date}</div>
            <div class="post-summary">${summary}${summary.length < (post.summary ? post.summary.length : post.content.length) ? '...' : ''}</div>
        </div>
`;
    });

    html += `
        <div class="feed-meta">
            Updated ${new Date().toLocaleString()} • Last 20 posts • Subscribe via <a href="${protocol}://${host}/rss/feed">RSS</a>
        </div>
    </div>
</body>
</html>
`;

    return html;
}

module.exports = router;
