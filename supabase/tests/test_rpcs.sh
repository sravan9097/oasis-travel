#!/bin/bash

# =====================================================
# RPC INTEGRATION TESTS
# =====================================================
# Run with: ./supabase/tests/test_rpcs.sh
# Or: bash supabase/tests/test_rpcs.sh
#
# Prerequisites:
# - Supabase running locally (supabase start)
# - Environment variables set:
#   - SUPABASE_URL (default: http://localhost:54321)
#   - SUPABASE_ANON_KEY
#   - SUPABASE_SERVICE_KEY

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_URL="${SUPABASE_URL:-http://localhost:54321}"
ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0}"
SERVICE_KEY="${SUPABASE_SERVICE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU}"

# Test counters
PASSED=0
FAILED=0
SKIPPED=0

# Helper functions
log_info() {
  echo -e "${YELLOW}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASSED++))
}

log_error() {
  echo -e "${RED}✗${NC} $1"
  ((FAILED++))
}

log_skip() {
  echo -e "${YELLOW}⊘${NC} $1"
  ((SKIPPED++))
}

# Test function
test_rpc() {
  local test_name="$1"
  local method="${2:-POST}"
  local endpoint="$3"
  local data="$4"
  local expected_status="${5:-200}"
  local use_service_key="${6:-false}"
  
  local key=$ANON_KEY
  if [ "$use_service_key" = "true" ]; then
    key=$SERVICE_KEY
  fi
  
  log_info "Testing: $test_name"
  
  local response
  local status_code
  
  if [ -n "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      "$SUPABASE_URL/rest/v1/rpc/$endpoint" \
      -H "apikey: $key" \
      -H "Authorization: Bearer $key" \
      -H "Content-Type: application/json" \
      -d "$data")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      "$SUPABASE_URL/rest/v1/rpc/$endpoint" \
      -H "apikey: $key" \
      -H "Authorization: Bearer $key" \
      -H "Content-Type: application/json")
  fi
  
  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$status_code" -eq "$expected_status" ]; then
    log_success "$test_name"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    return 0
  else
    log_error "$test_name (Status: $status_code, Expected: $expected_status)"
    echo "Response: $body"
    return 1
  fi
}

# Check if Supabase is running
log_info "Checking Supabase connection..."
if ! curl -s -f "$SUPABASE_URL/rest/v1/" > /dev/null; then
  log_error "Cannot connect to Supabase at $SUPABASE_URL"
  log_info "Make sure Supabase is running: supabase start"
  exit 1
fi

log_success "Connected to Supabase"

echo ""
echo "=========================================="
echo "RPC Integration Tests"
echo "=========================================="
echo ""

# =====================================================
# TEST 1: Create Lead from Guest
# =====================================================

LEAD_ID=""
test_rpc \
  "rpc_create_lead_from_guest" \
  "POST" \
  "rpc_create_lead_from_guest" \
  '{
    "p_guest_session_id": "test-guest-789",
    "p_minimal_request": {
      "destinations": ["Jaipur", "Jodhpur"],
      "nights": 3,
      "pax_adults": 2
    }
  }' \
  200

# Extract lead_id from response if possible
if [ $? -eq 0 ]; then
  LEAD_ID=$(echo "$body" | jq -r '.' 2>/dev/null || echo "")
  if [ -n "$LEAD_ID" ] && [ "$LEAD_ID" != "null" ]; then
    log_info "Created lead ID: $LEAD_ID"
  fi
fi

echo ""

# =====================================================
# TEST 2: Update Lead Stage
# =====================================================

# Get a test lead ID from seed data
TEST_LEAD_ID="l3333333-3333-3333-3333-333333333333"

test_rpc \
  "rpc_update_lead_stage" \
  "POST" \
  "rpc_update_lead_stage" \
  "{
    \"p_lead_id\": \"$TEST_LEAD_ID\",
    \"p_stage\": \"SCOPING\"
  }" \
  200 \
  true

echo ""

# =====================================================
# TEST 3: Send Quote
# =====================================================

# Get a test quote ID from seed data
TEST_QUOTE_ID="q2222222-2222-2222-2222-222222222222"

test_rpc \
  "rpc_send_quote" \
  "POST" \
  "rpc_send_quote" \
  "{
    \"p_quote_id\": \"$TEST_QUOTE_ID\"
  }" \
  200 \
  true

echo ""

# =====================================================
# TEST 4: Create Quote Version
# =====================================================

