#!/bin/bash

# End-to-end test for the chat bot with Ollama
# This script starts Supabase, tests the edge function, and makes a real API call

set -e

echo "🧪 End-to-End Chat Bot Test"
echo "============================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Ollama is running
echo "1️⃣  Checking Ollama..."
if ! curl -s http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
    echo -e "${RED}✗${NC} Ollama is not running!"
    echo "   Please start Ollama: ollama serve"
    exit 1
fi
echo -e "${GREEN}✓${NC} Ollama is running"
echo ""

# Start Supabase if not running
echo "2️⃣  Checking Supabase..."
if ! curl -s http://localhost:54321/rest/v1/ > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC}  Supabase not running, starting it..."
    cd supabase
    npx supabase start > /dev/null 2>&1 &
    SUPABASE_PID=$!
    
    # Wait for Supabase to start (max 60 seconds)
    for i in {1..60}; do
        if curl -s http://localhost:54321/rest/v1/ > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} Supabase started successfully"
            break
        fi
        sleep 1
        echo -n "."
    done
    echo ""
    cd ..
else
    echo -e "${GREEN}✓${NC} Supabase is already running"
fi
echo ""

# Wait a bit for edge functions to be ready
sleep 2

# Test the health endpoint
echo "3️⃣  Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:54321/functions/v1/ai_bot_chat/health 2>&1)

if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓${NC} Health endpoint is responding"
    
    AI_CONFIGURED=$(echo "$HEALTH_RESPONSE" | grep -o '"aiConfigured":[^,}]*' | cut -d':' -f2)
    USING_LOCAL=$(echo "$HEALTH_RESPONSE" | grep -o '"usingLocalOllama":[^,}]*' | cut -d':' -f2)
    
    echo "   AI Configured: $AI_CONFIGURED"
    echo "   Using Local Ollama: $USING_LOCAL"
else
    echo -e "${RED}✗${NC} Health endpoint error"
    echo "   Response: $HEALTH_RESPONSE"
    exit 1
fi
echo ""

# Test the chat endpoint with a simple message
echo "4️⃣  Testing chat endpoint..."
echo "   Sending test message: 'I want to visit Goa'"
echo ""

CHAT_RESPONSE=$(curl -s -X POST http://localhost:54321/functions/v1/ai_bot_chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -d '{
    "userMessage": "I want to visit Goa",
    "messages": [],
    "existingData": {}
  }' 2>&1)

if echo "$CHAT_RESPONSE" | grep -q '"message"'; then
    echo -e "${GREEN}✓${NC} Chat endpoint is working!"
    echo ""
    
    # Extract and display the response message
    MESSAGE=$(echo "$CHAT_RESPONSE" | grep -o '"message":"[^"]*"' | head -1 | cut -d'"' -f4 | sed 's/\\n/\n       /g')
    echo "   Bot Response:"
    echo "   --------------"
    echo "   $MESSAGE"
    echo "   --------------"
    echo ""
    
    # Check if data was extracted
    if echo "$CHAT_RESPONSE" | grep -q '"destinations"'; then
        echo -e "${GREEN}✓${NC} Data extraction is working"
        DESTINATIONS=$(echo "$CHAT_RESPONSE" | grep -o '"destinations":\[[^]]*\]' | head -1)
        echo "   Extracted: $DESTINATIONS"
    fi
else
    echo -e "${RED}✗${NC} Chat endpoint error"
    echo "   Response: $CHAT_RESPONSE"
    exit 1
fi
echo ""

echo "============================"
echo -e "${GREEN}✅ All tests passed!${NC}"
echo ""
echo "Your chat bot is ready to use! 🎉"
echo ""
echo "Next steps:"
echo "1. Open your mobile app: cd apps/mobile && npm run start"
echo "2. Navigate to the 'Plan' tab"
echo "3. Start chatting with the bot"
echo ""
echo "The bot is now powered by your local Ollama instance!"
