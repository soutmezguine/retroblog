const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { isAuthenticated } = require('./admin');
const { getCommonData } = require('../lib/data');

router.get('/', isAuthenticated, async (req, res) => {
    const drafts = db.prepare('SELECT * FROM drafts ORDER BY updated_at DESC').all();
    const commonData = await getCommonData();
    res.render('admin/drafts/index', { ...commonData, user: req.session.username, drafts });
});

router.post('/publish/:id', isAuthenticated, (req, res) => {
    const draft = db.prepare('SELECT * FROM drafts WHERE id = ?').get(req.params.id);
    if (!draft) {
        return res.redirect('/admin/drafts');
    }

    if (draft.type === 'post') {
        const info = db.prepare('INSERT INTO posts (title, slug, content, summary, category_id) VALUES (?, ?, ?, ?, ?)')
            .run(draft.title, draft.slug, draft.content, draft.summary, draft.category_id || null);
        const postId = info.lastInsertRowid;
        let tagList = [];
        if (draft.tag_ids) {
            tagList = draft.tag_ids.split(',').map(id => id.trim()).filter(Boolean);
        }
        if (draft.new_tags) {
            const newTagNames = draft.new_tags.split(',').map(t => t.trim()).filter(t => t);
            const insertTagStmt = db.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)');
            const selectTagStmt = db.prepare('SELECT id FROM tags WHERE name = ?');
            newTagNames.forEach(name => {
                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                insertTagStmt.run(name, slug);
                const tag = selectTagStmt.get(name);
                if (tag) tagList.push(tag.id.toString());
            });
        }
        const insertTag = db.prepare('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)');
        tagList.forEach(tagId => insertTag.run(postId, tagId));
    } else if (draft.type === 'page') {
        db.prepare('INSERT INTO pages (title, slug, content, navigation_order) VALUES (?, ?, ?, ?)')
            .run(draft.title, draft.slug, draft.content, draft.navigation_order || 0);
    }

    db.prepare('DELETE FROM drafts WHERE id = ?').run(req.params.id);
    res.redirect('/admin/drafts');
});

router.post('/delete/:id', isAuthenticated, (req, res) => {
    db.prepare('DELETE FROM drafts WHERE id = ?').run(req.params.id);
    res.redirect('/admin/drafts');
});

module.exports = router;
