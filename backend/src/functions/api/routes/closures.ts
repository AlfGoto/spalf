import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Effect, pipe } from "effect";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import { ClosureEntity } from "../../../core/database/entities";
import { SpalfTable } from "../../../core/database/table";
import { ValidationError, DatabaseError, NotFoundError, type AppError } from "../../../core/shared/errors";
import { generateId } from "../../../core/shared/utils";

// Types for request bodies
interface CreateClosureBody {
  date: string; // YYYY-MM-DD
  reason?: string;
  isAllDay?: boolean;
  startTime?: string; // HH:mm (only if isAllDay is false)
  endTime?: string; // HH:mm (only if isAllDay is false)
}

interface UpdateClosureBody extends Partial<CreateClosureBody> {}

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

// Validate create closure body
function validateCreateClosure(body: CreateClosureBody): Effect.Effect<CreateClosureBody, ValidationError> {
  if (!body.date?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return Effect.fail(new ValidationError({ message: "Valid date (YYYY-MM-DD) is required", field: "date" }));
  }
  
  // If not all day, validate time fields
  if (body.isAllDay === false) {
    if (!body.startTime || !/^\d{2}:\d{2}$/.test(body.startTime)) {
      return Effect.fail(new ValidationError({ message: "Valid start time (HH:mm) is required for partial closures", field: "startTime" }));
    }
    if (!body.endTime || !/^\d{2}:\d{2}$/.test(body.endTime)) {
      return Effect.fail(new ValidationError({ message: "Valid end time (HH:mm) is required for partial closures", field: "endTime" }));
    }
    if (body.startTime >= body.endTime) {
      return Effect.fail(new ValidationError({ message: "Start time must be before end time", field: "startTime" }));
    }
  }
  
  return Effect.succeed(body);
}

