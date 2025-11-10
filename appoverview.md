High-level architecture

Mobile (Customer): React Native (Expo, TypeScript)

Web – Operator Console: Next.js (App Router, TypeScript)

Web – Vendor Mini-Portal: Next.js (separate app or multi-tenant routes)

Backend: Supabase (already specified) exposing PostgREST + RPC + Edge Functions

Push: Expo Notifications (mobile), email for web fallbacks

Auth: Supabase Auth (phone/email OTP); guest mode on mobile, merge at OTP

Storage: Supabase Storage (private buckets, signed URLs)

Monorepo structure (TurboRepo)
yaatra/
  apps/
    mobile/           # Expo RN app (customers)
    console/          # Next.js operator console
    vendor/           # Next.js vendor portal (or merge into console as /vendor)
  packages/
    ui/               # Shared UI kit (RN + web via Tamagui/React Native Web) or radix-ui for web
    api/              # Typed API client (zod contracts, RPC wrappers)
    utils/            # Date, money, formatting, feature flags
    config/           # ESLint, TS, Prettier, env helpers
  supabase/           # migrations, seed, edge functions (from backend prompt)


Why: single source of truth for types/contracts, faster dev, consistent UX.

Environment & config

Env management: .env.local per app; never commit secrets

Feature flags: simple JSON in admin_settings (soft_onboarding, masked_calling, quick_actions)

Runtime secrets: Supabase anon key (client), service role only in edge functions

Shared types & API contracts (package: api/)

Define zod schemas & typed wrappers for all user-facing RPCs:

// api/src/contracts.ts
import { z } from "zod";

export const RequestDocMinimal = z.object({
  destinations: z.array(z.string()).min(1),
  nights: z.number().int().positive(),
  pax_adults: z.number().int().min(1),
});

export const Quote = z.object({
  id: z.string().uuid(),
  version: z.number().int(),
  status: z.enum(["DRAFT","SENT","ACCEPTED","DECLINED","ARCHIVED"]),
  total_amount: z.number(),
  validity_date: z.string(), // ISO date
  items: z.array(z.object({
    day_no: z.number().int(),
    item_type: z.enum(["hotel","cab","activity","misc"]),
    vendor_id: z.string().uuid().nullable(),
    description: z.string(),
    qty: z.number().int(),
    unit_price: z.number()
  }))
});

// api/src/client.ts
export async function rpcCreateLeadFromGuest(guestId: string, req: unknown) { /* ... */ }
export async function rpcSendQuote(quoteId: string) { /* ... */ }
export async function rpcAcceptQuote(quoteId: string) { /* ... */ }
// etc.


Use this package in mobile and web to reduce drift.

Mobile app (Expo RN) — Customer
Navigation map

Auth stack: Welcome/Guest → OTP → Merge guest

Tabs: Home, Quotes, My Trips, Support

Nested flows:

Plan a Trip (Bot): 3-step core → “Customize” accordion

Quote Details: version list + Compare v1/v2

Trip: Dayboard, Vouchers, Trip Channel (announcement feed with Quick Actions)

Emergency: sheet with on-call contact, P0 incident

Screens & components

Welcome (Guest mode)

Browse samples; “Get a quick estimate” (no OTP)

CTA “Save this plan” → OTP gate

Plan a Trip (Bot)

BotMessage, QuickReplyChips, StepperHeader

Local form state via react-hook-form + zod

On submit → rpc_create_lead_from_guest

Quotes

QuoteCard (status, validity, total)

Detail shows daywise items, inclusions/exclusions

Compare View: diff badges (“3★ → 4★ +₹5,000”)

Actions: Accept, Ask Changes, Decline

Accept → rpc_accept_quote → creates Booking

My Trip

Dayboard: per day cards (time, notes, map pin)

Vouchers: file cards with “view/download” (signed URL)

Trip Channel: AnnouncementCard with buttons (Quick Actions: Confirm pickup / Need help)

Driver Card: name, vehicle; Call Operator (or Masked Call if enabled)

Support & Emergency

Categories (delay, room, billing, other) → rpc_raise_incident

Emergency sheet: “We respond in ≤5 mins”; taps call on-call; inserts P0 incident

State & data

Server cache: @tanstack/react-query for RPCs, PostgREST lists

Global state: lightweight zustand (session, flags)

Offline: cache Trip (itinerary + vouchers) with expo-file-system; show “offline copy” badge

Error handling: toast + retry; incident creation for P0 errors

Push notifications

Register with expo-notifications

Poll notifications_outbox (or integrate later with server push)

Handle deep links to Quote/Trip/Channel

Theming & accessibility

UI kit: react-native-paper or tamagui (bonus: RN Web reuse)

Font scaling, contrast, large tap areas, Hindi labels ready

Operator console (Next.js)
App structure (App Router)
/login
/leads                     # Inbox board (New/Scoping/Quoted/Won/Lost)
/leads/[id]                # Lead detail + RequestDoc + chat notes
/quotes/[id]               # Quote editor (builder)
/bookings/[id]             # Unified Trip Workspace (tabs)
/vendors                   # Vendor list
/vendors/[id]              # Rates, drivers, POs
/alerts                    # SLA breaches, incidents
/admin                     # Settings (on-call, flags)

Unified Trip Workspace tabs

Overview: status chips, timers (voucher missing, driver unassigned), timeline

Quote: snapshot view, version list, Create v2 button

Vendors: POs, due timers, Accept/Decline status, Suggest alternate

Comms: Trip Channel posts (create/edit/schedule), quick-action results

Docs: vouchers list, upload/verify checklist (guest name, dates, code)

