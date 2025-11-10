#!/bin/bash

# Setup Test Users for Console Development
# This script helps create test users for quick login during development

set -e

echo "🔧 Setting up test users for Oasis Console..."

# Get Supabase service role key from environment or prompt
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "⚠️  SUPABASE_SERVICE_ROLE_KEY not set"
  echo "   You can find it by running: supabase status"
  echo ""
  read -p "Enter Supabase Service Role Key (or press Enter to skip): " SERVICE_KEY
  if [ -z "$SERVICE_KEY" ]; then
    echo "❌ Service key required. Exiting."
    exit 1
  fi
  export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_KEY"
fi

SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"

echo "📧 Creating test users..."

# Create admin user
echo "Creating admin@oasistravel.com..."
curl -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@oasistravel.com",
    "email_confirm": true,
    "user_metadata": {
      "role": "admin"
    }
  }' 2>/dev/null | jq -r '.id // empty' | head -1

# Create operator user
echo "Creating operator@oasistravel.com..."
curl -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operator@oasistravel.com",
    "email_confirm": true,
    "user_metadata": {
      "role": "operator"
    }
  }' 2>/dev/null | jq -r '.id // empty' | head -1

echo ""
echo "✅ Test users created!"
echo ""
echo "📝 Next steps:"
echo "   1. Check Supabase logs for OTP codes: supabase logs --follow"
echo "   2. Or use the Quick Login buttons on the login page"
echo "   3. Or check your email for magic links"
echo ""
echo "💡 Tip: In local Supabase, OTP codes are printed to logs"

