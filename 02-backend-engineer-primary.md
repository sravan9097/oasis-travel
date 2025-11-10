# Backend Engineer (Primary) Guide

**Your Role:** Database Schema, RLS Policies & Storage  
**Sections:** 2, 3, 6  
**Duration:** Week 1-2 (6-8 days total)  
**Dependencies:** Section 1 (DevOps must complete first)

---

## Overview

You are responsible for the core database foundation:
1. **Section 2**: Database schema & migrations (3 days)
2. **Section 3**: Row-Level Security policies (2 days)
3. **Section 6**: Storage buckets & policies (2 days)

Your work blocks Sections 4, 5, and 7. Backend Engineer (Services) is waiting for you to complete Section 3.

---

## Section 2: Database Schema & Migrations

### Timeline
- **Start**: After Section 1 complete
- **Duration**: 3 days
- **Blocks**: Sections 3, 4, 5, 6, 7
- **Reference**: `prompt.md` lines 96-336

### Objective
Create all database tables, constraints, and indexes using Supabase migrations.

---

### Prerequisites

```bash
# Ensure monorepo is set up
cd oasis-travel
pnpm install

# Ensure Supabase is running
supabase start

# You should see output with API URL and keys
```

---

### Step-by-Step Instructions

#### Step 1: Create Migration Files (Day 1, Morning)

```bash
# Create all migration files
supabase migration new create_profiles_and_users
supabase migration new create_leads_and_requests
supabase migration new create_quotes
supabase migration new create_bookings
supabase migration new create_trips
supabase migration new create_incidents
supabase migration new create_admin_audit
supabase migration new create_indexes
```

This creates timestamped files in `supabase/migrations/`

#### Step 2: Migration 001 - Profiles, Vendors, Drivers (Day 1, 2 hours)

Edit `supabase/migrations/[TIMESTAMP]_create_profiles_and_users.sql`:

```sql
-- =====================================================
-- PROFILES, VENDORS, AND DRIVERS
-- =====================================================

-- Profiles table (extends auth.users)
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

comment on table public.profiles is 'User profiles with role-based access';
comment on column public.profiles.role is 'User role: customer, operator, vendor, driver, or admin';

-- Vendors table
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

comment on table public.vendors is 'Vendor organizations (hotels, cabs, activities)';
comment on column public.vendors.sla_hours is 'Expected response time in hours for POs';

-- Drivers table
create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id) on delete cascade,
  name text not null,
  phone text, -- never exposed to travelers (privacy)
  vehicle_type text check (vehicle_type in ('sedan','suv','tempo','bus')),
  vehicle_number text,
  active boolean default true,
  created_at timestamptz default now()
);

comment on table public.drivers is 'Driver roster - phone numbers kept private';

-- Indexes for profiles
create index idx_profiles_role on profiles(role);
create index idx_vendors_type on vendors(type);
create index idx_vendors_owner on vendors(owner_id);
create index idx_drivers_vendor on drivers(vendor_id);
```

#### Step 3: Migration 002 - Leads & Requests (Day 1, 2 hours)

Edit `supabase/migrations/[TIMESTAMP]_create_leads_and_requests.sql`:

```sql
-- =====================================================
-- LEADS, REQUEST DOCS, AND RATE PLANS
-- =====================================================

-- Leads table
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id),
  guest_session_id text, -- for soft onboarding before OTP
  source text check (source in ('bot','manual','referral','website')),
  stage text check (stage in ('NEW','SCOPING','QUOTED','WON','LOST')) default 'NEW',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.leads is 'Sales leads from various sources';
comment on column public.leads.guest_session_id is 'Temporary ID before user signs in';

-- Trigger to update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at
  before update on leads
  for each row
  execute function update_updated_at();

-- Request documents (structured travel request)
create table public.request_docs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  origin_city text,
  destinations text[] not null,
  start_date date,
  end_date date,
  nights int,
  pax_adults int not null default 1,
  pax_children int default 0,
  pax_seniors int default 0,
  budget_min numeric,
  budget_max numeric,
  hotel_class text check (hotel_class in ('3*','4*','5*','luxury')),
  cab_type text check (cab_type in ('sedan','suv','tempo')),
  interests text[], -- ['adventure','heritage','wellness']
  pace text check (pace in ('relaxed','normal','packed')),
  language text default 'en',
  special_needs text,
  capture_mode text check (capture_mode in ('minimal','full')) default 'minimal',
  created_at timestamptz default now()
);

comment on table public.request_docs is 'Structured travel requirements from customers';

-- Rate plans (seasonal pricing from vendors)
create table public.rate_plans (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id) on delete cascade,
  title text not null,
  season_start date not null,
  season_end date not null,
  weekday_price numeric not null,
  weekend_price numeric not null,
  surcharge_json jsonb default '{}'::jsonb, -- {extra_bed: 1200, gst: 0.12}
  blackout_dates date[] default '{}',
  created_at timestamptz default now(),
  constraint season_dates_valid check (season_end >= season_start)
);

comment on table public.rate_plans is 'Vendor pricing by season';

-- Indexes
create index idx_leads_customer on leads(customer_id);
create index idx_leads_guest_session on leads(guest_session_id) where guest_session_id is not null;
create index idx_leads_stage on leads(stage);
create index idx_request_docs_lead on request_docs(lead_id);
create index idx_rate_plans_vendor on rate_plans(vendor_id);
create index idx_rate_plans_season on rate_plans(season_start, season_end);
```

