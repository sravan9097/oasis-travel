# Acceptance Test Checklist

This document contains the acceptance test checklist based on the requirements in `prompt.md`. Each test verifies a critical feature or business rule.

## Test 1: RLS – Customer Isolation

**Objective:** Verify that customers can only see and modify their own data.

- [ ] Login as Customer A
- [ ] Verify can see own leads
- [ ] Verify can see own quotes
- [ ] Verify can see own bookings
- [ ] Cannot see Customer B's leads
- [ ] Cannot see Customer B's quotes
- [ ] Cannot modify Customer B's bookings
- [ ] Cannot access Customer B's trip data

**Expected Result:** Complete data isolation between customers.

---

## Test 2: Quote Immutability

**Objective:** Verify that quotes become immutable after being sent.

- [ ] Create quote in DRAFT status
- [ ] Add quote items
- [ ] Modify quote items (should succeed)
- [ ] Send quote using `rpc_send_quote`
- [ ] Verify quote status changes to SENT
- [ ] Verify snapshot is frozen (contains quote data at send time)
- [ ] Attempt to modify quote_items for SENT quote
- [ ] Verify modification is prevented or original snapshot unchanged
- [ ] Verify quote total_amount matches snapshot

**Expected Result:** SENT quotes are immutable; snapshot preserves original data.

---

## Test 3: Accept → Booking Pipeline

**Objective:** Verify the complete flow from quote acceptance to booking creation.

- [ ] Customer receives SENT quote
- [ ] Customer accepts quote using `rpc_accept_quote`
- [ ] Verify booking created with status PENDING_VENDOR_CONFIRM
- [ ] Verify booking.price_snapshot contains frozen data from quote.snapshot
- [ ] Verify lead stage updated to WON
- [ ] Verify quote status updated to ACCEPTED
- [ ] Verify audit_log entry created

**Expected Result:** Smooth transition from quote to booking with data preservation.

---

## Test 4: PO SLA Monitoring

**Objective:** Verify SLA monitoring and alerting for purchase orders.

- [ ] Create PO with due_at in past (overdue)
- [ ] Run `sla_monitor` edge function (or wait for scheduled run)
- [ ] Verify alert appears in notifications_outbox
- [ ] Verify alert appears in operator /alerts page
- [ ] Verify alert contains PO details and vendor information
- [ ] Create PO with due_at in future (not overdue)
- [ ] Verify no alert created for non-overdue PO

**Expected Result:** Overdue POs trigger alerts; non-overdue POs do not.

---

## Test 5: Voucher Verification

**Objective:** Verify voucher upload and verification logic.

- [ ] Vendor uploads voucher with incomplete meta (missing guest_name)
- [ ] Verify voucher.verified = false
- [ ] Verify voucher appears in booking but marked as unverified
- [ ] Vendor uploads voucher with complete meta (guest_name, check_in, check_out, booking_id)
- [ ] Verify voucher.verified = true
- [ ] Verify verified voucher appears correctly in booking

**Expected Result:** Vouchers are verified based on meta completeness.

---

## Test 6: Confirm Booking Readiness

**Objective:** Verify booking confirmation only when all vouchers are ready.

- [ ] Create booking with 2 vendors
- [ ] Upload voucher from vendor 1 only
- [ ] Call `rpc_confirm_booking_if_ready`
- [ ] Verify booking status still PENDING_VENDOR_CONFIRM
- [ ] Upload voucher from vendor 2
- [ ] Call `rpc_confirm_booking_if_ready`
- [ ] Verify booking status changes to CONFIRMED
- [ ] Verify trip created automatically
- [ ] Verify trip_members added correctly

**Expected Result:** Booking confirms only when all vendor vouchers are present.

---

## Test 7: Trip Posts Schedule

**Objective:** Verify scheduled trip posts are published correctly.

- [ ] Create trip_post with scheduled_at = now() (or in past)
- [ ] Run `scheduler_post_runner` edge function
- [ ] Verify post status changes to POSTED
- [ ] Verify posted_at timestamp is set
- [ ] Verify notification created in notifications_outbox
- [ ] Verify post appears in trip channel
- [ ] Create trip_post with scheduled_at in future
- [ ] Run scheduler
- [ ] Verify post status remains SCHEDULED

**Expected Result:** Posts are published at scheduled time; notifications are sent.

---

## Test 8: Quick Actions

**Objective:** Verify trip post quick actions work correctly.

- [ ] Create trip post with quick_action (e.g., "Confirm Pickup")
- [ ] User clicks "Confirm Pickup" action
- [ ] Call `rpc_record_post_action`
- [ ] Verify trip_post_acks row created
- [ ] Verify ack contains correct action_id and user_id
- [ ] User clicks "Request Change" action
- [ ] Verify incident created automatically
- [ ] Verify incident linked to correct trip

