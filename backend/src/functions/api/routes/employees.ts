import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Effect, pipe } from "effect";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import { EmployeeEntity, type EmploymentType } from "../../../core/database/entities";
import { SpalfTable } from "../../../core/database/table";
import { ValidationError, DatabaseError, NotFoundError, type AppError } from "../../../core/shared/errors";
import { generateId } from "../../../core/shared/utils";

// Types for request bodies
interface CreateEmployeeBody {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  employmentType: EmploymentType;
  schedule?: Record<string, { start: string; end: string; isWorking: boolean }>;
  serviceIds?: string[];
}

interface UpdateEmployeeBody extends Partial<CreateEmployeeBody> {}

// Helper to create JSON response
function jsonResponse(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  };
}

// Helper to parse JSON body
function parseBody<T>(event: APIGatewayProxyEvent): Effect.Effect<T, ValidationError> {
  return Effect.try({
    try: () => JSON.parse(event.body || "{}") as T,
    catch: () =>
      new ValidationError({
        message: "Invalid JSON body",
      }),
  });
}

// Validate create employee body
function validateCreateEmployee(body: CreateEmployeeBody): Effect.Effect<CreateEmployeeBody, ValidationError> {
  if (!body.firstName?.trim()) {
    return Effect.fail(new ValidationError({ message: "First name is required", field: "firstName" }));
  }
  if (!body.lastName?.trim()) {
    return Effect.fail(new ValidationError({ message: "Last name is required", field: "lastName" }));
  }
  if (!body.email?.trim()) {
    return Effect.fail(new ValidationError({ message: "Email is required", field: "email" }));
  }
  if (!["FULLTIME", "FREELANCE"].includes(body.employmentType)) {
    return Effect.fail(new ValidationError({ message: "Invalid employment type", field: "employmentType" }));
  }
  return Effect.succeed(body);
}

export const employeesRouter = {
  // GET /api/employees
  list: (
    _event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId } = params;

    return pipe(
      Effect.tryPromise({
        try: async () => {
          const result = await SpalfTable.build(QueryCommand)
            .query({
              index: "GSI1",
              partition: `SPA#${spaId}`,
              range: { beginsWith: "EMPLOYEE#" },
            })
            .entities(EmployeeEntity)
            .send();
          return result.Items || [];
        },
        catch: (error) => {
          console.error("Query error:", error);
          return new DatabaseError({ message: "Failed to list employees", operation: "query", cause: error });
        },
      }),
      Effect.map((employees) => jsonResponse(200, { data: employees }))
    );
  },

  // POST /api/employees
  create: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId } = params;

    return pipe(
      parseBody<CreateEmployeeBody>(event),
      Effect.flatMap(validateCreateEmployee),
      Effect.flatMap((body) => {
        const employeeId = generateId();
        const item = {
          employeeId,
          spaId,
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone,
          employmentType: body.employmentType,
          schedule: body.schedule,
          serviceIds: body.serviceIds || [],
          GSI1PK: `SPA#${spaId}`,
          GSI1SK: `EMPLOYEE#${employeeId}`,
        };

        return pipe(
          Effect.tryPromise({
            try: () => EmployeeEntity.build(PutItemCommand).item(item).send(),
            catch: (error) => new DatabaseError({ message: "Failed to create employee", operation: "put", cause: error }),
          }),
          Effect.map(() => jsonResponse(201, { data: { ...item, employeeId } }))
        );
      })
    );
  },

  // GET /api/employees/:id
  get: (
    _event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      Effect.tryPromise({
        try: () =>
          EmployeeEntity.build(GetItemCommand)
            .key({ spaId, employeeId: id })
            .send(),
        catch: (error) => new DatabaseError({ message: "Failed to get employee", operation: "get", cause: error }),
      }),
      Effect.flatMap((result) =>
        result.Item
          ? Effect.succeed(jsonResponse(200, { data: result.Item }))
          : Effect.fail(new NotFoundError({ entity: "Employee", id }))
      )
    );
  },

  // PUT /api/employees/:id
  update: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      parseBody<UpdateEmployeeBody>(event),
      Effect.flatMap((body) => {
        // First, get the existing employee to ensure it exists
        return pipe(
          Effect.tryPromise({
            try: () =>
              EmployeeEntity.build(GetItemCommand)
                .key({ spaId, employeeId: id })
                .send(),
            catch: (error) => new DatabaseError({ message: "Failed to get employee", operation: "get", cause: error }),
          }),
          Effect.flatMap((result) =>
            result.Item
              ? Effect.succeed(result.Item)
              : Effect.fail(new NotFoundError({ entity: "Employee", id }))
          ),
          Effect.flatMap((existing) => {
            const updateData = {
              spaId,
              employeeId: id,
              GSI1PK: `SPA#${spaId}`,
              GSI1SK: `EMPLOYEE#${id}`,
              ...(body.firstName !== undefined && { firstName: body.firstName }),
              ...(body.lastName !== undefined && { lastName: body.lastName }),
              ...(body.email !== undefined && { email: body.email }),
              ...(body.phone !== undefined && { phone: body.phone }),
              ...(body.employmentType !== undefined && { employmentType: body.employmentType }),
              ...(body.schedule !== undefined && { schedule: body.schedule }),
              ...(body.serviceIds !== undefined && { serviceIds: body.serviceIds }),
            };

            return pipe(
              Effect.tryPromise({
                try: () => EmployeeEntity.build(UpdateItemCommand).item(updateData).send(),
                catch: (error) => new DatabaseError({ message: "Failed to update employee", operation: "update", cause: error }),
              }),
              Effect.map(() => jsonResponse(200, { data: { ...existing, ...body } }))
            );
          })
        );
      })
    );
  },

  // DELETE /api/employees/:id
  delete: (
    _event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      // Verify the employee exists first
      Effect.tryPromise({
        try: () =>
          EmployeeEntity.build(GetItemCommand)
            .key({ spaId, employeeId: id })
            .send(),
        catch: (error) => new DatabaseError({ message: "Failed to get employee", operation: "get", cause: error }),
      }),
      Effect.flatMap((result) =>
        result.Item
          ? Effect.succeed(result.Item)
          : Effect.fail(new NotFoundError({ entity: "Employee", id }))
      ),
      Effect.flatMap(() =>
        Effect.tryPromise({
          try: () =>
            EmployeeEntity.build(DeleteItemCommand)
              .key({ spaId, employeeId: id })
              .send(),
          catch: (error) => new DatabaseError({ message: "Failed to delete employee", operation: "delete", cause: error }),
        })
      ),
      Effect.map(() => jsonResponse(204, null))
    );
  },
};
