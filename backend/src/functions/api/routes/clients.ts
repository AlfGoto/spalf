import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Effect, pipe } from "effect";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import { ClientEntity } from "../../../core/database/entities";
import { SpalfTable } from "../../../core/database/table";
import { ValidationError, DatabaseError, NotFoundError, type AppError } from "../../../core/shared/errors";
import { generateId } from "../../../core/shared/utils";

// Types for request bodies
interface CreateClientBody {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  allergies?: string;
  preferences?: string;
  notes?: string;
}

interface UpdateClientBody extends Partial<CreateClientBody> {}

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

// Validate create client body
function validateCreateClient(body: CreateClientBody): Effect.Effect<CreateClientBody, ValidationError> {
  if (!body.firstName?.trim()) {
    return Effect.fail(new ValidationError({ message: "First name is required", field: "firstName" }));
  }
  if (!body.lastName?.trim()) {
    return Effect.fail(new ValidationError({ message: "Last name is required", field: "lastName" }));
  }
  if (!body.email?.trim()) {
    return Effect.fail(new ValidationError({ message: "Email is required", field: "email" }));
  }
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return Effect.fail(new ValidationError({ message: "Invalid email format", field: "email" }));
  }
  return Effect.succeed(body);
}

export const clientsRouter = {
  // GET /api/clients
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
              range: { beginsWith: "CLIENT#" },
            })
            .entities(ClientEntity)
            .send();
          return result.Items || [];
        },
        catch: (error) => {
          console.error("Query error:", error);
          return new DatabaseError({ message: "Failed to list clients", operation: "query", cause: error });
        },
      }),
      Effect.map((clients) => jsonResponse(200, { data: clients }))
    );
  },

  // POST /api/clients
  create: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId } = params;

    return pipe(
      parseBody<CreateClientBody>(event),
      Effect.flatMap(validateCreateClient),
      Effect.flatMap((body) => {
        const clientId = generateId();
        const item = {
          clientId,
          spaId,
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone,
          allergies: body.allergies,
          preferences: body.preferences,
          notes: body.notes,
          GSI1PK: `SPA#${spaId}`,
          GSI1SK: `CLIENT#${clientId}`,
        };

        return pipe(
          Effect.tryPromise({
            try: () => ClientEntity.build(PutItemCommand).item(item).send(),
            catch: (error) => new DatabaseError({ message: "Failed to create client", operation: "put", cause: error }),
          }),
          Effect.map(() => jsonResponse(201, { data: { ...item, clientId } }))
        );
      })
    );
  },

  // GET /api/clients/:id
  get: (
    _event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      Effect.tryPromise({
        try: () =>
          ClientEntity.build(GetItemCommand)
            .key({ spaId, clientId: id })
            .send(),
        catch: (error) => new DatabaseError({ message: "Failed to get client", operation: "get", cause: error }),
      }),
      Effect.flatMap((result) =>
        result.Item
          ? Effect.succeed(jsonResponse(200, { data: result.Item }))
          : Effect.fail(new NotFoundError({ entity: "Client", id }))
      )
    );
  },

  // PUT /api/clients/:id
  update: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      parseBody<UpdateClientBody>(event),
      Effect.flatMap((body) => {
        return pipe(
          Effect.tryPromise({
            try: () =>
              ClientEntity.build(GetItemCommand)
                .key({ spaId, clientId: id })
                .send(),
            catch: (error) => new DatabaseError({ message: "Failed to get client", operation: "get", cause: error }),
          }),
          Effect.flatMap((result) =>
            result.Item
              ? Effect.succeed(result.Item)
              : Effect.fail(new NotFoundError({ entity: "Client", id }))
          ),
          Effect.flatMap((existing) => {
            const updateData = {
              spaId,
              clientId: id,
              GSI1PK: `SPA#${spaId}`,
              GSI1SK: `CLIENT#${id}`,
              ...(body.firstName !== undefined && { firstName: body.firstName }),
              ...(body.lastName !== undefined && { lastName: body.lastName }),
              ...(body.email !== undefined && { email: body.email }),
              ...(body.phone !== undefined && { phone: body.phone }),
              ...(body.allergies !== undefined && { allergies: body.allergies }),
              ...(body.preferences !== undefined && { preferences: body.preferences }),
              ...(body.notes !== undefined && { notes: body.notes }),
            };

            return pipe(
              Effect.tryPromise({
                try: () => ClientEntity.build(UpdateItemCommand).item(updateData).send(),
                catch: (error) => new DatabaseError({ message: "Failed to update client", operation: "update", cause: error }),
              }),
              Effect.map(() => jsonResponse(200, { data: { ...existing, ...body } }))
            );
          })
        );
      })
    );
  },

  // DELETE /api/clients/:id
  delete: (
    _event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      Effect.tryPromise({
        try: () =>
          ClientEntity.build(GetItemCommand)
            .key({ spaId, clientId: id })
            .send(),
        catch: (error) => new DatabaseError({ message: "Failed to get client", operation: "get", cause: error }),
      }),
      Effect.flatMap((result) =>
        result.Item
          ? Effect.succeed(result.Item)
          : Effect.fail(new NotFoundError({ entity: "Client", id }))
      ),
      Effect.flatMap(() =>
        Effect.tryPromise({
          try: () =>
            ClientEntity.build(DeleteItemCommand)
              .key({ spaId, clientId: id })
              .send(),
          catch: (error) => new DatabaseError({ message: "Failed to delete client", operation: "delete", cause: error }),
        })
      ),
      Effect.map(() => jsonResponse(204, null))
    );
  },
};
