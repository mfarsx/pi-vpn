const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse = {
    error: isDevelopment ? err.message : 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  };

  if (isDevelopment) {
    errorResponse.stack = err.stack;
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      ...errorResponse,
      error: 'Validation error',
      details: err.details
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      ...errorResponse,
      error: 'Unauthorized'
    });
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({
      ...errorResponse,
      error: 'Forbidden'
    });
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json({
      ...errorResponse,
      error: 'Resource not found'
    });
  }

  // Default to 500 server error
  res.status(500).json(errorResponse);
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};