import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Effect, pipe } from "effect";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import {
  ReservationEntity,
  type ReservationStatus,
} from "../../../core/database/entities";
import { ClientEntity } from "../../../core/database/entities";
import { ServiceEntity } from "../../../core/database/entities";
import { SpalfTable } from "../../../core/database/table";
import {
  ValidationError,
  DatabaseError,
  NotFoundError,
  type AppError,
} from "../../../core/shared/errors";
import { generateId } from "../../../core/shared/utils";
import type { IntegrationItem } from "../../../core/database/entities/integration.entity";

/**
 * Reservations API for external integrations
 *
 * Allows external systems to create and manage reservations
 */

interface CreateReservationBody {
  serviceId: string;
  clientId?: string;
  client?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  date: string;
  startTime: string;
  employeeId?: string;
  roomId?: string;
  notes?: string;
  externalId?: string;
}

interface UpdateReservationBody {
  date?: string;
  startTime?: string;
  employeeId?: string;
  roomId?: string;
  status?: ReservationStatus;
  notes?: string;
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

export const reservationsRouter = {
  /**
   * GET /integration/reservations
   *
   * List reservations for the spa.
   * Query parameters:
   *   - date: Filter by date (YYYY-MM-DD)
   *   - startDate: Filter from date (YYYY-MM-DD)
   *   - endDate: Filter to date (YYYY-MM-DD)
   *   - status: Filter by status
   *   - externalId: Filter by external ID
   */
  list: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>,
    integration: IntegrationItem
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId } = params;
    const queryParams = event.queryStringParameters || {};