export const closuresRouter = {
  // GET /api/closures
  list: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId } = params;
    const queryParams = event.queryStringParameters || {};
    const startDate = queryParams.startDate;
    const endDate = queryParams.endDate;

    // If date range is provided, filter by date range
    if (startDate && endDate) {
      return pipe(
        Effect.tryPromise({
          try: async () => {
            const result = await SpalfTable.build(QueryCommand)
              .query({
                index: "GSI1",
                partition: `SPA#${spaId}`,
                range: { 
                  between: [`CLOSURE#${startDate}`, `CLOSURE#${endDate}\xff`]
                },
              })
              .entities(ClosureEntity)
              .send();
            return result.Items || [];
          },
          catch: (error) => {
            console.error("Query error:", error);
            return new DatabaseError({ message: "Failed to list closures", operation: "query", cause: error });
          },
        }),
        Effect.map((closures) => jsonResponse(200, { data: closures }))
      );
    }

    // Default: list all closures for the spa
    return pipe(
      Effect.tryPromise({
        try: async () => {
          const result = await SpalfTable.build(QueryCommand)
            .query({
              index: "GSI1",
              partition: `SPA#${spaId}`,
              range: { beginsWith: "CLOSURE#" },
            })
            .entities(ClosureEntity)
            .send();
          return result.Items || [];
        },
        catch: (error) => {
          console.error("Query error:", error);
          return new DatabaseError({ message: "Failed to list closures", operation: "query", cause: error });
        },
      }),
      Effect.map((closures) => jsonResponse(200, { data: closures }))
    );
  },

  // POST /api/closures
  create: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId } = params;

    return pipe(
      parseBody<CreateClosureBody>(event),
      Effect.flatMap(validateCreateClosure),
      Effect.flatMap((body) => {
        const closureId = generateId();
        const isAllDay = body.isAllDay !== false;
        
        const item = {
          closureId,
          spaId,
          date: body.date,
          reason: body.reason,
          isAllDay,
          startTime: isAllDay ? undefined : body.startTime,
          endTime: isAllDay ? undefined : body.endTime,
          GSI1PK: `SPA#${spaId}`,
          GSI1SK: `CLOSURE#${body.date}`,
          GSI2PK: `DATE#${body.date}`,
          GSI2SK: `SPA#${spaId}#CLOSURE`,
        };

        return pipe(
          Effect.tryPromise({
            try: () => ClosureEntity.build(PutItemCommand).item(item).send(),
            catch: (error) => new DatabaseError({ message: "Failed to create closure", operation: "put", cause: error }),
          }),
          Effect.map(() => jsonResponse(201, { data: { ...item, closureId } }))
        );
      })
    );
  },

  // GET /api/closures/:id
  get: (
    _event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      Effect.tryPromise({
        try: () =>
          ClosureEntity.build(GetItemCommand)
            .key({ spaId, closureId: id })
            .send(),
        catch: (error) => new DatabaseError({ message: "Failed to get closure", operation: "get", cause: error }),
      }),
      Effect.flatMap((result) =>
        result.Item
          ? Effect.succeed(jsonResponse(200, { data: result.Item }))
          : Effect.fail(new NotFoundError({ entity: "Closure", id }))
      )
    );
  },

  // PUT /api/closures/:id
  update: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      parseBody<UpdateClosureBody>(event),
      Effect.flatMap((body) => {
        return pipe(
          Effect.tryPromise({
            try: () =>
              ClosureEntity.build(GetItemCommand)
                .key({ spaId, closureId: id })
                .send(),
            catch: (error) => new DatabaseError({ message: "Failed to get closure", operation: "get", cause: error }),
          }),
          Effect.flatMap((result) =>
            result.Item
              ? Effect.succeed(result.Item)
              : Effect.fail(new NotFoundError({ entity: "Closure", id }))
          ),
          Effect.flatMap((existing) => {
            const newDate = body.date || existing.date;
            const isAllDay = body.isAllDay !== undefined ? body.isAllDay : existing.isAllDay;
            
            const updateData = {
              spaId,
              closureId: id,
              ...(body.date !== undefined && { date: body.date }),
              ...(body.reason !== undefined && { reason: body.reason }),
              ...(body.isAllDay !== undefined && { isAllDay: body.isAllDay }),
              ...(body.startTime !== undefined && { startTime: isAllDay ? undefined : body.startTime }),
              ...(body.endTime !== undefined && { endTime: isAllDay ? undefined : body.endTime }),
              GSI1PK: `SPA#${spaId}`,
              GSI1SK: `CLOSURE#${newDate}`,
              GSI2PK: `DATE#${newDate}`,
              GSI2SK: `SPA#${spaId}#CLOSURE`,
            };

            return pipe(
              Effect.tryPromise({
                try: () => ClosureEntity.build(UpdateItemCommand).item(updateData).send(),
                catch: (error) => new DatabaseError({ message: "Failed to update closure", operation: "update", cause: error }),
              }),
              Effect.map(() => jsonResponse(200, { data: { ...existing, ...body } }))
            );
          })
        );
      })
    );
  },

  // DELETE /api/closures/:id
  delete: (
    _event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      Effect.tryPromise({
        try: () =>
          ClosureEntity.build(GetItemCommand)
            .key({ spaId, closureId: id })
            .send(),
        catch: (error) => new DatabaseError({ message: "Failed to get closure", operation: "get", cause: error }),
      }),
      Effect.flatMap((result) =>
        result.Item
          ? Effect.succeed(result.Item)
          : Effect.fail(new NotFoundError({ entity: "Closure", id }))
      ),
      Effect.flatMap(() =>
        Effect.tryPromise({
          try: () =>
            ClosureEntity.build(DeleteItemCommand)
              .key({ spaId, closureId: id })
              .send(),
          catch: (error) => new DatabaseError({ message: "Failed to delete closure", operation: "delete", cause: error }),
        })
      ),
      Effect.map(() => jsonResponse(204, null))
    );
  },
};
