const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logLevels = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

function getLogFileName() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}.log`;
}

function formatLogMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
    return `[${timestamp}] [${level}] ${message} ${metaStr}`.trim();
}

function writeLog(level, message, meta = {}) {
    const logEntry = formatLogMessage(level, message, meta);
    const logFile = path.join(logsDir, getLogFileName());
    
    try {
        fs.appendFileSync(logFile, logEntry + '\n');
    } catch (err) {
        console.error('Failed to write to log file:', err.message);
    }
}

module.exports = {
    error: (message, meta) => writeLog(logLevels.ERROR, message, meta),
    warn: (message, meta) => writeLog(logLevels.WARN, message, meta),
    info: (message, meta) => writeLog(logLevels.INFO, message, meta),
    debug: (message, meta) => writeLog(logLevels.DEBUG, message, meta),
    logRequest: (method, path, meta) => {
        writeLog(logLevels.INFO, `${method} ${path}`, meta);
    },
    logError: (err, context = {}) => {
        const meta = {
            message: err.message,
            stack: err.stack,
            ...context
        };
        writeLog(logLevels.ERROR, 'Exception occurred', meta);
    }
};
