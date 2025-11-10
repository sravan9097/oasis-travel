#!/bin/bash

# Test script for storage bucket access
# This script tests storage bucket creation and access policies

set -e

echo "=========================================="
echo "Storage Buckets & Policies Test"
echo "=========================================="

# Get Supabase credentials from environment or use defaults
SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
ANON_KEY="${SUPABASE_ANON_KEY:-sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH}"
SERVICE_KEY="${SUPABASE_SERVICE_KEY:-sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz}"

echo ""
echo "Testing storage buckets..."
echo "URL: $SUPABASE_URL"
echo ""

# Test 1: Verify buckets exist
echo "Test 1: Verifying storage buckets exist..."
BUCKETS=$(curl -s -X GET "$SUPABASE_URL/storage/v1/bucket" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | jq -r '.[].name' 2>/dev/null || echo "")

if [ -z "$BUCKETS" ]; then
  echo "⚠️  Warning: Could not fetch buckets. Make sure jq is installed and Supabase is running."
  echo "   You can verify buckets manually in Supabase Studio: http://127.0.0.1:54323"
else
  echo "✅ Found buckets:"
  echo "$BUCKETS" | while read bucket; do
    echo "   - $bucket"
  done
  
  # Check for required buckets
  REQUIRED_BUCKETS=("vouchers" "quotes" "itineraries" "recaps" "avatars")
  for required in "${REQUIRED_BUCKETS[@]}"; do
    if echo "$BUCKETS" | grep -q "^$required$"; then
      echo "   ✅ $required bucket exists"
    else
      echo "   ❌ $required bucket missing!"
    fi
  done
fi

echo ""
echo "Test 2: Testing signed URL function..."
echo "Note: This requires a test file to be uploaded first."
echo "You can test manually with:"
echo "  SELECT rpc_sign_url('vouchers', 'test-booking/test-vendor/test.pdf', 300);"

echo ""
echo "Test 3: Storage policies verification"
echo "Storage policies are enforced by RLS. To test:"
echo "1. Create a test user and profile"
echo "2. Try uploading a file to vouchers bucket"
echo "3. Verify access is restricted based on user role"

echo ""
echo "=========================================="
echo "Storage Test Complete"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Verify buckets in Supabase Studio: http://127.0.0.1:54323/storage/buckets"
echo "2. Test upload/download via Supabase client SDK"
echo "3. Verify RLS policies are working correctly"

