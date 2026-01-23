/**
 * Shared utility functions.
 * 
 * Add utilities here that are used across multiple features
 * but are not specific to any package/library.
 */

/**
 * Format a date string for display.
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Format a time string for display.
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Format a price for display.
 */
export function formatPrice(price: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}
