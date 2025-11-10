import { describe, it, expect } from 'vitest';
import { parseFlags, isFeatureEnabled, DEFAULT_FLAGS } from '../feature-flags';

describe('Feature Flags Utils', () => {
  it('parses flags from valid JSON', () => {
    const json = {
      soft_onboarding: false,
      masked_calling: true,
      quick_actions: false,
      offline_mode: true,
    };
    const flags = parseFlags(json);
    expect(flags.soft_onboarding).toBe(false);
    expect(flags.masked_calling).toBe(true);
  });

  it('returns default flags for invalid input', () => {
    expect(parseFlags(null)).toEqual(DEFAULT_FLAGS);
    expect(parseFlags('invalid')).toEqual(DEFAULT_FLAGS);
  });

  it('merges partial flags with defaults', () => {
    const partial = { soft_onboarding: false };
    const flags = parseFlags(partial);
    expect(flags.soft_onboarding).toBe(false);
    expect(flags.quick_actions).toBe(DEFAULT_FLAGS.quick_actions);
  });

  it('checks if feature is enabled', () => {
    const flags = {
      soft_onboarding: true,
      masked_calling: false,
      quick_actions: true,
      offline_mode: false,
    };
    expect(isFeatureEnabled(flags, 'soft_onboarding')).toBe(true);
    expect(isFeatureEnabled(flags, 'masked_calling')).toBe(false);
  });
});

