# Troubleshooting AI Bot Issues

## Common Issues and Solutions

### 1. "Function not found" or 404 Error

**Symptoms:**
- Error message: "The chat service is not available"
- Bot doesn't respond to messages

**Solutions:**
1. **Check if edge function is deployed:**
   ```bash
   supabase functions list
   ```
   
2. **Deploy the edge function:**
   ```bash
   supabase functions deploy ai_bot_chat
   ```

3. **Verify the function name matches:**
   - Function name should be exactly: `ai_bot_chat`
   - Check in `supabase/functions/ai_bot_chat/index.ts`

### 2. "GOOGLE_AI_API_KEY environment variable is not set"

**Symptoms:**
- Error message: "The chat service is not configured"
- Bot fails immediately

**Solutions:**
1. **Get a Google AI API key:**
   - Go to https://aistudio.google.com/apikey
   - Create an API key

2. **Set the secret:**
   ```bash
   supabase secrets set GOOGLE_AI_API_KEY=your_api_key_here
   ```

3. **Verify the secret is set:**
   ```bash
   supabase secrets list
   ```

4. **Redeploy the function after setting the secret:**
   ```bash
   supabase functions deploy ai_bot_chat
   ```

### 3. "Google AI API error" or API Errors

**Symptoms:**
- Error messages from Google AI API
- Bot responses fail

**Solutions:**
1. **Check API key validity:**
   - Verify the API key is correct
   - Check if API key has restrictions that block requests

2. **Check API quota:**
   - Go to Google Cloud Console
   - Check if you've exceeded free tier limits

3. **Verify API is enabled:**
   - Ensure Gemini API is enabled in Google Cloud Console
   - Go to APIs & Services > Library > Search "Gemini API"

4. **Check API key permissions:**
   - API key should have access to Generative Language API

### 4. "Response was blocked by safety filters"

**Symptoms:**
- Error: "Your message was blocked by content filters"
- Bot doesn't respond to certain messages

**Solutions:**
1. **Rephrase the message:**
   - Google's safety filters may block certain content
   - Try rephrasing the user's message

2. **Check safety settings:**
   - In Google AI Studio, adjust safety settings if needed
   - Some content may be too sensitive

### 5. Empty or No Response

**Symptoms:**
- Bot sends empty messages
- No response from bot

**Solutions:**
1. **Check edge function logs:**
   ```bash
   supabase functions logs ai_bot_chat
   ```

2. **Verify Gemini API response:**
   - Check logs for Gemini API responses
   - Look for errors in the response structure

3. **Check response parsing:**
   - The function expects specific response format
   - Verify the response structure matches expectations

### 6. Network/Connection Errors

**Symptoms:**
- Timeout errors
- Connection refused

**Solutions:**
1. **Check Supabase project status:**
   - Verify project is active
   - Check if there are any service issues

2. **Check network connectivity:**
   - Verify device has internet connection
   - Check if Supabase URL is correct

3. **Verify Supabase configuration:**
   - Check `EXPO_PUBLIC_SUPABASE_URL` in mobile app
   - Verify `EXPO_PUBLIC_SUPABASE_ANON_KEY` is set

## Testing the Edge Function

### Test Locally

1. **Start local Supabase:**
   ```bash
   supabase start
   ```

2. **Serve edge functions:**
   ```bash
   supabase functions serve ai_bot_chat
   ```

3. **Test with curl:**
   ```bash
   curl -X POST \
     'http://localhost:54321/functions/v1/ai_bot_chat' \
     -H 'Authorization: Bearer YOUR_LOCAL_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{
       "messages": [],
       "userMessage": "Hello, I want to plan a trip",
       "existingData": {}
     }'
   ```

### Test Deployed Function

Use the test script:
```bash
./test-bot-function.sh
```

Or manually:
```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/ai_bot_chat' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [],
    "userMessage": "Hello, I want to plan a trip to Udaipur",
    "existingData": {}
  }'
```

## Checking Logs

### Edge Function Logs

```bash
# View recent logs
supabase functions logs ai_bot_chat

# View logs with tail
supabase functions logs ai_bot_chat --tail

# View logs in Supabase Dashboard
# Go to: Edge Functions > ai_bot_chat > Logs
```

### Mobile App Logs

Check React Native debugger or console for:
- Error messages
- Network request failures
- API response errors

## Debugging Steps

1. **Check edge function is deployed:**
   ```bash
   supabase functions list
   ```

2. **Verify API key is set:**
   ```bash
   supabase secrets list
   ```

3. **Test the function directly:**
   - Use the test script or curl command above

4. **Check function logs:**
   - Look for error messages
   - Check for API key issues
   - Verify Gemini API responses

5. **Verify mobile app configuration:**
   - Check Supabase URL and keys in `.env`
   - Verify the app can connect to Supabase

6. **Test with a simple message:**
   - Try: "Hello"
   - Check if basic communication works

## Common Error Messages

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Function not found" | Edge function not deployed | Deploy the function |
| "GOOGLE_AI_API_KEY not set" | API key missing | Set the secret |
| "Google AI API error: 401" | Invalid API key | Check API key |
| "Google AI API error: 429" | Rate limit exceeded | Wait or upgrade plan |
| "Response was blocked by safety filters" | Content blocked | Rephrase message |
| "No response candidates" | API returned empty | Check API status |

## Getting Help

If issues persist:
1. Check Supabase status page
2. Check Google AI status
3. Review edge function logs
4. Test with curl to isolate the issue
5. Check mobile app console for errors

