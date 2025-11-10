-- =====================================================
-- SEED DATA FOR DEVELOPMENT/STAGING
-- =====================================================
-- Run with: psql $DATABASE_URL -f supabase/seed.sql
-- Or: supabase db reset (which runs seed.sql automatically)

-- Clear existing data (careful in production!)
-- Note: This assumes you're in a development/staging environment
-- In production, use migrations instead of TRUNCATE

DO $$
BEGIN
  -- Disable triggers temporarily for faster truncation
  SET session_replication_role = 'replica';
  
  TRUNCATE TABLE 
    audit_log,
    trip_post_acks,
    trip_posts,
    trip_members,
    driver_assignments,
    trips,
    incidents,
    cancellations,
    vouchers,
    pos,
    bookings,
    quote_items,
    quotes,
    request_docs,
    leads,
    rate_plans,
    drivers,
    vendors,
    profiles
  CASCADE;
  
  -- Re-enable triggers
  SET session_replication_role = 'origin';
  
  RAISE NOTICE 'Cleared existing test data';
END $$;

-- =====================================================
-- USERS & PROFILES
-- =====================================================
-- Note: In a real setup, these users would be created via Supabase Auth API
-- For seed data, we'll insert directly into profiles (auth.users would need to exist first)
-- In practice, you'd create users via: supabase.auth.admin.createUser()

-- Operators
INSERT INTO profiles (id, role, display_name, email, phone) VALUES
  ('11111111-1111-1111-1111-111111111111', 'operator', 'Priya Sharma', 'priya@oasistravel.com', '+91-9876543210'),
  ('22222222-2222-2222-2222-222222222222', 'operator', 'Rahul Kumar', 'rahul@oasistravel.com', '+91-9876543211');

-- Admin
INSERT INTO profiles (id, role, display_name, email, phone) VALUES
  ('33333333-3333-3333-3333-333333333333', 'admin', 'Admin User', 'admin@oasistravel.com', '+91-9876543212');

-- Customers
INSERT INTO profiles (id, role, display_name, email, phone, home_city) VALUES
  ('44444444-4444-4444-4444-444444444444', 'customer', 'Amit Patel', 'amit@example.com', '+91-9876543213', 'Mumbai'),
  ('55555555-5555-5555-5555-555555555555', 'customer', 'Sneha Gupta', 'sneha@example.com', '+91-9876543214', 'Delhi'),
  ('66666666-6666-6666-6666-666666666666', 'customer', 'Rajesh Singh', 'rajesh@example.com', '+91-9876543215', 'Bangalore');

-- =====================================================
-- VENDORS
-- =====================================================

-- Vendor user profiles (owners)
INSERT INTO profiles (id, role, display_name, email, phone) VALUES
  ('77777777-7777-7777-7777-777777777777', 'vendor', 'Hotel Manager', 'hotel@vendor.com', '+91-9876543216'),
  ('88888888-8888-8888-8888-888888888888', 'vendor', 'Cab Provider', 'cab@vendor.com', '+91-9876543217'),
  ('99999999-9999-9999-9999-999999999999', 'vendor', 'Activity Provider', 'activity@vendor.com', '+91-9876543218');