# Get a test lead ID
TEST_LEAD_ID_FOR_QUOTE="l2222222-2222-2222-2222-222222222222"

test_rpc \
  "rpc_create_quote_version" \
  "POST" \
  "rpc_create_quote_version" \
  "{
    \"p_lead_id\": \"$TEST_LEAD_ID_FOR_QUOTE\",
    \"p_total_amount\": 60000,
    \"p_currency\": \"INR\"
  }" \
  200 \
  true

echo ""

# =====================================================
# TEST 5: Raise Incident
# =====================================================

TEST_TRIP_ID="t1111111-1111-1111-1111-111111111111"

test_rpc \
  "rpc_raise_incident" \
  "POST" \
  "rpc_raise_incident" \
  "{
    \"p_trip_id\": \"$TEST_TRIP_ID\",
    \"p_severity\": \"P2\",
    \"p_category\": \"other\",
    \"p_description\": \"Test incident from automated test\"
  }" \
  200

INCIDENT_ID=""
if [ $? -eq 0 ]; then
  INCIDENT_ID=$(echo "$body" | jq -r '.' 2>/dev/null || echo "")
  if [ -n "$INCIDENT_ID" ] && [ "$INCIDENT_ID" != "null" ]; then
    log_info "Created incident ID: $INCIDENT_ID"
  fi
fi

echo ""

# =====================================================
# TEST 6: Record Post Action
# =====================================================

# Get a test trip post ID
TEST_POST_ID=$(curl -s -X GET \
  "$SUPABASE_URL/rest/v1/trip_posts?trip_id=eq.$TEST_TRIP_ID&limit=1" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" | jq -r '.[0].id' 2>/dev/null || echo "")

if [ -n "$TEST_POST_ID" ] && [ "$TEST_POST_ID" != "null" ]; then
  test_rpc \
    "rpc_record_post_action" \
    "POST" \
    "rpc_record_post_action" \
    "{
      \"p_post_id\": \"$TEST_POST_ID\",
      \"p_action_id\": \"test_action\",
      \"p_payload\": {\"note\": \"Test action from automated test\"}
    }" \
    200
else
  log_skip "rpc_record_post_action (No trip post found)"
fi

echo ""

# =====================================================
# TEST 7: Confirm Booking If Ready
# =====================================================

TEST_BOOKING_ID="b1111111-1111-1111-1111-111111111111"

test_rpc \
  "rpc_confirm_booking_if_ready" \
  "POST" \
  "rpc_confirm_booking_if_ready" \
  "{
    \"p_booking_id\": \"$TEST_BOOKING_ID\"
  }" \
  200 \
  true

echo ""

# =====================================================
# TEST 8: Upload Voucher
# =====================================================

TEST_VENDOR_ID="v1111111-1111-1111-1111-111111111111"

test_rpc \
  "rpc_upload_voucher" \
  "POST" \
  "rpc_upload_voucher" \
  "{
    \"p_booking_id\": \"$TEST_BOOKING_ID\",
    \"p_vendor_id\": \"$TEST_VENDOR_ID\",
    \"p_file_url\": \"test/voucher.pdf\",
    \"p_meta\": {
      \"guest_name\": \"Test Guest\",
      \"check_in\": \"2024-12-15\",
      \"check_out\": \"2024-12-19\",
      \"booking_id\": \"TEST123\"
    }
  }" \
  200 \
  true

echo ""

# =====================================================
# TEST 9: Submit Cancellation
# =====================================================

TEST_BOOKING_ID_CANCEL="b2222222-2222-2222-2222-222222222222"

test_rpc \
  "rpc_submit_cancellation" \
  "POST" \
  "rpc_submit_cancellation" \
  "{
    \"p_booking_id\": \"$TEST_BOOKING_ID_CANCEL\",
    \"p_reason\": \"Test cancellation from automated test\"
  }" \
  200

echo ""

# =====================================================
# TEST 10: Sign URL (Storage)
# =====================================================

test_rpc \
  "rpc_sign_url" \
  "POST" \
  "rpc_sign_url" \
  "{
    \"p_bucket\": \"vouchers\",
    \"p_path\": \"test/voucher.pdf\",
    \"p_expires_in\": 3600
  }" \
  200

echo ""

# =====================================================
# SUMMARY
# =====================================================

echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo -e "${YELLOW}Skipped:${NC} $SKIPPED"
echo "=========================================="

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed!${NC}"
  exit 1
fi

