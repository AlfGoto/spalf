import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Effect, pipe } from "effect";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import { ServiceEntity, type ProductRequirement } from "../../../core/database/entities";
import { SpalfTable } from "../../../core/database/table";
import { ValidationError, DatabaseError, NotFoundError, type AppError } from "../../../core/shared/errors";
import { generateId } from "../../../core/shared/utils";

// Types for request bodies
interface CreateServiceBody {
  name: string;
  description?: string;
  price: number;
  duration: number;
  preparationTime?: number;
  recoveryTime?: number;
  cancellationDeadlineHours?: number;
  canBeRescheduled?: boolean;
  productIds?: ProductRequirement[];
  roomIds?: string[];
  employeeIds?: string[];
  composedServiceIds?: string[];
  isComposed?: boolean;
}

interface UpdateServiceBody extends Partial<CreateServiceBody> {}

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

// Validate create service body
function validateCreateService(body: CreateServiceBody): Effect.Effect<CreateServiceBody, ValidationError> {
  if (!body.name?.trim()) {
    return Effect.fail(new ValidationError({ message: "Name is required", field: "name" }));
  }
  if (body.price === undefined || body.price < 0) {
    return Effect.fail(new ValidationError({ message: "Price must be a non-negative number", field: "price" }));
  }
  if (body.duration === undefined || body.duration < 1) {
    return Effect.fail(new ValidationError({ message: "Duration must be at least 1 minute", field: "duration" }));
  }
  if (body.preparationTime !== undefined && body.preparationTime < 0) {
    return Effect.fail(new ValidationError({ message: "Preparation time cannot be negative", field: "preparationTime" }));
  }
  if (body.recoveryTime !== undefined && body.recoveryTime < 0) {
    return Effect.fail(new ValidationError({ message: "Recovery time cannot be negative", field: "recoveryTime" }));
  }
  if (body.cancellationDeadlineHours !== undefined && body.cancellationDeadlineHours < 0) {
    return Effect.fail(new ValidationError({ message: "Cancellation deadline cannot be negative", field: "cancellationDeadlineHours" }));
  }
  return Effect.succeed(body);
}

export const servicesRouter = {
  // GET /api/services
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
              range: { beginsWith: "SERVICE#" },
            })
            .entities(ServiceEntity)
            .send();
          return result.Items || [];
        },
        catch: (error) => {
          console.error("Query error:", error);
          return new DatabaseError({ message: "Failed to list services", operation: "query", cause: error });
        },
      }),
      Effect.map((services) => jsonResponse(200, { data: services }))
    );
  },

  // POST /api/services
  create: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId } = params;

    return pipe(
      parseBody<CreateServiceBody>(event),
      Effect.flatMap(validateCreateService),
      Effect.flatMap((body) => {
        const serviceId = generateId();
        const item = {
          serviceId,
          spaId,
          name: body.name,
          description: body.description,
          price: body.price,
          duration: body.duration,
          preparationTime: body.preparationTime ?? 0,
          recoveryTime: body.recoveryTime ?? 0,
          cancellationDeadlineHours: body.cancellationDeadlineHours ?? 24,
          canBeRescheduled: body.canBeRescheduled ?? true,
          productIds: body.productIds || [],
          roomIds: body.roomIds || [],
          employeeIds: body.employeeIds || [],
          composedServiceIds: body.composedServiceIds || [],
          isComposed: body.isComposed ?? false,
          GSI1PK: `SPA#${spaId}`,
          GSI1SK: `SERVICE#${serviceId}`,
        };

        return pipe(
          Effect.tryPromise({
            try: () => ServiceEntity.build(PutItemCommand).item(item).send(),
            catch: (error) => new DatabaseError({ message: "Failed to create service", operation: "put", cause: error }),
          }),
          Effect.map(() => jsonResponse(201, { data: { ...item, serviceId } }))
        );
      })
    );
  },

  // GET /api/services/:id
  get: (
    _event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      Effect.tryPromise({
        try: () =>
          ServiceEntity.build(GetItemCommand)
            .key({ spaId, serviceId: id })
            .send(),
        catch: (error) => new DatabaseError({ message: "Failed to get service", operation: "get", cause: error }),
      }),
      Effect.flatMap((result) =>
        result.Item
          ? Effect.succeed(jsonResponse(200, { data: result.Item }))
          : Effect.fail(new NotFoundError({ entity: "Service", id }))
      )
    );
  },

  // PUT /api/services/:id
  update: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      parseBody<UpdateServiceBody>(event),
      Effect.flatMap((body) => {
        return pipe(
          Effect.tryPromise({
            try: () =>
              ServiceEntity.build(GetItemCommand)
                .key({ spaId, serviceId: id })
                .send(),
            catch: (error) => new DatabaseError({ message: "Failed to get service", operation: "get", cause: error }),
          }),
          Effect.flatMap((result) =>
            result.Item
              ? Effect.succeed(result.Item)
              : Effect.fail(new NotFoundError({ entity: "Service", id }))
          ),
          Effect.flatMap((existing) => {
            const updateData = {
              spaId,
              serviceId: id,
              GSI1PK: `SPA#${spaId}`,
              GSI1SK: `SERVICE#${id}`,
              ...(body.name !== undefined && { name: body.name }),
              ...(body.description !== undefined && { description: body.description }),
              ...(body.price !== undefined && { price: body.price }),
              ...(body.duration !== undefined && { duration: body.duration }),
              ...(body.preparationTime !== undefined && { preparationTime: body.preparationTime }),
              ...(body.recoveryTime !== undefined && { recoveryTime: body.recoveryTime }),
              ...(body.cancellationDeadlineHours !== undefined && { cancellationDeadlineHours: body.cancellationDeadlineHours }),
              ...(body.canBeRescheduled !== undefined && { canBeRescheduled: body.canBeRescheduled }),
              ...(body.productIds !== undefined && { productIds: body.productIds }),
              ...(body.roomIds !== undefined && { roomIds: body.roomIds }),
              ...(body.employeeIds !== undefined && { employeeIds: body.employeeIds }),
              ...(body.composedServiceIds !== undefined && { composedServiceIds: body.composedServiceIds }),
              ...(body.isComposed !== undefined && { isComposed: body.isComposed }),
            };

            return pipe(
              Effect.tryPromise({
                try: () => ServiceEntity.build(UpdateItemCommand).item(updateData).send(),
                catch: (error) => new DatabaseError({ message: "Failed to update service", operation: "update", cause: error }),
              }),
              Effect.map(() => jsonResponse(200, { data: { ...existing, ...body } }))
            );
          })
        );
      })
    );
  },

  // DELETE /api/services/:id
  delete: (
    _event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      Effect.tryPromise({
        try: () =>
          ServiceEntity.build(GetItemCommand)
            .key({ spaId, serviceId: id })
            .send(),
        catch: (error) => new DatabaseError({ message: "Failed to get service", operation: "get", cause: error }),
      }),
      Effect.flatMap((result) =>
        result.Item
          ? Effect.succeed(result.Item)
          : Effect.fail(new NotFoundError({ entity: "Service", id }))
      ),
      Effect.flatMap(() =>
        Effect.tryPromise({
          try: () =>
            ServiceEntity.build(DeleteItemCommand)
              .key({ spaId, serviceId: id })
              .send(),
          catch: (error) => new DatabaseError({ message: "Failed to delete service", operation: "delete", cause: error }),
        })
      ),
      Effect.map(() => jsonResponse(204, null))
    );
  },
};
