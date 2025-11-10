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