**Expected Result:** Quick actions create appropriate records (acks or incidents).

---

## Test 9: Guest Merge

**Objective:** Verify guest session data is merged to authenticated user.

- [ ] Create lead with guest_session_id (no customer_id)
- [ ] Verify lead.customer_id is null
- [ ] Verify lead.guest_session_id is set
- [ ] User completes OTP authentication
- [ ] Call `rpc_merge_guest_to_user` with guest_session_id
- [ ] Verify lead.customer_id = authenticated user
- [ ] Verify lead.guest_session_id = null
- [ ] Verify all references (quotes, etc.) still valid
- [ ] Verify user can see merged lead

**Expected Result:** Guest data seamlessly merges to authenticated user account.

---

## Test 10: Cancellation Flow

**Objective:** Verify cancellation request and approval workflow.

- [ ] Customer submits cancellation using `rpc_submit_cancellation`
- [ ] Verify cancellation row created with status = REQUESTED
- [ ] Verify cancellation.policy_snapshot contains policy at time of request
- [ ] Operator views cancellation in console
- [ ] Operator updates cancellation status to APPROVED
- [ ] Verify booking status changes to CANCELLED
- [ ] Verify trip channel post created (if trip exists)
- [ ] Verify cancellation status changes to FINALIZED

**Expected Result:** Cancellation workflow completes with proper status updates.

---

## Test 11: Operator Access

**Objective:** Verify operators can access all customer data.

- [ ] Login as operator
- [ ] Verify can see all leads (all customers)
- [ ] Verify can see all quotes
- [ ] Verify can see all bookings
- [ ] Verify can update lead stages
- [ ] Verify can create quotes
- [ ] Verify can send quotes
- [ ] Verify can view all trips

**Expected Result:** Operators have full access to all customer data.

---

## Test 12: Vendor Access

**Objective:** Verify vendors can only see their own POs and data.

- [ ] Login as vendor
- [ ] Verify can see only their own POs
- [ ] Verify cannot see other vendors' POs
- [ ] Verify can upload vouchers for their POs
- [ ] Verify can view rate plans
- [ ] Verify can manage drivers
- [ ] Verify cannot see customer PII (phone numbers, etc.)

**Expected Result:** Vendors have restricted access to their own data only.

---

## Test 13: Incident Severity Handling

**Objective:** Verify incident severity levels trigger appropriate responses.

- [ ] Create P0 incident (emergency)
- [ ] Verify incident appears in emergency alerts
- [ ] Verify notification sent immediately
- [ ] Create P1 incident (urgent)
- [ ] Verify incident appears in urgent queue
- [ ] Create P2 incident (normal)
- [ ] Verify incident appears in normal queue
- [ ] Verify SLA targets are different for each severity

**Expected Result:** Incident severity determines response priority and SLA.

---

## Test 14: Audit Logging

**Objective:** Verify all mutations are logged in audit_log.

- [ ] Create lead
- [ ] Verify audit_log entry created with action = 'create_lead'
- [ ] Update lead stage
- [ ] Verify audit_log entry with before/after states
- [ ] Send quote
- [ ] Verify audit_log entry for quote send
- [ ] Accept quote
- [ ] Verify audit_log entry for quote acceptance

**Expected Result:** All critical actions are logged with before/after states.

---

## Test 15: Storage Access

**Objective:** Verify storage bucket access and signed URLs.

- [ ] Call `rpc_sign_url` for voucher upload
- [ ] Verify signed URL is generated
- [ ] Verify signed URL expires after specified time
- [ ] Upload file using signed URL
- [ ] Verify file appears in storage bucket
- [ ] Verify RLS policies prevent unauthorized access

**Expected Result:** Storage access is secure and time-limited.

---

## Test Execution Notes

### Prerequisites
- Seed data loaded (`supabase/seed.sql`)
- All apps running (`pnpm dev`)
- Supabase running locally (`supabase start`)

### Test Credentials
- Customer A: `amit@example.com` (ID: `44444444-4444-4444-4444-444444444444`)
- Customer B: `sneha@example.com` (ID: `55555555-5555-5555-5555-555555555555`)
- Operator: `priya@oasistravel.com` (ID: `11111111-1111-1111-1111-111111111111`)
- Vendor: `hotel@vendor.com` (ID: `77777777-7777-7777-7777-777777777777`)

### Running Tests
1. Manual testing: Follow checklist above
2. Automated RLS tests: `psql $DATABASE_URL -f supabase/tests/test_rls.sql`
3. Automated RPC tests: `./supabase/tests/test_rpcs.sh`
4. E2E tests: `cd apps/console && npm run test:e2e`

---

## Success Criteria

✅ All 15 acceptance tests passing
✅ No critical bugs found
✅ Performance acceptable (< 2s page load)
✅ Security verified (RLS working)
✅ Data integrity maintained
✅ Ready for staging deployment

