/**
 * Async handler wrapper
 * Eliminates the need for try-catch in every controller.
 * Wraps an async function and passes errors to next().
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom API Error class
 * Extends Error with a status code for the error handler.
 */
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = { asyncHandler, ApiError };
