import {
  validateCreateReservationInput,
  checkEmployeeAvailability,
  checkRoomAvailability,
  checkClosureConflict,
  checkCancellationPolicy,
  checkReschedulingPolicy,
  calculateReservationEndTime,
  buildReservationGSIKeys,
  type CreateReservationInput,
} from "./index";
import type {
  EmployeeItem,
  RoomItem,
  ReservationItem,
  ServiceItem,
  ClosureItem,
} from "../../database/entities";

// Helper to create a mock employee
function createMockEmployee(overrides?: Partial<EmployeeItem>): EmployeeItem {
  return {
    employeeId: "emp-1",
    spaId: "spa-1",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    employmentType: "FULLTIME",
    serviceIds: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// Helper to create a mock room
function createMockRoom(overrides?: Partial<RoomItem>): RoomItem {
  return {
    roomId: "room-1",
    spaId: "spa-1",
    name: "Room A",
    minCapacity: 1,
    maxCapacity: 2,
    maxConcurrentServices: 1,
    serviceIds: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// Helper to create a mock reservation
function createMockReservation(overrides?: Partial<ReservationItem>): ReservationItem {
  return {
    reservationId: "res-1",
    spaId: "spa-1",
    serviceId: "svc-1",
    clientId: "client-1",
    employeeId: "emp-1",
    roomId: "room-1",
    date: "2026-01-23",
    startTime: "10:00",
    endTime: "11:00",
    status: "CONFIRMED",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// Helper to create a mock service
function createMockService(overrides?: Partial<ServiceItem>): ServiceItem {
  return {
    serviceId: "svc-1",
    spaId: "spa-1",
    name: "Massage",
    price: 100,
    duration: 60,
    preparationTime: 0,
    recoveryTime: 0,
    cancellationDeadlineHours: 24,
    canBeRescheduled: true,
    productIds: [],
    roomIds: [],
    employeeIds: [],
    composedServiceIds: [],
    isComposed: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

// Helper to create a mock closure
function createMockClosure(overrides?: Partial<ClosureItem>): ClosureItem {
  return {
    closureId: "closure-1",
    spaId: "spa-1",
    date: "2026-01-23",
    reason: "Holiday",
    isAllDay: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("Reservation Domain Logic", () => {
  describe("validateCreateReservationInput", () => {
    const validInput: CreateReservationInput = {
      serviceId: "svc-1",
      clientId: "client-1",
      employeeId: "emp-1",
      roomId: "room-1",
      date: "2026-01-23",
      startTime: "10:00",
    };

    it("should accept valid input", () => {
      const result = validateCreateReservationInput(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validInput);
      }
    });

    it("should accept valid input with optional fields", () => {
      const inputWithNotes = {
        ...validInput,
        notes: "Customer prefers gentle pressure",
        internalNotes: "VIP client",
      };
      const result = validateCreateReservationInput(inputWithNotes);
      expect(result.success).toBe(true);
    });

    it("should reject missing serviceId", () => {
      const result = validateCreateReservationInput({
        ...validInput,
        serviceId: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.field).toBe("serviceId");
      }
    });

    it("should reject whitespace-only serviceId", () => {
      const result = validateCreateReservationInput({
        ...validInput,
        serviceId: "   ",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing clientId", () => {
      const result = validateCreateReservationInput({
        ...validInput,
        clientId: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.field).toBe("clientId");
      }
    });

    it("should reject missing employeeId", () => {
      const result = validateCreateReservationInput({
        ...validInput,
        employeeId: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.field).toBe("employeeId");
      }
    });

    it("should reject missing roomId", () => {
      const result = validateCreateReservationInput({
        ...validInput,
        roomId: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.field).toBe("roomId");
      }
    });

    it("should reject invalid date format", () => {
      const result = validateCreateReservationInput({
        ...validInput,
        date: "01-23-2026",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.field).toBe("date");
      }
    });

    it("should reject incomplete date", () => {
      const result = validateCreateReservationInput({
        ...validInput,
        date: "2026-01",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid time format", () => {
      const result = validateCreateReservationInput({
        ...validInput,
        startTime: "10:00:00",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.field).toBe("startTime");
      }
    });

    it("should reject time with single digit hour", () => {
      const result = validateCreateReservationInput({
        ...validInput,
        startTime: "9:00",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("checkEmployeeAvailability", () => {
    it("should allow booking when employee has no schedule", () => {
      const employee = createMockEmployee();
      const result = checkEmployeeAvailability(
        employee,
        [],
        "2026-01-23",
        "10:00",
        "11:00"
      );
      expect(result.available).toBe(true);
    });

    it("should allow booking within employee working hours", () => {
      const employee = createMockEmployee({
        schedule: {
          friday: { start: "09:00", end: "17:00", isWorking: true },
        },
      });
      const result = checkEmployeeAvailability(
        employee,
        [],
        "2026-01-23", // Friday
        "10:00",
        "11:00"
      );
      expect(result.available).toBe(true);
    });

    it("should reject booking when employee is not working that day", () => {
      const employee = createMockEmployee({
        schedule: {
          friday: { start: "09:00", end: "17:00", isWorking: false },
        },
      });
      const result = checkEmployeeAvailability(
        employee,
        [],
        "2026-01-23", // Friday
        "10:00",
        "11:00"
      );
      expect(result.available).toBe(false);
      if (!result.available) {
        expect(result.error._tag).toBe("BusinessRuleError");
        expect(result.error.message).toContain("does not work on friday");
      }
    });

    it("should reject booking outside working hours (too early)", () => {
      const employee = createMockEmployee({
        schedule: {
          friday: { start: "10:00", end: "17:00", isWorking: true },
        },
      });
      const result = checkEmployeeAvailability(
        employee,
        [],
        "2026-01-23", // Friday
        "09:00",
        "10:30"
      );
      expect(result.available).toBe(false);
      if (!result.available) {
        expect(result.error.message).toContain("outside employee's working hours");
      }
    });

    it("should reject booking outside working hours (too late)", () => {
      const employee = createMockEmployee({
        schedule: {
          friday: { start: "09:00", end: "17:00", isWorking: true },
        },
      });
      const result = checkEmployeeAvailability(
        employee,
        [],
        "2026-01-23", // Friday
        "16:30",
        "18:00"
      );
      expect(result.available).toBe(false);
    });

    it("should reject booking that conflicts with existing reservation", () => {
      const employee = createMockEmployee({ employeeId: "emp-1" });
      const existingReservation = createMockReservation({
        employeeId: "emp-1",
        startTime: "10:30",
        endTime: "11:30",
      });

      const result = checkEmployeeAvailability(
        employee,
        [existingReservation],
        "2026-01-23",
        "10:00",
        "11:00"
      );
      expect(result.available).toBe(false);
      if (!result.available) {
        expect(result.error._tag).toBe("ConflictError");
        expect(result.error.message).toContain("already has a reservation");
      }
    });

    it("should allow booking adjacent to existing reservation", () => {
      const employee = createMockEmployee({ employeeId: "emp-1" });
      const existingReservation = createMockReservation({
        employeeId: "emp-1",
        startTime: "11:00",
        endTime: "12:00",
      });

      const result = checkEmployeeAvailability(
        employee,
        [existingReservation],
        "2026-01-23",
        "10:00",
        "11:00"
      );
      expect(result.available).toBe(true);
    });

    it("should ignore cancelled reservations", () => {
      const employee = createMockEmployee({ employeeId: "emp-1" });
      const cancelledReservation = createMockReservation({
        employeeId: "emp-1",
        startTime: "10:00",
        endTime: "11:00",
        status: "CANCELLED",
      });

      const result = checkEmployeeAvailability(
        employee,
        [cancelledReservation],
        "2026-01-23",
        "10:00",
        "11:00"
      );
      expect(result.available).toBe(true);
    });

    it("should exclude specified reservation ID from conflict check", () => {
      const employee = createMockEmployee({ employeeId: "emp-1" });
      const existingReservation = createMockReservation({
        reservationId: "res-existing",
        employeeId: "emp-1",
        startTime: "10:00",
        endTime: "11:00",
      });

      const result = checkEmployeeAvailability(
        employee,
        [existingReservation],
        "2026-01-23",
        "10:00",
        "11:00",
        "res-existing" // Exclude this reservation
      );
      expect(result.available).toBe(true);
    });

    it("should ignore reservations for other employees", () => {
      const employee = createMockEmployee({ employeeId: "emp-1" });
      const otherEmployeeReservation = createMockReservation({
        employeeId: "emp-2",
        startTime: "10:00",
        endTime: "11:00",
      });

      const result = checkEmployeeAvailability(
        employee,
        [otherEmployeeReservation],
        "2026-01-23",
        "10:00",
        "11:00"
      );
      expect(result.available).toBe(true);
    });
  });

  describe("checkRoomAvailability", () => {
    it("should allow booking when room has no reservations", () => {
      const room = createMockRoom();
      const result = checkRoomAvailability(room, [], "10:00", "11:00");
      expect(result.available).toBe(true);
    });

    it("should allow booking when room has concurrent capacity", () => {
      const room = createMockRoom({ maxConcurrentServices: 2 });
      const existingReservation = createMockReservation({
        roomId: "room-1",
        startTime: "10:00",
        endTime: "11:00",
      });

      const result = checkRoomAvailability(
        room,
        [existingReservation],
        "10:00",
        "11:00"
      );
      expect(result.available).toBe(true);
    });

    it("should reject booking when room is at capacity", () => {
      const room = createMockRoom({ roomId: "room-1", maxConcurrentServices: 1 });
      const existingReservation = createMockReservation({
        roomId: "room-1",
        startTime: "10:00",
        endTime: "11:00",
      });

      const result = checkRoomAvailability(
        room,
        [existingReservation],
        "10:00",
        "11:00"
      );
      expect(result.available).toBe(false);
      if (!result.available) {
        expect(result.error._tag).toBe("ConflictError");
        expect(result.error.message).toContain("maximum concurrent services");
      }
    });

    it("should reject booking when room has overlapping reservation at capacity", () => {
      const room = createMockRoom({ roomId: "room-1", maxConcurrentServices: 1 });
      const existingReservation = createMockReservation({
        roomId: "room-1",
        startTime: "09:30",
        endTime: "10:30",
      });

      const result = checkRoomAvailability(
        room,
        [existingReservation],
        "10:00",
        "11:00"
      );
      expect(result.available).toBe(false);
    });

    it("should allow booking when concurrent reservations are at different times", () => {
      const room = createMockRoom({ roomId: "room-1", maxConcurrentServices: 1 });
      const existingReservation = createMockReservation({
        roomId: "room-1",
        startTime: "09:00",
        endTime: "10:00",
      });

      const result = checkRoomAvailability(
        room,
        [existingReservation],
        "10:00",
        "11:00"
      );
      expect(result.available).toBe(true);
    });

    it("should ignore cancelled reservations", () => {
      const room = createMockRoom({ roomId: "room-1", maxConcurrentServices: 1 });
      const cancelledReservation = createMockReservation({
        roomId: "room-1",
        startTime: "10:00",
        endTime: "11:00",
        status: "CANCELLED",
      });

      const result = checkRoomAvailability(
        room,
        [cancelledReservation],
        "10:00",
        "11:00"
      );
      expect(result.available).toBe(true);
    });

    it("should exclude specified reservation ID", () => {
      const room = createMockRoom({ roomId: "room-1", maxConcurrentServices: 1 });
      const existingReservation = createMockReservation({
        reservationId: "res-existing",
        roomId: "room-1",
        startTime: "10:00",
        endTime: "11:00",
      });

      const result = checkRoomAvailability(
        room,
        [existingReservation],
        "10:00",
        "11:00",
        "res-existing"
      );
      expect(result.available).toBe(true);
    });

    it("should ignore reservations for other rooms", () => {
      const room = createMockRoom({ roomId: "room-1", maxConcurrentServices: 1 });
      const otherRoomReservation = createMockReservation({
        roomId: "room-2",
        startTime: "10:00",
        endTime: "11:00",
      });

      const result = checkRoomAvailability(
        room,
        [otherRoomReservation],
        "10:00",
        "11:00"
      );
      expect(result.available).toBe(true);
    });

    it("should handle multiple concurrent reservations up to capacity", () => {
      const room = createMockRoom({ roomId: "room-1", maxConcurrentServices: 3 });
      const reservations = [
        createMockReservation({ reservationId: "r1", roomId: "room-1", startTime: "10:00", endTime: "11:00" }),
        createMockReservation({ reservationId: "r2", roomId: "room-1", startTime: "10:00", endTime: "11:00" }),
      ];

      // Third booking should be allowed (max is 3)
      const result = checkRoomAvailability(room, reservations, "10:00", "11:00");
      expect(result.available).toBe(true);

      // Fourth booking should fail
      reservations.push(
        createMockReservation({ reservationId: "r3", roomId: "room-1", startTime: "10:00", endTime: "11:00" })
      );
      const result2 = checkRoomAvailability(room, reservations, "10:00", "11:00");
      expect(result2.available).toBe(false);
    });
  });

  describe("checkClosureConflict", () => {
    it("should allow booking when no closures", () => {
      const result = checkClosureConflict([], "2026-01-23", "10:00", "11:00");
      expect(result.available).toBe(true);
    });

    it("should reject booking on all-day closure", () => {
      const closure = createMockClosure({ isAllDay: true });
      const result = checkClosureConflict([closure], "2026-01-23", "10:00", "11:00");
      expect(result.available).toBe(false);
      if (!result.available) {
        expect(result.error._tag).toBe("BusinessRuleError");
        expect(result.error.message).toContain("spa is closed");
      }
    });

    it("should include reason in closure error message", () => {
      const closure = createMockClosure({ isAllDay: true, reason: "Public Holiday" });
      const result = checkClosureConflict([closure], "2026-01-23", "10:00", "11:00");
      if (!result.available) {
        expect(result.error.message).toContain("Public Holiday");
      }
    });

    it("should handle all-day closure without reason", () => {
      const closure = createMockClosure({ isAllDay: true, reason: undefined });
      const result = checkClosureConflict([closure], "2026-01-23", "10:00", "11:00");
      expect(result.available).toBe(false);
      if (!result.available) {
        expect(result.error.message).toBe("The spa is closed on 2026-01-23");
      }
    });

    it("should reject booking during partial closure", () => {
      const closure = createMockClosure({
        isAllDay: false,
        startTime: "09:00",
        endTime: "12:00",
        reason: "Maintenance",
      });
      const result = checkClosureConflict([closure], "2026-01-23", "10:00", "11:00");
      expect(result.available).toBe(false);
      if (!result.available) {
        expect(result.error.message).toContain("Maintenance");
      }
    });

    it("should handle partial closure without reason", () => {
      const closure = createMockClosure({
        isAllDay: false,
        startTime: "09:00",
        endTime: "12:00",
        reason: undefined,
      });
      const result = checkClosureConflict([closure], "2026-01-23", "10:00", "11:00");
      expect(result.available).toBe(false);
      if (!result.available) {
        expect(result.error.message).toBe("The spa is closed from 09:00 to 12:00 on 2026-01-23");
      }
    });

    it("should allow booking outside partial closure", () => {
      const closure = createMockClosure({
        isAllDay: false,
        startTime: "09:00",
        endTime: "10:00",
      });
      const result = checkClosureConflict([closure], "2026-01-23", "10:00", "11:00");
      expect(result.available).toBe(true);
    });

    it("should reject booking that overlaps start of partial closure", () => {
      const closure = createMockClosure({
        isAllDay: false,
        startTime: "10:30",
        endTime: "12:00",
      });
      const result = checkClosureConflict([closure], "2026-01-23", "10:00", "11:00");
      expect(result.available).toBe(false);
    });
  });

  describe("checkCancellationPolicy", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-01-23T08:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should allow cancellation when outside deadline", () => {
      const reservation = createMockReservation({
        date: "2026-01-24",
        startTime: "10:00",
      });
      const service = createMockService({ cancellationDeadlineHours: 24 });

      const result = checkCancellationPolicy(reservation, service);
      expect(result.allowed).toBe(true);
    });

    it("should reject cancellation when inside deadline", () => {
      const reservation = createMockReservation({
        date: "2026-01-23",
        startTime: "10:00", // 2 hours from now
      });
      const service = createMockService({ cancellationDeadlineHours: 4 });

      const result = checkCancellationPolicy(reservation, service);
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.error.message).toContain("Cannot cancel reservation");
        expect(result.error.message).toContain("4 hours before");
      }
    });

    it("should show hours remaining in error message", () => {
      const reservation = createMockReservation({
        date: "2026-01-23",
        startTime: "10:00",
      });
      const service = createMockService({ cancellationDeadlineHours: 24 });

      const result = checkCancellationPolicy(reservation, service);
      if (!result.allowed) {
        expect(result.error.message).toContain("hours remaining");
      }
    });

    it("should show 0 hours remaining when reservation is in the past", () => {
      const reservation = createMockReservation({
        date: "2026-01-23",
        startTime: "07:00", // Past (current mock time is 08:00)
      });
      const service = createMockService({ cancellationDeadlineHours: 4 });

      const result = checkCancellationPolicy(reservation, service);
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.error.message).toContain("0 hours remaining");
      }
    });
  });

  describe("checkReschedulingPolicy", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-01-23T08:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should allow updates that are not rescheduling", () => {
      const reservation = createMockReservation({
        date: "2026-01-23",
        startTime: "10:00",
      });
      const service = createMockService({ canBeRescheduled: false });

      // Same date and time
      const result = checkReschedulingPolicy(
        reservation,
        service,
        "2026-01-23",
        "10:00"
      );
      expect(result.allowed).toBe(true);
    });

    it("should allow rescheduling when service permits", () => {
      const reservation = createMockReservation({
        date: "2026-01-24",
        startTime: "10:00",
      });
      const service = createMockService({ canBeRescheduled: true, cancellationDeadlineHours: 4 });

      const result = checkReschedulingPolicy(
        reservation,
        service,
        "2026-01-25",
        "11:00"
      );
      expect(result.allowed).toBe(true);
    });

    it("should reject rescheduling when service does not permit", () => {
      const reservation = createMockReservation({
        date: "2026-01-24",
        startTime: "10:00",
      });
      const service = createMockService({ canBeRescheduled: false });

      const result = checkReschedulingPolicy(
        reservation,
        service,
        "2026-01-25",
        "10:00"
      );
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.error.message).toContain("does not allow rescheduling");
      }
    });

    it("should reject rescheduling when inside deadline", () => {
      const reservation = createMockReservation({
        date: "2026-01-23",
        startTime: "10:00",
      });
      const service = createMockService({
        canBeRescheduled: true,
        cancellationDeadlineHours: 4,
      });

      const result = checkReschedulingPolicy(
        reservation,
        service,
        "2026-01-24",
        "10:00"
      );
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.error.message).toContain("Cannot reschedule reservation");
      }
    });

    it("should show 0 hours remaining when reservation is in the past", () => {
      const reservation = createMockReservation({
        date: "2026-01-23",
        startTime: "07:00", // Past (current mock time is 08:00)
      });
      const service = createMockService({
        canBeRescheduled: true,
        cancellationDeadlineHours: 4,
      });

      const result = checkReschedulingPolicy(
        reservation,
        service,
        "2026-01-24",
        "10:00"
      );
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.error.message).toContain("0 hours remaining");
      }
    });

    it("should treat date change alone as rescheduling", () => {
      const reservation = createMockReservation({
        date: "2026-01-23",
        startTime: "10:00",
      });
      const service = createMockService({ canBeRescheduled: false });

      const result = checkReschedulingPolicy(
        reservation,
        service,
        "2026-01-24", // Different date
        undefined // Same time
      );
      expect(result.allowed).toBe(false);
    });

    it("should treat time change alone as rescheduling", () => {
      const reservation = createMockReservation({
        date: "2026-01-23",
        startTime: "10:00",
      });
      const service = createMockService({ canBeRescheduled: false });

      const result = checkReschedulingPolicy(
        reservation,
        service,
        undefined, // Same date
        "14:00" // Different time
      );
      expect(result.allowed).toBe(false);
    });
  });

  describe("calculateReservationEndTime", () => {
    it("should calculate end time with duration only", () => {
      const service = createMockService({
        duration: 60,
        preparationTime: 0,
        recoveryTime: 0,
      });
      expect(calculateReservationEndTime("10:00", service)).toBe("11:00");
    });

    it("should include preparation time", () => {
      const service = createMockService({
        duration: 60,
        preparationTime: 15,
        recoveryTime: 0,
      });
      expect(calculateReservationEndTime("10:00", service)).toBe("11:15");
    });

    it("should include recovery time", () => {
      const service = createMockService({
        duration: 60,
        preparationTime: 0,
        recoveryTime: 15,
      });
      expect(calculateReservationEndTime("10:00", service)).toBe("11:15");
    });

    it("should include both preparation and recovery time", () => {
      const service = createMockService({
        duration: 60,
        preparationTime: 15,
        recoveryTime: 15,
      });
      expect(calculateReservationEndTime("10:00", service)).toBe("11:30");
    });

    it("should handle crossing hour boundaries", () => {
      const service = createMockService({
        duration: 90,
        preparationTime: 15,
        recoveryTime: 15,
      });
      expect(calculateReservationEndTime("10:30", service)).toBe("12:30");
    });
  });

  describe("buildReservationGSIKeys", () => {
    it("should build correct GSI keys", () => {
      const keys = buildReservationGSIKeys(
        "spa-123",
        "res-456",
        "2026-01-23",
        "10:00"
      );

      expect(keys.GSI1PK).toBe("SPA#spa-123");
      expect(keys.GSI1SK).toBe("RESERVATION#2026-01-23#10:00#res-456");
      expect(keys.GSI2PK).toBe("DATE#2026-01-23");
      expect(keys.GSI2SK).toBe("SPA#spa-123#RESERVATION#res-456");
    });

    it("should handle different spa and reservation IDs", () => {
      const keys = buildReservationGSIKeys(
        "my-spa",
        "my-res",
        "2025-12-25",
        "14:30"
      );

      expect(keys.GSI1PK).toBe("SPA#my-spa");
      expect(keys.GSI1SK).toBe("RESERVATION#2025-12-25#14:30#my-res");
      expect(keys.GSI2PK).toBe("DATE#2025-12-25");
      expect(keys.GSI2SK).toBe("SPA#my-spa#RESERVATION#my-res");
    });
  });
});
