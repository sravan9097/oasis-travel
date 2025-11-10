# Full-Stack Engineer Guide

**Your Role:** Shared Packages (API & Utils)  
**Sections:** 7, 8  
**Duration:** Week 1-3 (5 days total)  
**Dependencies:** Section 8 can start immediately; Section 7 needs Section 4

---

## Overview

You are responsible for shared packages that all apps will use:
1. **Section 8**: Utils Package (2 days) - Date, money, string utilities
2. **Section 7**: API Package (3 days) - Typed Supabase client & contracts

Section 8 can start immediately. Section 7 needs RPC functions (Section 4) complete.

---

## Section 8: Shared Utils Package

### Timeline
- **Start**: Immediately (parallel with Section 1)
- **Duration**: 2 days
- **Blocks**: None (but needed by Sections 9-13)

### Objective
Create utility functions for date formatting, money handling, string manipulation, validation, and feature flags.

---

### Step-by-Step Instructions

#### Day 1: Set Up Package & Core Utils

```bash
cd packages/utils

# Install dependencies
npm install date-fns@^2.30.0
npm install --save-dev @types/node vitest
```

Create `package.json`:
```json
{
  "name": "@oasis/utils",
  "version": "0.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch"
  },
  "dependencies": {
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@types/node": "^20.10.0"
  }
}
```

#### Create Date Utilities

`packages/utils/src/date.ts`:
```typescript
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
```

#### Create Money Utilities

`packages/utils/src/money.ts`:
```typescript
/**
 * Format number as Indian Rupees
 */
export const formatINR = (amount: number, showDecimals: boolean = false): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
};

/**
 * Format number as currency (generic)
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Round money to 2 decimal places
 */
export const roundMoney = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};

/**
 * Calculate percentage of amount
 */
export const percentage = (amount: number, percent: number): number => {
  return roundMoney((amount * percent) / 100);
};

/**
 * Add GST (18% in India)
 */
export const addGST = (amount: number, gstRate: number = 18): number => {
  return roundMoney(amount + percentage(amount, gstRate));
};

/**
 * Format large numbers with K/M suffixes
 */
export const formatCompact = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
};
```

#### Create String Utilities

`packages/utils/src/strings.ts`:
```typescript
/**
 * Truncate string to max length
 */
export const truncate = (str: string, maxLen: number): string => {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
};

/**
 * Convert string to slug (URL-friendly)
 */
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Capitalize first letter
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Capitalize each word
 */
export const titleCase = (str: string): string => {
  return str
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
};

/**
 * Sanitize HTML (basic)
 */
export const sanitize = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Extract initials from name
 */
export const getInitials = (name: string, maxChars: number = 2): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, maxChars);
};

/**
 * Mask phone number (show last 4 digits)
 */
export const maskPhone = (phone: string): string => {
  if (phone.length < 4) return '****';
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
};
```

#### Create Validation Utilities

`packages/utils/src/validation.ts`:
```typescript
/**
 * Validate Indian phone number
 */
export const isValidIndianPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return /^(?:\+91|91)?[6-9]\d{9}$/.test(cleaned);
};

/**
 * Validate international phone number
 */
export const isValidPhone = (phone: string): boolean => {
  return /^\+?[1-9]\d{9,14}$/.test(phone.replace(/\s/g, ''));
};

/**
 * Validate email
 */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validate Indian GSTIN
 */
export const isValidGSTIN = (gstin: string): boolean => {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
};

/**
 * Validate UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

/**
 * Validate URL
 */
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
```

#### Create Feature Flags Utility