Issues: incidents list, macros (“late driver”, “overbooking”), internal notes

Key components

Board (Kanban) for Leads

RateTableEditor with season rows (date range, weekday/weekend)

QuoteBuilder:

Day timeline → add items (hotel/cab/activity)

Price preview (from rate_plans + markup)

Generate PDF (calls edge pdf_generate_quote)

TripChannelComposer: template list (Welcome, Driver, Day Brief), schedule picker

SLAIndicator: counts down to PO due_at, color states

IncidentPanel: filters by severity; assign owner; status changes

Data fetching

Use Server Components for lists where possible (SSR for speed)

Client components with react-query for mutations/live updates

Websocket/polling for SLA timers & incidents (poll every 30–60s)

Vendor portal (Next.js)

Auth: Supabase Auth; vendor users tied to vendors.owner_id

Routes

/login

/orders (POs list: status, due timer)

/orders/[id] (Accept/Decline, message thread, Upload voucher)

/rates (Season editor + CSV import)

/drivers (manage driver roster)

Voucher upload

File to vouchers bucket → rpc_upload_voucher(booking_id, vendor_id, path, meta)

Show checklist (guest name, dates, booking id); block “Confirm” until valid

Implementation step-by-step
Step 1 — Bootstraps & wiring (2–3 days)

Create monorepo via TurboRepo; scaffold Expo + Next.js apps

Install shared packages; set up api/ client (Supabase JS + zod)

Hook Supabase project URL and anon key; verify RLS read on public lookups only

Step 2 — Auth & Guest (2–3 days)

Mobile: guest session (UUID) in SecureStore; call rpc_create_lead_from_guest

OTP flow → call rpc_merge_guest_to_user

Web: standard OTP login; role guard (operator, vendor)

Step 3 — Intake & Leads (3–4 days)

Mobile bot (3-step core + “Customize” accordion) → create lead + request_doc

Console /leads board; /leads/[id] detail with notes

SLA “time to first quote” timer on lead

Step 4 — Quotes (5–7 days)

Console QuoteBuilder with rate plan pulls

Send Quote → edge pdf_generate_quote, snapshot, status= SENT

Mobile quotes list/detail; Compare versions (diff UI)

Actions: Accept / Ask changes / Decline (RPCs)

Step 5 — Booking & POs (5–7 days)

rpc_accept_quote → create booking snapshot

Console Vendors tab: create POs, due timers, messages

Vendor portal: orders list, accept/decline, voucher upload + checklist

Edge sla_monitor → /alerts page for operators

Step 6 — Trip & Channel (5–7 days)

rpc_confirm_booking_if_ready → create trip, members, seed scheduled posts

Edge scheduler_post_runner → posts & notification outbox

Mobile Trip screen: Dayboard, Vouchers, Trip Channel with Quick Actions (Confirm pickup / Need help)

Console Comms tab: create/schedule posts; see quick-action aggregates

Step 7 — Support, Emergency, Cancellation (3–4 days)

Mobile Support forms → rpc_raise_incident

Emergency sheet → P0 incident + call on-call; SLA in copy

Mobile Cancel trip → rpc_submit_cancellation; operator approve/reject

Step 8 — Recap & polish (3–4 days)

Edge recap_generator → store & show in Past Trips

Perf tuning, skeleton states, error toasts

Accessibility checks; Hindi labels (basic)

Offline, caching, and resilience

Mobile:

Cache: react-query with 5–10 min stale times for quotes/leads

Persist last active trip (itinerary + vouchers) to disk; fallback read when offline

Queue quick-actions/incidents offline and retry on reconnect

Web:

Use optimistic updates where safe (PO messages)

Polling for SLA/incident changes

Security & privacy specifics

Never display phone numbers in Trip Channel; show display_name from trip_members

Driver numbers not shown to customers; “Call Operator” or masked call (later)

Signed URLs with short TTL (60–300s) for vouchers/quotes

Enforce RLS and verify with integration tests

Audit RPC mutations to audit_log (actor, entity, before/after)

Analytics & events

Client events:

lead_started, lead_submitted, quote_viewed, quote_compared, quote_accepted

voucher_viewed, trip_channel_ack, incident_created, emergency_pressed

Server metrics:

Lead→first quote time, Quote→accept rate, PO SLA breaches, time-to-voucher, message delivery/read

Tooling: Mixpanel or PostHog (self-hosted) + simple SQL dashboards in Supabase

Testing strategy

Unit: UI components (RN Testing Library, React Testing Library)

Contract tests: zod schemas validate API responses

Integration:

Auth & RLS (customer cannot read others’ rows)

Quote immutability after SENT

Booking confirm only when vouchers uploaded

Trip post scheduler marks POSTED and creates outbox entries

E2E:

Mobile: Detox/ Maestro for intake → quote → accept → view trip

Web: Playwright for console flows and vendor voucher upload

CI/CD

Mobile: Expo EAS Build; Internal Testing track (Android) & TestFlight (iOS)

Web: Vercel for console & vendor portal; Preview deploys per PR

Checks: typecheck, lint, unit tests, lightweight e2e on PR

Env promotion: Dev → Staging → Pilot (separate Supabase projects)

UX specifics & ready-made copy

Soft onboarding banner: “Look around first — sign in when you’re ready to save your trip.”

Quote waiting micro-updates: “Scouting stays… Comparing cabs… Finalising your plan…”

Offline payments note: “Payments are handled outside the app via your travel expert (UPI/Bank Transfer).”

Emergency: “We’ll respond within 5 minutes. For medical emergencies, call 112.”