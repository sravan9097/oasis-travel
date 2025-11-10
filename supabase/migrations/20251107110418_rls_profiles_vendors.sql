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