`packages/utils/src/feature-flags.ts`:
```typescript
export interface FeatureFlags {
  soft_onboarding: boolean;
  masked_calling: boolean;
  quick_actions: boolean;
  offline_mode: boolean;
}

export const DEFAULT_FLAGS: FeatureFlags = {
  soft_onboarding: true,
  masked_calling: false,
  quick_actions: true,
  offline_mode: true,
};

/**
 * Parse feature flags from admin_settings JSON
 */
export const parseFlags = (json: any): FeatureFlags => {
  if (!json || typeof json !== 'object') {
    return DEFAULT_FLAGS;
  }

  return {
    soft_onboarding: json.soft_onboarding ?? DEFAULT_FLAGS.soft_onboarding,
    masked_calling: json.masked_calling ?? DEFAULT_FLAGS.masked_calling,
    quick_actions: json.quick_actions ?? DEFAULT_FLAGS.quick_actions,
    offline_mode: json.offline_mode ?? DEFAULT_FLAGS.offline_mode,
  };
};

/**
 * Check if feature is enabled
 */
export const isFeatureEnabled = (
  flags: FeatureFlags,
  feature: keyof FeatureFlags
): boolean => {
  return flags[feature] === true;
};
```

#### Create Index Export

`packages/utils/src/index.ts`:
```typescript
export * from './date';
export * from './money';
export * from './strings';
export * from './validation';
export * from './feature-flags';
```

#### Day 2: Write Tests

Create `packages/utils/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
});
```

Create `packages/utils/src/__tests__/money.test.ts`:
```typescript
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
```

Create tests for other modules similarly.

Run tests:
```bash
cd packages/utils
npm test
```

### Deliverables Checklist - Section 8

- [ ] Date utilities (format, relative time, calculations)
- [ ] Money utilities (INR formatting, GST, rounding)
- [ ] String utilities (truncate, slugify, sanitize)
- [ ] Validation utilities (phone, email, GSTIN)
- [ ] Feature flags utility
- [ ] All utilities tested (>80% coverage)
- [ ] Package exports correctly

---

## Section 7: Shared API Package

### Timeline
- **Start**: After Section 4 (RPCs) complete
- **Duration**: 3 days
- **Blocks**: Sections 9, 12, 13

### Objective
Create typed Supabase client with Zod schemas and RPC wrappers for all frontend apps.

---

### Step-by-Step Instructions

#### Day 1: Types & Supabase Client Setup

```bash
cd packages/api

# Install dependencies
npm install @supabase/supabase-js@^2.38.0 zod@^3.22.0
npm install --save-dev @types/node vitest
```

Create `package.json`:
```json
{
  "name": "@oasis/api",
  "version": "0.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "vitest"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0"
  }
}
```

Create `packages/api/src/types.ts`:
```typescript
// Database types (generated from Supabase schema)

export interface Profile {
  id: string;
  role: 'customer' | 'operator' | 'vendor' | 'driver' | 'admin';
  display_name: string;
  phone: string | null;
  email: string | null;
  home_city: string | null;
  lang: string;
  created_at: string;
}

export interface Lead {
  id: string;
  customer_id: string | null;
  guest_session_id: string | null;
  source: string | null;
  stage: 'NEW' | 'SCOPING' | 'QUOTED' | 'WON' | 'LOST';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RequestDoc {
  id: string;
  lead_id: string;
  origin_city: string | null;
  destinations: string[];
  start_date: string | null;
  end_date: string | null;
  nights: number | null;
  pax_adults: number;
  pax_children: number;
  pax_seniors: number;
  budget_min: number | null;
  budget_max: number | null;
  hotel_class: string | null;
  cab_type: string | null;
  interests: string[] | null;
  pace: string | null;
  language: string | null;
  special_needs: string | null;
  capture_mode: string | null;
  created_at: string;
}

export interface Quote {
  id: string;
  lead_id: string;
  version: number;
  parent_quote_id: string | null;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'ARCHIVED';
  total_amount: number;
  currency: string;
  inclusions: string | null;
  exclusions: string | null;
  validity_date: string | null;
  pdf_url: string | null;
  snapshot: any;
  created_by: string | null;
  created_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  day_no: number | null;
  item_type: 'hotel' | 'cab' | 'activity' | 'misc';
  vendor_id: string | null;
  description: string;
  qty: number;
  unit_price: number;
  meta: any;
}

export interface Booking {
  id: string;
  quote_id: string;
  customer_id: string;
  status: 'PENDING_VENDOR_CONFIRM' | 'CONFIRMED' | 'IN_TRIP' | 'COMPLETED' | 'CANCELLED';
  price_snapshot: any;
  created_at: string;
}

export interface Trip {
  id: string;
  booking_id: string;
  title: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface TripPost {
  id: string;
  trip_id: string;
  kind: 'announcement' | 'itinerary' | 'voucher' | 'reminder';
  content: any;
  scheduled_at: string | null;
  posted_at: string | null;
  status: 'SCHEDULED' | 'POSTED' | 'CANCELLED';
  quick_actions: any[];
  created_at: string;
}

export interface Incident {
  id: string;
  trip_id: string;
  created_by: string;
  severity: 'P0' | 'P1' | 'P2';
  category: string | null;
  description: string;
  status: 'OPEN' | 'ACK' | 'RESOLVED' | 'CANCELLED';
  created_at: string;
}
```

