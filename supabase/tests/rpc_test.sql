-- ==========================================================
-- RPC FUNCTION TESTS
-- ==========================================================
-- Run with: psql $DATABASE_URL -f supabase/tests/rpc_test.sql

-- Test lead creation
do $$
declare
  v_lead_id uuid;
  v_request_doc_id uuid;
begin
  raise notice '=== Testing rpc_create_lead_from_guest ===';
  
  select rpc_create_lead_from_guest(
    'test-guest-123',
    '{"destinations": ["Udaipur", "Jaipur"], "nights": 4, "pax_adults": 2}'::jsonb
  ) into v_lead_id;
  
  assert v_lead_id is not null, 'Lead should be created';
  
  -- Verify lead was created
  select id into v_request_doc_id
  from request_docs
  where lead_id = v_lead_id;
  
  assert v_request_doc_id is not null, 'Request doc should be created';
  
  raise notice 'PASS: Lead created %', v_lead_id;
end $$;

-- Test lead stage update
do $$
declare
  v_lead_id uuid;
begin
  raise notice '=== Testing rpc_update_lead_stage ===';
  
  -- Get a test lead
  select id into v_lead_id
  from leads
  where guest_session_id = 'test-guest-123'
  limit 1;
  
  if v_lead_id is null then
    raise exception 'No test lead found';
  end if;
  
  -- Update stage
  perform rpc_update_lead_stage(v_lead_id, 'SCOPING');
  
  -- Verify update
  assert (select stage from leads where id = v_lead_id) = 'SCOPING', 'Stage should be updated';
  
  raise notice 'PASS: Lead stage updated to SCOPING';
end $$;

-- Test quote send
do $$
declare
  v_lead_id uuid;
  v_quote_id uuid;
  v_snapshot jsonb;
begin
  raise notice '=== Testing rpc_send_quote ===';
  
  -- Create a test quote
  select id into v_lead_id
  from leads
  where guest_session_id = 'test-guest-123'
  limit 1;
  
  if v_lead_id is null then
    raise exception 'No test lead found';
  end if;
  
  -- Insert test quote
  insert into quotes (lead_id, version, status, total_amount, currency)
  values (v_lead_id, 1, 'DRAFT', 50000, 'INR')
  returning id into v_quote_id;
  
  -- Add a quote item
  insert into quote_items (quote_id, day_no, item_type, description, qty, unit_price)
  values (v_quote_id, 1, 'hotel', 'Test Hotel', 2, 25000);
  
  -- Send quote
  perform rpc_send_quote(v_quote_id);
  
  -- Verify snapshot was created
  select snapshot into v_snapshot
  from quotes
  where id = v_quote_id;
  
  assert v_snapshot is not null, 'Snapshot should be created';
  assert (select status from quotes where id = v_quote_id) = 'SENT', 'Status should be SENT';
  
  raise notice 'PASS: Quote sent and snapshot frozen';
end $$;

-- Test quote acceptance
do $$
declare
  v_lead_id uuid;
  v_quote_id uuid;
  v_booking_id uuid;
begin
  raise notice '=== Testing rpc_accept_quote ===';
  
  -- Get a sent quote
  select q.id, q.lead_id into v_quote_id, v_lead_id
  from quotes q
  where q.status = 'SENT'
  limit 1;
  
  if v_quote_id is null then
    raise notice 'SKIP: No sent quote found for acceptance test';
    return;
  end if;
  
  -- Note: This test requires an authenticated user context
  -- In real testing, you would set auth.uid() first
  raise notice 'INFO: Quote acceptance test requires authenticated user context';
end $$;

-- Test trip creation
do $$
declare
  v_booking_id uuid;
  v_trip_id uuid;
begin
  raise notice '=== Testing rpc_create_trip_from_booking ===';
  
  -- Get a confirmed booking
  select id into v_booking_id
  from bookings
  where status = 'CONFIRMED'
  limit 1;
  
  if v_booking_id is null then
    raise notice 'SKIP: No confirmed booking found for trip creation test';
    return;
  end if;
  
  -- Note: This test requires an authenticated user context
  raise notice 'INFO: Trip creation test requires authenticated user context';
end $$;

-- Test incident raising
do $$
declare
  v_trip_id uuid;
  v_incident_id uuid;
begin
  raise notice '=== Testing rpc_raise_incident ===';
  
  -- Get a test trip
  select id into v_trip_id
  from trips
  limit 1;
  
  if v_trip_id is null then
    raise notice 'SKIP: No trip found for incident test';
    return;
  end if;
  
  -- Note: This test requires an authenticated user context
  raise notice 'INFO: Incident raising test requires authenticated user context';
end $$;

raise notice '=== RPC Tests Complete ===';
raise notice 'Note: Some tests require authenticated user context (auth.uid())';
raise notice 'Run these tests with proper authentication setup for full coverage';

