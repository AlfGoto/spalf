import {
  SpalfError,
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  DatabaseError,
  BusinessRuleError,
  errorToResponse,
} from "./errors";

describe("errors", () => {
  describe("SpalfError", () => {
    it("should create a tagged error with all properties", () => {
      const error = new SpalfError({
        message: "Something went wrong",
        code: "GENERIC_ERROR",
        statusCode: 500,
        cause: new Error("Original error"),
      });

      expect(error.message).toBe("Something went wrong");
      expect(error.code).toBe("GENERIC_ERROR");
      expect(error.statusCode).toBe(500);
      expect(error.cause).toBeInstanceOf(Error);
      expect(error._tag).toBe("SpalfError");
    });
  });

  describe("NotFoundError", () => {
    it("should create a not found error with entity info", () => {
      const error = new NotFoundError({
        entity: "Employee",
        id: "emp-123",
      });

      expect(error.entity).toBe("Employee");
      expect(error.id).toBe("emp-123");
      expect(error.message).toBe("Employee with id 'emp-123' not found");
      expect(error.code).toBe("NOT_FOUND");
      expect(error.statusCode).toBe(404);
      expect(error._tag).toBe("NotFoundError");
    });

    it("should work with different entity types", () => {
      const error = new NotFoundError({
        entity: "Reservation",
        id: "res-456",
      });

      expect(error.message).toBe("Reservation with id 'res-456' not found");
    });
  });

  describe("ValidationError", () => {
    it("should create a validation error with message", () => {
      const error = new ValidationError({
        message: "Email is required",
      });

      expect(error.message).toBe("Email is required");
      expect(error.field).toBeUndefined();
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.statusCode).toBe(400);
      expect(error._tag).toBe("ValidationError");
    });

    it("should include optional field name", () => {
      const error = new ValidationError({
        message: "Invalid email format",
        field: "email",
      });

      expect(error.message).toBe("Invalid email format");
      expect(error.field).toBe("email");
    });
  });

  describe("ConflictError", () => {
    it("should create a conflict error with type", () => {
      const error = new ConflictError({
        message: "Employee already has a booking at this time",
        conflictType: "SCHEDULE",
      });

      expect(error.message).toBe("Employee already has a booking at this time");
      expect(error.conflictType).toBe("SCHEDULE");
      expect(error.code).toBe("CONFLICT_ERROR");
      expect(error.statusCode).toBe(409);
      expect(error._tag).toBe("ConflictError");
    });

    it("should handle different conflict types", () => {
      const roomError = new ConflictError({
        message: "Room is fully booked",
        conflictType: "ROOM",
      });
      expect(roomError.conflictType).toBe("ROOM");

      const productError = new ConflictError({
        message: "Product out of stock",
        conflictType: "PRODUCT",
      });
      expect(productError.conflictType).toBe("PRODUCT");

      const otherError = new ConflictError({
        message: "Generic conflict",
        conflictType: "OTHER",
      });
      expect(otherError.conflictType).toBe("OTHER");
    });
  });

  describe("UnauthorizedError", () => {
    it("should create an unauthorized error", () => {
      const error = new UnauthorizedError({
        message: "Invalid credentials",
      });

      expect(error.message).toBe("Invalid credentials");
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.statusCode).toBe(401);
      expect(error._tag).toBe("UnauthorizedError");
    });
  });

  describe("ForbiddenError", () => {
    it("should create a forbidden error", () => {
      const error = new ForbiddenError({
        message: "Access denied",
      });

      expect(error.message).toBe("Access denied");
      expect(error.resource).toBeUndefined();
      expect(error.code).toBe("FORBIDDEN");
      expect(error.statusCode).toBe(403);
      expect(error._tag).toBe("ForbiddenError");
    });

    it("should include optional resource", () => {
      const error = new ForbiddenError({
        message: "Cannot access this spa",
        resource: "spa-123",
      });

      expect(error.resource).toBe("spa-123");
    });
  });

  describe("DatabaseError", () => {
    it("should create a database error", () => {
      const originalError = new Error("Connection refused");
      const error = new DatabaseError({
        message: "Failed to connect to database",
        operation: "connect",
        cause: originalError,
      });

      expect(error.message).toBe("Failed to connect to database");
      expect(error.operation).toBe("connect");
      expect(error.cause).toBe(originalError);
      expect(error.code).toBe("DATABASE_ERROR");
      expect(error.statusCode).toBe(500);
      expect(error._tag).toBe("DatabaseError");
    });

    it("should work without cause", () => {
      const error = new DatabaseError({
        message: "Query failed",
        operation: "query",
      });

      expect(error.cause).toBeUndefined();
    });
  });

  describe("BusinessRuleError", () => {
    it("should create a business rule error", () => {
      const error = new BusinessRuleError({
        message: "Cannot cancel within 24 hours of appointment",
        rule: "CANCELLATION_DEADLINE",
      });

      expect(error.message).toBe("Cannot cancel within 24 hours of appointment");
      expect(error.rule).toBe("CANCELLATION_DEADLINE");
      expect(error.code).toBe("BUSINESS_RULE_ERROR");
      expect(error.statusCode).toBe(422);
      expect(error._tag).toBe("BusinessRuleError");
    });
  });

  describe("errorToResponse", () => {
    it("should convert NotFoundError to API response", () => {
      const error = new NotFoundError({ entity: "Employee", id: "123" });
      const response = errorToResponse(error);

      expect(response.statusCode).toBe(404);
      expect(response.headers).toEqual({ "Content-Type": "application/json" });
      expect(JSON.parse(response.body)).toEqual({
        error: {
          code: "NOT_FOUND",
          message: "Employee with id '123' not found",
        },
      });
    });

    it("should convert ValidationError to API response", () => {
      const error = new ValidationError({ message: "Invalid input", field: "email" });
      const response = errorToResponse(error);

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
        },
      });
    });

    it("should convert ConflictError to API response", () => {
      const error = new ConflictError({ message: "Time slot taken", conflictType: "SCHEDULE" });
      const response = errorToResponse(error);

      expect(response.statusCode).toBe(409);
      expect(JSON.parse(response.body)).toEqual({
        error: {
          code: "CONFLICT_ERROR",
          message: "Time slot taken",
        },
      });
    });

    it("should convert UnauthorizedError to API response", () => {
      const error = new UnauthorizedError({ message: "Token expired" });
      const response = errorToResponse(error);

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.body)).toEqual({
        error: {
          code: "UNAUTHORIZED",
          message: "Token expired",
        },
      });
    });

    it("should convert ForbiddenError to API response", () => {
      const error = new ForbiddenError({ message: "Not allowed" });
      const response = errorToResponse(error);

      expect(response.statusCode).toBe(403);
      expect(JSON.parse(response.body)).toEqual({
        error: {
          code: "FORBIDDEN",
          message: "Not allowed",
        },
      });
    });

    it("should convert DatabaseError to API response", () => {
      const error = new DatabaseError({ message: "DB error", operation: "insert" });
      const response = errorToResponse(error);

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        error: {
          code: "DATABASE_ERROR",
          message: "DB error",
        },
      });
    });

    it("should convert BusinessRuleError to API response", () => {
      const error = new BusinessRuleError({ message: "Rule violated", rule: "TEST_RULE" });
      const response = errorToResponse(error);

      expect(response.statusCode).toBe(422);
      expect(JSON.parse(response.body)).toEqual({
        error: {
          code: "BUSINESS_RULE_ERROR",
          message: "Rule violated",
        },
      });
    });
  });
});
