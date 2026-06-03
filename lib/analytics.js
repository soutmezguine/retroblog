const db = require('./db');
const geoip = require('geoip-lite');

/**
 * Track a visitor's visit
 */
function trackVisitor(ip) {
    try {
        const geo = geoip.lookup(ip);
        const countryCode = geo ? geo.country : 'XX';
        const latitude = geo ? geo.ll[0] : null;
        const longitude = geo ? geo.ll[1] : null;
        const city = geo ? geo.city : null;

        db.prepare(`
            INSERT INTO visitors (ip, country_code, latitude, longitude, city)
            VALUES (?, ?, ?, ?, ?)
        `).run(ip, countryCode, latitude, longitude, city);
    } catch (err) {
        console.error('Failed to track visitor:', err);
    }
}

/**
 * Track a page view for a specific post or page
 */
function trackPageView(ip, postId = null, pageId = null) {
    try {
        db.prepare(`
            INSERT INTO page_views (post_id, page_id, ip)
            VALUES (?, ?, ?)
        `).run(postId, pageId, ip);
    } catch (err) {
        console.error('Failed to track page view:', err);
    }
}

/**
 * Get visitor analytics for the last N days
 */
function getVisitorGeoData(days = 7) {
    try {
        const result = db.prepare(`
            SELECT 
                country_code,
                city,
                latitude,
                longitude,
                COUNT(*) as count
            FROM visitors
            WHERE visited_at > datetime('now', '-' || ? || ' days')
            GROUP BY country_code, city, latitude, longitude
            ORDER BY count DESC
        `).all(days);
        return result || [];
    } catch (err) {
        console.error('Failed to get visitor geo data:', err);
        return [];
    }
}

/**
 * Get top N pages by unique views in a time period
 */
function getTopPages(limit = 10, days = 7) {
    try {
        const result = db.prepare(`
            SELECT 
                COALESCE(p.id, pg.id) as content_id,
                COALESCE(p.title, pg.title) as title,
                COALESCE(p.slug, pg.slug) as slug,
                'post' as type,
                COUNT(DISTINCT pv.ip) as unique_views,
                COUNT(*) as total_views
            FROM page_views pv
            LEFT JOIN posts p ON pv.post_id = p.id
            LEFT JOIN pages pg ON pv.page_id = pg.id
            WHERE pv.visited_at > datetime('now', '-' || ? || ' days')
            AND (pv.post_id IS NOT NULL OR pv.page_id IS NOT NULL)
            GROUP BY COALESCE(p.id, pg.id)
            ORDER BY unique_views DESC
            LIMIT ?
        `).all(days, limit);
        return result || [];
    } catch (err) {
        console.error('Failed to get top pages:', err);
        return [];
    }
}

/**
 * Get analytics for a specific time period (day, week, month, year)
 */
function getPageViewsByPeriod(postId, pageId, period = 'day') {
    try {
        let daysBack = 1;
        if (period === 'week') daysBack = 7;
        else if (period === 'month') daysBack = 30;
        else if (period === 'year') daysBack = 365;

        const result = db.prepare(`
            SELECT 
                COUNT(DISTINCT ip) as unique_views,
                COUNT(*) as total_views
            FROM page_views
            WHERE visited_at > datetime('now', '-' || ? || ' days')
            AND (post_id = ? OR page_id = ?)
        `).get(daysBack, postId, pageId);
        
        return result || { unique_views: 0, total_views: 0 };
    } catch (err) {
        console.error('Failed to get page views by period:', err);
        return { unique_views: 0, total_views: 0 };
    }
}

/**
 * Get comprehensive analytics data for dashboard
 */
function getDashboardAnalytics() {
    try {
        const topPages = {
            day: getTopPages(10, 1),
            week: getTopPages(10, 7),
            month: getTopPages(10, 30),
            year: getTopPages(10, 365)
        };

        const visitorGeo = getVisitorGeoData(7);

        const totalVisitors = db.prepare(`
            SELECT COUNT(DISTINCT ip) as count FROM visitors WHERE visited_at > datetime('now', '-7 days')
        `).get().count;

        const totalPageViews = db.prepare(`
            SELECT COUNT(*) as count FROM page_views WHERE visited_at > datetime('now', '-7 days')
        `).get().count;

        return {
            topPages,
            visitorGeo,
            totalVisitors,
            totalPageViews
        };
    } catch (err) {
        console.error('Failed to get dashboard analytics:', err);
        return {
            topPages: { day: [], week: [], month: [], year: [] },
            visitorGeo: [],
            totalVisitors: 0,
            totalPageViews: 0
        };
    }
}

module.exports = {
    trackVisitor,
    trackPageView,
    getVisitorGeoData,
    getTopPages,
    getPageViewsByPeriod,
    getDashboardAnalytics
};
