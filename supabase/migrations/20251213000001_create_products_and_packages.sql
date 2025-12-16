-- =====================================================
-- PRODUCTS AND DESTINATION PACKAGES FOR AI BOT
-- =====================================================
-- This migration creates tables for vendor products and
-- curated destination packages used by the AI chatbot
-- to generate quote suggestions.

-- Products table for vendor inventory
create table public.products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id) on delete cascade,
  name text not null,
  category text check (category in ('room','package','activity','transfer','meal')) not null,
  description text,
  base_price numeric not null default 0,
  currency text default 'INR',
  images text[] default '{}',
  availability_json jsonb default '{}'::jsonb, -- {dates_available: [], capacity: 10, min_nights: 1}
  meta jsonb default '{}'::jsonb, -- {room_type: 'deluxe', meal_plan: 'MAP', inclusions: [...]}
  destination text, -- city/region where product is offered
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.products is 'Vendor inventory items available for booking';
comment on column public.products.availability_json is 'Availability calendar and capacity info';
comment on column public.products.meta is 'Category-specific metadata (room_type, meal_plan, etc.)';

-- Create trigger for updated_at
create trigger products_updated_at
  before update on products
  for each row
  execute function update_updated_at();

-- Destination packages for curated offerings
create table public.destination_packages (
  id uuid primary key default gen_random_uuid(),
  destination text not null,
  title text not null,
  description text,
  nights int not null,
  base_price numeric not null default 0,
  currency text default 'INR',
  hotel_class text check (hotel_class in ('3*','4*','5*','luxury')),
  cab_type text check (cab_type in ('sedan','suv','tempo')),
  inclusions text[] default '{}', -- ['Breakfast', 'Transfers', 'Sightseeing']
  exclusions text[] default '{}', -- ['Airfare', 'Personal expenses']
  highlights text[] default '{}', -- ['Visit Taj Mahal', 'Boat ride on Lake Pichola']
  itinerary_json jsonb default '[]'::jsonb, -- [{day: 1, title: "Arrival", activities: [...]}]
  images text[] default '{}',
  valid_from date,
  valid_until date,
  max_pax int default 6,
  tags text[] default '{}', -- ['romantic', 'adventure', 'family', 'honeymoon']
  popularity_score int default 0, -- for sorting recommendations
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.destination_packages is 'Curated travel packages for AI bot suggestions';
comment on column public.destination_packages.itinerary_json is 'Day-wise itinerary breakdown';
comment on column public.destination_packages.popularity_score is 'Used for ranking in suggestions';

-- Create trigger for updated_at
create trigger destination_packages_updated_at
  before update on destination_packages
  for each row
  execute function update_updated_at();

-- Package components linking products to packages
create table public.package_components (
  id uuid primary key default gen_random_uuid(),
  package_id uuid references destination_packages(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  vendor_id uuid references vendors(id) on delete set null,
  day_no int, -- which day of the itinerary
  component_type text check (component_type in ('hotel','cab','activity','meal','transfer','guide')) not null,
  description text not null,
  quantity int default 1,
  unit_price numeric default 0, -- override price for this package
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

comment on table public.package_components is 'Links products/vendors to destination packages';

-- Draft quotes table for AI-generated suggestions pending approval
create table public.draft_quotes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  package_id uuid references destination_packages(id) on delete set null,
  suggested_items jsonb not null default '[]'::jsonb, -- AI-generated line items
  total_amount numeric default 0,
  currency text default 'INR',
  confidence_score numeric default 0, -- AI confidence in this suggestion (0-1)
  status text check (status in ('pending','approved','rejected','expired')) default 'pending',
  notes text,
  generated_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  expires_at timestamptz default (now() + interval '7 days')
);

comment on table public.draft_quotes is 'AI-generated quote suggestions awaiting admin approval';
comment on column public.draft_quotes.confidence_score is 'AI confidence score for the suggestion (0-1)';

-- Indexes for efficient querying
create index idx_products_vendor on products(vendor_id);
create index idx_products_category on products(category);
create index idx_products_destination on products(destination);
create index idx_products_active on products(active) where active = true;

create index idx_packages_destination on destination_packages(destination);
create index idx_packages_nights on destination_packages(nights);
create index idx_packages_hotel_class on destination_packages(hotel_class);
create index idx_packages_price on destination_packages(base_price);
create index idx_packages_active on destination_packages(active) where active = true;
create index idx_packages_tags on destination_packages using gin(tags);
create index idx_packages_validity on destination_packages(valid_from, valid_until);

create index idx_package_components_package on package_components(package_id);
create index idx_package_components_product on package_components(product_id);
create index idx_package_components_vendor on package_components(vendor_id);

create index idx_draft_quotes_lead on draft_quotes(lead_id);
create index idx_draft_quotes_status on draft_quotes(status);
create index idx_draft_quotes_expires on draft_quotes(expires_at);

-- RLS Policies

-- Products: Vendors can manage their own, operators/admins can see all
alter table public.products enable row level security;

create policy "Vendors can manage own products"
  on public.products for all
  using (
    vendor_id in (
      select id from vendors where owner_id = auth.uid()
    )
  );

create policy "Operators can view all products"
  on public.products for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('operator', 'admin')
    )
  );

create policy "Admins can manage all products"
  on public.products for all
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Destination packages: Operators/admins can manage, all authenticated can view active
alter table public.destination_packages enable row level security;

create policy "Anyone can view active packages"
  on public.destination_packages for select
  using (active = true);

create policy "Operators can manage packages"
  on public.destination_packages for all
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('operator', 'admin')
    )
  );

-- Package components: Same as packages
alter table public.package_components enable row level security;

create policy "Anyone can view package components"
  on public.package_components for select
  using (
    package_id in (
      select id from destination_packages where active = true
    )
  );

create policy "Operators can manage package components"
  on public.package_components for all
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('operator', 'admin')
    )
  );

-- Draft quotes: Operators/admins can manage
alter table public.draft_quotes enable row level security;

create policy "Operators can view draft quotes"
  on public.draft_quotes for select
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('operator', 'admin')
    )
  );

create policy "Operators can manage draft quotes"
  on public.draft_quotes for all
  using (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('operator', 'admin')
    )
  );

-- Service role bypass for edge functions
create policy "Service role full access to products"
  on public.products for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role full access to packages"
  on public.destination_packages for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role full access to package components"
  on public.package_components for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role full access to draft quotes"
  on public.draft_quotes for all
  using (auth.jwt() ->> 'role' = 'service_role');