#### Day 2: Zod Schemas & Contracts

Create `packages/api/src/contracts.ts`:
```typescript
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

// Type inference from schemas
export type RequestDocMinimal = z.infer<typeof RequestDocMinimalSchema>;
export type RequestDocFull = z.infer<typeof RequestDocFullSchema>;
export type QuoteValidated = z.infer<typeof QuoteSchema>;
export type IncidentCreate = z.infer<typeof IncidentCreateSchema>;
```

#### Day 3: Supabase Client & RPC Wrappers

Create `packages/api/src/client.ts`:
```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RequestDocMinimalSchema, IncidentCreateSchema } from './contracts';
import type { Lead, Quote, Booking, Trip, TripPost, Incident } from './types';

let supabase: SupabaseClient;

/**
 * Initialize Supabase client
 */
export const initSupabase = (url: string, key: string): SupabaseClient => {
  supabase = createClient(url, key);
  return supabase;
};

/**
 * Get Supabase client instance
 */
export const getSupabase = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Supabase not initialized. Call initSupabase() first.');
  }
  return supabase;
};

// ======================
// RPC WRAPPERS
// ======================

/**
 * Create lead from guest session
 */
export const rpcCreateLeadFromGuest = async (
  guestSessionId: string,
  minimalRequest: unknown
): Promise<string> => {
  const validated = RequestDocMinimalSchema.parse(minimalRequest);

  const { data, error } = await supabase.rpc('rpc_create_lead_from_guest', {
    p_guest_session_id: guestSessionId,
    p_minimal_request: validated,
  });

  if (error) throw error;
  return data as string; // lead_id
};

/**
 * Merge guest session to authenticated user
 */
export const rpcMergeGuestToUser = async (guestSessionId: string): Promise<void> => {
  const { error } = await supabase.rpc('rpc_merge_guest_to_user', {
    p_guest_session_id: guestSessionId,
  });

  if (error) throw error;
};

/**
 * Send quote (freeze snapshot)
 */
export const rpcSendQuote = async (quoteId: string): Promise<void> => {
  const { error } = await supabase.rpc('rpc_send_quote', {
    p_quote_id: quoteId,
  });

  if (error) throw error;
};

/**
 * Accept quote → create booking
 */
export const rpcAcceptQuote = async (quoteId: string): Promise<string> => {
  const { data, error } = await supabase.rpc('rpc_accept_quote', {
    p_quote_id: quoteId,
  });

  if (error) throw error;
  return data as string; // booking_id
};

/**
 * Raise incident
 */
export const rpcRaiseIncident = async (
  tripId: string,
  severity: 'P0' | 'P1' | 'P2',
  category: string,
  description: string
): Promise<string> => {
  const validated = IncidentCreateSchema.parse({
    trip_id: tripId,
    severity,
    category,
    description,
  });

  const { data, error } = await supabase.rpc('rpc_raise_incident', {
    p_trip_id: validated.trip_id,
    p_severity: validated.severity,
    p_category: validated.category,
    p_description: validated.description,
  });

  if (error) throw error;
  return data as string; // incident_id
};

/**
 * Record trip post action (quick action)
 */
export const rpcRecordPostAction = async (
  postId: string,
  actionId: string,
  payload?: any
): Promise<string> => {
  const { data, error } = await supabase.rpc('rpc_record_post_action', {
    p_post_id: postId,
    p_action_id: actionId,
    p_payload: payload || null,
  });

  if (error) throw error;
  return data as string; // ack_id
};

// ======================
// POSTGREST QUERIES
// ======================

/**
 * Get leads for current user
 */
export const getLeads = async (): Promise<Lead[]> => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Lead[];
};

/**
 * Get quotes for a lead
 */
export const getQuotes = async (leadId: string): Promise<Quote[]> => {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, quote_items(*)')
    .eq('lead_id', leadId)
    .order('version', { ascending: false });

  if (error) throw error;
  return data as Quote[];
};

/**
 * Get bookings for current user
 */
export const getBookings = async (): Promise<Booking[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Booking[];
};

/**
 * Get trips for current user
 */
export const getTrips = async (): Promise<Trip[]> => {
  const { data, error } = await supabase
    .from('trips')
    .select('*, trip_members!inner(*)')
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data as Trip[];
};

/**
 * Get trip posts for a trip
 */
export const getTripPosts = async (tripId: string): Promise<TripPost[]> => {
  const { data, error } = await supabase
    .from('trip_posts')
    .select('*')
    .eq('trip_id', tripId)
    .eq('status', 'POSTED')
    .order('posted_at', { ascending: false });

  if (error) throw error;
  return data as TripPost[];
};

/**
 * Get incidents for a trip
 */
export const getIncidents = async (tripId: string): Promise<Incident[]> => {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Incident[];
};

/**
 * Get signed URL for storage object
 */
export const getSignedUrl = async (
  bucket: string,
  path: string,
  ttl: number = 300
): Promise<string> => {
  const { data, error } = await supabase.rpc('rpc_sign_url', {
    p_bucket: bucket,
    p_path: path,
    p_ttl_seconds: ttl,
  });

  if (error) throw error;
  return data as string;
};
```

