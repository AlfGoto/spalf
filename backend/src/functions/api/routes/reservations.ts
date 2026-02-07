import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Effect, pipe } from "effect";
import { PutItemCommand } from "dynamodb-toolbox/entity/actions/put";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { UpdateItemCommand } from "dynamodb-toolbox/entity/actions/update";
import { DeleteItemCommand } from "dynamodb-toolbox/entity/actions/delete";
import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import {
  ReservationEntity,
  type ReservationStatus,
  EmployeeEntity,
  RoomEntity,
  ServiceEntity,
  ClientEntity,
  ClosureEntity,
  type ReservationItem,
  type EmployeeItem,
  type RoomItem,
  type ServiceItem,
  type ClosureItem,
} from "../../../core/database/entities";
import { SpalfTable } from "../../../core/database/table";
import {
  ValidationError,
  DatabaseError,
  NotFoundError,
  ConflictError,
  BusinessRuleError,
  type AppError,
} from "../../../core/shared/errors";
import {
  generateId,
  timeRangesOverlap,
  addMinutesToTime,
  getDayOfWeek,
  timeToMinutes,
  isWithinCancellationDeadline,
  getHoursUntilReservation,
} from "../../../core/shared/utils";

// Types for request bodies
interface CreateReservationBody {
  serviceId: string;
  clientId: string;
  employeeId: string;
  roomId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  notes?: string;
  internalNotes?: string;
}