    return pipe(
      Effect.tryPromise({
        try: async () => {
          // Query reservations using GSI1
          const result = await SpalfTable.build(QueryCommand)
            .query({
              index: "GSI1",
              partition: `SPA#${spaId}`,
              range: { beginsWith: "RESERVATION#" },
            })
            .entities(ReservationEntity)
            .send();

          let reservations = result.Items || [];

          // Apply filters
          if (queryParams.date) {
            reservations = reservations.filter((r) => r.date === queryParams.date);
          }
          if (queryParams.startDate) {
            reservations = reservations.filter((r) => r.date >= queryParams.startDate!);
          }
          if (queryParams.endDate) {
            reservations = reservations.filter((r) => r.date <= queryParams.endDate!);
          }
          if (queryParams.status) {
            reservations = reservations.filter((r) => r.status === queryParams.status);
          }
          if (queryParams.externalId) {
            reservations = reservations.filter(
              (r) => (r as Record<string, unknown>).externalId === queryParams.externalId
            );
          }

          return reservations;
        },
        catch: (error) => {
          console.error("Query error:", error);
          return new DatabaseError({
            message: "Failed to list reservations",
            operation: "query",
            cause: error,
          });
        },
      }),
      Effect.map((reservations) =>
        jsonResponse(200, {
          data: reservations,
          meta: {
            count: reservations.length,
            integrationId: integration.integrationId,
          },
        })
      )
    );
  },

  /**
   * POST /integration/reservations
   *
   * Create a new reservation.
   * Can optionally create a client inline if clientId is not provided.
   */
  create: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>,
    integration: IntegrationItem
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId } = params;

    return pipe(
      parseBody<CreateReservationBody>(event),
      Effect.flatMap((body) => {
        // Validate required fields
        if (!body.serviceId) {
          return Effect.fail(
            new ValidationError({ message: "serviceId is required", field: "serviceId" })
          );
        }
        if (!body.date) {
          return Effect.fail(
            new ValidationError({ message: "date is required", field: "date" })
          );
        }
        if (!body.startTime) {
          return Effect.fail(
            new ValidationError({ message: "startTime is required", field: "startTime" })
          );
        }
        if (!body.clientId && !body.client) {
          return Effect.fail(
            new ValidationError({
              message: "Either clientId or client object is required",
              field: "clientId",
            })
          );
        }

        return Effect.succeed(body);
      }),
      Effect.flatMap((body) => {
        return pipe(
          // Verify service exists and get duration
          Effect.tryPromise({
            try: () =>
              ServiceEntity.build(GetItemCommand)
                .key({ spaId, serviceId: body.serviceId })
                .send(),
            catch: (error) =>
              new DatabaseError({
                message: "Failed to get service",
                operation: "get",
                cause: error,
              }),
          }),
          Effect.flatMap((serviceResult) => {
            if (!serviceResult.Item) {
              return Effect.fail(
                new NotFoundError({ entity: "Service", id: body.serviceId })
              );
            }
            return Effect.succeed(serviceResult.Item);
          }),
          Effect.flatMap((service) => {
            // Handle client creation if needed
            const clientIdEffect = body.clientId
              ? Effect.succeed(body.clientId)
              : pipe(
                  Effect.gen(function* () {
                    const clientId = generateId();
                    const clientItem = {
                      clientId,
                      spaId,
                      firstName: body.client!.firstName,
                      lastName: body.client!.lastName,
                      email: body.client!.email,
                      phone: body.client!.phone,
                      GSI1PK: `SPA#${spaId}`,
                      GSI1SK: `CLIENT#${clientId}`,
                    };

                    yield* Effect.tryPromise({
                      try: () => ClientEntity.build(PutItemCommand).item(clientItem).send(),
                      catch: (error) =>
                        new DatabaseError({
                          message: "Failed to create client",
                          operation: "put",
                          cause: error,
                        }),
                    });

                    return clientId;
                  })
                );

            return pipe(
              clientIdEffect,
              Effect.flatMap((clientId) => {
                const reservationId = generateId();
                const duration = (service as Record<string, unknown>).duration as number || 60;

                // Calculate end time
                const [hours, minutes] = body.startTime.split(":").map(Number);
                const totalMinutes = hours * 60 + minutes + duration;
                const endHours = Math.floor(totalMinutes / 60);
                const endMins = totalMinutes % 60;
                const endTime = `${endHours.toString().padStart(2, "0")}:${endMins
                  .toString()
                  .padStart(2, "0")}`;

                const reservationItem = {
                  reservationId,
                  spaId,
                  serviceId: body.serviceId,
                  clientId,
                  employeeId: body.employeeId,
                  roomId: body.roomId,
                  date: body.date,
                  startTime: body.startTime,
                  endTime,
                  status: "pending" as ReservationStatus,
                  notes: body.notes,
                  // Store the external reference and integration info
                  externalId: body.externalId,
                  createdByIntegration: integration.integrationId,
                  // GSI keys
                  GSI1PK: `SPA#${spaId}`,
                  GSI1SK: `RESERVATION#${body.date}#${body.startTime}#${reservationId}`,
                  GSI2PK: `DATE#${body.date}`,
                  GSI2SK: `SPA#${spaId}#RESERVATION#${reservationId}`,
                };

                return pipe(
                  Effect.tryPromise({
                    try: () =>
                      ReservationEntity.build(PutItemCommand).item(reservationItem).send(),
                    catch: (error) =>
                      new DatabaseError({
                        message: "Failed to create reservation",
                        operation: "put",
                        cause: error,
                      }),
                  }),
                  Effect.map(() =>
                    jsonResponse(201, {
                      data: reservationItem,
                      meta: {
                        integrationId: integration.integrationId,
                        clientCreated: !body.clientId,
                      },
                    })
                  )
                );
              })
            );
          })
        );
      })
    );
  },

  /**
   * GET /integration/reservations/:id
   *
   * Get a single reservation by ID.
   */
  get: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>,
    integration: IntegrationItem
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      Effect.tryPromise({
        try: () =>
          ReservationEntity.build(GetItemCommand)
            .key({ spaId, reservationId: id })
            .send(),
        catch: (error) =>
          new DatabaseError({
            message: "Failed to get reservation",
            operation: "get",
            cause: error,
          }),
      }),
      Effect.flatMap((result) =>
        result.Item
          ? Effect.succeed(
              jsonResponse(200, {
                data: result.Item,
                meta: { integrationId: integration.integrationId },
              })
            )
          : Effect.fail(new NotFoundError({ entity: "Reservation", id }))
      )
    );
  },

  /**
   * PUT /integration/reservations/:id
   *
   * Update a reservation.
   */
  update: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>,
    integration: IntegrationItem
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      parseBody<UpdateReservationBody>(event),
      Effect.flatMap((body) => {
        // First get existing reservation
        return pipe(
          Effect.tryPromise({
            try: () =>
              ReservationEntity.build(GetItemCommand)
                .key({ spaId, reservationId: id })
                .send(),
            catch: (error) =>
              new DatabaseError({
                message: "Failed to get reservation",
                operation: "get",
                cause: error,
              }),
          }),
          Effect.flatMap((result) =>
            result.Item
              ? Effect.succeed(result.Item)
              : Effect.fail(new NotFoundError({ entity: "Reservation", id }))
          ),
          Effect.flatMap((existing) => {
            const existingRes = existing as {
              serviceId: string;
              clientId: string;
              date: string;
              startTime: string;
              endTime: string;
              employeeId?: string;
              roomId?: string;
              status: ReservationStatus;
              notes?: string;
            };

            // Calculate new values
            const newDate = body.date ?? existingRes.date;
            const newStartTime = body.startTime ?? existingRes.startTime;

            const updateItem = {
              spaId,
              reservationId: id,
              serviceId: existingRes.serviceId,
              clientId: existingRes.clientId,
              date: newDate,
              startTime: newStartTime,
              endTime: existingRes.endTime,
              employeeId: body.employeeId ?? existingRes.employeeId,
              roomId: body.roomId ?? existingRes.roomId,
              status: body.status ?? existingRes.status,
              notes: body.notes ?? existingRes.notes,
              lastModifiedByIntegration: integration.integrationId,
              GSI1PK: `SPA#${spaId}`,
              GSI1SK: `RESERVATION#${newDate}#${newStartTime}#${id}`,
              GSI2PK: `DATE#${newDate}`,
              GSI2SK: `SPA#${spaId}#RESERVATION#${id}`,
            };

            return pipe(
              Effect.tryPromise({
                try: () =>
                  ReservationEntity.build(UpdateItemCommand).item(updateItem).send(),
                catch: (error) =>
                  new DatabaseError({
                    message: "Failed to update reservation",
                    operation: "update",
                    cause: error,
                  }),
              }),
              Effect.map(() =>
                jsonResponse(200, {
                  data: { ...existing, ...body },
                  meta: { integrationId: integration.integrationId },
                })
              )
            );
          })
        );
      })
    );
  },
};
