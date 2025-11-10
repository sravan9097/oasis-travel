# QA Engineer Guide

**Your Role:** Testing & Quality Assurance  
**Sections:** 14  
**Duration:** Week 8 (7-10 days)  
**Dependencies:** All feature sections (2-13)

---

## Overview

You are responsible for comprehensive testing and seed data creation:
1. **Section 14**: Create test data, write test suites, verify all acceptance criteria

Your work ensures production readiness before deployment.

---

## Section 14: Testing & Seed Data

### Timeline
- **Start**: After all features complete (Sections 2-13)
- **Duration**: 7-10 days

### Prerequisites

```bash
# Ensure all apps are working
cd oasis-travel
pnpm dev

# Install testing tools
npm install --save-dev pgTAP  # For PostgreSQL testing
cd apps/mobile && npm install --save-dev @testing-library/react-native jest
cd apps/console && npm install --save-dev @playwright/test
```

### Objective
Create comprehensive test coverage across database, backend, and frontend layers.

---

### Day 1-2: Seed Data Creation

**supabase/seed.sql:**
```sql
-- =====================================================
-- SEED DATA FOR DEVELOPMENT/STAGING
-- =====================================================

-- Clear existing data (careful in production!)
TRUNCATE TABLE 
  audit_log,
  trip_post_acks,
  trip_posts,
  trip_members,
  trips,
  driver_assignments,
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

-- =====================================================
-- USERS & PROFILES
-- =====================================================

-- Insert test users (using Supabase Auth - these need to be created via Auth API in practice)
-- For development, we'll use placeholder UUIDs

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

INSERT INTO vendors (id, owner_id, type, name, gstin, contact_phone, contact_email, sla_hours) VALUES
  ('v1111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'hotel', 'Royal Heritage Hotel', '29AAACP1234F1Z5', '+91-294-2512345', 'royal@hotel.com', 24),
  ('v2222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888888', 'cab', 'Premium Travels', '29AAACP1234F1Z6', '+91-294-2512346', 'premium@travels.com', 12),
  ('v3333333-3333-3333-3333-333333333333', '99999999-9999-9999-9999-999999999999', 'activity', 'Adventure Tours Udaipur', '29AAACP1234F1Z7', '+91-294-2512347', 'adventure@tours.com', 24);

-- Vendor user profiles
INSERT INTO profiles (id, role, display_name, email, phone) VALUES
  ('77777777-7777-7777-7777-777777777777', 'vendor', 'Hotel Manager', 'hotel@vendor.com', '+91-9876543216'),
  ('88888888-8888-8888-8888-888888888888', 'vendor', 'Cab Provider', 'cab@vendor.com', '+91-9876543217'),
  ('99999999-9999-9999-9999-999999999999', 'vendor', 'Activity Provider', 'activity@vendor.com', '+91-9876543218');

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

-- =====================================================
-- TEST INCIDENTS
-- =====================================================

INSERT INTO incidents (trip_id, created_by, severity, category, description, status) VALUES
  ('t1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'P2', 'transport_delay', 
   'Flight delayed by 2 hours. May need pickup time adjustment.', 'OPEN');

-- =====================================================
-- NOTIFICATIONS OUTBOX (for testing)
-- =====================================================

INSERT INTO notifications_outbox (user_id, kind, title, body, data_json) VALUES
  ('44444444-4444-4444-4444-444444444444', 'quote_ready', 'Your Quote is Ready!', 
   'We have prepared a customized quote for your Rajasthan trip.', 
   '{"quote_id": "q1111111-1111-1111-1111-111111111111"}'::jsonb);

-- =====================================================
-- VERIFY DATA
-- =====================================================

-- Count check
DO $$
BEGIN
  RAISE NOTICE 'Seed data summary:';
  RAISE NOTICE 'Profiles: %', (SELECT COUNT(*) FROM profiles);
  RAISE NOTICE 'Vendors: %', (SELECT COUNT(*) FROM vendors);
  RAISE NOTICE 'Drivers: %', (SELECT COUNT(*) FROM drivers);
  RAISE NOTICE 'Leads: %', (SELECT COUNT(*) FROM leads);
  RAISE NOTICE 'Quotes: %', (SELECT COUNT(*) FROM quotes);
  RAISE NOTICE 'Bookings: %', (SELECT COUNT(*) FROM bookings);
  RAISE NOTICE 'Trips: %', (SELECT COUNT(*) FROM trips);
END $$;
```

