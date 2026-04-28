const sntp = require('sntp');
const moment = require('moment-timezone');

let cachedTime = null;
let cacheExpiry = 0;

async function getCurrentTime(settings) {
    const now = Date.now();
    if (cachedTime && now < cacheExpiry) {
        return cachedTime;
    }

    try {
        const ntpTime = await sntp.time({ server: settings.time_server || 'pool.ntp.org' });
        const utcTime = new Date(ntpTime.t);
        const timeZone = settings.time_zone || 'UTC';
        const zonedTime = moment(utcTime).tz(timeZone);
        cachedTime = zonedTime.toDate();
        cacheExpiry = now + 60000; // Cache for 1 minute
        return cachedTime;
    } catch (err) {
        console.error('NTP sync failed, using local time:', err.message);
        const timeZone = settings.time_zone || 'UTC';
        return moment().tz(timeZone).toDate();
    }
}

function formatDate(date, settings) {
    const timeZone = settings.time_zone || 'UTC';
    return moment(date).tz(timeZone).format('MMMM D, YYYY [at] h:mm A z');
}

module.exports = { getCurrentTime, formatDate };