# @oasis/api

Typed Supabase client and API wrappers for the Oasis Travel platform.

## Installation

```bash
npm install @oasis/api
```

## Usage

```typescript
import {
  initSupabase,
  rpcCreateLeadFromGuest,
  getLeads,
  getQuotes,
  generateQuotePDF,
} from '@oasis/api';

// Initialize Supabase client
initSupabase(SUPABASE_URL, SUPABASE_ANON_KEY);

// Create lead from guest session
const leadId = await rpcCreateLeadFromGuest('guest-123', {
  destinations: ['Udaipur'],
  nights: 4,
  pax_adults: 2,
});

// Get leads
const leads = await getLeads();

// Get quotes for a lead
const quotes = await getQuotes(leadId);

// Generate PDF for a quote (edge function)
await generateQuotePDF(quoteId);
```

## Modules

- **types.ts**: TypeScript interfaces for all database tables
- **contracts.ts**: Zod schemas for input validation
- **client.ts**: Supabase client initialization, RPC wrappers, and PostgREST queries
- **edge-functions.ts**: Edge function client helpers

## RPC Functions

All RPC functions are typed and validated:

### Lead Management
- `rpcCreateLeadFromGuest` - Create lead from guest session
- `rpcMergeGuestToUser` - Merge guest data to authenticated user
- `rpcUpdateLeadStage` - Update lead stage

### Quote Management
- `rpcSendQuote` - Send quote (freeze snapshot)
- `rpcAcceptQuote` - Accept quote and create booking
- `rpcCreateQuoteVersion` - Create new quote version from parent

### Booking Management
- `rpcConfirmBookingIfReady` - Confirm booking when all vouchers uploaded
- `rpcUploadVoucher` - Upload voucher for a booking
- `rpcSubmitCancellation` - Submit cancellation request

### Trip Management
- `rpcCreateTripFromBooking` - Create trip from confirmed booking
- `rpcRaiseIncident` - Raise incident for a trip
- `rpcRecordPostAction` - Record trip post action (quick action)

### Storage
- `rpcSignUrl` - Generate signed URL for storage object

## Edge Functions

Helper functions for calling Supabase Edge Functions:

- `generateQuotePDF(quoteId)` - Generate PDF for a quote
- `triggerSchedulerPostRunner()` - Trigger scheduler (usually called by cron)
- `triggerSLAMonitor()` - Trigger SLA monitor (usually called by cron)
- `triggerRecapGenerator()` - Trigger recap generator (usually called by cron)

## PostgREST Queries

Helper functions for common queries:

### Leads & Quotes
- `getLeads()` - Get all leads for current user
- `getLead(leadId)` - Get lead by ID
- `getRequestDoc(leadId)` - Get request doc for a lead
- `getQuotes(leadId)` - Get quotes for a lead
- `getQuote(quoteId)` - Get quote by ID

### Bookings & Trips
- `getBookings()` - Get bookings for current user
- `getBooking(bookingId)` - Get booking by ID
- `getTrips()` - Get trips for current user
- `getTrip(tripId)` - Get trip by ID
- `getTripPosts(tripId)` - Get trip posts
- `getTripMembers(tripId)` - Get trip members
- `getIncidents(tripId)` - Get incidents for a trip

### Vendor & PO
- `getPOs(bookingId)` - Get POs for a booking
- `getVendorPOs()` - Get POs for current vendor
- `getPO(poId)` - Get PO by ID
- `getVouchers(bookingId)` - Get vouchers for a booking
- `getVendor(vendorId)` - Get vendor by ID
- `getRatePlans(vendorId)` - Get rate plans for a vendor

### Profile
- `getProfile()` - Get profile for current user

## Tests

Run tests with:

```bash
npm test
```

