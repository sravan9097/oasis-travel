Primary objective

Build a privacy-first backend that powers:

Lead intake (bot or manual) → structured RequestDoc

Quote creation with versioning + immutable snapshots

Booking coordination (POs to vendors, voucher uploads)

Trip Channels (announcement-only) with scheduled posts and quick actions

Driver assignment & trip sheets

Incident reporting & emergency escalation

Soft onboarding (guest to OTP merge)

Out of scope: online payments, invoices, loyalty/wallet.

Platform & tooling (required)

Supabase: Postgres + Auth + Storage + RLS + Edge Functions + Cron

Language: TypeScript (Deno for Edge Functions)

DB: PostgreSQL 15+

Auth: Supabase Auth (OTP via phone/email)

Storage buckets: vouchers, quotes, itineraries, recaps, avatars

Migrations: SQL migrations in supabase/migrations

API: PostgREST (CRUD) + RPC (SQL functions) for complex actions

Scheduler: Supabase Cron (edge function invocations)

Observability: Edge function structured logs, DB audit tables

Testing: SQL tests (pgTAP if available) + HTTP e2e tests (Deno scripts)

Security & privacy principles (must implement)

RLS ON for all tables (except public lookup).

Customers can access only their leads/quotes/bookings/trips.

Vendors can access only their POs/rates/Voucher uploads.

Trip Channels: members see posts but never other members’ PII (no phone numbers).

Files private by default; access via signed URLs with short TTL.

Audit trail: write to audit_log on any mutating RPC.

Core domain & status machines
Lead

NEW → SCOPING → QUOTED → WON | LOST

Quote (versioned)

DRAFT → SENT → ACCEPTED | DECLINED → ARCHIVED

Sent quotes are immutable snapshots (line items frozen).

Booking

PENDING_VENDOR_CONFIRM → CONFIRMED → IN_TRIP → COMPLETED | CANCELLED

Created only from an ACCEPTED Quote.

Purchase Order (PO) to vendor

SENT → ACCEPTED → CONFIRMED | DECLINED

Voucher required before vendor status becomes CONFIRMED.

Trip Channel Post

SCHEDULED → POSTED → CANCELLED

Quick actions produce acks or incidents.

Cancellation request

REQUESTED → APPROVED | REJECTED → FINALIZED


Database schema (create these tables)

Create verbatim (rename only if needed for conventions).


-- Users & roles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('customer','operator','vendor','driver','admin')) not null,
  display_name text not null,
  phone text,
  email text,
  home_city text,
  lang text default 'en',
  created_at timestamptz default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id),
  type text check (type in ('hotel','cab','activity','guide')) not null,
  name text not null,
  gstin text,
  contact_phone text,
  contact_email text,
  sla_hours int default 24,
  active boolean default true,
  created_at timestamptz default now()
);

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id) on delete cascade,
  name text not null,
  phone text, -- never exposed to other travelers
  vehicle_type text, -- 'sedan','suv','tempo'
  vehicle_number text,
  active boolean default true,
  created_at timestamptz default now()
);

-- Leads & request docs
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id),
  guest_session_id text, -- for soft onboarding
  source text, -- 'bot','manual','referral'
  stage text check (stage in ('NEW','SCOPING','QUOTED','WON','LOST')) default 'NEW',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.request_docs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  origin_city text,
  destinations text[], -- ['Udaipur','Mount Abu']
  start_date date,
  end_date date,
  nights int,
  pax_adults int,
  pax_children int,
  pax_seniors int,
  budget_min numeric,
  budget_max numeric,
  hotel_class text, -- '3*','4*','5*'
  cab_type text,
  interests text[], -- tags
  pace text, -- 'relaxed','normal','packed'
  language text, -- 'en','hi'
  special_needs text,
  capture_mode text, -- 'minimal'|'full'
  created_at timestamptz default now()
);

-- Rate plans
create table public.rate_plans (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id) on delete cascade,
  title text,
  season_start date,
  season_end date,
  weekday_price numeric, -- net
  weekend_price numeric, -- net
  surcharge_json jsonb default '{}'::jsonb, -- {extra_bed: 1200}
  blackout_dates date[],
  created_at timestamptz default now()
);

-- Quotes (versioned)
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  version int not null,
  parent_quote_id uuid references quotes(id),
  status text check (status in ('DRAFT','SENT','ACCEPTED','DECLINED','ARCHIVED')) default 'DRAFT',
  total_amount numeric default 0,
  currency text default 'INR',
  inclusions text,
  exclusions text,
  validity_date date,
  pdf_url text, -- storage reference
  snapshot jsonb, -- frozen copy when SENT
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique(lead_id, version)
);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references quotes(id) on delete cascade,
  day_no int,
  item_type text check (item_type in ('hotel','cab','activity','misc')),
  vendor_id uuid references vendors(id),
  description text,
  qty int default 1,
  unit_price numeric default 0,
  meta jsonb default '{}'::jsonb
);

