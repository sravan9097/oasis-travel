import { describe, it, expect } from 'vitest';
import {
  RequestDocMinimalSchema,
  RequestDocFullSchema,
  IncidentCreateSchema,
  CancellationRequestSchema,
} from '../contracts';

describe('API Contracts', () => {
  describe('RequestDocMinimalSchema', () => {
    it('validates minimal request', () => {
      const valid = {
        destinations: ['Udaipur'],
        nights: 4,
        pax_adults: 2,
      };

      expect(() => RequestDocMinimalSchema.parse(valid)).not.toThrow();
    });

    it('rejects invalid minimal request', () => {
      const invalid = {
        destinations: [],
        nights: -1,
        pax_adults: 0,
      };

      expect(() => RequestDocMinimalSchema.parse(invalid)).toThrow();
    });

    it('requires at least one destination', () => {
      const invalid = {
        destinations: [],
        nights: 4,
        pax_adults: 2,
      };

      expect(() => RequestDocMinimalSchema.parse(invalid)).toThrow();
    });
  });

  describe('RequestDocFullSchema', () => {
    it('validates full request with optional fields', () => {
      const valid = {
        destinations: ['Udaipur', 'Mount Abu'],
        nights: 4,
        pax_adults: 2,
        pax_children: 1,
        hotel_class: '4*' as const,
        cab_type: 'suv' as const,
        pace: 'normal' as const,
      };

      expect(() => RequestDocFullSchema.parse(valid)).not.toThrow();
    });

    it('rejects invalid hotel class', () => {
      const invalid = {
        destinations: ['Udaipur'],
        nights: 4,
        pax_adults: 2,
        hotel_class: '6*',
      };

      expect(() => RequestDocFullSchema.parse(invalid)).toThrow();
    });
  });

  describe('IncidentCreateSchema', () => {
    it('validates incident creation', () => {
      const valid = {
        trip_id: '123e4567-e89b-12d3-a456-426614174000',
        severity: 'P0' as const,
        category: 'transport_delay',
        description: 'This is a detailed description of the incident',
      };

      expect(() => IncidentCreateSchema.parse(valid)).not.toThrow();
    });

    it('rejects short description', () => {
      const invalid = {
        trip_id: '123e4567-e89b-12d3-a456-426614174000',
        severity: 'P0' as const,
        category: 'transport_delay',
        description: 'Short',
      };

      expect(() => IncidentCreateSchema.parse(invalid)).toThrow();
    });
  });

  describe('CancellationRequestSchema', () => {
    it('validates cancellation request', () => {
      const valid = {
        booking_id: '123e4567-e89b-12d3-a456-426614174000',
        reason: 'This is a detailed reason for cancellation',
      };

      expect(() => CancellationRequestSchema.parse(valid)).not.toThrow();
    });

    it('rejects short reason', () => {
      const invalid = {
        booking_id: '123e4567-e89b-12d3-a456-426614174000',
        reason: 'Short',
      };

      expect(() => CancellationRequestSchema.parse(invalid)).toThrow();
    });
  });
});

