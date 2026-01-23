import {
  generateId,
  buildKey,
  parseKey,
  formatDate,
  formatTime,
  timeToMinutes,
  minutesToTime,
  timeRangesOverlap,
  addMinutesToTime,
  roundToSlot,
  getDayOfWeek,
  isWithinCancellationDeadline,
  getHoursUntilReservation,
} from "./utils";

describe("utils", () => {
  describe("generateId", () => {
    it("should generate a unique ULID", () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeDefined();
      expect(id1.length).toBe(26); // ULIDs are 26 characters
      expect(id1).not.toBe(id2);
    });

    it("should generate IDs with consistent format", () => {
      const id = generateId();

      // ULIDs use Crockford's Base32 (uppercase letters and digits, excluding I, L, O, U)
      expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    });
  });

  describe("buildKey", () => {
    it("should join parts with #", () => {
      expect(buildKey("SPA", "123")).toBe("SPA#123");
      expect(buildKey("SPA", "123", "EMPLOYEE", "456")).toBe("SPA#123#EMPLOYEE#456");
    });

    it("should handle single part", () => {
      expect(buildKey("METADATA")).toBe("METADATA");
    });

    it("should handle empty strings", () => {
      expect(buildKey("SPA", "", "123")).toBe("SPA##123");
    });
  });

  describe("parseKey", () => {
    it("should split key by #", () => {
      expect(parseKey("SPA#123")).toEqual(["SPA", "123"]);
      expect(parseKey("SPA#123#EMPLOYEE#456")).toEqual(["SPA", "123", "EMPLOYEE", "456"]);
    });

    it("should handle single value", () => {
      expect(parseKey("METADATA")).toEqual(["METADATA"]);
    });
  });

  describe("formatDate", () => {
    it("should format date as YYYY-MM-DD", () => {
      const date = new Date("2026-01-23T14:30:00Z");
      expect(formatDate(date)).toBe("2026-01-23");
    });

    it("should handle different dates", () => {
      expect(formatDate(new Date("2025-12-01T00:00:00Z"))).toBe("2025-12-01");
      expect(formatDate(new Date("2026-06-15T23:59:59Z"))).toBe("2026-06-15");
    });
  });

  describe("formatTime", () => {
    it("should format time as HH:mm", () => {
      const date = new Date("2026-01-23T14:30:00Z");
      expect(formatTime(date)).toBe("14:30");
    });

    it("should handle different times", () => {
      expect(formatTime(new Date("2026-01-01T00:00:00Z"))).toBe("00:00");
      expect(formatTime(new Date("2026-01-01T23:59:00Z"))).toBe("23:59");
      expect(formatTime(new Date("2026-01-01T09:05:00Z"))).toBe("09:05");
    });
  });

  describe("timeToMinutes", () => {
    it("should convert time string to minutes since midnight", () => {
      expect(timeToMinutes("00:00")).toBe(0);
      expect(timeToMinutes("01:00")).toBe(60);
      expect(timeToMinutes("12:00")).toBe(720);
      expect(timeToMinutes("14:30")).toBe(870);
      expect(timeToMinutes("23:59")).toBe(1439);
    });

    it("should handle leading zeros", () => {
      expect(timeToMinutes("09:05")).toBe(545);
    });
  });

  describe("minutesToTime", () => {
    it("should convert minutes to time string", () => {
      expect(minutesToTime(0)).toBe("00:00");
      expect(minutesToTime(60)).toBe("01:00");
      expect(minutesToTime(720)).toBe("12:00");
      expect(minutesToTime(870)).toBe("14:30");
      expect(minutesToTime(1439)).toBe("23:59");
    });

    it("should pad with leading zeros", () => {
      expect(minutesToTime(5)).toBe("00:05");
      expect(minutesToTime(65)).toBe("01:05");
      expect(minutesToTime(545)).toBe("09:05");
    });
  });

  describe("timeRangesOverlap", () => {
    it("should detect overlapping ranges", () => {
      // Range 1: 10:00-11:00, Range 2: 10:30-11:30
      expect(timeRangesOverlap("10:00", "11:00", "10:30", "11:30")).toBe(true);

      // Range 1: 10:00-12:00, Range 2: 09:00-10:30
      expect(timeRangesOverlap("10:00", "12:00", "09:00", "10:30")).toBe(true);

      // Range 2 completely inside Range 1
      expect(timeRangesOverlap("09:00", "17:00", "10:00", "11:00")).toBe(true);

      // Range 1 completely inside Range 2
      expect(timeRangesOverlap("10:00", "11:00", "09:00", "17:00")).toBe(true);
    });

    it("should detect non-overlapping ranges", () => {
      // Range 1: 10:00-11:00, Range 2: 11:00-12:00 (adjacent, no overlap)
      expect(timeRangesOverlap("10:00", "11:00", "11:00", "12:00")).toBe(false);

      // Range 1: 10:00-11:00, Range 2: 12:00-13:00
      expect(timeRangesOverlap("10:00", "11:00", "12:00", "13:00")).toBe(false);

      // Range 1: 14:00-15:00, Range 2: 10:00-11:00
      expect(timeRangesOverlap("14:00", "15:00", "10:00", "11:00")).toBe(false);
    });

    it("should handle same start or end times", () => {
      // Same start time
      expect(timeRangesOverlap("10:00", "11:00", "10:00", "10:30")).toBe(true);

      // Same end time
      expect(timeRangesOverlap("10:00", "11:00", "10:30", "11:00")).toBe(true);

      // Identical ranges
      expect(timeRangesOverlap("10:00", "11:00", "10:00", "11:00")).toBe(true);
    });
  });

  describe("addMinutesToTime", () => {
    it("should add minutes to time string", () => {
      expect(addMinutesToTime("10:00", 30)).toBe("10:30");
      expect(addMinutesToTime("10:30", 60)).toBe("11:30");
      expect(addMinutesToTime("23:00", 120)).toBe("25:00"); // Can go past midnight
    });

    it("should handle zero minutes", () => {
      expect(addMinutesToTime("14:30", 0)).toBe("14:30");
    });

    it("should handle crossing hour boundaries", () => {
      expect(addMinutesToTime("10:45", 30)).toBe("11:15");
      expect(addMinutesToTime("09:50", 25)).toBe("10:15");
    });
  });

  describe("roundToSlot", () => {
    it("should round to nearest 15-minute slot", () => {
      expect(roundToSlot("10:07", 15)).toBe("10:00");
      expect(roundToSlot("10:08", 15)).toBe("10:15");
      expect(roundToSlot("10:22", 15)).toBe("10:15");
      expect(roundToSlot("10:23", 15)).toBe("10:30");
    });

    it("should round to nearest 30-minute slot", () => {
      expect(roundToSlot("10:14", 30)).toBe("10:00");
      expect(roundToSlot("10:15", 30)).toBe("10:30");
      expect(roundToSlot("10:44", 30)).toBe("10:30");
      expect(roundToSlot("10:45", 30)).toBe("11:00");
    });

    it("should round to nearest 60-minute slot", () => {
      expect(roundToSlot("10:29", 60)).toBe("10:00");
      expect(roundToSlot("10:30", 60)).toBe("11:00");
      expect(roundToSlot("10:31", 60)).toBe("11:00");
    });

    it("should handle exact slot times", () => {
      expect(roundToSlot("10:00", 15)).toBe("10:00");
      expect(roundToSlot("10:30", 30)).toBe("10:30");
    });
  });

  describe("getDayOfWeek", () => {
    it("should return correct day of week", () => {
      // 2026-01-23 is a Friday
      expect(getDayOfWeek("2026-01-23")).toBe("friday");

      // 2026-01-19 is a Monday
      expect(getDayOfWeek("2026-01-19")).toBe("monday");

      // 2026-01-24 is a Saturday
      expect(getDayOfWeek("2026-01-24")).toBe("saturday");

      // 2026-01-25 is a Sunday
      expect(getDayOfWeek("2026-01-25")).toBe("sunday");
    });
  });

  describe("isWithinCancellationDeadline", () => {
    // These tests are time-sensitive, so we need to mock Date
    const RealDate = Date;

    beforeEach(() => {
      // Mock current time to 2026-01-23 10:00:00
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-01-23T10:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should return true when within cancellation deadline", () => {
      // Reservation at 12:00 with 4-hour deadline
      // Deadline is 08:00, current time is 10:00 (past deadline)
      expect(isWithinCancellationDeadline("2026-01-23", "12:00", 4)).toBe(true);
    });

    it("should return false when outside cancellation deadline", () => {
      // Reservation at 16:00 with 4-hour deadline
      // Deadline is 12:00, current time is 10:00 (before deadline)
      expect(isWithinCancellationDeadline("2026-01-23", "16:00", 4)).toBe(false);
    });

    it("should return true when reservation is in the past", () => {
      // Reservation was at 08:00, current time is 10:00
      expect(isWithinCancellationDeadline("2026-01-23", "08:00", 24)).toBe(true);
    });

    it("should return true when exactly at deadline", () => {
      // Reservation at 14:00 with 4-hour deadline
      // Deadline is exactly 10:00, current time is 10:00
      expect(isWithinCancellationDeadline("2026-01-23", "14:00", 4)).toBe(true);
    });

    it("should handle reservations on future dates", () => {
      // Reservation tomorrow at 10:00 with 4-hour deadline
      // Deadline is tomorrow 06:00, current time is today 10:00
      expect(isWithinCancellationDeadline("2026-01-24", "10:00", 4)).toBe(false);
    });
  });

  describe("getHoursUntilReservation", () => {
    // Helper to format date as YYYY-MM-DD in local time
    function formatLocalDate(d: Date): string {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    // Helper to format time as HH:mm in local time
    function formatLocalTime(d: Date): string {
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    }

    it("should calculate positive hours for future reservations", () => {
      // Create a reservation 4 hours from now
      const now = new Date();
      const reservationTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      const date = formatLocalDate(reservationTime);
      const time = formatLocalTime(reservationTime);

      const hours = getHoursUntilReservation(date, time);
      // Allow for slight timing differences during test execution
      expect(hours).toBeGreaterThanOrEqual(3);
      expect(hours).toBeLessThanOrEqual(4);
    });

    it("should return negative hours for past reservations", () => {
      // Create a reservation 2 hours ago
      const now = new Date();
      const reservationTime = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const date = formatLocalDate(reservationTime);
      const time = formatLocalTime(reservationTime);

      const hours = getHoursUntilReservation(date, time);
      expect(hours).toBeLessThanOrEqual(-2);
      expect(hours).toBeGreaterThanOrEqual(-3);
    });

    it("should handle reservations on future dates", () => {
      // Create a reservation 25 hours from now
      const now = new Date();
      const reservationTime = new Date(now.getTime() + 25 * 60 * 60 * 1000);
      const date = formatLocalDate(reservationTime);
      const time = formatLocalTime(reservationTime);

      const hours = getHoursUntilReservation(date, time);
      expect(hours).toBeGreaterThanOrEqual(24);
      expect(hours).toBeLessThanOrEqual(25);
    });

    it("should floor partial hours", () => {
      // Create a reservation 90 minutes from now = 1 hour (floored)
      const now = new Date();
      const reservationTime = new Date(now.getTime() + 90 * 60 * 1000);
      const date = formatLocalDate(reservationTime);
      const time = formatLocalTime(reservationTime);

      const hours = getHoursUntilReservation(date, time);
      expect(hours).toBe(1);
    });
  });
});
