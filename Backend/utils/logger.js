const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const transports = [];

// Check if we can write to filesystem (not in serverless)
const canWriteToFS = (() => {
  try {
    const testDir = path.join(__dirname, '../logs');
    fs.mkdirSync(testDir, { recursive: true });
    return true;
  } catch (err) {
    return false;
  }
})();

// Only use file transports if filesystem is writable
if (canWriteToFS) {
  const logDir = path.join(__dirname, '../logs');
  transports.push(
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Always use console transport (Vercel captures these)
transports.push(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: logFormat,
  defaultMeta: { service: 'cloud-vm-management' },
  transports
});

module.exports = logger;
