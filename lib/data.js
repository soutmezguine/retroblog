const db = require('./db');

function getCommonData() {
    const settings = db.prepare('SELECT key, value FROM settings').all().reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {});
    const pages = db.prepare('SELECT * FROM pages ORDER BY navigation_order ASC').all();
    const categories = db.prepare('SELECT * FROM categories').all();
    const tags = db.prepare('SELECT * FROM tags').all();

    const archives = db.prepare(`
        SELECT DISTINCT strftime('%Y', created_at) as year, strftime('%m', created_at) as month
        FROM posts
        ORDER BY year DESC, month DESC
    `).all().map(a => {
        const date = new Date(a.year, parseInt(a.month) - 1);
        return { ...a, month_name: date.toLocaleString('default', { month: 'long' }).toUpperCase() };
    });

    return { settings, pages, categories, tags, archives };
}

module.exports = { getCommonData };
