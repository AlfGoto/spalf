/**
 * Reservation Domain Logic
 *
 * Pure functions for reservation validation, availability checking,
 * and business rule enforcement.
 */

import {
  ValidationError,
  ConflictError,
  BusinessRuleError,
} from "../../shared/errors";
import {
  timeRangesOverlap,
  timeToMinutes,
  getDayOfWeek,
  addMinutesToTime,
  isWithinCancellationDeadline,
  getHoursUntilReservation,
} from "../../shared/utils";
import type { EmployeeItem, RoomItem, ReservationItem, ServiceItem, ClosureItem } from "../../database/entities";

// Types for reservation creation and updates
export interface CreateReservationInput {
  serviceId: string;
  clientId: string;
  employeeId: string;
  roomId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  notes?: string;
  internalNotes?: string;
}

export interface UpdateReservationInput {
  employeeId?: string;
  roomId?: string;
  date?: string;
  startTime?: string;
  status?: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  notes?: string;
  internalNotes?: string;
  cancellationReason?: string;
}

// Validation result type
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: ValidationError };

/**
 * Validate create reservation input
 */
export function validateCreateReservationInput(
  input: CreateReservationInput
): ValidationResult<CreateReservationInput> {
  if (!input.serviceId?.trim()) {
    return {
      success: false,
      error: new ValidationError({ message: "Service ID is required", field: "serviceId" }),
    };
  }
  if (!input.clientId?.trim()) {
    return {
      success: false,
      error: new ValidationError({ message: "Client ID is required", field: "clientId" }),
    };
  }
  if (!input.employeeId?.trim()) {
    return {
      success: false,
      error: new ValidationError({ message: "Employee ID is required", field: "employeeId" }),
    };
  }
  if (!input.roomId?.trim()) {
    return {
      success: false,
      error: new ValidationError({ message: "Room ID is required", field: "roomId" }),
    };
  }
  if (!input.date?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    return {
      success: false,
      error: new ValidationError({ message: "Valid date (YYYY-MM-DD) is required", field: "date" }),
    };
  }
  if (!input.startTime?.trim() || !/^\d{2}:\d{2}$/.test(input.startTime)) {
    return {
      success: false,
      error: new ValidationError({ message: "Valid start time (HH:mm) is required", field: "startTime" }),
    };
  }

  return { success: true, data: input };
}

/**
 * Availability check result type
 */
export type AvailabilityResult =
  | { available: true }
  | { available: false; error: ConflictError | BusinessRuleError };

/**
 * Check if employee is available for the given time slot
 */
export function checkEmployeeAvailability(
  employee: EmployeeItem,
  existingReservations: ReservationItem[],
  date: string,
  startTime: string,
  endTime: string,
  excludeReservationId?: string
): AvailabilityResult {
  // Check if employee works on this day
  const dayOfWeek = getDayOfWeek(date);
  const schedule = employee.schedule?.[dayOfWeek];

  if (schedule && !schedule.isWorking) {
    return {
      available: false,
      error: new BusinessRuleError({
        message: `Employee ${employee.firstName} ${employee.lastName} does not work on ${dayOfWeek}`,
        rule: "EMPLOYEE_NOT_WORKING",
      }),
    };
  }

  if (schedule) {
    const scheduleStart = timeToMinutes(schedule.start);
    const scheduleEnd = timeToMinutes(schedule.end);
    const resStart = timeToMinutes(startTime);
    const resEnd = timeToMinutes(endTime);

    if (resStart < scheduleStart || resEnd > scheduleEnd) {
      return {
        available: false,
        error: new BusinessRuleError({
          message: `Reservation time (${startTime}-${endTime}) is outside employee's working hours (${schedule.start}-${schedule.end})`,
          rule: "OUTSIDE_WORKING_HOURS",
        }),
      };
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
      return {
        available: false,
        error: new ConflictError({
          message: `Employee ${employee.firstName} ${employee.lastName} already has a reservation from ${reservation.startTime} to ${reservation.endTime}`,
          conflictType: "SCHEDULE",
        }),
      };
    }
  }

  return { available: true };
}

/**
 * Check if room is available for the given time slot
 */
export function checkRoomAvailability(
  room: RoomItem,
  existingReservations: ReservationItem[],
  startTime: string,
  endTime: string,
  excludeReservationId?: string
): AvailabilityResult {
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
    return {
      available: false,
      error: new ConflictError({
        message: `Room ${room.name} has reached maximum concurrent services (${room.maxConcurrentServices}) during ${startTime}-${endTime}`,
        conflictType: "ROOM",
      }),
    };
  }

  return { available: true };
}

