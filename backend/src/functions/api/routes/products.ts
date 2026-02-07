import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Effect, pipe } from "effect";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import { ProductEntity } from "../../../core/database/entities";
import { SpalfTable } from "../../../core/database/table";
import { ValidationError, DatabaseError, NotFoundError, type AppError } from "../../../core/shared/errors";
import { generateId } from "../../../core/shared/utils";

// Types for request bodies
interface CreateProductBody {
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  isInfinite?: boolean;
}

interface UpdateProductBody extends Partial<CreateProductBody> {}

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

// Validate create product body
function validateCreateProduct(body: CreateProductBody): Effect.Effect<CreateProductBody, ValidationError> {
  if (!body.name?.trim()) {
    return Effect.fail(new ValidationError({ message: "Name is required", field: "name" }));
  }
  if (body.price === undefined || body.price < 0) {
    return Effect.fail(new ValidationError({ message: "Price must be a non-negative number", field: "price" }));
  }
  if (body.quantity !== undefined && body.quantity < 0) {
    return Effect.fail(new ValidationError({ message: "Quantity must be a non-negative number", field: "quantity" }));
  }
  return Effect.succeed(body);
}

export const productsRouter = {
  // GET /api/products
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
              range: { beginsWith: "PRODUCT#" },
            })
            .entities(ProductEntity)
            .send();
          return result.Items || [];
        },
        catch: (error) => {
          console.error("Query error:", error);
          return new DatabaseError({ message: "Failed to list products", operation: "query", cause: error });
        },
      }),
      Effect.map((products) => jsonResponse(200, { data: products }))
    );
  },

  // POST /api/products
  create: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId } = params;

    return pipe(
      parseBody<CreateProductBody>(event),
      Effect.flatMap(validateCreateProduct),
      Effect.flatMap((body) => {
        const productId = generateId();
        const item = {
          productId,
          spaId,
          name: body.name,
          description: body.description,
          price: body.price,
          quantity: body.quantity,
          isInfinite: body.isInfinite ?? false,
          GSI1PK: `SPA#${spaId}`,
          GSI1SK: `PRODUCT#${productId}`,
        };

        return pipe(
          Effect.tryPromise({
            try: () => ProductEntity.build(PutItemCommand).item(item).send(),
            catch: (error) => new DatabaseError({ message: "Failed to create product", operation: "put", cause: error }),
          }),
          Effect.map(() => jsonResponse(201, { data: { ...item, productId } }))
        );
      })
    );
  },

  // GET /api/products/:id
  get: (
    _event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      Effect.tryPromise({
        try: () =>
          ProductEntity.build(GetItemCommand)
            .key({ spaId, productId: id })
            .send(),
        catch: (error) => new DatabaseError({ message: "Failed to get product", operation: "get", cause: error }),
      }),
      Effect.flatMap((result) =>
        result.Item
          ? Effect.succeed(jsonResponse(200, { data: result.Item }))
          : Effect.fail(new NotFoundError({ entity: "Product", id }))
      )
    );
  },

  // PUT /api/products/:id
  update: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      parseBody<UpdateProductBody>(event),
      Effect.flatMap((body) => {
        return pipe(
          Effect.tryPromise({
            try: () =>
              ProductEntity.build(GetItemCommand)
                .key({ spaId, productId: id })
                .send(),
            catch: (error) => new DatabaseError({ message: "Failed to get product", operation: "get", cause: error }),
          }),
          Effect.flatMap((result) =>
            result.Item
              ? Effect.succeed(result.Item)
              : Effect.fail(new NotFoundError({ entity: "Product", id }))
          ),
          Effect.flatMap((existing) => {
            const updateData = {
              spaId,
              productId: id,
              GSI1PK: `SPA#${spaId}`,
              GSI1SK: `PRODUCT#${id}`,
              ...(body.name !== undefined && { name: body.name }),
              ...(body.description !== undefined && { description: body.description }),
              ...(body.price !== undefined && { price: body.price }),
              ...(body.quantity !== undefined && { quantity: body.quantity }),
              ...(body.isInfinite !== undefined && { isInfinite: body.isInfinite }),
            };

            return pipe(
              Effect.tryPromise({
                try: () => ProductEntity.build(UpdateItemCommand).item(updateData).send(),
                catch: (error) => new DatabaseError({ message: "Failed to update product", operation: "update", cause: error }),
              }),
              Effect.map(() => jsonResponse(200, { data: { ...existing, ...body } }))
            );
          })
        );
      })
    );
  },

  // DELETE /api/products/:id
  delete: (
    _event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      Effect.tryPromise({
        try: () =>
          ProductEntity.build(GetItemCommand)
            .key({ spaId, productId: id })
            .send(),
        catch: (error) => new DatabaseError({ message: "Failed to get product", operation: "get", cause: error }),
      }),
      Effect.flatMap((result) =>
        result.Item
          ? Effect.succeed(result.Item)
          : Effect.fail(new NotFoundError({ entity: "Product", id }))
      ),
      Effect.flatMap(() =>
        Effect.tryPromise({
          try: () =>
            ProductEntity.build(DeleteItemCommand)
              .key({ spaId, productId: id })
              .send(),
          catch: (error) => new DatabaseError({ message: "Failed to delete product", operation: "delete", cause: error }),
        })
      ),
      Effect.map(() => jsonResponse(204, null))
    );
  },
};
