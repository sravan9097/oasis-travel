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

