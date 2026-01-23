import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Effect, pipe } from "effect";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import {
  IntegrationEntity,
  type IntegrationPermission,
  type WebhookEventType,
} from "../../../core/database/entities";
import { SpalfTable } from "../../../core/database/table";
import {
  ValidationError,
  DatabaseError,
  NotFoundError,
  type AppError,
} from "../../../core/shared/errors";
import { generateId } from "../../../core/shared/utils";
import { generateSecretToken, hashSecret } from "../../../core/shared/crypto";

// Types for request bodies
interface CreateIntegrationBody {
  name: string;
  description?: string;
  webhookUrl?: string;
  webhookEvents?: string[];
  permissions?: string[];
}

interface UpdateIntegrationBody {
  name?: string;
  description?: string;
  webhookUrl?: string;
  webhookEvents?: string[];
  permissions?: string[];
  isActive?: boolean;
}

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

// Validate integration name
function validateCreateIntegration(
  body: CreateIntegrationBody
): Effect.Effect<CreateIntegrationBody, ValidationError> {
  if (!body.name?.trim()) {
    return Effect.fail(
      new ValidationError({ message: "Name is required", field: "name" })
    );
  }
  if (body.webhookUrl && !isValidUrl(body.webhookUrl)) {
    return Effect.fail(
      new ValidationError({
        message: "Invalid webhook URL",
        field: "webhookUrl",
      })
    );
  }
  return Effect.succeed(body);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export const integrationsRouter = {
  // GET /api/integrations
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
              range: { beginsWith: "INTEGRATION#" },
            })
            .entities(IntegrationEntity)
            .send();
          return result.Items || [];
        },
        catch: (error) => {
          console.error("Query error:", error);
          return new DatabaseError({
            message: "Failed to list integrations",
            operation: "query",
            cause: error,
          });
        },
      }),
      Effect.map((integrations) => {
        // Remove secretHash from response
        const sanitized = integrations.map((i) => {
          const { secretHash, ...rest } = i as Record<string, unknown>;
          return rest;
        });
        return jsonResponse(200, { data: sanitized });
      })
    );
  },

  // POST /api/integrations
  create: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId } = params;

    return pipe(
      parseBody<CreateIntegrationBody>(event),
      Effect.flatMap(validateCreateIntegration),
      Effect.flatMap((body) => {
        const integrationId = generateId();
        // Generate a secret token for this integration
        const secretToken = generateSecretToken();
        const secretHash = hashSecret(secretToken);

        const item = {
          integrationId,
          spaId,
          name: body.name,
          description: body.description,
          secretHash,
          webhookUrl: body.webhookUrl,
          webhookEvents: body.webhookEvents || [],
          permissions: body.permissions || [],
          isActive: true,
          GSI1PK: `SPA#${spaId}`,
          GSI1SK: `INTEGRATION#${integrationId}`,
        };

        return pipe(
          Effect.tryPromise({
            try: () => IntegrationEntity.build(PutItemCommand).item(item).send(),
            catch: (error) =>
              new DatabaseError({
                message: "Failed to create integration",
                operation: "put",
                cause: error,
              }),
          }),
          Effect.map(() => {
            // Return the response with the secret token (only shown once!)
            const { secretHash: _, ...responseItem } = item;
            return jsonResponse(201, {
              data: {
                ...responseItem,
                // Include the secret token in the response - user must save this!
                secretToken,
                authorizationHeader: `Bearer ${spaId}:${integrationId}:${secretToken}`,
              },
              message:
                "Integration created. Save the secretToken and authorizationHeader - they will not be shown again!",
            });
          })
        );
      })
    );
  },

  // GET /api/integrations/:id
  get: (
    _event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      Effect.tryPromise({
        try: () =>
          IntegrationEntity.build(GetItemCommand)
            .key({ spaId, integrationId: id })
            .send(),
        catch: (error) =>
          new DatabaseError({
            message: "Failed to get integration",
            operation: "get",
            cause: error,
          }),
      }),
      Effect.flatMap((result) => {
        if (!result.Item) {
          return Effect.fail(new NotFoundError({ entity: "Integration", id }));
        }
        // Remove secretHash from response
        const { secretHash, ...sanitized } = result.Item as Record<string, unknown>;
        return Effect.succeed(jsonResponse(200, { data: sanitized }));
      })
    );
  },

  // PUT /api/integrations/:id
  update: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      parseBody<UpdateIntegrationBody>(event),
      Effect.flatMap((body) => {
        // First, get the existing integration
        return pipe(
          Effect.tryPromise({
            try: () =>
              IntegrationEntity.build(GetItemCommand)
                .key({ spaId, integrationId: id })
                .send(),
            catch: (error) =>
              new DatabaseError({
                message: "Failed to get integration",
                operation: "get",
                cause: error,
              }),
          }),
          Effect.flatMap((result) =>
            result.Item
              ? Effect.succeed(result.Item)
              : Effect.fail(new NotFoundError({ entity: "Integration", id }))
          ),
          Effect.flatMap((existing) => {
            const existingItem = existing as {
              secretHash: string;
              name: string;
              description?: string;
              webhookUrl?: string;
              webhookEvents: string[];
              permissions: string[];
              isActive: boolean;
            };

            const updateItem = {
              spaId,
              integrationId: id,
              name: body.name ?? existingItem.name,
              description: body.description ?? existingItem.description,
              webhookUrl: body.webhookUrl ?? existingItem.webhookUrl,
              webhookEvents: body.webhookEvents ?? existingItem.webhookEvents,
              permissions: body.permissions ?? existingItem.permissions,
              isActive: body.isActive ?? existingItem.isActive,
              secretHash: existingItem.secretHash, // Keep existing secret
              GSI1PK: `SPA#${spaId}`,
              GSI1SK: `INTEGRATION#${id}`,
            };

            return pipe(
              Effect.tryPromise({
                try: () =>
                  IntegrationEntity.build(UpdateItemCommand).item(updateItem).send(),
                catch: (error) =>
                  new DatabaseError({
                    message: "Failed to update integration",
                    operation: "update",
                    cause: error,
                  }),
              }),
              Effect.map(() => {
                const { secretHash, ...existingSanitized } = existing as Record<string, unknown>;
                return jsonResponse(200, {
                  data: { ...existingSanitized, ...body },
                });
              })
            );
          })
        );
      })
    );
  },

  // DELETE /api/integrations/:id
  delete: (
    _event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      // Verify the integration exists first
      Effect.tryPromise({
        try: () =>
          IntegrationEntity.build(GetItemCommand)
            .key({ spaId, integrationId: id })
            .send(),
        catch: (error) =>
          new DatabaseError({
            message: "Failed to get integration",
            operation: "get",
            cause: error,
          }),
      }),
      Effect.flatMap((result) =>
        result.Item
          ? Effect.succeed(result.Item)
          : Effect.fail(new NotFoundError({ entity: "Integration", id }))
      ),
      Effect.flatMap(() =>
        Effect.tryPromise({
          try: () =>
            IntegrationEntity.build(DeleteItemCommand)
              .key({ spaId, integrationId: id })
              .send(),
          catch: (error) =>
            new DatabaseError({
              message: "Failed to delete integration",
              operation: "delete",
              cause: error,
            }),
        })
      ),
      Effect.map(() => jsonResponse(204, null))
    );
  },

  // POST /api/integrations/:id/regenerate-secret
  regenerateSecret: (
    _event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      // Verify the integration exists first
      Effect.tryPromise({
        try: () =>
          IntegrationEntity.build(GetItemCommand)
            .key({ spaId, integrationId: id })
            .send(),
        catch: (error) =>
          new DatabaseError({
            message: "Failed to get integration",
            operation: "get",
            cause: error,
          }),
      }),
      Effect.flatMap((result) =>
        result.Item
          ? Effect.succeed(result.Item)
          : Effect.fail(new NotFoundError({ entity: "Integration", id }))
      ),
      Effect.flatMap((existing) => {
        // Generate new secret
        const secretToken = generateSecretToken();
        const secretHash = hashSecret(secretToken);

        return pipe(
          Effect.tryPromise({
            try: () =>
              IntegrationEntity.build(UpdateItemCommand)
                .item({
                  spaId,
                  integrationId: id,
                  secretHash,
                  GSI1PK: `SPA#${spaId}`,
                  GSI1SK: `INTEGRATION#${id}`,
                })
                .send(),
            catch: (error) =>
              new DatabaseError({
                message: "Failed to regenerate secret",
                operation: "update",
                cause: error,
              }),
          }),
          Effect.map(() =>
            jsonResponse(200, {
              data: {
                integrationId: id,
                secretToken,
                authorizationHeader: `Bearer ${spaId}:${id}:${secretToken}`,
              },
              message:
                "Secret regenerated. Save the new secretToken - it will not be shown again! Old tokens are now invalid.",
            })
          )
        );
      })
    );
  },
};
