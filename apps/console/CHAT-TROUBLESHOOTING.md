# Chat Bot Configuration & Troubleshooting Guide

## ✅ Issue Fixed!

The chat bot was not working because the admin console was missing the Supabase environment variables.

### What Was Fixed

Created `/apps/console/.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

## 🏗️ System Architecture

The chat bot uses the following components:

1. **Frontend (Console)**: `/apps/console/app/chat/page.tsx`

   - Web-based React chat interface
   - Uses `@oasis/api` package to call edge functions

2. **API Package**: `packages/api/src/edge-functions.ts`

   - `chatWithBot()` function
   - Handles communication with Supabase edge functions

3. **Edge Function**: `supabase/functions/ai_bot_chat/index.ts`

   - Processes chat messages
   - Calls Ollama API for LLM responses
   - Extracts trip data from conversations

4. **LLM Service**: Ollama (Local)
   - Running on `http://127.0.0.1:11434`
   - Model: `tinyllama:1.1b` (fast, 2-5 second responses)
   - Alternative models available: `llama2:7b`, `deepseek-r1:7b`

## 🔧 How to Test

### 1. Check All Services Are Running

```bash
# 1. Check Ollama
curl http://127.0.0.1:11434/api/tags
# Should return list of available models

# 2. Check Supabase
cd /path/to/oasis-travel
supabase status
# Should show "supabase local development setup is running"

# 3. Start Console App
cd apps/console
npm run dev
# Should start on http://localhost:3000
```

### 2. Test the Chat

1. Open browser to `http://localhost:3000`
2. Login to admin console (DEV_MODE bypasses auth)
3. Click "Chat Assistant" (💬) in the sidebar
4. Start chatting - should see welcome message

### 3. Expected Behavior

- ✅ Welcome message appears automatically
- ✅ Bot asks "Where would you like to go?"
- ✅ Quick reply buttons appear
- ✅ Typing indicator shows while bot is processing
- ✅ Bot extracts trip data (shown at bottom of chat)
- ✅ Package cards appear when destination + nights are provided

## 🐛 Troubleshooting

### Issue: "Missing authorization header"

**Cause**: Console app doesn't have Supabase credentials

**Fix**: Create `/apps/console/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

### Issue: "Error: Supabase not initialized"

**Cause**: Missing environment variables

**Fix**:

1. Ensure `.env.local` exists in `/apps/console/`
2. Restart the Next.js dev server: `npm run dev`

### Issue: Bot takes a long time to respond

**Cause**: Using a slow model or first request (model loading)

**Fix**: Use a faster model in edge function:

```typescript
// In supabase/functions/ai_bot_chat/index.ts, line 532
model: 'tinyllama:1.1b', // Fast (2-5s responses)
// OR
model: 'llama2:7b',      // Better quality but slower (10-30s)
```

### Issue: "Cannot connect to Ollama"

**Cause**: Ollama service not running

**Fix**:

```bash
# Check if Ollama is running
curl http://127.0.0.1:11434/api/tags

# If not, start Ollama
ollama serve

# Verify tinyllama model is available
ollama list
# If not listed, pull it:
ollama pull tinyllama:1.1b
```

### Issue: Bot returns fallback responses

**Cause**: Ollama API error or timeout

**Check**:

1. Look at edge function logs in terminal running `supabase start`
2. Check for error messages with `[DEBUG]` prefix
3. Verify Ollama endpoint in environment:
   ```bash
   # In root .env.local
   ANYTHINGLLM_ENDPOINT=http://127.0.0.1:11434
   ```

## 📊 Debug Information

### View Edge Function Logs

When testing chat:

1. Watch the terminal where you ran `supabase start`
2. Look for `[DEBUG A/B/C/D/E]` log messages
3. These show the full flow through the edge function

### Test Edge Function Directly

```bash
# Health check
curl http://127.0.0.1:54321/functions/v1/ai_bot_chat/health \
  -H "Authorization: Bearer sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"

# Test chat (replace with your anon key)
curl -X POST http://127.0.0.1:54321/functions/v1/ai_bot_chat \
  -H "Authorization: Bearer sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" \
  -H "apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" \
  -H "Content-Type: application/json" \
  -d '{"messages": [], "userMessage": "Hello", "existingData": {}}'
```

### Check Extracted Data

The chat page shows extracted trip data at the bottom in a blue debug panel:

```json
{
  "destinations": ["Goa"],
  "nights": 3,
  "pax_adults": 2
}
```

## 🔐 Environment Variables Reference

### Console App (`.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
```

### Root Directory (`.env.local`)

```bash
ANYTHINGLLM_API_KEY=T19EM3P-BR3MSWZ-PJWQ4ZC-7BNQ0FG
ANYTHINGLLM_ENDPOINT=http://127.0.0.1:11434
ANYTHINGLLM_WORKSPACE=default
```

### Supabase Config (`supabase/config.toml`)

```toml
[env.anon_key]
ANYTHINGLLM_API_KEY = "env(ANYTHINGLLM_API_KEY)"
ANYTHINGLLM_ENDPOINT = "env(ANYTHINGLLM_ENDPOINT)"
ANYTHINGLLM_WORKSPACE = "env(ANYTHINGLLM_WORKSPACE)"
```

## 🎯 Testing Checklist

- [ ] Ollama is running (`curl http://127.0.0.1:11434/api/tags`)
- [ ] Supabase is running (`supabase status`)
- [ ] Console `.env.local` exists with correct values
- [ ] Root `.env.local` has Ollama configuration
- [ ] Console dev server is running (`npm run dev`)
- [ ] Can access chat page at `http://localhost:3000/chat`
- [ ] Welcome message appears automatically
- [ ] Bot responds to user messages
- [ ] Typing indicator works
- [ ] Quick reply buttons work
- [ ] Extracted data shows at bottom

## 📚 Additional Resources

- **Full setup guide**: `MIGRATION_COMPLETE.md`
- **LLM configuration**: `ANYTHINGLLM_SETUP.md` (if exists)
- **Test scripts**:
  - `test-llm-integration.sh` - Tests Ollama integration
  - `test-e2e.sh` - End-to-end chat tests

## 🚀 Quick Fix Commands

```bash
# Restart everything from scratch
cd /path/to/oasis-travel

# 1. Stop Supabase
supabase stop

# 2. Start Ollama (if not running)
ollama serve &

# 3. Start Supabase
supabase start

# 4. Start console
cd apps/console
npm run dev

# 5. Open browser
open http://localhost:3000/chat
```

## ✅ Success Indicators

When everything is working correctly:

1. **Chat loads**: Welcome message appears within 1 second
2. **Bot responds**: First bot message appears within 2-5 seconds
3. **Quick replies work**: Clicking buttons sends messages
4. **Data extraction works**: Debug panel shows extracted trip info
5. **No error messages**: No red errors in browser console or terminal

If you see any of these issues, check the troubleshooting section above.