interface UpdateReservationBody {
  employeeId?: string;
  roomId?: string;
  date?: string;
  startTime?: string;
  status?: ReservationStatus;
  notes?: string;
  internalNotes?: string;
  cancellationReason?: string;
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

// Validate create reservation body
function validateCreateReservation(body: CreateReservationBody): Effect.Effect<CreateReservationBody, ValidationError> {
  if (!body.serviceId?.trim()) {
    return Effect.fail(new ValidationError({ message: "Service ID is required", field: "serviceId" }));
  }
  if (!body.clientId?.trim()) {
    return Effect.fail(new ValidationError({ message: "Client ID is required", field: "clientId" }));
  }
  if (!body.employeeId?.trim()) {
    return Effect.fail(new ValidationError({ message: "Employee ID is required", field: "employeeId" }));
  }
  if (!body.roomId?.trim()) {
    return Effect.fail(new ValidationError({ message: "Room ID is required", field: "roomId" }));
  }
  if (!body.date?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return Effect.fail(new ValidationError({ message: "Valid date (YYYY-MM-DD) is required", field: "date" }));
  }
  if (!body.startTime?.trim() || !/^\d{2}:\d{2}$/.test(body.startTime)) {
    return Effect.fail(new ValidationError({ message: "Valid start time (HH:mm) is required", field: "startTime" }));
  }
  return Effect.succeed(body);
}

// Get reservations for a spa on a specific date
function getReservationsForDate(
  spaId: string,
  date: string
): Effect.Effect<ReservationItem[], DatabaseError> {
  return Effect.tryPromise({
    try: async () => {
      const result = await SpalfTable.build(QueryCommand)
        .query({
          index: "GSI1",
          partition: `SPA#${spaId}`,
          range: { beginsWith: `RESERVATION#${date}` },
        })
        .entities(ReservationEntity)
        .send();
      return (result.Items || []) as ReservationItem[];
    },
    catch: (error) => {
      console.error("Query reservations error:", error);
      return new DatabaseError({ message: "Failed to query reservations", operation: "query", cause: error });
    },
  });
}

// Check for employee availability
function checkEmployeeAvailability(
  employee: EmployeeItem,
  existingReservations: ReservationItem[],
  date: string,
  startTime: string,
  endTime: string,
  excludeReservationId?: string
): Effect.Effect<void, ConflictError | BusinessRuleError> {
  // Check if employee works on this day
  const dayOfWeek = getDayOfWeek(date);
  const schedule = employee.schedule?.[dayOfWeek];

  if (schedule && !schedule.isWorking) {
    return Effect.fail(
      new BusinessRuleError({
        message: `Employee ${employee.firstName} ${employee.lastName} does not work on ${dayOfWeek}`,
        rule: "EMPLOYEE_NOT_WORKING",
      })
    );
  }

  if (schedule) {
    const scheduleStart = timeToMinutes(schedule.start);
    const scheduleEnd = timeToMinutes(schedule.end);
    const resStart = timeToMinutes(startTime);
    const resEnd = timeToMinutes(endTime);

    if (resStart < scheduleStart || resEnd > scheduleEnd) {
      return Effect.fail(
        new BusinessRuleError({
          message: `Reservation time (${startTime}-${endTime}) is outside employee's working hours (${schedule.start}-${schedule.end})`,
          rule: "OUTSIDE_WORKING_HOURS",
        })
      );
    }
  }

  // Check for conflicts with existing reservations
  const employeeReservations = existingReservations.filter(
    (r) =>
      r.employeeId === employee.employeeId &&
      r.status !== "CANCELLED" &&
      r.reservationId !== excludeReservationId
  );

  for (const reservation of employeeReservations) {
    if (timeRangesOverlap(startTime, endTime, reservation.startTime, reservation.endTime)) {
      return Effect.fail(
        new ConflictError({
          message: `Employee ${employee.firstName} ${employee.lastName} already has a reservation from ${reservation.startTime} to ${reservation.endTime}`,
          conflictType: "SCHEDULE",
        })
      );
    }
  }

  return Effect.succeed(undefined);
}

// Check for room availability
function checkRoomAvailability(
  room: RoomItem,
  existingReservations: ReservationItem[],
  startTime: string,
  endTime: string,
  excludeReservationId?: string
): Effect.Effect<void, ConflictError> {
  // Get concurrent reservations for this room
  const roomReservations = existingReservations.filter(
    (r) =>
      r.roomId === room.roomId &&
      r.status !== "CANCELLED" &&
      r.reservationId !== excludeReservationId
  );

  // Count concurrent reservations at the requested time
  const concurrentCount = roomReservations.filter((r) =>
    timeRangesOverlap(startTime, endTime, r.startTime, r.endTime)
  ).length;

  if (concurrentCount >= room.maxConcurrentServices) {
    return Effect.fail(
      new ConflictError({
        message: `Room ${room.name} has reached maximum concurrent services (${room.maxConcurrentServices}) during ${startTime}-${endTime}`,
        conflictType: "ROOM",
      })
    );
  }

  return Effect.succeed(undefined);
}

// Check for closures
function checkClosures(
  spaId: string,
  date: string,
  startTime: string,
  endTime: string
): Effect.Effect<void, BusinessRuleError | DatabaseError> {
  return pipe(
    Effect.tryPromise({
      try: async () => {
        const result = await SpalfTable.build(QueryCommand)
          .query({
            index: "GSI1",
            partition: `SPA#${spaId}`,
            range: { beginsWith: `CLOSURE#${date}` },
          })
          .entities(ClosureEntity)
          .send();
        return (result.Items || []) as ClosureItem[];
      },
      catch: (error) => {
        console.error("Query closures error:", error);
        return new DatabaseError({ message: "Failed to query closures", operation: "query", cause: error });
      },
    }),
    Effect.flatMap((closures) => {
      for (const closure of closures) {
        if (closure.isAllDay) {
          return Effect.fail(
            new BusinessRuleError({
              message: `The spa is closed on ${date}${closure.reason ? `: ${closure.reason}` : ""}`,
              rule: "SPA_CLOSED",
            })
          );
        }

        // Check partial closure
        if (
          closure.startTime &&
          closure.endTime &&
          timeRangesOverlap(startTime, endTime, closure.startTime, closure.endTime)
        ) {
          return Effect.fail(
            new BusinessRuleError({
              message: `The spa is closed from ${closure.startTime} to ${closure.endTime} on ${date}${
                closure.reason ? `: ${closure.reason}` : ""
              }`,
              rule: "SPA_CLOSED",
            })
          );
        }
      }
      return Effect.succeed(undefined);
    })
  );
}

export const reservationsRouter = {
  // GET /api/reservations
  list: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId } = params;
    const queryParams = event.queryStringParameters || {};
    const date = queryParams.date;
    const startDate = queryParams.startDate;
    const endDate = queryParams.endDate;

    // If a specific date is provided, query by date
    if (date) {
      return pipe(
        getReservationsForDate(spaId, date),
        Effect.map((reservations) => jsonResponse(200, { data: reservations }))
      );
    }