**Run seed:**
```bash
psql $DATABASE_URL -f supabase/seed.sql
```

### Day 3-4: Database/RLS Tests (pgTAP)

**supabase/tests/test_rls.sql:**
```sql
-- =====================================================
-- RLS POLICY TESTS
-- =====================================================

BEGIN;
SELECT plan(10);

-- Test 1: Customer isolation - Customer A cannot see Customer B's leads
PREPARE customer_a_leads AS
  SELECT COUNT(*) FROM leads 
  WHERE customer_id = '44444444-4444-4444-4444-444444444444';

SET LOCAL role TO authenticated;
SET LOCAL "request.jwt.claim.sub" TO '44444444-4444-4444-4444-444444444444';

SELECT ok(
  (SELECT COUNT(*) FROM leads) = (EXECUTE customer_a_leads),
  'Customer A should only see their own leads'
);

-- Test 2: Operators see all leads
SET LOCAL "request.jwt.claim.sub" TO '11111111-1111-1111-1111-111111111111';

SELECT ok(
  (SELECT COUNT(*) FROM leads) >= 3,
  'Operators should see all leads'
);

-- Test 3: Customer cannot update other customer's booking
SET LOCAL "request.jwt.claim.sub" TO '55555555-5555-5555-5555-555555555555';

PREPARE update_other_booking AS
  UPDATE bookings 
  SET status = 'CANCELLED' 
  WHERE customer_id = '44444444-4444-4444-4444-444444444444';

SELECT throws_ok(
  'update_other_booking',
  'insufficient_privilege',
  'Customer should not be able to update other customer booking'
);

-- Test 4: Vendor sees only their POs
SET LOCAL role TO authenticated;
-- Assume vendor user is logged in
-- This would need actual vendor user UUID

-- Test 5: Quote immutability after SENT
-- Verify that quote_items cannot be modified after quote is SENT
-- ...

SELECT * FROM finish();
ROLLBACK;
```

### Day 5-6: RPC Integration Tests

**supabase/tests/test_rpcs.sh:**
```bash
#!/bin/bash

SUPABASE_URL="http://localhost:54321"
ANON_KEY="your_anon_key"
SERVICE_KEY="your_service_key"

echo "Testing RPC Functions..."

# Test 1: Create lead from guest
echo "Test 1: rpc_create_lead_from_guest"
LEAD_ID=$(curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/rpc_create_lead_from_guest" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "p_guest_session_id": "test-guest-789",
    "p_minimal_request": {
      "destinations": ["Jaipur"],
      "nights": 3,
      "pax_adults": 2
    }
  }' | jq -r '.')

if [ -z "$LEAD_ID" ]; then
  echo "❌ FAILED: Lead creation"
  exit 1
else
  echo "✓ PASSED: Lead created with ID: $LEAD_ID"
fi

# Test 2: Send quote
echo "Test 2: rpc_send_quote"
curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/rpc_send_quote" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"p_quote_id": "q1111111-1111-1111-1111-111111111111"}'

if [ $? -eq 0 ]; then
  echo "✓ PASSED: Quote sent"
else
  echo "❌ FAILED: Send quote"
fi

# Test 3: Accept quote
# ...

# Test 4: Raise incident
echo "Test 4: rpc_raise_incident"
INCIDENT_ID=$(curl -s -X POST "$SUPABASE_URL/rest/v1/rpc/rpc_raise_incident" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "p_trip_id": "t1111111-1111-1111-1111-111111111111",
    "p_severity": "P2",
    "p_category": "other",
    "p_description": "Test incident from automated test"
  }' | jq -r '.')

if [ -z "$INCIDENT_ID" ]; then
  echo "❌ FAILED: Incident creation"
else
  echo "✓ PASSED: Incident created"
fi

echo "RPC tests complete!"
```