-- Booking (snapshot from accepted quote)
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references quotes(id),
  customer_id uuid references auth.users(id),
  status text check (status in ('PENDING_VENDOR_CONFIRM','CONFIRMED','IN_TRIP','COMPLETED','CANCELLED')) default 'PENDING_VENDOR_CONFIRM',
  price_snapshot jsonb not null,
  created_at timestamptz default now()
);

-- POs to vendors
create table public.pos (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  vendor_id uuid references vendors(id),
  items jsonb not null, -- [{day:1,type:'hotel',...}]
  status text check (status in ('SENT','ACCEPTED','CONFIRMED','DECLINED')) default 'SENT',
  due_at timestamptz, -- SLA deadline
  messages jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- Vouchers (files)
create table public.vouchers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  vendor_id uuid references vendors(id),
  file_url text not null, -- storage path
  meta jsonb, -- parsed values: {guest_name, dates, booking_id}
  verified boolean default false,
  created_at timestamptz default now()
);

-- Trip & channel
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  title text,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

create table public.trip_members (
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid references auth.users(id),
  role text check (role in ('customer','operator','vendor','driver')) not null,
  display_name text not null,
  primary key (trip_id, user_id)
);

create table public.trip_posts (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  kind text check (kind in ('announcement','itinerary','voucher','reminder')) not null,
  content jsonb not null, -- structured content, links, buttons
  scheduled_at timestamptz,
  posted_at timestamptz,
  status text check (status in ('SCHEDULED','POSTED','CANCELLED')) default 'SCHEDULED',
  quick_actions jsonb default '[]'::jsonb -- [{id:'confirm_pickup',label:'Confirm'}]
);

create table public.trip_post_acks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references trip_posts(id) on delete cascade,
  user_id uuid references auth.users(id),
  action_id text,
  payload jsonb,
  created_at timestamptz default now(),
  unique(post_id, user_id, action_id)
);

-- Driver assignment
create table public.driver_assignments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  day_no int,
  driver_id uuid references drivers(id),
  pickup_time timestamptz,
  pickup_location text,
  vehicle_note text,
  created_at timestamptz default now()
);

-- Incidents & emergency
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  created_by uuid references auth.users(id),
  severity text check (severity in ('P0','P1','P2')) default 'P2',
  category text, -- 'transport_delay','room_issue','emergency'
  description text,
  status text check (status in ('OPEN','ACK','RESOLVED','CANCELLED')) default 'OPEN',
  created_at timestamptz default now()
);

-- Cancellation requests
create table public.cancellations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  requested_by uuid references auth.users(id),
  reason text,
  policy_snapshot jsonb,
  status text check (status in ('REQUESTED','APPROVED','REJECTED','FINALIZED')) default 'REQUESTED',
  created_at timestamptz default now()
);

-- Admin settings (on-call etc.)
create table public.admin_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Audit
create table public.audit_log (
  id bigserial primary key,
  actor uuid,
  action text,
  entity text,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz default now()
);


Edge functions (TypeScript / Deno)

pdf_generate_quote

Input: quote_id

Pull snapshot, render HTML→PDF, store in quotes bucket, update quotes.pdf_url.

scheduler_post_runner (Cron: every minute)

Find trip_posts where status='SCHEDULED' AND scheduled_at <= now()

Post them (mark POSTED + timestamp), enqueue pushes (via Supabase push integration or webhook to Expo server you’ll set later).

Write audit.

sla_monitor (Cron: every 15 min)

Find POs where status='SENT' or 'ACCEPTED' and now() > due_at

Mark breach flag and create operator alert (row in ops_alerts or send email).

recap_generator (Cron: daily)

For trips that ended yesterday and not yet recapped, compile simple recap HTML/PDF, store in recaps, link to user.

webhook_post_ack_action (optional)

When trip_post_acks inserted, evaluates quick action semantics (e.g., confirm pickup → set an ack flag; request change → incident).

All edge functions must validate caller (service role or checked secret) and write to audit_log.

Storage buckets & policies

Buckets: vouchers, quotes, itineraries, recaps, avatars → private.

Use rpc_sign_url to create short-lived links.

Enforce path conventions: vouchers/{booking_id}/{vendor_id}/{uuid}.pdf.

Notifications (plumbing only)

Create notifications_outbox table with rows {id, user_id, kind, title, body, data_json, created_at, sent_at}.

Edge functions append here; frontend push worker (later) picks them up.

