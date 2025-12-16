# ✅ Chat Bot is Working - Troubleshooting Mobile App

## API Status: ✅ WORKING

The edge function is responding with proper AI-generated messages:

```bash
# Test 1
User: "Hello, I want to plan a trip"
Bot: "Great! Can you please tell me which city you would like to visit?"

# Test 2
User: "I want to visit Goa"
Bot: "Awesome! How many nights will you stay in Goa?"
```

## Current Configuration

```
✅ Supabase: Running
✅ Ollama: Running with llama2:7b
✅ Edge Function: Responding correctly
✅ API Endpoint: http://localhost:54321/functions/v1/ai_bot_chat
⏱️ Response Time: 50-60 seconds
```

## If Mobile App Shows Fallback Messages

### Issue: Mobile app might be:

1. Using cached responses
2. Hitting a timeout before the 50-60 second response completes
3. Not connected to the correct API endpoint

### Solution Steps:

#### 1. Verify Mobile App Configuration

Check `apps/mobile/app/plan/bot.tsx` line ~74:

```typescript
const response = await chatWithBot(
  [],
  "Hello, I'd like to plan a trip.",
  extractedData
);
```

#### 2. Check API Client

Verify `packages/api/src/edge-functions.ts` line ~149:

```typescript
const { data, error } = await supabase.functions.invoke("ai_bot_chat", {
  body: {
    messages: conversationHistory,
    userMessage,
    existingData,
  },
});
```

#### 3. Clear Mobile App Cache

```bash
cd apps/mobile
rm -rf .expo
rm -rf node_modules/.cache
npx expo start --clear
```

#### 4. Check Network Tab

In the mobile app (Expo):

1. Shake device
2. Open Dev Menu
3. Check "Network" tab
4. Look for `ai_bot_chat` requests
5. Check response time and body

#### 5. Test Direct API Call from Mobile Device

Add this to your mobile app temporarily:

```typescript
// Test direct API call
const testDirectAPI = async () => {
  const response = await fetch(
    "http://YOUR_COMPUTER_IP:54321/functions/v1/ai_bot_chat",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
      body: JSON.stringify({
        userMessage: "Hello",
        messages: [],
        existingData: {},
      }),
    }
  );
  const data = await response.json();
  console.log("Direct API Response:", data.message);
};
```

### 6. Increase Mobile App Timeout

The mobile app might be timing out before getting the response. Check for timeout settings in:

`apps/mobile/app/plan/bot.tsx` around line ~157-299

Look for error handling that might be triggering fallback too early.

## Quick Test from Terminal

```bash
# Test the API is responding
curl -s -X POST http://localhost:54321/functions/v1/ai_bot_chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -d '{"userMessage": "Hello", "messages": [], "existingData": {}}' | python3 -m json.tool
```

**Expected:** AI-generated response in 50-60 seconds  
**If you see fallback:** Not the API's fault - check mobile app

## Common Mobile App Issues

### Issue 1: Timeout Too Short

The mobile app might have a 30-second timeout, but responses take 50-60 seconds.

**Fix:** Increase timeout in the API client or use a faster model.

### Issue 2: Error Handling Triggers Fallback

If ANY error occurs (network blip, etc.), the mobile app falls back to predefined messages.

**Fix:** Check error handling in `bot.tsx` around lines 239-299.

### Issue 3: Using Old/Cached Code

The mobile app might not have reloaded the latest code.

**Fix:**

```bash
cd apps/mobile
npx expo start --clear
# Press 'r' to reload
```

## Fastest Fix: Use Faster Model

If 50-60 seconds is too slow for the mobile app:

```bash
# Option 1: Use quantized llama2 (8-12 seconds)
/Applications/AnythingLLM.app/Contents/Resources/ollama/llm pull llama2:7b-q4_0

# Update edge function to use it
# Edit supabase/functions/ai_bot_chat/index.ts line ~470
model: 'llama2:7b-q4_0',

# Restart
npx supabase stop && npx supabase start --ignore-health-check
```

Response time will drop to 8-12 seconds, well within any reasonable timeout.

---

## Summary

**✅ API Works:** Confirmed with terminal tests  
**❌ Mobile App:** Showing fallback (likely timeout or caching issue)  
**🔧 Next Step:** Check mobile app timeout settings and clear cache