/**
 * Check if a time slot is blocked by closures
 */
export function checkClosureConflict(
  closures: ClosureItem[],
  date: string,
  startTime: string,
  endTime: string
): AvailabilityResult {
  for (const closure of closures) {
    if (closure.isAllDay) {
      return {
        available: false,
        error: new BusinessRuleError({
          message: `The spa is closed on ${date}${closure.reason ? `: ${closure.reason}` : ""}`,
          rule: "SPA_CLOSED",
        }),
      };
    }

    // Check partial closure
    if (
      closure.startTime &&
      closure.endTime &&
      timeRangesOverlap(startTime, endTime, closure.startTime, closure.endTime)
    ) {
      return {
        available: false,
        error: new BusinessRuleError({
          message: `The spa is closed from ${closure.startTime} to ${closure.endTime} on ${date}${
            closure.reason ? `: ${closure.reason}` : ""
          }`,
          rule: "SPA_CLOSED",
        }),
      };
    }
  }

  return { available: true };
}

/**
 * Policy check result type
 */
export type PolicyResult =
  | { allowed: true }
  | { allowed: false; error: BusinessRuleError };

/**
 * Check if cancellation is allowed based on service policy
 */
export function checkCancellationPolicy(
  reservation: ReservationItem,
  service: ServiceItem
): PolicyResult {
  const deadlinePassed = isWithinCancellationDeadline(
    reservation.date,
    reservation.startTime,
    service.cancellationDeadlineHours
  );

  if (deadlinePassed) {
    const hoursUntil = getHoursUntilReservation(reservation.date, reservation.startTime);
    return {
      allowed: false,
      error: new BusinessRuleError({
        message: `Cannot cancel reservation. Cancellation deadline is ${service.cancellationDeadlineHours} hours before the appointment. Only ${hoursUntil > 0 ? hoursUntil : 0} hours remaining.`,
        rule: "CANCELLATION_DEADLINE_PASSED",
      }),
    };
  }

  return { allowed: true };
}

/**
 * Check if rescheduling is allowed based on service policy
 */
export function checkReschedulingPolicy(
  reservation: ReservationItem,
  service: ServiceItem,
  newDate?: string,
  newStartTime?: string
): PolicyResult {
  // Check if this is actually a reschedule
  const isRescheduling =
    (newDate && newDate !== reservation.date) ||
    (newStartTime && newStartTime !== reservation.startTime);

  if (!isRescheduling) {
    return { allowed: true };
  }

  // Check if service allows rescheduling
  if (!service.canBeRescheduled) {
    return {
      allowed: false,
      error: new BusinessRuleError({
        message: `This service does not allow rescheduling. Please cancel and create a new reservation if needed.`,
        rule: "RESCHEDULING_NOT_ALLOWED",
      }),
    };
  }

  // Check cancellation deadline for rescheduling too
  const deadlinePassed = isWithinCancellationDeadline(
    reservation.date,
    reservation.startTime,
    service.cancellationDeadlineHours
  );

  if (deadlinePassed) {
    const hoursUntil = getHoursUntilReservation(reservation.date, reservation.startTime);
    return {
      allowed: false,
      error: new BusinessRuleError({
        message: `Cannot reschedule reservation. Changes must be made at least ${service.cancellationDeadlineHours} hours before the appointment. Only ${hoursUntil > 0 ? hoursUntil : 0} hours remaining.`,
        rule: "RESCHEDULING_DEADLINE_PASSED",
      }),
    };
  }

  return { allowed: true };
}

/**
 * Calculate reservation end time based on service duration
 */
export function calculateReservationEndTime(
  startTime: string,
  service: ServiceItem
): string {
  const totalDuration = service.duration + service.preparationTime + service.recoveryTime;
  return addMinutesToTime(startTime, totalDuration);
}

/**
 * Build GSI keys for a reservation
 */
export function buildReservationGSIKeys(
  spaId: string,
  reservationId: string,
  date: string,
  startTime: string
): {
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK: string;
  GSI2SK: string;
} {
  return {
    GSI1PK: `SPA#${spaId}`,
    GSI1SK: `RESERVATION#${date}#${startTime}#${reservationId}`,
    GSI2PK: `DATE#${date}`,
    GSI2SK: `SPA#${spaId}#RESERVATION#${reservationId}`,
  };
}
