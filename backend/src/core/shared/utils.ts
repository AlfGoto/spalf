import { ulid } from "ulid";

/**
 * Generate a unique ID using ULID
 */
export function generateId(): string {
  return ulid();
}

/**
 * Build a composite key for DynamoDB
 */
export function buildKey(...parts: string[]): string {
  return parts.join("#");
}

/**
 * Parse a composite key
 */
export function parseKey(key: string): string[] {
  return key.split("#");
}

/**
 * Format a date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Format time to HH:mm
 */
export function formatTime(date: Date): string {
  return date.toISOString().split("T")[1].substring(0, 5);
}

/**
 * Parse time string (HH:mm) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:mm)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);

  return s1 < e2 && s2 < e1;
}

/**
 * Add minutes to a time string
 */
export function addMinutesToTime(time: string, minutesToAdd: number): string {
  const totalMinutes = timeToMinutes(time) + minutesToAdd;
  return minutesToTime(totalMinutes);
}

/**
 * Round time to nearest slot based on granularity
 */
export function roundToSlot(time: string, granularity: number): string {
  const minutes = timeToMinutes(time);
  const rounded = Math.round(minutes / granularity) * granularity;
  return minutesToTime(rounded);
}

/**
 * Get day of week from date string (YYYY-MM-DD)
 */
export function getDayOfWeek(dateStr: string): string {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const date = new Date(dateStr);
  return days[date.getDay()];
}

/**
 * Check if a reservation is within the cancellation deadline
 * Returns true if cancellation is NOT allowed (deadline has passed)
 */
export function isWithinCancellationDeadline(
  reservationDate: string,
  reservationStartTime: string,
  cancellationDeadlineHours: number
): boolean {
  const reservationDateTime = new Date(`${reservationDate}T${reservationStartTime}:00`);
  const now = new Date();
  const deadlineTime = new Date(reservationDateTime.getTime() - cancellationDeadlineHours * 60 * 60 * 1000);
  
  // If current time is past the deadline time, cancellation is NOT allowed
  return now >= deadlineTime;
}

/**
 * Get hours until reservation starts
 */
export function getHoursUntilReservation(
  reservationDate: string,
  reservationStartTime: string
): number {
  const reservationDateTime = new Date(`${reservationDate}T${reservationStartTime}:00`);
  const now = new Date();
  const diffMs = reservationDateTime.getTime() - now.getTime();
  return Math.floor(diffMs / (60 * 60 * 1000));
}
