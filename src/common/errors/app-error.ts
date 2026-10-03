export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = "INTERNAL_ERROR",
    details?: unknown,
    isOperational: boolean = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(
    message: string,
    details?: unknown,
    errorCode = "BAD_REQUEST",
  ) {
    return new AppError(message, 400, errorCode, details);
  }

  static unauthorized(
    message = "Authentication required",
    errorCode = "UNAUTHORIZED",
  ) {
    return new AppError(message, 401, errorCode);
  }

  static forbidden(
    message = "Insufficient permissions",
    errorCode = "FORBIDDEN",
  ) {
    return new AppError(message, 403, errorCode);
  }

  static notFound(message = "Resource not found", errorCode = "NOT_FOUND") {
    return new AppError(message, 404, errorCode);
  }

  static conflict(message: string, details?: unknown, errorCode = "CONFLICT") {
    return new AppError(message, 409, errorCode, details);
  }

  static unprocessable(
    message: string,
    details?: unknown,
    errorCode = "VALIDATION_ERROR",
  ) {
    return new AppError(message, 422, errorCode, details);
  }

  static tooManyRequests(
    message = "Too many requests, please try again later",
    errorCode = "RATE_LIMIT_EXCEEDED",
  ) {
    return new AppError(message, 429, errorCode);
  }

  static serviceUnavailable(
    message = "Service temporarily unavailable",
    errorCode = "SERVICE_UNAVAILABLE",
  ) {
    return new AppError(message, 503, errorCode);
  }
}
