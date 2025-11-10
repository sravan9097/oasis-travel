import { z } from 'zod';

// Request validation schemas

export const RequestDocMinimalSchema = z.object({
  destinations: z.array(z.string()).min(1, 'At least one destination required'),
  nights: z.number().int().positive('Nights must be positive'),
  pax_adults: z.number().int().min(1, 'At least 1 adult required'),
});

export const RequestDocFullSchema = RequestDocMinimalSchema.extend({
  origin_city: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  pax_children: z.number().int().min(0).optional(),
  pax_seniors: z.number().int().min(0).optional(),
  budget_min: z.number().positive().optional(),
  budget_max: z.number().positive().optional(),
  hotel_class: z.enum(['3*', '4*', '5*', 'luxury']).optional(),
  cab_type: z.enum(['sedan', 'suv', 'tempo']).optional(),
  interests: z.array(z.string()).optional(),
  pace: z.enum(['relaxed', 'normal', 'packed']).optional(),
  special_needs: z.string().optional(),
});

export const QuoteSchema = z.object({
  id: z.string().uuid(),
  lead_id: z.string().uuid(),
  version: z.number().int(),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'ARCHIVED']),
  total_amount: z.number(),
  currency: z.string(),
  validity_date: z.string().nullable(),
  inclusions: z.string().nullable(),
  exclusions: z.string().nullable(),
});

export const IncidentCreateSchema = z.object({
  trip_id: z.string().uuid(),
  severity: z.enum(['P0', 'P1', 'P2']),
  category: z.string(),
  description: z.string().min(10, 'Description too short'),
});

export const CancellationRequestSchema = z.object({
  booking_id: z.string().uuid(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

// Type inference from schemas
export type RequestDocMinimal = z.infer<typeof RequestDocMinimalSchema>;
export type RequestDocFull = z.infer<typeof RequestDocFullSchema>;
export type QuoteValidated = z.infer<typeof QuoteSchema>;
export type IncidentCreate = z.infer<typeof IncidentCreateSchema>;
export type CancellationRequest = z.infer<typeof CancellationRequestSchema>;