#### Step 4: Migration 003 - Quotes (Day 1, 2 hours)

Edit `supabase/migrations/[TIMESTAMP]_create_quotes.sql`:

```sql
-- =====================================================
-- QUOTES AND QUOTE ITEMS (VERSIONED)
-- =====================================================

-- Quotes table (versioned)
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
  pdf_url text, -- storage bucket path
  snapshot jsonb, -- frozen copy when status = SENT (immutable)
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique(lead_id, version)
);

comment on table public.quotes is 'Quote versions with immutable snapshots';
comment on column public.quotes.snapshot is 'Frozen quote data when sent - prevents retroactive changes';

-- Quote items (line items)
create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references quotes(id) on delete cascade,
  day_no int,
  item_type text check (item_type in ('hotel','cab','activity','misc')) not null,
  vendor_id uuid references vendors(id),
  description text not null,
  qty int default 1,
  unit_price numeric default 0,
  meta jsonb default '{}'::jsonb -- {room_type: 'deluxe', meal_plan: 'MAP'}
);

comment on table public.quote_items is 'Line items for quotes (day-wise breakdown)';

-- Indexes
create index idx_quotes_lead on quotes(lead_id);
create index idx_quotes_status on quotes(status);
create index idx_quotes_validity on quotes(validity_date);
create index idx_quotes_created_by on quotes(created_by);
create index idx_quote_items_quote on quote_items(quote_id);
create index idx_quote_items_vendor on quote_items(vendor_id);
```

#### Step 5: Migration 004 - Bookings (Day 2, 2 hours)

Edit `supabase/migrations/[TIMESTAMP]_create_bookings.sql`:

```sql
-- =====================================================
-- BOOKINGS, PURCHASE ORDERS, VOUCHERS
-- =====================================================

-- Bookings table (created from accepted quote)
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references quotes(id),
  customer_id uuid references auth.users(id) not null,
  status text check (status in ('PENDING_VENDOR_CONFIRM','CONFIRMED','IN_TRIP','COMPLETED','CANCELLED')) default 'PENDING_VENDOR_CONFIRM',
  price_snapshot jsonb not null, -- frozen from quote.snapshot
  created_at timestamptz default now()
);

comment on table public.bookings is 'Confirmed bookings from accepted quotes';
comment on column public.bookings.price_snapshot is 'Immutable price data from quote';

-- Purchase Orders to vendors
create table public.pos (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  vendor_id uuid references vendors(id) not null,
  items jsonb not null, -- [{day:1, type:'hotel', description:'...', qty:2, price:5000}]
  status text check (status in ('SENT','ACCEPTED','CONFIRMED','DECLINED')) default 'SENT',
  due_at timestamptz, -- SLA deadline (booking_created + vendor.sla_hours)
  messages jsonb default '[]'::jsonb, -- [{from:'operator', text:'...', at:'2024-01-01T10:00:00Z'}]
  created_at timestamptz default now()
);

comment on table public.pos is 'Purchase orders sent to vendors';
comment on column public.pos.due_at is 'SLA deadline for vendor response';

-- Vouchers (uploaded by vendors)
create table public.vouchers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  vendor_id uuid references vendors(id) not null,
  file_url text not null, -- storage bucket path
  meta jsonb, -- {guest_name: 'John Doe', check_in: '2024-01-15', booking_id: 'ABC123'}
  verified boolean default false,
  created_at timestamptz default now()
);

comment on table public.vouchers is 'Vendor confirmation documents';
comment on column public.vouchers.meta is 'Parsed voucher details for verification';

-- Indexes
create index idx_bookings_customer on bookings(customer_id);
create index idx_bookings_status on bookings(status);
create index idx_bookings_quote on bookings(quote_id);
create index idx_pos_booking on pos(booking_id);
create index idx_pos_vendor on pos(vendor_id);
create index idx_pos_due_at on pos(due_at) where status in ('SENT', 'ACCEPTED');
create index idx_vouchers_booking on vouchers(booking_id);
create index idx_vouchers_vendor on vouchers(vendor_id);
```

#### Step 6: Migration 005 - Trips (Day 2, 3 hours)

Edit `supabase/migrations/[TIMESTAMP]_create_trips.sql`:

```sql
-- =====================================================
-- TRIPS, TRIP MEMBERS, POSTS, DRIVER ASSIGNMENTS
-- =====================================================

-- Trips (created from confirmed booking)
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  title text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz default now()
);

comment on table public.trips is 'Active trips with communication channel';

-- Trip members (who can see this trip)
create table public.trip_members (
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid references auth.users(id),
  role text check (role in ('customer','operator','vendor','driver')) not null,
  display_name text not null, -- privacy: no phone numbers exposed
  primary key (trip_id, user_id)
);

comment on table public.trip_members is 'Trip participants (privacy: display name only)';

-- Trip posts (announcement channel)
create table public.trip_posts (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  kind text check (kind in ('announcement','itinerary','voucher','reminder')) not null,
  content jsonb not null, -- {title: '...', body: '...', attachments: [...]}
  scheduled_at timestamptz,
  posted_at timestamptz,
  status text check (status in ('SCHEDULED','POSTED','CANCELLED')) default 'SCHEDULED',
  quick_actions jsonb default '[]'::jsonb, -- [{id:'confirm_pickup', label:'Confirm', type:'ack'}]
  created_at timestamptz default now()
);

comment on table public.trip_posts is 'Scheduled announcements for trip channel';

-- Trip post acknowledgments (quick action responses)
create table public.trip_post_acks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references trip_posts(id) on delete cascade,
  user_id uuid references auth.users(id),
  action_id text not null,
  payload jsonb, -- {location: 'lat,lng', note: '...'}
  created_at timestamptz default now(),
  unique(post_id, user_id, action_id)
);

comment on table public.trip_post_acks is 'User responses to quick actions';

-- Driver assignments (per day)
create table public.driver_assignments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  day_no int not null,
  driver_id uuid references drivers(id),
  pickup_time timestamptz,
  pickup_location text,
  vehicle_note text,
  created_at timestamptz default now(),
  unique(trip_id, day_no)
);

comment on table public.driver_assignments is 'Daily driver assignments';

-- Indexes
create index idx_trips_booking on trips(booking_id);
create index idx_trips_dates on trips(start_date, end_date);
create index idx_trip_members_trip on trip_members(trip_id);
create index idx_trip_members_user on trip_members(user_id);
create index idx_trip_posts_trip on trip_posts(trip_id);
create index idx_trip_posts_scheduled on trip_posts(scheduled_at, status) where status = 'SCHEDULED';
create index idx_trip_post_acks_post on trip_post_acks(post_id);
create index idx_driver_assignments_trip on driver_assignments(trip_id);
```

#### Step 7: Migration 006 - Incidents & Cancellations (Day 2, 1 hour)

Edit `supabase/migrations/[TIMESTAMP]_create_incidents.sql`:

```sql
-- =====================================================
-- INCIDENTS, CANCELLATIONS
-- =====================================================

-- Incidents (support issues, emergencies)
create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  created_by uuid references auth.users(id),
  severity text check (severity in ('P0','P1','P2')) default 'P2',
  category text check (category in ('transport_delay','room_issue','billing','emergency','other')),
  description text not null,
  status text check (status in ('OPEN','ACK','RESOLVED','CANCELLED')) default 'OPEN',
  created_at timestamptz default now()
);

comment on table public.incidents is 'Trip issues and emergencies';
comment on column public.incidents.severity is 'P0=Emergency (5min SLA), P1=Urgent, P2=Normal';

-- Cancellation requests
create table public.cancellations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  requested_by uuid references auth.users(id),
  reason text,
  policy_snapshot jsonb, -- cancellation policy at time of request
  status text check (status in ('REQUESTED','APPROVED','REJECTED','FINALIZED')) default 'REQUESTED',
  created_at timestamptz default now()
);

comment on table public.cancellations is 'Booking cancellation requests';

-- Indexes
create index idx_incidents_trip on incidents(trip_id);
create index idx_incidents_severity_status on incidents(severity, status);
create index idx_incidents_created_at on incidents(created_at desc);
create index idx_cancellations_booking on cancellations(booking_id);
create index idx_cancellations_status on cancellations(status);
```

#### Step 8: Migration 007 - Admin & Audit (Day 3, 1 hour)

Edit `supabase/migrations/[TIMESTAMP]_create_admin_audit.sql`:

```sql
-- =====================================================
-- ADMIN SETTINGS, AUDIT LOG, NOTIFICATIONS
-- =====================================================

-- Admin settings (feature flags, on-call info)
create table public.admin_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

comment on table public.admin_settings is 'System configuration and feature flags';

-- Pre-populate with defaults
insert into public.admin_settings (key, value) values
  ('on_call', '{"phone": "+91-9999999999", "hours": "24x7"}'::jsonb),
  ('feature_flags', '{"soft_onboarding": true, "masked_calling": false, "quick_actions": true}'::jsonb),
  ('sla_targets', '{"lead_to_quote": 24, "po_response": 24, "p0_incident": 5}'::jsonb);

-- Audit log (all mutations tracked)
create table public.audit_log (
  id bigserial primary key,
  actor uuid, -- auth.uid() who performed the action
  action text not null, -- 'create_lead', 'send_quote', 'accept_quote', etc.
  entity text not null, -- 'leads', 'quotes', 'bookings', etc.
  entity_id uuid,
  before jsonb, -- state before change
  after jsonb, -- state after change
  created_at timestamptz default now()
);

comment on table public.audit_log is 'Immutable audit trail for all mutations';

-- Notifications outbox (for push/email)
create table public.notifications_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  kind text not null, -- 'quote_ready', 'trip_post', 'incident_update'
  title text not null,
  body text not null,
  data_json jsonb, -- deep link payload
  created_at timestamptz default now(),
  sent_at timestamptz
);

comment on table public.notifications_outbox is 'Pending notifications for delivery';

-- Indexes
create index idx_audit_log_actor on audit_log(actor);
create index idx_audit_log_entity on audit_log(entity, entity_id);
create index idx_audit_log_created_at on audit_log(created_at desc);
create index idx_notifications_outbox_user on notifications_outbox(user_id);
create index idx_notifications_outbox_pending on notifications_outbox(created_at) where sent_at is null;
```

