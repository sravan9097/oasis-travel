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

