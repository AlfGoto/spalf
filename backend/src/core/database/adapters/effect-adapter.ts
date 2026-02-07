import { Effect, pipe } from "effect";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import { DatabaseError, NotFoundError } from "../../shared/errors";

/**
 * Effect adapter for DynamoDB Toolbox entities
 * Wraps entity operations in Effect for type-safe error handling
 */

// Generic put item - works with any entity
export function putItem<T extends { build: (cmd: typeof PutItemCommand) => { item: (i: unknown) => { send: () => Promise<unknown> } } }>(
  entity: T,
  item: unknown
): Effect.Effect<unknown, DatabaseError> {
  return Effect.tryPromise({
    try: () => entity.build(PutItemCommand).item(item).send(),
    catch: (error) =>
      new DatabaseError({
        message: `Failed to put item`,
        operation: "put",
        cause: error,
      }),
  });
}

// Generic get item
export function getItem<T extends { build: (cmd: typeof GetItemCommand) => { key: (k: unknown) => { send: () => Promise<{ Item?: unknown }> } }; entityName: string }>(
  entity: T,
  key: unknown
): Effect.Effect<unknown, DatabaseError | NotFoundError> {
  return pipe(
    Effect.tryPromise({
      try: () => entity.build(GetItemCommand).key(key).send(),
      catch: (error) =>
        new DatabaseError({
          message: `Failed to get item`,
          operation: "get",
          cause: error,
        }),
    }),
    Effect.flatMap((result) =>
      result.Item
        ? Effect.succeed(result.Item)
        : Effect.fail(
            new NotFoundError({
              entity: entity.entityName,
              id: JSON.stringify(key),
            })
          )
    )
  );
}

// Generic update item
export function updateItem<T extends { build: (cmd: typeof UpdateItemCommand) => { item: (i: unknown) => { send: () => Promise<unknown> } } }>(
  entity: T,
  item: unknown
): Effect.Effect<unknown, DatabaseError> {
  return Effect.tryPromise({
    try: () => entity.build(UpdateItemCommand).item(item).send(),
    catch: (error) =>
      new DatabaseError({
        message: `Failed to update item`,
        operation: "update",
        cause: error,
      }),
  });
}

// Generic delete item
export function deleteItem<T extends { build: (cmd: typeof DeleteItemCommand) => { key: (k: unknown) => { send: () => Promise<unknown> } } }>(
  entity: T,
  key: unknown
): Effect.Effect<unknown, DatabaseError> {
  return Effect.tryPromise({
    try: () => entity.build(DeleteItemCommand).key(key).send(),
    catch: (error) =>
      new DatabaseError({
        message: `Failed to delete item`,
        operation: "delete",
        cause: error,
      }),
  });
}