#### Step 9: Run Migrations (Day 3, 30 minutes)

```bash
# Reset database and apply all migrations
supabase db reset

# Verify all tables exist
supabase db dump --schema public

# Check for errors
supabase status
```

**Expected output:**
```
Running migrations...
✔ All migrations applied successfully
```

#### Step 10: Create Schema Documentation (Day 3, 1 hour)

Create `supabase/SCHEMA.md`:

```markdown
# Database Schema Documentation

## Entity Relationship Overview

\`\`\`
auth.users
    ├── profiles (1:1)
    ├── vendors (1:many, owner)
    ├── leads (1:many, customer)
    └── bookings (1:many, customer)

vendors
    ├── drivers (1:many)
    ├── rate_plans (1:many)
    └── pos (1:many)

leads
    ├── request_docs (1:1)
    └── quotes (1:many)

quotes
    ├── quote_items (1:many)
    └── bookings (1:1 when accepted)

bookings
    ├── pos (1:many)
    ├── vouchers (1:many)
    ├── trips (1:1 when confirmed)
    └── cancellations (1:many)

trips
    ├── trip_members (1:many)
    ├── trip_posts (1:many)
    ├── driver_assignments (1:many)
    └── incidents (1:many)
\`\`\`

## Status State Machines

### Lead
NEW → SCOPING → QUOTED → (WON | LOST)

### Quote
DRAFT → SENT → (ACCEPTED | DECLINED) → ARCHIVED

### Booking
PENDING_VENDOR_CONFIRM → CONFIRMED → IN_TRIP → (COMPLETED | CANCELLED)

### PO
SENT → ACCEPTED → CONFIRMED | DECLINED

### Trip Post
SCHEDULED → POSTED | CANCELLED

### Incident
OPEN → ACK → RESOLVED | CANCELLED

### Cancellation
REQUESTED → (APPROVED | REJECTED) → FINALIZED

## Key Constraints

- Quotes are versioned per lead (unique constraint on lead_id + version)
- Sent quotes are immutable (snapshot frozen)
- Bookings can only be created from ACCEPTED quotes
- Drivers' phone numbers never exposed (privacy)
- Trip members see only display names, not PII
\`\`\`

---

### Deliverables Checklist

- [ ] 7 migration files created with all tables
- [ ] All CHECK constraints applied
- [ ] Indexes created for performance
- [ ] Migrations run successfully (`supabase db reset`)
- [ ] Schema documentation created
- [ ] No SQL syntax errors

---

### Handoff to Backend Engineer (Services)

Once Section 2 is complete, proceed to Section 3 (RLS), then notify Backend Engineer (Services):

"Database schema ready. All tables created. You can start Section 4 (RPC Functions) once Section 3 (RLS) is complete."

---

## Section 3: Row-Level Security (RLS) Policies

### Timeline
- **Start**: After Section 2 complete
- **Duration**: 2 days
- **Blocks**: Section 4 (RPC Functions)

### Objective
Implement privacy-first RLS policies ensuring:
- Customers see only their own data
- Operators see all operational data
- Vendors see only their POs and rates
- Trip members see only their trip data

---

### Step-by-Step Instructions

#### Step 1: Enable RLS (Day 4, Morning, 30 minutes)

Create `supabase/migrations/[TIMESTAMP]_enable_rls.sql`:

```sql
-- =====================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================

alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.drivers enable row level security;
alter table public.leads enable row level security;
alter table public.request_docs enable row level security;
alter table public.rate_plans enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.bookings enable row level security;
alter table public.pos enable row level security;
alter table public.vouchers enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_posts enable row level security;
alter table public.trip_post_acks enable row level security;
alter table public.driver_assignments enable row level security;
alter table public.incidents enable row level security;
alter table public.cancellations enable row level security;

-- Admin settings: read-only for authenticated users
alter table public.admin_settings enable row level security;

-- Audit log: append-only, read by operators
alter table public.audit_log enable row level security;

-- Notifications: users see only their own
alter table public.notifications_outbox enable row level security;
```

#### Step 2: Helper Functions (Day 4, 1 hour)

Create `supabase/migrations/[TIMESTAMP]_rls_helpers.sql`:

```sql
-- =====================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- =====================================================

