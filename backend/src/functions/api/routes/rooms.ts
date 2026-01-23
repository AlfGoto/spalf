import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Effect, pipe } from "effect";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import { RoomEntity } from "../../../core/database/entities";
import { SpalfTable } from "../../../core/database/table";
import { ValidationError, DatabaseError, NotFoundError, type AppError } from "../../../core/shared/errors";
import { generateId } from "../../../core/shared/utils";

// Types for request bodies
interface CreateRoomBody {
  name: string;
  minCapacity?: number;
  maxCapacity: number;
  maxConcurrentServices?: number;
  description?: string;
  serviceIds?: string[];
}

interface UpdateRoomBody extends Partial<CreateRoomBody> {}

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

// Validate create room body
function validateCreateRoom(body: CreateRoomBody): Effect.Effect<CreateRoomBody, ValidationError> {
  if (!body.name?.trim()) {
    return Effect.fail(new ValidationError({ message: "Name is required", field: "name" }));
  }
  if (body.maxCapacity === undefined || body.maxCapacity < 1) {
    return Effect.fail(new ValidationError({ message: "Max capacity must be at least 1", field: "maxCapacity" }));
  }
  if (body.minCapacity !== undefined && body.minCapacity < 1) {
    return Effect.fail(new ValidationError({ message: "Min capacity must be at least 1", field: "minCapacity" }));
  }
  if (body.minCapacity !== undefined && body.minCapacity > body.maxCapacity) {
    return Effect.fail(new ValidationError({ message: "Min capacity cannot exceed max capacity", field: "minCapacity" }));
  }
  return Effect.succeed(body);
}

export const roomsRouter = {
  // GET /api/rooms
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
              range: { beginsWith: "ROOM#" },
            })
            .entities(RoomEntity)
            .send();
          return result.Items || [];
        },
        catch: (error) => {
          console.error("Query error:", error);
          return new DatabaseError({ message: "Failed to list rooms", operation: "query", cause: error });
        },
      }),
      Effect.map((rooms) => jsonResponse(200, { data: rooms }))
    );
  },

  // POST /api/rooms
  create: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId } = params;

    return pipe(
      parseBody<CreateRoomBody>(event),
      Effect.flatMap(validateCreateRoom),
      Effect.flatMap((body) => {
        const roomId = generateId();
        const item = {
          roomId,
          spaId,
          name: body.name,
          minCapacity: body.minCapacity ?? 1,
          maxCapacity: body.maxCapacity,
          maxConcurrentServices: body.maxConcurrentServices ?? 1,
          description: body.description,
          serviceIds: body.serviceIds || [],
          GSI1PK: `SPA#${spaId}`,
          GSI1SK: `ROOM#${roomId}`,
        };

        return pipe(
          Effect.tryPromise({
            try: () => RoomEntity.build(PutItemCommand).item(item).send(),
            catch: (error) => new DatabaseError({ message: "Failed to create room", operation: "put", cause: error }),
          }),
          Effect.map(() => jsonResponse(201, { data: { ...item, roomId } }))
        );
      })
    );
  },

  // GET /api/rooms/:id
  get: (
    _event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      Effect.tryPromise({
        try: () =>
          RoomEntity.build(GetItemCommand)
            .key({ spaId, roomId: id })
            .send(),
        catch: (error) => new DatabaseError({ message: "Failed to get room", operation: "get", cause: error }),
      }),
      Effect.flatMap((result) =>
        result.Item
          ? Effect.succeed(jsonResponse(200, { data: result.Item }))
          : Effect.fail(new NotFoundError({ entity: "Room", id }))
      )
    );
  },

  // PUT /api/rooms/:id
  update: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      parseBody<UpdateRoomBody>(event),
      Effect.flatMap((body) => {
        return pipe(
          Effect.tryPromise({
            try: () =>
              RoomEntity.build(GetItemCommand)
                .key({ spaId, roomId: id })
                .send(),
            catch: (error) => new DatabaseError({ message: "Failed to get room", operation: "get", cause: error }),
          }),
          Effect.flatMap((result) =>
            result.Item
              ? Effect.succeed(result.Item)
              : Effect.fail(new NotFoundError({ entity: "Room", id }))
          ),
          Effect.flatMap((existing) => {
            const updateData = {
              spaId,
              roomId: id,
              GSI1PK: `SPA#${spaId}`,
              GSI1SK: `ROOM#${id}`,
              ...(body.name !== undefined && { name: body.name }),
              ...(body.minCapacity !== undefined && { minCapacity: body.minCapacity }),
              ...(body.maxCapacity !== undefined && { maxCapacity: body.maxCapacity }),
              ...(body.maxConcurrentServices !== undefined && { maxConcurrentServices: body.maxConcurrentServices }),
              ...(body.description !== undefined && { description: body.description }),
              ...(body.serviceIds !== undefined && { serviceIds: body.serviceIds }),
            };

            return pipe(
              Effect.tryPromise({
                try: () => RoomEntity.build(UpdateItemCommand).item(updateData).send(),
                catch: (error) => new DatabaseError({ message: "Failed to update room", operation: "update", cause: error }),
              }),
              Effect.map(() => jsonResponse(200, { data: { ...existing, ...body } }))
            );
          })
        );
      })
    );
  },

  // DELETE /api/rooms/:id
  delete: (
    _event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      Effect.tryPromise({
        try: () =>
          RoomEntity.build(GetItemCommand)
            .key({ spaId, roomId: id })
            .send(),
        catch: (error) => new DatabaseError({ message: "Failed to get room", operation: "get", cause: error }),
      }),
      Effect.flatMap((result) =>
        result.Item
          ? Effect.succeed(result.Item)
          : Effect.fail(new NotFoundError({ entity: "Room", id }))
      ),
      Effect.flatMap(() =>
        Effect.tryPromise({
          try: () =>
            RoomEntity.build(DeleteItemCommand)
              .key({ spaId, roomId: id })
              .send(),
          catch: (error) => new DatabaseError({ message: "Failed to delete room", operation: "delete", cause: error }),
        })
      ),
      Effect.map(() => jsonResponse(204, null))
    );
  },
};
