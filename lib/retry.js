/**
 * Retry mechanism with exponential backoff
 * For handling transient failures in webhook processing
 */

const { logger } = require('./logger');

/**
 * Retry configuration
 */
const DEFAULT_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETUNREACH',
    'EAI_AGAIN'
  ]
};

/**
 * Check if error is retryable
 */
function isRetryableError(error, config = DEFAULT_CONFIG) {
  // Network errors
  if (config.retryableErrors.includes(error.code)) {
    return true;
  }
  
  // HTTP status codes that should be retried
  if (error.response) {
    const status = error.response.status;
    return status === 429 || // Rate limit
           status === 502 || // Bad gateway
           status === 503 || // Service unavailable
           status === 504;   // Gateway timeout
  }
  
  // Datto API specific errors
  if (error.message && error.message.includes('Token expired')) {
    return true;
  }
  
  return false;
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt, config = DEFAULT_CONFIG) {
  const delay = Math.min(
    config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelay
  );
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return Math.floor(delay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry async operation with exponential backoff
 */
async function retryAsync(operation, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };
  const operationName = options.operationName || 'operation';
  const requestLogger = options.logger || logger;
  
  let lastError;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = calculateDelay(attempt - 1, config);
        requestLogger.info(`Retrying ${operationName}`, {
          attempt,
          maxRetries: config.maxRetries,
          delayMs: delay
        });
        await sleep(delay);
      }
      
      const result = await operation();
      
      if (attempt > 0) {
        requestLogger.info(`${operationName} succeeded after retry`, {
          attempt,
          totalAttempts: attempt + 1
        });
      }
      
      return result;
      
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (!isRetryableError(error, config)) {
        requestLogger.warn(`${operationName} failed with non-retryable error`, {
          error: error.message,
          code: error.code,
          attempt
        });
        throw error;
      }
      
      // Check if we've exhausted retries
      if (attempt >= config.maxRetries) {
        requestLogger.error(`${operationName} failed after all retries`, {
          error: error.message,
          code: error.code,
          totalAttempts: attempt + 1,
          maxRetries: config.maxRetries
        });
        throw error;
      }
      
      requestLogger.warn(`${operationName} failed, will retry`, {
        error: error.message,
        code: error.code,
        attempt,
        maxRetries: config.maxRetries
      });
    }
  }
  
  throw lastError;
}

/**
 * Retry with circuit breaker pattern
 * Prevents cascading failures by stopping retries after threshold
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.lastFailureTime = null;
  }
  
  async execute(operation, options = {}) {
    // Check if circuit is open
    if (this.state === 'OPEN') {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      
      if (timeSinceFailure >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker entering HALF_OPEN state');
      } else {
        throw new Error('Circuit breaker is OPEN - operation blocked');
      }
    }
    
    try {
      const result = await retryAsync(operation, options);
      
      // Success - reset circuit breaker
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
        logger.info('Circuit breaker reset to CLOSED state');
      }
      
      return result;
      
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
        logger.error('Circuit breaker opened due to failures', {
          failures: this.failures,
          threshold: this.failureThreshold
        });
      }
      
      throw error;
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

module.exports = {
  retryAsync,
  isRetryableError,
  calculateDelay,
  CircuitBreaker,
  DEFAULT_CONFIG
};