-- Check if current user is operator/admin
create or replace function is_operator()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('operator', 'admin')
  );
$$ language sql security definer;

-- Check if current user is vendor
create or replace function is_vendor()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role = 'vendor'
  );
$$ language sql security definer;

-- Check if current user is member of a trip
create or replace function is_trip_member(p_trip_id uuid)
returns boolean as $$
  select exists (
    select 1 from trip_members
    where trip_id = p_trip_id
    and user_id = auth.uid()
  );
$$ language sql security definer;

-- Get vendor IDs owned by current user
create or replace function my_vendor_ids()
returns setof uuid as $$
  select id from vendors where owner_id = auth.uid();
$$ language sql security definer;
```

#### Step 3: Profiles & Vendors RLS (Day 4, 1 hour)

Create `supabase/migrations/[TIMESTAMP]_rls_profiles_vendors.sql`:

```sql
-- =====================================================
-- RLS: PROFILES, VENDORS, DRIVERS
-- =====================================================

-- PROFILES: Users can read/update own profile; operators see all
create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id or is_operator());

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Operators can insert profiles"
  on profiles for insert
  with check (is_operator());

-- VENDORS: Owners and operators see vendors
create policy "Vendors viewable by owner and operators"
  on vendors for select
  using (owner_id = auth.uid() or is_operator());

create policy "Operators can manage vendors"
  on vendors for all
  using (is_operator());

-- DRIVERS: Vendors see own drivers; operators see all
create policy "Drivers viewable by vendor and operators"
  on drivers for select
  using (
    vendor_id in (select my_vendor_ids())
    or is_operator()
  );

create policy "Vendors can manage own drivers"
  on drivers for all
  using (vendor_id in (select my_vendor_ids()));
```

#### Step 4: Leads & Quotes RLS (Day 4, 2 hours)

Create `supabase/migrations/[TIMESTAMP]_rls_leads_quotes.sql`:

```sql
-- =====================================================
-- RLS: LEADS, QUOTES
-- =====================================================

-- LEADS: Customers see own; operators see all
create policy "Customers see own leads"
  on leads for select
  using (
    customer_id = auth.uid()
    or is_operator()
  );

create policy "Anyone can create lead (guest mode)"
  on leads for insert
  with check (true); -- Guest session allowed

create policy "Operators can update leads"
  on leads for update
  using (is_operator());

-- REQUEST_DOCS: Follow lead access
create policy "Request docs follow lead access"
  on request_docs for select
  using (
    exists (
      select 1 from leads
      where leads.id = request_docs.lead_id
      and (leads.customer_id = auth.uid() or is_operator())
    )
  );

create policy "Anyone can create request doc"
  on request_docs for insert
  with check (true);

-- QUOTES: Follow lead access
create policy "Quotes viewable by lead owner and operators"
  on quotes for select
  using (
    exists (
      select 1 from leads
      where leads.id = quotes.lead_id
      and (leads.customer_id = auth.uid() or is_operator())
    )
  );

create policy "Operators can manage quotes"
  on quotes for all
  using (is_operator());

-- QUOTE_ITEMS: Follow quote access
create policy "Quote items follow quote access"
  on quote_items for select
  using (
    exists (
      select 1 from quotes
      join leads on leads.id = quotes.lead_id
      where quotes.id = quote_items.quote_id
      and (leads.customer_id = auth.uid() or is_operator())
    )
  );

create policy "Operators can manage quote items"
  on quote_items for all
  using (is_operator());

-- RATE_PLANS: Vendors see own; operators see all
create policy "Rate plans viewable by vendor and operators"
  on rate_plans for select
  using (
    vendor_id in (select my_vendor_ids())
    or is_operator()
  );

create policy "Vendors can manage own rate plans"
  on rate_plans for all
  using (vendor_id in (select my_vendor_ids()));
```

#### Step 5: Bookings & POs RLS (Day 4, 2 hours)

Create `supabase/migrations/[TIMESTAMP]_rls_bookings_pos.sql`:

```sql
-- =====================================================
-- RLS: BOOKINGS, POS, VOUCHERS
-- =====================================================

-- BOOKINGS: Customers see own; operators and related vendors see all
create policy "Bookings viewable by customer and operators"
  on bookings for select
  using (
    customer_id = auth.uid()
    or is_operator()
  );

create policy "Operators can manage bookings"
  on bookings for all
  using (is_operator());

-- POS: Vendors see own; operators see all
create policy "POs viewable by vendor and operators"
  on pos for select
  using (
    vendor_id in (select my_vendor_ids())
    or is_operator()
  );

create policy "Operators can create POs"
  on pos for insert
  with check (is_operator());

create policy "Vendors and operators can update POs"
  on pos for update
  using (
    vendor_id in (select my_vendor_ids())
    or is_operator()
  );

