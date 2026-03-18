/**
 * Structured logging module with correlation IDs
 * Uses Winston for production-grade logging
 */

const winston = require('winston');
const { v4: uuidv4 } = require('crypto');

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
    let msg = `${timestamp} [${level}]`;
    if (correlationId) msg += ` [${correlationId}]`;
    msg += `: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: structuredFormat,
  defaultMeta: { service: 'cloudigan-api' },
  transports: [
    // Write all logs to file
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// Add console transport for non-production
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

/**
 * Generate correlation ID for request tracking
 */
function generateCorrelationId() {
  return uuidv4().split('-')[0]; // Use first segment for brevity
}

/**
 * Create child logger with correlation ID
 */
function createRequestLogger(correlationId = null) {
  const id = correlationId || generateCorrelationId();
  return logger.child({ correlationId: id });
}

/**
 * Express middleware to add correlation ID to requests
 */
function correlationMiddleware(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
  req.correlationId = correlationId;
  req.logger = createRequestLogger(correlationId);
  
  // Add correlation ID to response headers
  res.setHeader('X-Correlation-ID', correlationId);
  
  // Log incoming request
  req.logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  
  next();
}

/**
 * Log error with full context
 */
function logError(logger, error, context = {}) {
  logger.error(error.message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    ...context
  });
}

module.exports = {
  logger,
  generateCorrelationId,
  createRequestLogger,
  correlationMiddleware,
  logError
};
