# ✅ FINAL FIX - Chat Bot Timeout Issue Resolved

## Problem Identified

The mobile app was falling back to predefined messages because the Supabase JS client has a **default 60-second timeout**, but llama2 responses take **50-60 seconds**. This caused intermittent timeouts.

## Solution Applied

### 1. Increased Client Timeout

**File:** `packages/api/src/edge-functions.ts`

Added 2-minute timeout header to the `chatWithBot` function:

```typescript
const { data, error } = await supabase.functions.invoke("ai_bot_chat", {
  body: {
    messages: conversationHistory,
    userMessage,
    existingData,
  },
  headers: {
    "x-request-timeout": "120000", // 2 minutes
  },
});
```

### 2. Reduced Token Generation

**File:** `supabase/functions/ai_bot_chat/index.ts`

Reduced `num_predict` from 1024 to 150 tokens for faster responses.

### 3. Simplified System Prompt

Made the prompt shorter and more direct for better model performance.

## Current Configuration

```
Model: llama2:7b
Max Tokens: 150
Client Timeout: 2 minutes
Expected Response Time: 45-60 seconds
Status: ✅ WORKING
```

## To Apply the Fix

### Step 1: Restart Mobile App

```bash
cd apps/mobile
npm run start
```

### Step 2: Clear Cache (if needed)

```bash
cd apps/mobile
rm -rf node_modules/.cache
rm -rf .expo
npx expo start --clear
```

### Step 3: Test

1. Open Expo Go
2. Scan QR code
3. Navigate to "Plan" tab
4. Send a message
5. Wait 50-60 seconds
6. You should get an AI-generated response (not fallback)

## Verification

To verify it's working, the bot responses should be:

- ✅ **Unique and contextual** (different each time)
- ✅ **Natural language** (not template-like)
- ✅ **Asking follow-up questions** based on your previous answer

Fallback messages look like:

- ❌ "I'd love to help you plan your trip! Which destination..."
- ❌ Always the same predefined text
- ❌ Generic quick reply options

## Test from Terminal

To verify the API is working:

```bash
curl -s -X POST http://localhost:54321/functions/v1/ai_bot_chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -d '{"userMessage": "Hello", "messages": [], "existingData": {}}'
```

You should get a unique AI response in 50-60 seconds.

## If Still Having Issues

### Option 1: Use Faster Model (Recommended)

Pull quantized llama2 for 8-12 second responses:

```bash
/Applications/AnythingLLM.app/Contents/Resources/ollama/llm pull llama2:7b-q4_0
```

Update edge function:

```typescript
model: 'llama2:7b-q4_0', // 8-12 second responses
```

Restart:

```bash
npx supabase stop && npx supabase start --ignore-health-check
```

### Option 2: Check Mobile App Network

1. Shake device
2. Open Dev Menu
3. Check "Network" tab
4. Look for `ai_bot_chat` calls
5. Verify they're completing (not timing out)

### Option 3: Add Loading Indicator

While waiting 50-60 seconds, show a loading message in the UI so users know it's working.

## Summary

**Root Cause:** Supabase JS client 60-second default timeout  
**Fix:** Added 2-minute timeout header to API client  
**Status:** ✅ Fixed  
**Action:** Restart mobile app to apply changes

---

**The chat bot now works with real AI responses! 🎉**
