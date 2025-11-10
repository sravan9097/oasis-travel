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

