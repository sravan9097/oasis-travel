import { describe, it, expect } from 'vitest';
import {
  isValidIndianPhone,
  isValidPhone,
  isValidEmail,
  isValidGSTIN,
  isValidUUID,
  isValidURL,
} from '../validation';

describe('Validation Utils', () => {
  it('validates Indian phone numbers', () => {
    expect(isValidIndianPhone('9876543210')).toBe(true);
    expect(isValidIndianPhone('+919876543210')).toBe(true);
    expect(isValidIndianPhone('919876543210')).toBe(true);
    expect(isValidIndianPhone('1234567890')).toBe(false);
  });

  it('validates international phone numbers', () => {
    expect(isValidPhone('+1234567890')).toBe(true);
    expect(isValidPhone('1234567890')).toBe(true);
    expect(isValidPhone('123')).toBe(false);
  });

  it('validates emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
  });

  it('validates GSTIN', () => {
    expect(isValidGSTIN('27AABCU9603R1ZM')).toBe(true);
    expect(isValidGSTIN('invalid')).toBe(false);
  });

  it('validates UUIDs', () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';
    expect(isValidUUID(validUUID)).toBe(true);
    expect(isValidUUID('invalid')).toBe(false);
  });

  it('validates URLs', () => {
    expect(isValidURL('https://example.com')).toBe(true);
    expect(isValidURL('http://example.com')).toBe(true);
    expect(isValidURL('not-a-url')).toBe(false);
  });
});

