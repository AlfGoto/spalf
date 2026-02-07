import { Data } from "effect";

// Base error class for all Spalf errors
export class SpalfError extends Data.TaggedError("SpalfError")<{
  readonly message: string;
  readonly code: string;
  readonly statusCode: number;
  readonly cause?: unknown;
}> {}

// Not Found Errors
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly entity: string;
  readonly id: string;
}> {
  get message() {
    return `${this.entity} with id '${this.id}' not found`;
  }
  get code() {
    return "NOT_FOUND";
  }
  get statusCode() {
    return 404;
  }
}

// Validation Errors
export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly message: string;
  readonly field?: string;
}> {
  get code() {
    return "VALIDATION_ERROR";
  }
  get statusCode() {
    return 400;
  }
}

// Conflict Errors
export class ConflictError extends Data.TaggedError("ConflictError")<{
  readonly message: string;
  readonly conflictType: "SCHEDULE" | "ROOM" | "PRODUCT" | "OTHER";
}> {
  get code() {
    return "CONFLICT_ERROR";
  }
  get statusCode() {
    return 409;
  }
}

// Authorization Errors
export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  readonly message: string;
}> {
  get code() {
    return "UNAUTHORIZED";
  }
  get statusCode() {
    return 401;
  }
}

export class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
  readonly message: string;
  readonly resource?: string;
}> {
  get code() {
    return "FORBIDDEN";
  }
  get statusCode() {
    return 403;
  }
}

// Database Errors
export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly message: string;
  readonly operation: string;
  readonly cause?: unknown;
}> {
  get code() {
    return "DATABASE_ERROR";
  }
  get statusCode() {
    return 500;
  }
}

// Business Rule Errors
export class BusinessRuleError extends Data.TaggedError("BusinessRuleError")<{
  readonly message: string;
  readonly rule: string;
}> {
  get code() {
    return "BUSINESS_RULE_ERROR";
  }
  get statusCode() {
    return 422;
  }
}

// Type union of all errors
export type AppError =
  | SpalfError
  | NotFoundError
  | ValidationError
  | ConflictError
  | UnauthorizedError
  | ForbiddenError
  | DatabaseError
  | BusinessRuleError;

// Helper to convert any error to an API response
export function errorToResponse(error: AppError) {
  return {
    statusCode: error.statusCode,
    body: JSON.stringify({
      error: {
        code: error.code,
        message: error.message,
      },
    }),
    headers: {
      "Content-Type": "application/json",
    },
  };
}
