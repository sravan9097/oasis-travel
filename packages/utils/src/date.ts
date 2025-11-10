import {
  format,
  formatDistanceToNow,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  addDays,
  addHours,
  isAfter,
  isBefore,
  isToday,
  parseISO,
} from 'date-fns';

export type DateInput = Date | string | number;

/**
 * Format date to readable string
 */
export const formatDate = (
  date: DateInput,
  formatStr: string = 'MMM dd, yyyy'
): string => {
  return format(parseDate(date), formatStr);
};

/**
 * Format date and time
 */
export const formatDateTime = (date: DateInput): string => {
  return format(parseDate(date), 'MMM dd, yyyy HH:mm');
};

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export const relativeTime = (date: DateInput): string => {
  return formatDistanceToNow(parseDate(date), { addSuffix: true });
};

/**
 * Calculate days between two dates
 */
export const daysBetween = (start: DateInput, end: DateInput): number => {
  return differenceInDays(parseDate(end), parseDate(start));
};

/**
 * Calculate hours between two dates
 */
export const hoursBetween = (start: DateInput, end: DateInput): number => {
  return differenceInHours(parseDate(end), parseDate(start));
};

/**
 * Calculate minutes until a future date
 */
export const minutesUntil = (futureDate: DateInput): number => {
  return differenceInMinutes(parseDate(futureDate), new Date());
};

/**
 * Check if date is in the past
 */
export const isPast = (date: DateInput): boolean => {
  return isBefore(parseDate(date), new Date());
};

/**
 * Check if date is in the future
 */
export const isFuture = (date: DateInput): boolean => {
  return isAfter(parseDate(date), new Date());
};

/**
 * Check if date is today
 */
export const isDateToday = (date: DateInput): boolean => {
  return isToday(parseDate(date));
};

/**
 * Add days to date
 */
export const addDaysToDate = (date: DateInput, days: number): Date => {
  return addDays(parseDate(date), days);
};

/**
 * Add hours to date
 */
export const addHoursToDate = (date: DateInput, hours: number): Date => {
  return addHours(parseDate(date), hours);
};

/**
 * Parse date from various formats
 */
function parseDate(date: DateInput): Date {
  if (date instanceof Date) return date;
  if (typeof date === 'number') return new Date(date);
  return parseISO(date);
}

