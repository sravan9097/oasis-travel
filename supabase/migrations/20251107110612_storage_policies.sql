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
    and (string_to_array(name, '/'))[2]::uuid in (select my_vendor_ids())
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
        where bookings.id = (string_to_array(name, '/'))[1]::uuid
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
        where leads.id = (string_to_array(name, '/'))[1]::uuid
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
      is_trip_member((string_to_array(name, '/'))[1]::uuid)
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
      is_trip_member((string_to_array(name, '/'))[1]::uuid)
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
    and (string_to_array(name, '/'))[1]::uuid = auth.uid()
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
    and (string_to_array(name, '/'))[1]::uuid = auth.uid()
  );

