import { describe, it, expect } from 'vitest';
import {
  truncate,
  slugify,
  capitalize,
  titleCase,
  sanitize,
  getInitials,
  maskPhone,
} from '../strings';

describe('String Utils', () => {
  it('truncates strings correctly', () => {
    expect(truncate('Hello World', 5)).toBe('He...');
    expect(truncate('Hi', 5)).toBe('Hi');
  });

  it('slugifies strings correctly', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('Test & Example')).toBe('test-example');
  });

  it('capitalizes strings correctly', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('HELLO')).toBe('Hello');
  });

  it('converts to title case', () => {
    expect(titleCase('hello world')).toBe('Hello World');
    expect(titleCase('test example')).toBe('Test Example');
  });

  it('sanitizes HTML', () => {
    expect(sanitize('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('extracts initials', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('John Michael Doe', 3)).toBe('JMD');
  });

  it('masks phone numbers', () => {
    expect(maskPhone('1234567890')).toBe('******7890');
    expect(maskPhone('123')).toBe('****');
  });
});