### Day 7: Frontend Unit Tests

**Mobile Component Tests:**

**apps/mobile/__tests__/BotMessage.test.tsx:**
```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { BotMessage } from '../app/components/BotMessage';

describe('BotMessage', () => {
  it('renders bot message correctly', () => {
    const { getByText } = render(
      <BotMessage message="Hello, how can I help?" />
    );
    
    expect(getByText('Hello, how can I help?')).toBeTruthy();
  });

  it('renders user message with different styling', () => {
    const { getByText } = render(
      <BotMessage message="I want to book a trip" isUser />
    );
    
    expect(getByText('I want to book a trip')).toBeTruthy();
  });
});
```

**Utils Tests:**

**packages/utils/__tests__/money.test.ts:**
```typescript
import { formatINR, roundMoney, percentage, addGST } from '../src/money';

describe('Money Utils', () => {
  it('formats INR correctly', () => {
    expect(formatINR(1000)).toBe('₹1,000');
    expect(formatINR(100000)).toBe('₹1,00,000');
    expect(formatINR(5000000)).toBe('₹50,00,000');
  });

  it('rounds money correctly', () => {
    expect(roundMoney(10.556)).toBe(10.56);
    expect(roundMoney(10.554)).toBe(10.55);
    expect(roundMoney(10.555)).toBe(10.56); // Banker's rounding
  });

  it('calculates percentage', () => {
    expect(percentage(1000, 10)).toBe(100);
    expect(percentage(1000, 18)).toBe(180);
    expect(percentage(500, 5)).toBe(25);
  });

  it('adds GST correctly', () => {
    expect(addGST(1000, 18)).toBe(1180);
    expect(addGST(5000, 12)).toBe(5600);
  });
});
```

### Day 8: E2E Tests (Optional but Recommended)

**Console E2E (Playwright):**

**apps/console/e2e/leads.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Leads Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'operator@test.com');
    await page.click('button:has-text("Send OTP")');
    // In test environment, you'd mock OTP or use test credentials
  });

  test('should display leads board', async ({ page }) => {
    await page.goto('http://localhost:3000/leads');
    
    await expect(page.locator('h1')).toContainText('Leads');
    await expect(page.locator('[data-testid="kanban-board"]')).toBeVisible();
  });

  test('should drag lead to different stage', async ({ page }) => {
    await page.goto('http://localhost:3000/leads');
    
    // Drag lead from NEW to SCOPING
    const leadCard = page.locator('[data-lead-stage="NEW"]').first();
    const scopingColumn = page.locator('[data-column="SCOPING"]');
    
    await leadCard.dragTo(scopingColumn);
    
    // Verify lead moved
    await expect(page.locator('[data-column="SCOPING"]')).toContainText('Lead #');
  });
});
```

### Day 9-10: Acceptance Testing

**Manual test checklist based on `prompt.md` acceptance criteria:**

**test-acceptance.md:**
```markdown
# Acceptance Test Checklist

## Test 1: RLS – Customer Isolation
- [ ] Login as Customer A
- [ ] Verify can see own leads
- [ ] Cannot see Customer B's leads
- [ ] Cannot modify Customer B's bookings

## Test 2: Quote Immutability
- [ ] Create quote in DRAFT
- [ ] Add quote items
- [ ] Send quote (rpc_send_quote)
- [ ] Verify snapshot is frozen
- [ ] Attempt to modify quote_items
- [ ] Verify original snapshot unchanged

## Test 3: Accept → Booking
- [ ] Customer accepts quote (rpc_accept_quote)
- [ ] Booking created with status PENDING_VENDOR_CONFIRM
- [ ] price_snapshot contains frozen data
- [ ] Lead stage updated to WON