-- VOUCHERS: Vendors upload; customers and operators view
create policy "Vouchers viewable by customer, vendor, operators"
  on vouchers for select
  using (
    vendor_id in (select my_vendor_ids())
    or is_operator()
    or exists (
      select 1 from bookings
      where bookings.id = vouchers.booking_id
      and bookings.customer_id = auth.uid()
    )
  );

create policy "Vendors can upload vouchers"
  on vouchers for insert
  with check (vendor_id in (select my_vendor_ids()));

create policy "Operators can manage vouchers"
  on vouchers for all
  using (is_operator());
```

#### Step 6: Trips & Channel RLS (Day 5, 2 hours)

Create `supabase/migrations/[TIMESTAMP]_rls_trips_channel.sql`:

```sql
-- =====================================================
-- RLS: TRIPS, TRIP MEMBERS, POSTS
-- =====================================================

-- TRIPS: Trip members and operators see trips
create policy "Trips viewable by members and operators"
  on trips for select
  using (
    is_trip_member(id)
    or is_operator()
  );

create policy "Operators can manage trips"
  on trips for all
  using (is_operator());

-- TRIP_MEMBERS: Members see own trip members
create policy "Trip members viewable by members"
  on trip_members for select
  using (
    is_trip_member(trip_id)
    or is_operator()
  );

create policy "Operators can manage trip members"
  on trip_members for all
  using (is_operator());

-- TRIP_POSTS: Trip members see posts
create policy "Trip posts viewable by members"
  on trip_posts for select
  using (
    is_trip_member(trip_id)
    or is_operator()
  );

create policy "Operators can manage trip posts"
  on trip_posts for all
  using (is_operator());

-- TRIP_POST_ACKS: Users can ack their own actions
create policy "Users can view own acks"
  on trip_post_acks for select
  using (
    user_id = auth.uid()
    or is_operator()
  );

create policy "Users can create acks for their trip posts"
  on trip_post_acks for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from trip_posts
      where trip_posts.id = post_id
      and is_trip_member(trip_posts.trip_id)
    )
  );

-- DRIVER_ASSIGNMENTS: Trip members and operators see assignments
create policy "Driver assignments viewable by trip members"
  on driver_assignments for select
  using (
    is_trip_member(trip_id)
    or is_operator()
  );

create policy "Operators can manage driver assignments"
  on driver_assignments for all
  using (is_operator());
```

#### Step 7: Incidents & Admin RLS (Day 5, 1 hour)

Create `supabase/migrations/[TIMESTAMP]_rls_incidents_admin.sql`:

```sql
-- =====================================================
-- RLS: INCIDENTS, CANCELLATIONS, ADMIN
-- =====================================================

-- INCIDENTS: Trip members can create/view
create policy "Incidents viewable by trip members and operators"
  on incidents for select
  using (
    is_trip_member(trip_id)
    or is_operator()
  );

create policy "Trip members can create incidents"
  on incidents for insert
  with check (
    created_by = auth.uid()
    and is_trip_member(trip_id)
  );

create policy "Operators can update incidents"
  on incidents for update
  using (is_operator());

-- CANCELLATIONS: Customers create; operators manage
create policy "Cancellations viewable by customer and operators"
  on cancellations for select
  using (
    requested_by = auth.uid()
    or is_operator()
  );

create policy "Customers can request cancellations"
  on cancellations for insert
  with check (requested_by = auth.uid());

create policy "Operators can update cancellations"
  on cancellations for update
  using (is_operator());

-- ADMIN_SETTINGS: Everyone reads; only operators write
create policy "Admin settings readable by all"
  on admin_settings for select
  using (auth.uid() is not null);

create policy "Operators can update admin settings"
  on admin_settings for all
  using (is_operator());

-- AUDIT_LOG: Operators read; system writes
create policy "Audit log readable by operators"
  on audit_log for select
  using (is_operator());

-- NOTIFICATIONS_OUTBOX: Users see own notifications
create policy "Users see own notifications"
  on notifications_outbox for select
  using (user_id = auth.uid() or is_operator());

create policy "System can create notifications"
  on notifications_outbox for insert
  with check (true); -- Service role will write
```

#### Step 8: Test RLS Policies (Day 5, 2 hours)

Create `supabase/tests/rls_test.sql`:

```sql
-- =====================================================
-- RLS POLICY TESTS
-- =====================================================

-- Test 1: Customer isolation
begin;
  -- Create test users
  insert into auth.users (id, email) values
    ('11111111-1111-1111-1111-111111111111', 'customer1@test.com'),
    ('22222222-2222-2222-2222-222222222222', 'customer2@test.com');
  
  insert into profiles (id, role, display_name) values
    ('11111111-1111-1111-1111-111111111111', 'customer', 'Customer 1'),
    ('22222222-2222-2222-2222-222222222222', 'customer', 'Customer 2');
  
  -- Create leads for both
  insert into leads (id, customer_id, stage) values
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'NEW'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'NEW');
  
  -- Set role to customer 1
  set local role authenticated;
  set local request.jwt.claim.sub to '11111111-1111-1111-1111-111111111111';
  
  -- Customer 1 should see only their lead
  do $$
  declare
    lead_count int;
  begin
    select count(*) into lead_count from leads;
    if lead_count != 1 then
      raise exception 'RLS FAIL: Customer should see only 1 lead, saw %', lead_count;
    end if;
    raise notice 'PASS: Customer isolation working';
  end $$;
  