-- Vendors
INSERT INTO vendors (id, owner_id, type, name, gstin, contact_phone, contact_email, sla_hours) VALUES
  ('v1111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'hotel', 'Royal Heritage Hotel', '29AAACP1234F1Z5', '+91-294-2512345', 'royal@hotel.com', 24),
  ('v2222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888888', 'cab', 'Premium Travels', '29AAACP1234F1Z6', '+91-294-2512346', 'premium@travels.com', 12),
  ('v3333333-3333-3333-3333-333333333333', '99999999-9999-9999-9999-999999999999', 'activity', 'Adventure Tours Udaipur', '29AAACP1234F1Z7', '+91-294-2512347', 'adventure@tours.com', 24);

-- =====================================================
-- DRIVERS
-- =====================================================

INSERT INTO drivers (vendor_id, name, phone, vehicle_type, vehicle_number) VALUES
  ('v2222222-2222-2222-2222-222222222222', 'Mohan Kumar', '+91-9876543220', 'sedan', 'RJ14AB1234'),
  ('v2222222-2222-2222-2222-222222222222', 'Suresh Rao', '+91-9876543221', 'suv', 'RJ14CD5678'),
  ('v2222222-2222-2222-2222-222222222222', 'Vikram Singh', '+91-9876543222', 'tempo', 'RJ14EF9012');

-- =====================================================
-- RATE PLANS
-- =====================================================

INSERT INTO rate_plans (vendor_id, title, season_start, season_end, weekday_price, weekend_price, surcharge_json) VALUES
  ('v1111111-1111-1111-1111-111111111111', 'Winter Season 2024', '2024-10-01', '2025-03-31', 5000, 7000, '{"extra_bed": 1200, "gst": 0.12}'::jsonb),
  ('v1111111-1111-1111-1111-111111111111', 'Summer Season 2024', '2024-04-01', '2024-09-30', 3500, 4500, '{"extra_bed": 1000, "gst": 0.12}'::jsonb),
  ('v2222222-2222-2222-2222-222222222222', 'Year Round Rates', '2024-01-01', '2024-12-31', 3000, 3500, '{"driver_allowance": 500}'::jsonb);

-- =====================================================
-- SAMPLE LEAD → QUOTE → BOOKING PIPELINE
-- =====================================================

-- Lead 1: Won (Complete pipeline)
INSERT INTO leads (id, customer_id, source, stage, created_at) VALUES
  ('l1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'bot', 'WON', NOW() - INTERVAL '10 days');

INSERT INTO request_docs (lead_id, origin_city, destinations, start_date, end_date, nights, pax_adults, pax_children, budget_min, budget_max, hotel_class) VALUES
  ('l1111111-1111-1111-1111-111111111111', 'Mumbai', ARRAY['Udaipur', 'Mount Abu'], '2024-12-15', '2024-12-19', 4, 2, 0, 30000, 50000, '4*');

-- Quote v1 (ACCEPTED)
INSERT INTO quotes (id, lead_id, version, status, total_amount, currency, inclusions, exclusions, validity_date, created_by, created_at) VALUES
  ('q1111111-1111-1111-1111-111111111111', 'l1111111-1111-1111-1111-111111111111', 1, 'ACCEPTED', 45000, 'INR', 
   'Hotel accommodation, All transfers, Sightseeing tours', 
   'Meals, Personal expenses, Monument entry fees',
   '2024-12-01',
   '11111111-1111-1111-1111-111111111111',
   NOW() - INTERVAL '8 days');

INSERT INTO quote_items (quote_id, day_no, item_type, vendor_id, description, qty, unit_price) VALUES
  ('q1111111-1111-1111-1111-111111111111', 1, 'hotel', 'v1111111-1111-1111-1111-111111111111', 'Royal Heritage Hotel - Deluxe Room', 1, 6000),
  ('q1111111-1111-1111-1111-111111111111', 1, 'cab', 'v2222222-2222-2222-2222-222222222222', 'Mumbai to Udaipur Transfer', 1, 8000),
  ('q1111111-1111-1111-1111-111111111111', 2, 'hotel', 'v1111111-1111-1111-1111-111111111111', 'Royal Heritage Hotel - Deluxe Room', 1, 6000),
  ('q1111111-1111-1111-1111-111111111111', 2, 'activity', 'v3333333-3333-3333-3333-333333333333', 'City Palace & Lake Tour', 2, 2500),
  ('q1111111-1111-1111-1111-111111111111', 3, 'hotel', 'v1111111-1111-1111-1111-111111111111', 'Royal Heritage Hotel - Deluxe Room', 1, 6000),
  ('q1111111-1111-1111-1111-111111111111', 4, 'cab', 'v2222222-2222-2222-2222-222222222222', 'Udaipur to Mount Abu', 1, 5000);

-- Booking (CONFIRMED)
INSERT INTO bookings (id, quote_id, customer_id, status, price_snapshot, created_at) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'q1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'CONFIRMED',
   '{"total": 45000, "items": []}'::jsonb,
   NOW() - INTERVAL '7 days');

-- Purchase Orders
INSERT INTO pos (id, booking_id, vendor_id, items, status, due_at, created_at) VALUES
  ('p1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'v1111111-1111-1111-1111-111111111111',
   '[{"day":1,"type":"hotel","description":"Deluxe Room x3 nights","qty":3,"price":18000}]'::jsonb,
   'CONFIRMED', NOW() + INTERVAL '6 days', NOW() - INTERVAL '6 days'),
  ('p2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'v2222222-2222-2222-2222-222222222222',
   '[{"day":1,"type":"cab","description":"Mumbai-Udaipur transfer","qty":1,"price":8000}]'::jsonb,
   'CONFIRMED', NOW() + INTERVAL '6 days', NOW() - INTERVAL '6 days');

-- Vouchers
INSERT INTO vouchers (booking_id, vendor_id, file_url, meta, verified) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'v1111111-1111-1111-1111-111111111111', 
   'b1111111/v1111111/voucher-hotel.pdf',
   '{"guest_name": "Amit Patel", "check_in": "2024-12-15", "check_out": "2024-12-19", "booking_id": "RH2024001"}'::jsonb,
   true),
  ('b1111111-1111-1111-1111-111111111111', 'v2222222-2222-2222-2222-222222222222',
   'b1111111/v2222222/voucher-cab.pdf',
   '{"guest_name": "Amit Patel", "pickup_date": "2024-12-15", "booking_id": "PT2024001"}'::jsonb,
   true);