Create `packages/api/src/index.ts`:
```typescript
export * from './types';
export * from './contracts';
export * from './client';
```

#### Write Tests

Create `packages/api/src/__tests__/contracts.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { RequestDocMinimalSchema } from '../contracts';

describe('API Contracts', () => {
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
});
```

### Deliverables Checklist - Section 7

- [ ] Complete TypeScript types for all tables
- [ ] Zod schemas for all input DTOs
- [ ] Supabase client initialized
- [ ] RPC wrappers for all functions
- [ ] PostgREST query helpers
- [ ] Tests validating schemas
- [ ] Package exports correctly

---

## Handoff

Once both sections complete:

**To Mobile Engineers**: "API and Utils packages ready. You can import `@oasis/api` and `@oasis/utils` in mobile app."

**To Frontend Engineers**: "API and Utils packages ready for console and vendor portal."

Provide usage examples:
```typescript
// In any app
import { initSupabase, rpcCreateLeadFromGuest, getLeads } from '@oasis/api';
import { formatINR, formatDate } from '@oasis/utils';

// Initialize
initSupabase(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create lead
const leadId = await rpcCreateLeadFromGuest('guest-123', {
  destinations: ['Udaipur'],
  nights: 4,
  pax_adults: 2,
});

// Format data
const price = formatINR(5000);
const date = formatDate(new Date());
```

---

## Success Criteria

✅ Section 8 Complete When:
- All utility functions work correctly
- Tests pass with >80% coverage
- Mobile/web engineers can import and use

✅ Section 7 Complete When:
- All RPC functions have typed wrappers
- Zod schemas validate inputs
- Mobile/web engineers can make API calls
- Type errors caught at compile time