    // If date range is provided, we need to query each date
    if (startDate && endDate) {
      return pipe(
        Effect.tryPromise({
          try: async () => {
            // Generate all dates in range
            const dates: string[] = [];
            const current = new Date(startDate);
            const end = new Date(endDate);
            while (current <= end) {
              dates.push(current.toISOString().split("T")[0]);
              current.setDate(current.getDate() + 1);
            }

            // Query all dates in parallel (limited batch)
            const allReservations: ReservationItem[] = [];
            for (const d of dates) {
              const result = await SpalfTable.build(QueryCommand)
                .query({
                  index: "GSI1",
                  partition: `SPA#${spaId}`,
                  range: { beginsWith: `RESERVATION#${d}` },
                })
                .entities(ReservationEntity)
                .send();
              allReservations.push(...((result.Items || []) as ReservationItem[]));
            }
            return allReservations;
          },
          catch: (error) => {
            console.error("Query reservations error:", error);
            return new DatabaseError({ message: "Failed to query reservations", operation: "query", cause: error });
          },
        }),
        Effect.map((reservations) => jsonResponse(200, { data: reservations }))
      );
    }

    // Default: list all reservations for the spa
    return pipe(
      Effect.tryPromise({
        try: async () => {
          const result = await SpalfTable.build(QueryCommand)
            .query({
              index: "GSI1",
              partition: `SPA#${spaId}`,
              range: { beginsWith: "RESERVATION#" },
            })
            .entities(ReservationEntity)
            .send();
          return (result.Items || []) as ReservationItem[];
        },
        catch: (error) => {
          console.error("Query error:", error);
          return new DatabaseError({ message: "Failed to list reservations", operation: "query", cause: error });
        },
      }),
      Effect.map((reservations) => jsonResponse(200, { data: reservations }))
    );
  },

  // POST /api/reservations
  create: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId } = params;

    return Effect.gen(function* () {
      const body = yield* parseBody<CreateReservationBody>(event);
      yield* validateCreateReservation(body);

      // Fetch required entities in parallel
      const [serviceResult, employeeResult, roomResult, clientResult, existingReservations] = yield* Effect.all([
        Effect.tryPromise({
          try: () =>
            ServiceEntity.build(GetItemCommand)
              .key({ spaId, serviceId: body.serviceId })
              .send(),
          catch: (error) =>
            new DatabaseError({ message: "Failed to get service", operation: "get", cause: error }),
        }),
        Effect.tryPromise({
          try: () =>
            EmployeeEntity.build(GetItemCommand)
              .key({ spaId, employeeId: body.employeeId })
              .send(),
          catch: (error) =>
            new DatabaseError({ message: "Failed to get employee", operation: "get", cause: error }),
        }),
        Effect.tryPromise({
          try: () =>
            RoomEntity.build(GetItemCommand)
              .key({ spaId, roomId: body.roomId })
              .send(),
          catch: (error) => new DatabaseError({ message: "Failed to get room", operation: "get", cause: error }),
        }),
        Effect.tryPromise({
          try: () =>
            ClientEntity.build(GetItemCommand)
              .key({ spaId, clientId: body.clientId })
              .send(),
          catch: (error) =>
            new DatabaseError({ message: "Failed to get client", operation: "get", cause: error }),
        }),
        getReservationsForDate(spaId, body.date),
      ]);

      // Validate entities exist
      if (!serviceResult.Item) {
        return yield* Effect.fail(new NotFoundError({ entity: "Service", id: body.serviceId }));
      }
      if (!employeeResult.Item) {
        return yield* Effect.fail(new NotFoundError({ entity: "Employee", id: body.employeeId }));
      }
      if (!roomResult.Item) {
        return yield* Effect.fail(new NotFoundError({ entity: "Room", id: body.roomId }));
      }
      if (!clientResult.Item) {
        return yield* Effect.fail(new NotFoundError({ entity: "Client", id: body.clientId }));
      }

      const service = serviceResult.Item as ServiceItem;
      const employee = employeeResult.Item as EmployeeItem;
      const room = roomResult.Item as RoomItem;

      // Calculate end time based on service duration (including prep and recovery)
      const totalDuration = service.duration + service.preparationTime + service.recoveryTime;
      const endTime = addMinutesToTime(body.startTime, totalDuration);

      // Check closures and availability
      yield* checkClosures(spaId, body.date, body.startTime, endTime);
      yield* checkEmployeeAvailability(employee, existingReservations, body.date, body.startTime, endTime);
      yield* checkRoomAvailability(room, existingReservations, body.startTime, endTime);

      // All checks passed, create the reservation
      const reservationId = generateId();
      const item: ReservationItem = {
        reservationId,
        spaId,
        serviceId: body.serviceId,
        clientId: body.clientId,
        employeeId: body.employeeId,
        roomId: body.roomId,
        date: body.date,
        startTime: body.startTime,
        endTime,
        status: "CONFIRMED",
        notes: body.notes,
        internalNotes: body.internalNotes,
        GSI1PK: `SPA#${spaId}`,
        GSI1SK: `RESERVATION#${body.date}#${body.startTime}#${reservationId}`,
        GSI2PK: `DATE#${body.date}`,
        GSI2SK: `SPA#${spaId}#RESERVATION#${reservationId}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      yield* Effect.tryPromise({
        try: () => ReservationEntity.build(PutItemCommand).item(item).send(),
        catch: (error) =>
          new DatabaseError({ message: "Failed to create reservation", operation: "put", cause: error }),
      });

      return jsonResponse(201, { data: item });
    });
  },

  // GET /api/reservations/:id
  get: (
    _event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return pipe(
      Effect.tryPromise({
        try: () =>
          ReservationEntity.build(GetItemCommand)
            .key({ spaId, reservationId: id })
            .send(),
        catch: (error) =>
          new DatabaseError({ message: "Failed to get reservation", operation: "get", cause: error }),
      }),
      Effect.flatMap((result) =>
        result.Item
          ? Effect.succeed(jsonResponse(200, { data: result.Item }))
          : Effect.fail(new NotFoundError({ entity: "Reservation", id }))
      )
    );
  },

  // PUT /api/reservations/:id
  update: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return Effect.gen(function* () {
      const body = yield* parseBody<UpdateReservationBody>(event);

      // Get the existing reservation
      const reservationResult = yield* Effect.tryPromise({
        try: () =>
          ReservationEntity.build(GetItemCommand)
            .key({ spaId, reservationId: id })
            .send(),
        catch: (error) =>
          new DatabaseError({ message: "Failed to get reservation", operation: "get", cause: error }),
      });

      if (!reservationResult.Item) {
        return yield* Effect.fail(new NotFoundError({ entity: "Reservation", id }));
      }

      const existing = reservationResult.Item as ReservationItem;

      // Get the service for policy checks
      const serviceResult = yield* Effect.tryPromise({
        try: () =>
          ServiceEntity.build(GetItemCommand)
            .key({ spaId, serviceId: existing.serviceId })
            .send(),
        catch: (error) =>
          new DatabaseError({ message: "Failed to get service", operation: "get", cause: error }),
      });

      if (!serviceResult.Item) {
        return yield* Effect.fail(new NotFoundError({ entity: "Service", id: existing.serviceId }));
      }

      const service = serviceResult.Item as ServiceItem;

      // Check cancellation policy
      if (body.status === "CANCELLED") {
        const deadlinePassed = isWithinCancellationDeadline(
          existing.date,
          existing.startTime,
          service.cancellationDeadlineHours
        );
        if (deadlinePassed) {
          const hoursUntil = getHoursUntilReservation(existing.date, existing.startTime);
          return yield* Effect.fail(
            new BusinessRuleError({
              message: `Cannot cancel reservation. Cancellation deadline is ${service.cancellationDeadlineHours} hours before the appointment. Only ${hoursUntil > 0 ? hoursUntil : 0} hours remaining.`,
              rule: "CANCELLATION_DEADLINE_PASSED",
            })
          );
        }
      }

      // Check rescheduling policy
      const isRescheduling =
        (body.date && body.date !== existing.date) ||
        (body.startTime && body.startTime !== existing.startTime);

      if (isRescheduling && !service.canBeRescheduled) {
        return yield* Effect.fail(
          new BusinessRuleError({
            message: `This service does not allow rescheduling. Please cancel and create a new reservation if needed.`,
            rule: "RESCHEDULING_NOT_ALLOWED",
          })
        );
      }

      // If rescheduling, also check the cancellation deadline
      if (isRescheduling) {
        const deadlinePassed = isWithinCancellationDeadline(
          existing.date,
          existing.startTime,
          service.cancellationDeadlineHours
        );
        if (deadlinePassed) {
          const hoursUntil = getHoursUntilReservation(existing.date, existing.startTime);
          return yield* Effect.fail(
            new BusinessRuleError({
              message: `Cannot reschedule reservation. Changes must be made at least ${service.cancellationDeadlineHours} hours before the appointment. Only ${hoursUntil > 0 ? hoursUntil : 0} hours remaining.`,
              rule: "RESCHEDULING_DEADLINE_PASSED",
            })
          );
        }
      }

      // Determine new values
      let newDate = body.date ?? existing.date;
      let newStartTime = body.startTime ?? existing.startTime;
      let newEndTime = existing.endTime;

      // If rescheduling (date, time, employee, or room changed), validate availability
      const needsAvailabilityCheck =
        (body.date && body.date !== existing.date) ||
        (body.startTime && body.startTime !== existing.startTime) ||
        (body.employeeId && body.employeeId !== existing.employeeId) ||
        (body.roomId && body.roomId !== existing.roomId);

      if (needsAvailabilityCheck) {
        const newEmployeeId = body.employeeId ?? existing.employeeId;
        const newRoomId = body.roomId ?? existing.roomId;

        // Ensure employee and room IDs are available for availability check
        if (!newEmployeeId) {
          return yield* Effect.fail(
            new ValidationError({ message: "Employee ID is required for rescheduling", field: "employeeId" })
          );
        }
        if (!newRoomId) {
          return yield* Effect.fail(
            new ValidationError({ message: "Room ID is required for rescheduling", field: "roomId" })
          );
        }

        const totalDuration = service.duration + service.preparationTime + service.recoveryTime;
        newEndTime = addMinutesToTime(newStartTime, totalDuration);

        const [employeeResult, roomResult, existingReservations] = yield* Effect.all([
          Effect.tryPromise({
            try: () =>
              EmployeeEntity.build(GetItemCommand)
                .key({ spaId, employeeId: newEmployeeId })
                .send(),
            catch: (error) =>
              new DatabaseError({ message: "Failed to get employee", operation: "get", cause: error }),
          }),
          Effect.tryPromise({
            try: () =>
              RoomEntity.build(GetItemCommand)
                .key({ spaId, roomId: newRoomId })
                .send(),
            catch: (error) =>
              new DatabaseError({ message: "Failed to get room", operation: "get", cause: error }),
          }),
          getReservationsForDate(spaId, newDate),
        ]);

        if (!employeeResult.Item) {
          return yield* Effect.fail(new NotFoundError({ entity: "Employee", id: newEmployeeId }));
        }
        if (!roomResult.Item) {
          return yield* Effect.fail(new NotFoundError({ entity: "Room", id: newRoomId }));
        }

        const employee = employeeResult.Item as EmployeeItem;
        const room = roomResult.Item as RoomItem;

        yield* checkClosures(spaId, newDate, newStartTime, newEndTime);
        yield* checkEmployeeAvailability(employee, existingReservations, newDate, newStartTime, newEndTime, id);
        yield* checkRoomAvailability(room, existingReservations, newStartTime, newEndTime, id);
      }

      // Build the complete update item with all required fields
      const updateItem = {
        spaId,
        reservationId: id,
        serviceId: existing.serviceId,
        clientId: existing.clientId,
        employeeId: body.employeeId ?? existing.employeeId,
        roomId: body.roomId ?? existing.roomId,
        date: newDate,
        startTime: newStartTime,
        endTime: body.startTime ? newEndTime : existing.endTime,
        status: body.status ?? existing.status,
        notes: body.notes ?? existing.notes,
        internalNotes: body.internalNotes ?? existing.internalNotes,
        cancelledAt: body.status === "CANCELLED" ? new Date().toISOString() : existing.cancelledAt,
        cancellationReason: body.status === "CANCELLED" ? body.cancellationReason : existing.cancellationReason,
        GSI1PK: `SPA#${spaId}`,
        GSI1SK: `RESERVATION#${newDate}#${newStartTime}#${id}`,
        GSI2PK: `DATE#${newDate}`,
        GSI2SK: `SPA#${spaId}#RESERVATION#${id}`,
      };

      yield* Effect.tryPromise({
        try: () => ReservationEntity.build(UpdateItemCommand).item(updateItem).send(),
        catch: (error) =>
          new DatabaseError({ message: "Failed to update reservation", operation: "update", cause: error }),
      });

      return jsonResponse(200, { data: { ...existing, ...body, reservationId: id } });
    });
  },

  // DELETE /api/reservations/:id
  delete: (
    _event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId, id } = params;

    return Effect.gen(function* () {
      // Verify the reservation exists first
      const result = yield* Effect.tryPromise({
        try: () =>
          ReservationEntity.build(GetItemCommand)
            .key({ spaId, reservationId: id })
            .send(),
        catch: (error) =>
          new DatabaseError({ message: "Failed to get reservation", operation: "get", cause: error }),
      });

      if (!result.Item) {
        return yield* Effect.fail(new NotFoundError({ entity: "Reservation", id }));
      }

      const existing = result.Item as ReservationItem;

      // Get the service to check cancellation policy
      const serviceResult = yield* Effect.tryPromise({
        try: () =>
          ServiceEntity.build(GetItemCommand)
            .key({ spaId, serviceId: existing.serviceId })
            .send(),
        catch: (error) =>
          new DatabaseError({ message: "Failed to get service", operation: "get", cause: error }),
      });

      if (serviceResult.Item) {
        const service = serviceResult.Item as ServiceItem;

        // Check cancellation deadline
        const deadlinePassed = isWithinCancellationDeadline(
          existing.date,
          existing.startTime,
          service.cancellationDeadlineHours
        );

        if (deadlinePassed) {
          const hoursUntil = getHoursUntilReservation(existing.date, existing.startTime);
          return yield* Effect.fail(
            new BusinessRuleError({
              message: `Cannot delete reservation. Cancellation deadline is ${service.cancellationDeadlineHours} hours before the appointment. Only ${hoursUntil > 0 ? hoursUntil : 0} hours remaining. Please cancel the reservation instead.`,
              rule: "CANCELLATION_DEADLINE_PASSED",
            })
          );
        }
      }

      // Delete the reservation
      yield* Effect.tryPromise({
        try: () =>
          ReservationEntity.build(DeleteItemCommand)
            .key({ spaId, reservationId: id })
            .send(),
        catch: (error) =>
          new DatabaseError({ message: "Failed to delete reservation", operation: "delete", cause: error }),
      });

      return jsonResponse(204, null);
    });
  },

  // GET /api/reservations/calendar - Get calendar data
  calendar: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    const { spaId } = params;
    const queryParams = event.queryStringParameters || {};
    const startDate = queryParams.startDate;
    const endDate = queryParams.endDate;
    const employeeId = queryParams.employeeId;
    const roomId = queryParams.roomId;

    if (!startDate || !endDate) {
      return Effect.fail(
        new ValidationError({ message: "startDate and endDate are required", field: "query" })
      );
    }

    return pipe(
      Effect.tryPromise({
        try: async () => {
          // Generate all dates in range
          const dates: string[] = [];
          const current = new Date(startDate);
          const end = new Date(endDate);
          while (current <= end) {
            dates.push(current.toISOString().split("T")[0]);
            current.setDate(current.getDate() + 1);
          }

          // Query all dates
          const allReservations: ReservationItem[] = [];
          for (const date of dates) {
            const result = await SpalfTable.build(QueryCommand)
              .query({
                index: "GSI1",
                partition: `SPA#${spaId}`,
                range: { beginsWith: `RESERVATION#${date}` },
              })
              .entities(ReservationEntity)
              .send();
            allReservations.push(...((result.Items || []) as ReservationItem[]));
          }

          // Filter by employee or room if specified
          let filtered = allReservations;
          if (employeeId) {
            filtered = filtered.filter((r) => r.employeeId === employeeId);
          }
          if (roomId) {
            filtered = filtered.filter((r) => r.roomId === roomId);
          }

          return filtered;
        },
        catch: (error) => {
          console.error("Calendar query error:", error);
          return new DatabaseError({ message: "Failed to get calendar data", operation: "query", cause: error });
        },
      }),
      Effect.map((reservations) => jsonResponse(200, { data: reservations }))
    );
  },
};
