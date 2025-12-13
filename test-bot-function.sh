#!/bin/bash

# Test script for AI bot edge function
# Usage: ./test-bot-function.sh

echo "Testing AI Bot Edge Function..."
echo ""

# Get Supabase URL and anon key from environment or prompt
if [ -z "$SUPABASE_URL" ]; then
  read -p "Enter your Supabase URL: " SUPABASE_URL
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
  read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY
fi

echo ""
echo "Testing with basic message..."
echo ""

curl -X POST \
  "${SUPABASE_URL}/functions/v1/ai_bot_chat" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [],
    "userMessage": "Hello, I want to plan a trip to Udaipur",
    "existingData": {}
  }' \
  | jq '.'

echo ""
echo "Test complete!"

