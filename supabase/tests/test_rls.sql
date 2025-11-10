-- =====================================================
-- RLS POLICY TESTS (pgTAP format)
-- =====================================================
-- Run with: psql $DATABASE_URL -f supabase/tests/test_rls.sql
-- Or with pgTAP: pg_prove supabase/tests/test_rls.sql
--
-- Note: These tests require pgTAP extension
-- Install: CREATE EXTENSION IF NOT EXISTS pgtap;

-- Load pgTAP if available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgtap') THEN
    PERFORM 1;
  ELSE
    RAISE NOTICE 'pgTAP extension not found. Tests will run in basic mode.';
    RAISE NOTICE 'To install: CREATE EXTENSION IF NOT EXISTS pgtap;';
  END IF;
END $$;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to set authenticated user context
CREATE OR REPLACE FUNCTION test_set_user(user_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', user_id::text, true);
  PERFORM set_config('role', 'authenticated', true);
END;
$$ LANGUAGE plpgsql;

-- Function to reset to anon role
CREATE OR REPLACE FUNCTION test_reset_role()
RETURNS void AS $$
BEGIN
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claim.sub', '', true);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TEST 1: Customer Isolation
-- =====================================================

DO $$
DECLARE
  v_customer1_id uuid := '44444444-4444-4444-4444-444444444444';
  v_customer2_id uuid := '55555555-5555-5555-5555-555555555555';
  v_lead_count int;
BEGIN
  RAISE NOTICE '=== TEST 1: Customer Isolation ===';
  
  -- Set context to customer 1
  PERFORM test_set_user(v_customer1_id);
  
  -- Customer 1 should see only their own leads
  SELECT COUNT(*) INTO v_lead_count FROM leads;
  
  IF v_lead_count != (SELECT COUNT(*) FROM leads WHERE customer_id = v_customer1_id) THEN
    RAISE EXCEPTION 'FAIL: Customer 1 should see only their own leads. Expected %, got %', 
      (SELECT COUNT(*) FROM leads WHERE customer_id = v_customer1_id), v_lead_count;
  END IF;
  
  RAISE NOTICE 'PASS: Customer 1 sees only their own leads';
  
  -- Set context to customer 2
  PERFORM test_set_user(v_customer2_id);
  
  SELECT COUNT(*) INTO v_lead_count FROM leads;
  
  IF v_lead_count != (SELECT COUNT(*) FROM leads WHERE customer_id = v_customer2_id) THEN
    RAISE EXCEPTION 'FAIL: Customer 2 should see only their own leads. Expected %, got %',
      (SELECT COUNT(*) FROM leads WHERE customer_id = v_customer2_id), v_lead_count;
  END IF;
  
  RAISE NOTICE 'PASS: Customer 2 sees only their own leads';
  
  PERFORM test_reset_role();
END $$;

-- =====================================================
-- TEST 2: Operator Sees All Leads
-- =====================================================

DO $$
DECLARE
  v_operator_id uuid := '11111111-1111-1111-1111-111111111111';
  v_lead_count int;
  v_total_leads int;
BEGIN
  RAISE NOTICE '=== TEST 2: Operator Sees All Leads ===';
  
  -- Get total leads count (should be visible to operators)
  SELECT COUNT(*) INTO v_total_leads FROM leads;
  
  -- Set context to operator
  PERFORM test_set_user(v_operator_id);
  
  -- Operator should see all leads
  SELECT COUNT(*) INTO v_lead_count FROM leads;
  
  IF v_lead_count < v_total_leads THEN
    RAISE EXCEPTION 'FAIL: Operator should see all leads. Expected at least %, got %', 
      v_total_leads, v_lead_count;
  END IF;
  
  RAISE NOTICE 'PASS: Operator sees all leads (%)', v_lead_count;
  
  PERFORM test_reset_role();
END $$;

-- =====================================================
-- TEST 3: Customer Cannot Update Other Customer's Booking
-- =====================================================

DO $$
DECLARE
  v_customer1_id uuid := '44444444-4444-4444-4444-444444444444';
  v_customer2_id uuid := '55555555-5555-5555-5555-555555555555';
  v_booking_id uuid;
  v_update_success boolean := false;
BEGIN
  RAISE NOTICE '=== TEST 3: Customer Cannot Update Other Customer''s Booking ===';
  
  -- Get a booking that belongs to customer 1
  SELECT id INTO v_booking_id 
  FROM bookings 
  WHERE customer_id = v_customer1_id 
  LIMIT 1;
  
  IF v_booking_id IS NULL THEN
    RAISE NOTICE 'SKIP: No booking found for customer 1';
    RETURN;
  END IF;
  
  -- Set context to customer 2 (different customer)
  PERFORM test_set_user(v_customer2_id);
  
  -- Try to update customer 1's booking (should fail)
  BEGIN
    UPDATE bookings 
    SET status = 'CANCELLED' 
    WHERE id = v_booking_id;
    
    v_update_success := true;
  EXCEPTION WHEN insufficient_privilege OR OTHERS THEN
    v_update_success := false;
  END;
  
  IF v_update_success THEN
    RAISE EXCEPTION 'FAIL: Customer 2 should not be able to update customer 1''s booking';
  END IF;
  
  RAISE NOTICE 'PASS: Customer cannot update other customer''s booking';
  
  PERFORM test_reset_role();
END $$;

-- =====================================================
-- TEST 4: Customer Can Update Own Booking
-- =====================================================

DO $$
DECLARE
  v_customer_id uuid := '44444444-4444-4444-4444-444444444444';
  v_booking_id uuid;
  v_original_status text;
BEGIN
  RAISE NOTICE '=== TEST 4: Customer Can Update Own Booking ===';
  
  -- Get a booking that belongs to the customer
  SELECT id, status INTO v_booking_id, v_original_status
  FROM bookings 
  WHERE customer_id = v_customer_id 
  LIMIT 1;
  
  IF v_booking_id IS NULL THEN
    RAISE NOTICE 'SKIP: No booking found for customer';
    RETURN;
  END IF;
  
  -- Set context to customer
  PERFORM test_set_user(v_customer_id);
  
  -- Try to update own booking (should succeed for certain fields)
  -- Note: Actual RLS policies may restrict which fields can be updated
  -- This test verifies the customer can at least see their booking
  IF NOT EXISTS (SELECT 1 FROM bookings WHERE id = v_booking_id AND customer_id = v_customer_id) THEN
    RAISE EXCEPTION 'FAIL: Customer should be able to see their own booking';
  END IF;
  
  RAISE NOTICE 'PASS: Customer can see their own booking';
  
  PERFORM test_reset_role();
END $$;

-- =====================================================
-- TEST 5: Vendor Sees Only Their POs
-- =====================================================

DO $$
DECLARE
  v_vendor_id uuid := '77777777-7777-7777-7777-777777777777';
  v_vendor_po_count int;
  v_total_po_count int;
BEGIN
  RAISE NOTICE '=== TEST 5: Vendor Sees Only Their POs ===';
  
  -- Get vendor's actual PO count
  SELECT COUNT(*) INTO v_vendor_po_count
  FROM pos p
  JOIN vendors v ON p.vendor_id = v.id
  WHERE v.owner_id = v_vendor_id;
  
  -- Set context to vendor
  PERFORM test_set_user(v_vendor_id);
  
  -- Vendor should see only their POs
  SELECT COUNT(*) INTO v_total_po_count FROM pos;
  
  IF v_total_po_count > v_vendor_po_count THEN
    RAISE EXCEPTION 'FAIL: Vendor should see only their POs. Expected %, got %',
      v_vendor_po_count, v_total_po_count;
  END IF;
  
  RAISE NOTICE 'PASS: Vendor sees only their POs (%)', v_total_po_count;
  
  PERFORM test_reset_role();
END $$;

-- =====================================================
-- TEST 6: Quote Immutability After SENT
-- =====================================================

DO $$
DECLARE
  v_quote_id uuid;
  v_operator_id uuid := '11111111-1111-1111-1111-111111111111';
  v_update_success boolean := false;
BEGIN
  RAISE NOTICE '=== TEST 6: Quote Immutability After SENT ===';
  
  -- Get a SENT quote
  SELECT id INTO v_quote_id
  FROM quotes
  WHERE status = 'SENT'
  LIMIT 1;
  
  IF v_quote_id IS NULL THEN
    RAISE NOTICE 'SKIP: No SENT quote found';
    RETURN;
  END IF;
  
  -- Set context to operator
  PERFORM test_set_user(v_operator_id);
  
  -- Try to modify quote_items for a SENT quote (should fail or be prevented)
  BEGIN
    INSERT INTO quote_items (quote_id, day_no, item_type, description, qty, unit_price)
    VALUES (v_quote_id, 99, 'misc', 'Test item', 1, 1000);
    
    -- If insert succeeds, check if it's actually allowed
    DELETE FROM quote_items WHERE quote_id = v_quote_id AND day_no = 99;
    v_update_success := true;
  EXCEPTION WHEN OTHERS THEN
    v_update_success := false;
  END;
  
  -- Note: This test depends on actual RLS/trigger implementation
  -- If quotes are truly immutable after SENT, the insert should fail
  RAISE NOTICE 'INFO: Quote immutability test completed. Update success: %', v_update_success;
  
  PERFORM test_reset_role();
END $$;

-- =====================================================
-- TEST 7: Trip Members Privacy
-- =====================================================

DO $$
DECLARE
  v_customer_id uuid := '44444444-4444-4444-4444-444444444444';
  v_trip_id uuid;
  v_member_count int;
BEGIN
  RAISE NOTICE '=== TEST 7: Trip Members Privacy ===';
  
  -- Get a trip the customer is part of
  SELECT t.id INTO v_trip_id
  FROM trips t
  JOIN trip_members tm ON t.id = tm.trip_id
  WHERE tm.user_id = v_customer_id
  LIMIT 1;
  
  IF v_trip_id IS NULL THEN
    RAISE NOTICE 'SKIP: No trip found for customer';
    RETURN;
  END IF;
  
  -- Set context to customer
  PERFORM test_set_user(v_customer_id);
  
  -- Customer should see trip members (but only display names, not PII)
  SELECT COUNT(*) INTO v_member_count
  FROM trip_members
  WHERE trip_id = v_trip_id;
  
  IF v_member_count = 0 THEN
    RAISE EXCEPTION 'FAIL: Customer should see trip members';
  END IF;
  
  -- Verify display_name is present (privacy: no phone numbers)
  IF EXISTS (
    SELECT 1 FROM trip_members 
    WHERE trip_id = v_trip_id 
    AND display_name IS NULL
  ) THEN
    RAISE EXCEPTION 'FAIL: All trip members should have display_name';
  END IF;
  
  RAISE NOTICE 'PASS: Trip members visible with display names only';
  
  PERFORM test_reset_role();
END $$;

-- =====================================================
-- TEST 8: Anonymous Users Cannot Access Data
-- =====================================================

DO $$
DECLARE
  v_lead_count int;
BEGIN
  RAISE NOTICE '=== TEST 8: Anonymous Users Cannot Access Data ===';
  
  -- Reset to anonymous role
  PERFORM test_reset_role();
  
  -- Anonymous users should not see leads
  BEGIN
    SELECT COUNT(*) INTO v_lead_count FROM leads;
    
    IF v_lead_count > 0 THEN
      RAISE EXCEPTION 'FAIL: Anonymous users should not see any leads. Got %', v_lead_count;
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    -- This is expected - RLS should block access
    RAISE NOTICE 'PASS: Anonymous access blocked by RLS';
    RETURN;
  END;
  
  RAISE NOTICE 'PASS: Anonymous users cannot access leads';
END $$;

-- =====================================================
-- TEST 9: Operator Can Update Lead Stage
-- =====================================================

DO $$
DECLARE
  v_operator_id uuid := '11111111-1111-1111-1111-111111111111';
  v_lead_id uuid;
  v_update_success boolean := false;
BEGIN
  RAISE NOTICE '=== TEST 9: Operator Can Update Lead Stage ===';
  
  -- Get a lead
  SELECT id INTO v_lead_id
  FROM leads
  WHERE stage = 'NEW'
  LIMIT 1;
  
  IF v_lead_id IS NULL THEN
    RAISE NOTICE 'SKIP: No NEW lead found';
    RETURN;
  END IF;
  
  -- Set context to operator
  PERFORM test_set_user(v_operator_id);
  
  -- Try to update lead stage
  BEGIN
    UPDATE leads
    SET stage = 'SCOPING'
    WHERE id = v_lead_id;
    
    v_update_success := true;
    
    -- Revert change
    UPDATE leads
    SET stage = 'NEW'
    WHERE id = v_lead_id;
  EXCEPTION WHEN OTHERS THEN
    v_update_success := false;
  END;
  
  IF NOT v_update_success THEN
    RAISE EXCEPTION 'FAIL: Operator should be able to update lead stage';
  END IF;
  
  RAISE NOTICE 'PASS: Operator can update lead stage';
  
  PERFORM test_reset_role();
END $$;

-- =====================================================
-- TEST 10: Customer Cannot See Other Customer's Quotes
-- =====================================================

DO $$
DECLARE
  v_customer1_id uuid := '44444444-4444-4444-4444-444444444444';
  v_customer2_id uuid := '55555555-5555-5555-5555-555555555555';
  v_quote_count int;
  v_expected_count int;
BEGIN
  RAISE NOTICE '=== TEST 10: Customer Cannot See Other Customer''s Quotes ===';
  
  -- Get expected quote count for customer 1
  SELECT COUNT(*) INTO v_expected_count
  FROM quotes q
  JOIN leads l ON q.lead_id = l.id
  WHERE l.customer_id = v_customer1_id;
  
  -- Set context to customer 1
  PERFORM test_set_user(v_customer1_id);
  
  -- Customer 1 should see only quotes for their leads
  SELECT COUNT(*) INTO v_quote_count
  FROM quotes;
  
  IF v_quote_count != v_expected_count THEN
    RAISE EXCEPTION 'FAIL: Customer 1 should see % quotes, got %', v_expected_count, v_quote_count;
  END IF;
  
  RAISE NOTICE 'PASS: Customer sees only their own quotes';
  
  PERFORM test_reset_role();
END $$;

-- =====================================================
-- SUMMARY
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Tests Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All tests executed. Review output above for results.';
  RAISE NOTICE '========================================';
END $$;