-- Trip
INSERT INTO trips (id, booking_id, title, start_date, end_date) VALUES
  ('t1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 
   'Rajasthan Heritage Tour', '2024-12-15', '2024-12-19');

-- Trip Members
INSERT INTO trip_members (trip_id, user_id, role, display_name) VALUES
  ('t1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'customer', 'Amit Patel'),
  ('t1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'operator', 'Priya Sharma');

-- Trip Posts
INSERT INTO trip_posts (trip_id, kind, content, scheduled_at, status) VALUES
  ('t1111111-1111-1111-1111-111111111111', 'announcement',
   '{"title": "Welcome!", "body": "Your trip details are ready. Looking forward to hosting you!"}'::jsonb,
   NOW() + INTERVAL '1 hour', 'SCHEDULED'),
  ('t1111111-1111-1111-1111-111111111111', 'itinerary',
   '{"title": "Day 1 Itinerary", "body": "Pick up at 8 AM from Mumbai. Arrive Udaipur by 6 PM."}'::jsonb,
   NOW() + INTERVAL '2 hours', 'SCHEDULED');

-- Driver Assignments
INSERT INTO driver_assignments (trip_id, day_no, driver_id, pickup_time, pickup_location) VALUES
  ('t1111111-1111-1111-1111-111111111111', 1, 
   (SELECT id FROM drivers WHERE vehicle_number = 'RJ14AB1234' LIMIT 1),
   '2024-12-15 08:00:00+05:30', 'Mumbai Airport'),
  ('t1111111-1111-1111-1111-111111111111', 4,
   (SELECT id FROM drivers WHERE vehicle_number = 'RJ14CD5678' LIMIT 1),
   '2024-12-18 09:00:00+05:30', 'Udaipur Hotel');

-- =====================================================
-- OTHER TEST LEADS
-- =====================================================

-- Lead 2: SCOPING (in progress)
INSERT INTO leads (id, customer_id, source, stage, notes) VALUES
  ('l2222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'manual', 'SCOPING', 
   'Customer interested in Kerala backwaters. Budget flexible.');

INSERT INTO request_docs (lead_id, destinations, nights, pax_adults, pax_children, budget_min, budget_max) VALUES
  ('l2222222-2222-2222-2222-222222222222', ARRAY['Cochin', 'Alleppey', 'Munnar'], 6, 4, 2, 80000, 120000);

-- Lead 3: NEW (just created)
INSERT INTO leads (id, guest_session_id, source, stage) VALUES
  ('l3333333-3333-3333-3333-333333333333', 'guest-session-123', 'bot', 'NEW');

INSERT INTO request_docs (lead_id, destinations, nights, pax_adults) VALUES
  ('l3333333-3333-3333-3333-333333333333', ARRAY['Goa'], 5, 2);

-- Lead 4: QUOTED (quote sent, waiting for response)
INSERT INTO leads (id, customer_id, source, stage, created_at) VALUES
  ('l4444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', 'bot', 'QUOTED', NOW() - INTERVAL '3 days');

INSERT INTO request_docs (lead_id, origin_city, destinations, start_date, end_date, nights, pax_adults, budget_min, budget_max) VALUES
  ('l4444444-4444-4444-4444-444444444444', 'Bangalore', ARRAY['Ooty', 'Coorg'], '2025-01-10', '2025-01-14', 4, 2, 40000, 60000);

INSERT INTO quotes (id, lead_id, version, status, total_amount, currency, inclusions, exclusions, validity_date, created_by, created_at) VALUES
  ('q2222222-2222-2222-2222-222222222222', 'l4444444-4444-4444-4444-444444444444', 1, 'SENT', 55000, 'INR',
   'Hotel accommodation, All transfers', 'Meals, Personal expenses',
   '2025-01-05',
   '22222222-2222-2222-2222-222222222222',
   NOW() - INTERVAL '2 days');

INSERT INTO quote_items (quote_id, day_no, item_type, vendor_id, description, qty, unit_price) VALUES
  ('q2222222-2222-2222-2222-222222222222', 1, 'hotel', 'v1111111-1111-1111-1111-111111111111', 'Royal Heritage Hotel - Deluxe Room', 1, 6500),
  ('q2222222-2222-2222-2222-222222222222', 1, 'cab', 'v2222222-2222-2222-2222-222222222222', 'Bangalore to Ooty Transfer', 1, 9000);

-- =====================================================
-- TEST INCIDENTS
-- =====================================================

INSERT INTO incidents (trip_id, created_by, severity, category, description, status) VALUES
  ('t1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'P2', 'transport_delay', 
   'Flight delayed by 2 hours. May need pickup time adjustment.', 'OPEN'),
  ('t1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'P1', 'room_issue',
   'Customer reports AC not working in room. Need immediate attention.', 'ACK');

-- =====================================================
-- TEST CANCELLATIONS
-- =====================================================

-- Create another booking for cancellation test
INSERT INTO bookings (id, quote_id, customer_id, status, price_snapshot, created_at) VALUES
  ('b2222222-2222-2222-2222-222222222222', 'q2222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'PENDING_VENDOR_CONFIRM',
   '{"total": 55000, "items": []}'::jsonb,
   NOW() - INTERVAL '5 days');

INSERT INTO cancellations (booking_id, requested_by, reason, status, policy_snapshot) VALUES
  ('b2222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 
   'Change in travel plans due to work commitment', 'REQUESTED',
   '{"refund_percentage": 50, "cutoff_days": 7}'::jsonb);

-- =====================================================
-- NOTIFICATIONS OUTBOX (for testing)
-- =====================================================

INSERT INTO notifications_outbox (user_id, kind, title, body, data_json) VALUES
  ('44444444-4444-4444-4444-444444444444', 'quote_ready', 'Your Quote is Ready!', 
   'We have prepared a customized quote for your Rajasthan trip.', 
   '{"quote_id": "q1111111-1111-1111-1111-111111111111"}'::jsonb),
  ('66666666-6666-6666-6666-666666666666', 'quote_ready', 'Your Quote is Ready!',
   'We have prepared a customized quote for your Ooty trip.',
   '{"quote_id": "q2222222-2222-2222-2222-222222222222"}'::jsonb),
  ('44444444-4444-4444-4444-444444444444', 'trip_post', 'Welcome to Your Trip!',
   'Your trip details are ready. Check the trip channel for updates.',
   '{"trip_id": "t1111111-1111-1111-1111-111111111111", "post_id": "..."}'::jsonb);

-- =====================================================
-- VERIFY DATA
-- =====================================================

DO $$
DECLARE
  v_profiles int;
  v_vendors int;
  v_drivers int;
  v_leads int;
  v_quotes int;
  v_bookings int;
  v_trips int;
  v_incidents int;
BEGIN
  SELECT COUNT(*) INTO v_profiles FROM profiles;
  SELECT COUNT(*) INTO v_vendors FROM vendors;
  SELECT COUNT(*) INTO v_drivers FROM drivers;
  SELECT COUNT(*) INTO v_leads FROM leads;
  SELECT COUNT(*) INTO v_quotes FROM quotes;
  SELECT COUNT(*) INTO v_bookings FROM bookings;
  SELECT COUNT(*) INTO v_trips FROM trips;
  SELECT COUNT(*) INTO v_incidents FROM incidents;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Seed data summary:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Profiles: %', v_profiles;
  RAISE NOTICE 'Vendors: %', v_vendors;
  RAISE NOTICE 'Drivers: %', v_drivers;
  RAISE NOTICE 'Leads: %', v_leads;
  RAISE NOTICE 'Quotes: %', v_quotes;
  RAISE NOTICE 'Bookings: %', v_bookings;
  RAISE NOTICE 'Trips: %', v_trips;
  RAISE NOTICE 'Incidents: %', v_incidents;
  RAISE NOTICE '========================================';
  
  -- Verify counts are as expected
  IF v_profiles < 9 THEN
    RAISE WARNING 'Expected at least 9 profiles, found %', v_profiles;
  END IF;
  
  IF v_leads < 4 THEN
    RAISE WARNING 'Expected at least 4 leads, found %', v_leads;
  END IF;
  
  RAISE NOTICE 'Seed data loaded successfully!';
END $$;

