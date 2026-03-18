/**
 * Custom error classes for better error handling and categorization
 */

/**
 * Base error class with additional context
 */
class AppError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code;
    this.statusCode = options.statusCode || 500;
    this.isOperational = options.isOperational !== false; // Operational errors are expected
    this.context = options.context || {};
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Stripe webhook validation errors
 */
class WebhookValidationError extends AppError {
  constructor(message, context = {}) {
    super(message, {
      code: 'WEBHOOK_VALIDATION_ERROR',
      statusCode: 400,
      isOperational: true,
      context
    });
  }
}

/**
 * Datto API errors
 */
class DattoApiError extends AppError {
  constructor(message, context = {}) {
    super(message, {
      code: 'DATTO_API_ERROR',
      statusCode: 502,
      isOperational: true,
      context
    });
  }
}

/**
 * Datto authentication errors
 */
class DattoAuthError extends AppError {
  constructor(message, context = {}) {
    super(message, {
      code: 'DATTO_AUTH_ERROR',
      statusCode: 401,
      isOperational: true,
      context
    });
  }
}

/**
 * Email sending errors
 */
class EmailError extends AppError {
  constructor(message, context = {}) {
    super(message, {
      code: 'EMAIL_ERROR',
      statusCode: 500,
      isOperational: true,
      context
    });
  }
}

/**
 * Wix CMS errors
 */
class WixCmsError extends AppError {
  constructor(message, context = {}) {
    super(message, {
      code: 'WIX_CMS_ERROR',
      statusCode: 502,
      isOperational: true,
      context
    });
  }
}

/**
 * Stripe API errors
 */
class StripeApiError extends AppError {
  constructor(message, context = {}) {
    super(message, {
      code: 'STRIPE_API_ERROR',
      statusCode: 502,
      isOperational: true,
      context
    });
  }
}

/**
 * Configuration errors
 */
class ConfigurationError extends AppError {
  constructor(message, context = {}) {
    super(message, {
      code: 'CONFIGURATION_ERROR',
      statusCode: 500,
      isOperational: false, // Non-operational - requires code fix
      context
    });
  }
}

/**
 * Rate limit errors
 */
class RateLimitError extends AppError {
  constructor(message, context = {}) {
    super(message, {
      code: 'RATE_LIMIT_ERROR',
      statusCode: 429,
      isOperational: true,
      context
    });
  }
}

/**
 * Timeout errors
 */
class TimeoutError extends AppError {
  constructor(message, context = {}) {
    super(message, {
      code: 'TIMEOUT_ERROR',
      statusCode: 504,
      isOperational: true,
      context
    });
  }
}

/**
 * Check if error is operational (expected) vs programming error
 */
function isOperationalError(error) {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Format error for API response
 */
function formatErrorResponse(error, includeStack = false) {
  const response = {
    error: {
      message: error.message,
      code: error.code || 'INTERNAL_ERROR',
      statusCode: error.statusCode || 500
    }
  };
  
  if (error.context && Object.keys(error.context).length > 0) {
    response.error.context = error.context;
  }
  
  if (includeStack && error.stack) {
    response.error.stack = error.stack;
  }
  
  return response;
}

module.exports = {
  AppError,
  WebhookValidationError,
  DattoApiError,
  DattoAuthError,
  EmailError,
  WixCmsError,
  StripeApiError,
  ConfigurationError,
  RateLimitError,
  TimeoutError,
  isOperationalError,
  formatErrorResponse
};