For now, mark as TODO; keep schema ready.

Operator “Unified Trip Workspace” support

Implement a view or materialized view vw_trip_workspace joining booking, POs, vouchers, driver assignments, incidents, next scheduled post, SLA flags.

This powers the web console without N+1 queries.

Soft onboarding (guest → user merge)

On app start, allow creating lead with guest_session_id.

When user completes OTP, call rpc_merge_guest_to_user(guest_session_id):

Attach all leads to customer_id; remove guest_session_id; keep history.

Cancellation flow

Customer calls rpc_submit_cancellation.

Operator approves/rejects by updating cancellations.status.

If approved → set booking CANCELLED, post update to Trip Channel.

Emergency escalation

Admin sets admin_settings key on_call = { phone: "+91...", hours: "24x7" }.

incidents.severity='P0' insertion triggers immediate alert to operator (outbox row).

SLA note in copy handled by frontend; backend timestamps provide audit.

Acceptance tests (must pass)

RLS – Customer isolation: User A cannot select User B’s lead/quote/booking/trip.

Quote immutability: After rpc_send_quote, updating quote_items doesn’t change quotes.snapshot.

Accept→Booking: rpc_accept_quote creates booking with frozen price_snapshot; status is PENDING_VENDOR_CONFIRM.

PO SLA: PO with due_at < now() appears in SLA monitor and raises an alert row.

Voucher verify: rpc_upload_voucher with missing guest_name in meta fails validation (or flags verified=false).

Confirm readiness: rpc_confirm_booking_if_ready sets booking CONFIRMED only if all mandatory vendors have vouchers.

Trip posts schedule: Inserting a trip_posts with scheduled_at=now() is picked by scheduler_post_runner and marked POSTED.

Quick actions: rpc_record_post_action creates trip_post_acks and for an action request_change it creates an incident.

Guest merge: Lead created with guest_session_id becomes owned by customer_id after merge; references remain valid.

Cancellation: Submitting cancellation creates a row; operator updates to APPROVED → booking becomes CANCELLED.

Seed data (for local/staging)

2 operators, 1 admin, 3 customers, 3 vendors (hotel, cab, activity).

4 rate plans (weekday/weekend, simple seasons).

One sample lead→quote (SENT)→booking pipeline with sample vouchers (PDF stubs).

Performance & indexes

Create indexes for:

quotes(lead_id), quotes(status), quotes(validity_date)

bookings(customer_id), bookings(status)

pos(booking_id), pos(vendor_id), pos(due_at)

trip_posts(trip_id, scheduled_at, status)

trip_members(trip_id, user_id)

incidents(trip_id, severity, status)

P95 target for RPCs: < 300 ms under typical loads.

Deliverables

SQL migrations (schema + RLS + indexes).

RPC definitions (sql files) with validation and error messages.

4 Edge Functions (pdf_generate_quote, scheduler_post_runner, sla_monitor, recap_generator).

Storage policy scripts + path helpers.

Seed script (supabase seed) for local dev.

README with:

Env setup, service keys, running cron, testing commands

Table ownership model, RLS summary

API examples (curl) for each RPC

Troubleshooting & known limitations

Example API calls (curl)
# create lead as guest
curl -X POST "$SUPABASE_URL/rest/v1/rpc/rpc_create_lead_from_guest" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" \
  -d '{"guest_session_id":"abc123","minimal_request":{"destinations":["Udaipur"],"nights":4,"adults":2}}'

# send quote
curl -X POST "$SUPABASE_URL/rest/v1/rpc/rpc_send_quote" \
  -H "apikey: $SERVICE" -H "Authorization: Bearer $SERVICE" \
  -H "Content-Type: application/json" \
  -d '{"quote_id":"<uuid>"}'

# accept quote -> booking
curl -X POST "$SUPABASE_URL/rest/v1/rpc/rpc_accept_quote" \
  -H "apikey: $USER" -H "Authorization: Bearer $USER" \
  -H "Content-Type: application/json" \
  -d '{"quote_id":"<uuid>"}'

Non-functional requirements

Reliability: idempotent RPCs (use ON CONFLICT DO NOTHING where applicable).

Auditing: all RPCs write to audit_log with before/after.

Localization: keep content fields neutral; copy lives in frontend.

GDPR-like: ability to export a customer’s bookings/trips on demand (SQL view).

Backups: rely on Supabase PITR; document restore steps.

Stretch (nice-to-have if time remains)

Basic diff endpoint: rpc_quote_diff(q1 uuid, q2 uuid) returning changed fields with +/- deltas.

OCR stub for voucher meta extraction (regex over PDF text if trivial).

Materialized vw_trip_workspace refreshed on write triggers.
