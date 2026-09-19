const { ZodError } = require('zod');
const ApiError = require('../utils/ApiError');

function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message, errors: err.errors });
  }

  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
    return res.status(422).json({ success: false, message: 'Validation failed', errors });
  }

  if (err.name === 'FileValidationError') {
    return res.status(422).json({ success: false, message: err.message, errors: [] });
  }

  if (err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (maximum 5MB)' : err.message;
    return res.status(422).json({ success: false, message, errors: [] });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid identifier', errors: [] });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {}).join(', ') || 'field';
    return res.status(409).json({ success: false, message: `Duplicate value for ${field}`, errors: [] });
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return res.status(422).json({ success: false, message: 'Validation failed', errors });
  }

  console.error(err);
  return res.status(500).json({ success: false, message: 'Internal server error', errors: [] });
}

module.exports = { notFoundHandler, errorHandler };