## Test 4: PO SLA
- [ ] Create PO with due_at in past
- [ ] Run sla_monitor edge function
- [ ] Verify alert appears in notifications_outbox
- [ ] Verify appears in operator /alerts page

## Test 5: Voucher Verify
- [ ] Vendor uploads voucher
- [ ] Missing guest_name in meta
- [ ] Verify verified=false
- [ ] Upload with complete meta
- [ ] Verify verified=true

## Test 6: Confirm Readiness
- [ ] Booking with 2 vendors
- [ ] Upload voucher from vendor 1 only
- [ ] Call rpc_confirm_booking_if_ready
- [ ] Verify status still PENDING
- [ ] Upload voucher from vendor 2
- [ ] Call rpc_confirm_booking_if_ready
- [ ] Verify status changes to CONFIRMED

## Test 7: Trip Posts Schedule
- [ ] Create trip_post with scheduled_at=now()
- [ ] Run scheduler_post_runner
- [ ] Verify status=POSTED
- [ ] Verify posted_at timestamp set
- [ ] Verify notification created

## Test 8: Quick Actions
- [ ] Create trip post with quick_action
- [ ] User clicks "Confirm Pickup"
- [ ] Call rpc_record_post_action
- [ ] Verify trip_post_acks created
- [ ] User clicks "Request Change"
- [ ] Verify incident created

## Test 9: Guest Merge
- [ ] Create lead with guest_session_id
- [ ] Verify lead.customer_id is null
- [ ] User completes OTP
- [ ] Call rpc_merge_guest_to_user
- [ ] Verify lead.customer_id = authenticated user
- [ ] Verify guest_session_id = null
- [ ] Verify references still valid

## Test 10: Cancellation
- [ ] Customer submits cancellation
- [ ] Verify cancellation row created with status=REQUESTED
- [ ] Operator updates status to APPROVED
- [ ] Verify booking status changes to CANCELLED
- [ ] Verify trip channel post created
```

---

## Deliverables Checklist

- [ ] Seed data SQL file with realistic test data
- [ ] 2 operators, 1 admin, 3 customers, 3 vendors
- [ ] Complete sample pipeline (lead → quote → booking → trip)
- [ ] pgTAP tests for RLS policies
- [ ] Integration tests for all RPC functions
- [ ] Unit tests for utility functions
- [ ] Unit tests for mobile components
- [ ] E2E tests for critical flows (optional)
- [ ] All 10 acceptance tests passing
- [ ] Test documentation
- [ ] Bug report template
- [ ] Test coverage report (>70%)

---

## Test Execution

```bash
# Run all tests
cd oasis-travel

# Database tests
psql $DATABASE_URL -f supabase/tests/test_rls.sql

# RPC integration tests
./supabase/tests/test_rpcs.sh

# Frontend unit tests
cd apps/mobile && npm test
cd apps/console && npm test
cd packages/utils && npm test

# E2E tests
cd apps/console && npx playwright test

# Generate coverage report
npm run test:coverage
```

---

## Success Criteria

✅ Section 14 Complete When:
- Seed data loads without errors
- All RLS tests passing
- All RPC integration tests passing
- Frontend unit tests >70% coverage
- All 10 acceptance tests passing
- No critical bugs found
- Test documentation complete
- Ready for staging deployment

---

## Bug Reporting Template

**Create `.github/ISSUE_TEMPLATE/bug_report.md`:**
```markdown
## Bug Description
[Clear description of the issue]

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error...

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- App: [Mobile/Console/Vendor]
- OS: [iOS/Android/Browser]
- Version: [Version number]

## Screenshots
[If applicable]

## Priority
[P0 - Critical | P1 - High | P2 - Medium | P3 - Low]
```

---

## Resources

- [pgTAP Documentation](https://pgtap.org/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Documentation](https://jestjs.io/)

