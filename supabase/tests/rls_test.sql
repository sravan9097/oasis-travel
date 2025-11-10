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

