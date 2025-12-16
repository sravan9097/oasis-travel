#!/bin/bash

# Test script for AnythingLLM/Ollama integration
# This script tests the chat bot's connection to the local LLM

set -e

echo "🧪 Testing AnythingLLM/Ollama Integration"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if Ollama is running
echo "📡 Test 1: Checking if Ollama is running..."
if curl -s http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Ollama is running on port 11434"
    
    # Get available models
    MODELS=$(curl -s http://127.0.0.1:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    echo "  Available models:"
    echo "$MODELS" | while read -r model; do
        echo "  - $model"
    done
else
    echo -e "${RED}✗${NC} Ollama is not running on port 11434"
    echo "  Please start Ollama: ollama serve"
    exit 1
fi
echo ""

# Test 2: Check environment variables
echo "🔑 Test 2: Checking environment variables..."
if [ -f .env.local ]; then
    echo -e "${GREEN}✓${NC} .env.local file exists"
    
    if grep -q "ANYTHINGLLM_ENDPOINT" .env.local; then
        ENDPOINT=$(grep "ANYTHINGLLM_ENDPOINT" .env.local | cut -d'=' -f2)
        echo "  ANYTHINGLLM_ENDPOINT: $ENDPOINT"
    fi
else
    echo -e "${YELLOW}⚠${NC}  .env.local file not found (will use defaults)"
fi
echo ""

# Test 3: Check Supabase configuration
echo "⚙️  Test 3: Checking Supabase configuration..."
if [ -f supabase/config.toml ]; then
    if grep -q "ANYTHINGLLM_API_KEY" supabase/config.toml; then
        echo -e "${GREEN}✓${NC} Supabase config.toml has AnythingLLM settings"
    else
        echo -e "${RED}✗${NC} Supabase config.toml missing AnythingLLM settings"
    fi
else
    echo -e "${RED}✗${NC} supabase/config.toml not found"
fi
echo ""

# Test 4: Test Ollama API directly
echo "🤖 Test 4: Testing Ollama API..."
TEST_RESPONSE=$(curl -s -X POST http://127.0.0.1:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-r1:7b",
    "messages": [
      {
        "role": "user",
        "content": "Say hello in one word"
      }
    ],
    "stream": false
  }' 2>&1)

if echo "$TEST_RESPONSE" | grep -q '"message"'; then
    echo -e "${GREEN}✓${NC} Ollama API is responding correctly"
    RESPONSE_TEXT=$(echo "$TEST_RESPONSE" | grep -o '"content":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "  Response: $RESPONSE_TEXT"
else
    echo -e "${RED}✗${NC} Ollama API returned an error"
    echo "  Response: $TEST_RESPONSE"
fi
echo ""

# Test 5: Check if Supabase is running
echo "🗄️  Test 5: Checking if Supabase is running..."
if curl -s http://localhost:54321/rest/v1/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Supabase is running"
else
    echo -e "${YELLOW}⚠${NC}  Supabase is not running"
    echo "  Start it with: cd supabase && npx supabase start"
fi
echo ""

echo "========================================"
echo "✅ Integration test complete!"
echo ""
echo "Next steps:"
echo "1. If Supabase is not running: cd supabase && npx supabase start"
echo "2. Start the mobile app: cd apps/mobile && npm run start"
echo "3. Test the chat interface in the app"
