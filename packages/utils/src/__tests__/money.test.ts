import { describe, it, expect } from 'vitest';
import { formatINR, roundMoney, percentage, addGST, formatCompact } from '../money';

describe('Money Utils', () => {
  it('formats INR correctly', () => {
    expect(formatINR(1000)).toBe('₹1,000');
    expect(formatINR(100000)).toBe('₹1,00,000');
  });

  it('rounds money correctly', () => {
    expect(roundMoney(10.556)).toBe(10.56);
    expect(roundMoney(10.554)).toBe(10.55);
  });

  it('calculates percentage', () => {
    expect(percentage(1000, 10)).toBe(100);
    expect(percentage(1000, 18)).toBe(180);
  });

  it('adds GST', () => {
    expect(addGST(1000, 18)).toBe(1180);
  });

  it('formats compact numbers', () => {
    expect(formatCompact(50000)).toBe('₹50.0K');
    expect(formatCompact(500000)).toBe('₹5.0L');
    expect(formatCompact(50000000)).toBe('₹5.0Cr');
  });
});

