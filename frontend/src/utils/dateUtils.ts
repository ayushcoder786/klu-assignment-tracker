import { format, parseISO, isValid } from 'date-fns';

/**
 * Parses a date string into a Date object representing the correct point in time.
 * If the string is an ISO string without a timezone suffix (e.g. '2026-08-28T13:30:00'),
 * it treats it as UTC to ensure proper conversion to the user's local timezone (e.g. IST).
 */
export function parseUtcDate(dateStr?: string | Date | null): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isValid(dateStr) ? dateStr : null;

  const trimmed = dateStr.trim();
  if (!trimmed || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
    return null;
  }

  try {
    // If it's an ISO datetime containing 'T' but without 'Z' or offset (+/-), append 'Z' (UTC)
    let normalized = trimmed;
    if (normalized.includes('T') && !normalized.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(normalized)) {
      normalized = normalized + 'Z';
    }

    const d = parseISO(normalized);
    if (isValid(d)) return d;

    const fallback = new Date(normalized);
    return isValid(fallback) ? fallback : null;
  } catch {
    return null;
  }
}

/**
 * Format a date timestamp for display in the user's local timezone.
 * Returns 'Never' when the timestamp is null, undefined, or missing.
 *
 * Example output: 'Aug 28, 2026 7:00 PM'
 */
export function formatLocalDateTime(
  dateStr?: string | Date | null,
  formatStr: string = 'MMM d, yyyy h:mm a',
  fallbackText: string = 'Never'
): string {
  const d = parseUtcDate(dateStr);
  if (!d) return fallbackText;

  try {
    return format(d, formatStr);
  } catch {
    return fallbackText;
  }
}

/**
 * Format time only (e.g. '7:00 PM').
 */
export function formatLocalTime(
  dateStr?: string | Date | null,
  fallbackText: string = 'Never'
): string {
  return formatLocalDateTime(dateStr, 'h:mm a', fallbackText);
}