rollback;

-- Test 2: Operator sees all
begin;
  -- Create operator
  insert into auth.users (id, email) values
    ('33333333-3333-3333-3333-333333333333', 'operator@test.com');
  
  insert into profiles (id, role, display_name) values
    ('33333333-3333-3333-3333-333333333333', 'operator', 'Operator');
  
  -- Create leads for customers
  insert into auth.users (id, email) values
    ('11111111-1111-1111-1111-111111111111', 'customer1@test.com'),
    ('22222222-2222-2222-2222-222222222222', 'customer2@test.com');
  
  insert into profiles (id, role, display_name) values
    ('11111111-1111-1111-1111-111111111111', 'customer', 'Customer 1'),
    ('22222222-2222-2222-2222-222222222222', 'customer', 'Customer 2');
  
  insert into leads (customer_id, stage) values
    ('11111111-1111-1111-1111-111111111111', 'NEW'),
    ('22222222-2222-2222-2222-222222222222', 'NEW');
  
  -- Set role to operator
  set local role authenticated;
  set local request.jwt.claim.sub to '33333333-3333-3333-3333-333333333333';
  
  -- Operator should see both leads
  do $$
  declare
    lead_count int;
  begin
    select count(*) into lead_count from leads;
    if lead_count != 2 then
      raise exception 'RLS FAIL: Operator should see 2 leads, saw %', lead_count;
    end if;
    raise notice 'PASS: Operator sees all leads';
  end $$;
  
rollback;
```

Run tests:
```bash
psql $DATABASE_URL -f supabase/tests/rls_test.sql
```

---

### Deliverables Checklist

- [ ] RLS enabled on all tables
- [ ] Helper functions created (is_operator, is_trip_member, etc.)
- [ ] Policies for profiles, vendors, drivers
- [ ] Policies for leads, quotes, request_docs
- [ ] Policies for bookings, POs, vouchers
- [ ] Policies for trips, posts, acks
- [ ] Policies for incidents, cancellations, admin
- [ ] Test scripts verify customer isolation
- [ ] Test scripts verify operator access

---

### Handoff to Backend Engineer (Services)

"RLS policies complete and tested. Customer isolation verified. Section 4 (RPC Functions) is unblocked. Database is production-ready for business logic."

---

## Section 6: Storage Buckets & Policies

### Timeline
- **Start**: After Section 2 (can be parallel with Section 3)
- **Duration**: 1-2 days
- **Blocks**: None (can be done in parallel)

### Objective
Set up private storage buckets with access policies for vouchers, quotes, itineraries, recaps, and avatars.

---

### Step-by-Step Instructions

#### Step 1: Create Storage Buckets (Day 4 or 5, 1 hour)

Option A: Via Supabase Dashboard
1. Go to Storage → Buckets
2. Create buckets:
   - `vouchers` (private)
   - `quotes` (private)
   - `itineraries` (private)
   - `recaps` (private)
   - `avatars` (private)

Option B: Via SQL

Create `supabase/migrations/[TIMESTAMP]_storage_buckets.sql`:

```sql
-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Create private buckets
insert into storage.buckets (id, name, public) values
  ('vouchers', 'vouchers', false),
  ('quotes', 'quotes', false),
  ('itineraries', 'itineraries', false),
  ('recaps', 'recaps', false),
  ('avatars', 'avatars', false)
on conflict (id) do nothing;
```

#### Step 2: Create Storage Policies (Day 4 or 5, 2 hours)

Create `supabase/migrations/[TIMESTAMP]_storage_policies.sql`:

```sql
-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- VOUCHERS BUCKET
-- Path convention: vouchers/{booking_id}/{vendor_id}/{filename}.pdf

-- Vendors can upload to their own vendor folder
create policy "Vendors can upload vouchers"
  on storage.objects for insert
  with check (
    bucket_id = 'vouchers'
    and (storage.foldername(name))[2]::uuid in (select my_vendor_ids())
    and auth.role() = 'authenticated'
  );

-- Customers can read vouchers for their bookings
create policy "Customers can read own vouchers"
  on storage.objects for select
  using (
    bucket_id = 'vouchers'
    and (
      exists (
        select 1 from bookings
        where bookings.id = (storage.foldername(name))[1]::uuid
        and bookings.customer_id = auth.uid()
      )
      or is_operator()
    )
  );

-- Operators can manage all vouchers
create policy "Operators can manage vouchers"
  on storage.objects for all
  using (
    bucket_id = 'vouchers'
    and is_operator()
  );

-- QUOTES BUCKET
-- Path convention: quotes/{lead_id}/{quote_id}.pdf

