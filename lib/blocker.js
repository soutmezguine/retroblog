const geoip = require('geoip-lite');
const db = require('./db');

const blockMiddleware = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const isBlocked = db.prepare('SELECT id FROM blocked_ips WHERE ip = ?').get(ip);
    if (isBlocked) return res.status(403).send('Your IP is blocked.');

    const geo = geoip.lookup(ip);
    if (geo) {
        const isCountryBlocked = db.prepare('SELECT id FROM blocked_ips WHERE country_code = ?').get(geo.country);
        if (isCountryBlocked) return res.status(403).send(`Access denied from ${geo.country}.`);
    }
    next();
};

module.exports = blockMiddleware;
