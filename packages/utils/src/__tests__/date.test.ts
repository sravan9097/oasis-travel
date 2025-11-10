import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  relativeTime,
  daysBetween,
  hoursBetween,
  isPast,
  isFuture,
  isDateToday,
  addDaysToDate,
} from '../date';

describe('Date Utils', () => {
  const testDate = new Date('2024-01-15T10:00:00Z');
  const pastDate = new Date('2020-01-01T00:00:00Z');
  const futureDate = new Date('2030-01-01T00:00:00Z');

  it('formats date correctly', () => {
    const formatted = formatDate(testDate);
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('15');
  });

  it('formats date and time correctly', () => {
    const formatted = formatDateTime(testDate);
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('15');
    expect(formatted).toMatch(/\d{2}:\d{2}/); // Matches HH:mm format
  });

  it('calculates days between dates', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-11');
    expect(daysBetween(start, end)).toBe(10);
  });

  it('calculates hours between dates', () => {
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-01T05:00:00Z');
    expect(hoursBetween(start, end)).toBe(5);
  });

  it('checks if date is in the past', () => {
    expect(isPast(pastDate)).toBe(true);
    expect(isPast(futureDate)).toBe(false);
  });

  it('checks if date is in the future', () => {
    expect(isFuture(futureDate)).toBe(true);
    expect(isFuture(pastDate)).toBe(false);
  });

  it('adds days to date', () => {
    const result = addDaysToDate(testDate, 5);
    expect(result.getDate()).toBe(20);
  });
});