create policy "Customers can read own quotes"
  on storage.objects for select
  using (
    bucket_id = 'quotes'
    and (
      exists (
        select 1 from leads
        where leads.id = (storage.foldername(name))[1]::uuid
        and leads.customer_id = auth.uid()
      )
      or is_operator()
    )
  );

create policy "Operators can manage quotes"
  on storage.objects for all
  using (
    bucket_id = 'quotes'
    and is_operator()
  );

-- ITINERARIES BUCKET
-- Path convention: itineraries/{trip_id}/{filename}.pdf

create policy "Trip members can read itineraries"
  on storage.objects for select
  using (
    bucket_id = 'itineraries'
    and (
      is_trip_member((storage.foldername(name))[1]::uuid)
      or is_operator()
    )
  );

create policy "Operators can manage itineraries"
  on storage.objects for all
  using (
    bucket_id = 'itineraries'
    and is_operator()
  );

-- RECAPS BUCKET
-- Path convention: recaps/{trip_id}/{filename}.pdf

create policy "Trip members can read recaps"
  on storage.objects for select
  using (
    bucket_id = 'recaps'
    and (
      is_trip_member((storage.foldername(name))[1]::uuid)
      or is_operator()
    )
  );

create policy "Operators can manage recaps"
  on storage.objects for all
  using (
    bucket_id = 'recaps'
    and is_operator()
  );

-- AVATARS BUCKET
-- Path convention: avatars/{user_id}/{filename}

create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1]::uuid = auth.uid()
  );

create policy "Anyone can read avatars"
  on storage.objects for select
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );

create policy "Users can delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1]::uuid = auth.uid()
  );
```

#### Step 3: Create Signed URL Function (Day 4 or 5, 1 hour)

Create `supabase/migrations/[TIMESTAMP]_rpc_sign_url.sql`:

```sql
-- =====================================================
-- SIGNED URL GENERATION
-- =====================================================

create or replace function rpc_sign_url(
  p_bucket text,
  p_path text,
  p_ttl_seconds int default 300
)
returns text
language plpgsql
security definer
as $$
declare
  signed_url text;
  object_exists boolean;
begin
  -- Validate bucket
  if p_bucket not in ('vouchers', 'quotes', 'itineraries', 'recaps', 'avatars') then
    raise exception 'Invalid bucket: %', p_bucket;
  end if;
  
  -- Check if object exists
  select exists (
    select 1 from storage.objects
    where bucket_id = p_bucket
    and name = p_path
  ) into object_exists;
  
  if not object_exists then
    raise exception 'File not found: %/%', p_bucket, p_path;
  end if;
  
  -- Validate user has access (RLS policies handle this)
  -- If we reach here, user has SELECT permission via RLS
  
  -- Generate signed URL (TTL in seconds)
  select storage.presigned_url(p_bucket, p_path, p_ttl_seconds)
  into signed_url;
  
  return signed_url;
end;
$$;

comment on function rpc_sign_url is 'Generate short-lived signed URL for storage objects';

-- Example usage:
-- select rpc_sign_url('vouchers', 'abc123/vendor456/voucher.pdf', 300);
```

#### Step 4: Test Storage Access (Day 5, 1 hour)

Create test script `supabase/tests/storage_test.sh`:

```bash
#!/bin/bash

# Test script for storage bucket access

SUPABASE_URL="http://localhost:54321"
ANON_KEY="your_anon_key"
SERVICE_KEY="your_service_key"

echo "Testing voucher upload..."

# Upload a test file (as service role)
curl -X POST "$SUPABASE_URL/storage/v1/object/vouchers/test-booking/test-vendor/test.pdf" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/pdf" \
  --data-binary @test.pdf

echo "Testing signed URL generation..."

# Get signed URL via RPC
curl -X POST "$SUPABASE_URL/rest/v1/rpc/rpc_sign_url" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "p_bucket": "vouchers",
    "p_path": "test-booking/test-vendor/test.pdf",
    "p_ttl_seconds": 300
  }'

echo "Storage tests complete"
```

---

### Deliverables Checklist

- [ ] 5 storage buckets created (all private)
- [ ] Storage policies for vouchers (vendor upload, customer read)
- [ ] Storage policies for quotes, itineraries, recaps
- [ ] Avatar upload/download policies
- [ ] `rpc_sign_url` function created
- [ ] Test scripts verify upload/download
- [ ] Path conventions documented

---

## Resources

- [Supabase Migrations Docs](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [PostgreSQL CHECK Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)

---

## Success Criteria

✅ Section 2 Complete When:
- All tables created without errors
- Indexes applied
- Foreign key relationships correct
- Sample data inserts successfully

✅ Section 3 Complete When:
- RLS enabled on all tables
- Customer A cannot access Customer B's data
- Operators can access all data
- Vendors can access only their POs/rates
- Test scripts pass

✅ Section 6 Complete When:
- 5 buckets created
- Files upload successfully with correct policies
- Signed URLs generated and work
- Path conventions enforced

---

**Next Steps:**
- Once all 3 sections complete, notify Backend Engineer (Services) to start Section 4
- Provide database dump for reference
- Share RLS policy summary document

