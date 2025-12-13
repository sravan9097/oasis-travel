# AI Bot Setup Guide

This guide explains how to set up and configure the AI-powered trip planning bot.

## Overview

The AI bot uses Google Gemini 1.5 Flash to have natural conversations with users and extract trip requirements. It runs as a Supabase Edge Function and is called from the mobile app.

## Prerequisites

1. Google AI API key (get one at https://aistudio.google.com/apikey)
2. Supabase project with Edge Functions enabled
3. Supabase CLI installed

## Setup Steps

### 1. Deploy the Edge Function

```bash
# Navigate to project root
cd /path/to/oasis-travel

# Deploy the AI bot edge function
supabase functions deploy ai_bot_chat
```

### 2. Set Google AI API Key

The edge function requires a Google AI API key to be set as a Supabase secret.

#### Option A: Using Supabase CLI (Recommended)

```bash
# Set the secret
supabase secrets set GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

#### Option B: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Add a new secret:
   - **Name**: `GOOGLE_AI_API_KEY`
   - **Value**: Your Google AI API key

### 3. Verify Deployment

You can test the edge function using the Supabase CLI:

```bash
# Test the function locally (if running local Supabase)
supabase functions serve ai_bot_chat

# Or invoke it directly
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/ai_bot_chat' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
      -d '{
    "messages": [],
    "userMessage": "Hello, I want to plan a trip",
    "existingData": {}
  }'
```

### Getting a Google AI API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key (starts with `AIza...`)
5. Set it as a Supabase secret (see Step 2 above)

## Configuration

### Google Gemini Model

The bot currently uses `gemini-1.5-flash` which is cost-effective and suitable for this use case. To change the model, edit:

`supabase/functions/ai_bot_chat/index.ts`

Look for:
```typescript
gemini-1.5-flash:generateContent
```

And change to your preferred model (e.g., `gemini-1.5-pro`, `gemini-pro`).

### System Prompt

The bot's behavior is controlled by the system prompt in the edge function. To customize it, edit:

`supabase/functions/ai_bot_chat/index.ts`

Look for the `systemPrompt` variable and modify as needed.

### Quick Replies

Quick reply options are automatically generated based on the bot's message and context. The logic is in the `generateQuickReplies` function in the edge function.

## Cost Considerations

- **Gemini 1.5 Flash**: Free tier available, then ~$0.075 per 1M input tokens, ~$0.30 per 1M output tokens
- Each conversation typically uses 200-500 tokens per exchange
- Estimated cost: Free tier covers most usage, then ~$0.0001-0.0002 per conversation turn

For 1000 conversations with 5 turns each: Free tier or ~$0.50-1/month after free tier

## Troubleshooting

### Error: "GOOGLE_AI_API_KEY environment variable is not set"

**Solution**: Make sure you've set the secret using `supabase secrets set GOOGLE_AI_API_KEY=your_key`

### Error: "Google AI API error: Insufficient quota"

**Solution**: Check your Google Cloud account billing and ensure you have credits available. Google AI Studio provides free tier usage.

### Bot not extracting data correctly

**Solution**: 
1. Check the function calling schema in the edge function
2. Verify the system prompt is clear about what to extract
3. Test with simpler user inputs first

### Edge function timeout

**Solution**: 
- The function makes 1-2 API calls to OpenAI per user message
- If timeouts occur, consider:
  - Using a faster model (gpt-3.5-turbo is already fast)
  - Reducing conversation history length
  - Implementing caching for common queries

## Testing

### Local Testing

```bash
# Start local Supabase
supabase start

# Serve edge functions locally
supabase functions serve ai_bot_chat

# Test with curl
curl -X POST \
  'http://localhost:54321/functions/v1/ai_bot_chat' \
  -H 'Authorization: Bearer YOUR_LOCAL_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [],
    "userMessage": "I want to visit Udaipur for 3 nights with 2 adults",
    "existingData": {}
  }'
```

### Mobile App Testing

1. Ensure the mobile app is configured with the correct Supabase URL and keys
2. Navigate to the bot screen in the app
3. Start a conversation and verify:
   - Bot responds naturally
   - Data is extracted correctly
   - Quick replies appear when appropriate
   - Submit button appears when minimum data is collected

## Monitoring

### View Edge Function Logs

```bash
# Using Supabase CLI
supabase functions logs ai_bot_chat

# Or in Supabase Dashboard
# Go to Edge Functions → ai_bot_chat → Logs
```

### Key Metrics to Monitor

- Function invocation count
- Average response time
- Error rate
- Google AI API errors
- Token usage (if tracking)

## Security

- **API Key**: Never commit the Google AI API key to version control
- **Secrets**: Always use Supabase secrets for sensitive data
- **RLS**: The edge function uses service role key internally, but user data is still protected by RLS
- **Rate Limiting**: Consider implementing rate limiting for production use

## Future Enhancements

- Operator-configurable quick replies
- Conversation history persistence
- Multi-language support
- Custom training/fine-tuning
- Analytics dashboard for conversation quality

## Support

For issues or questions:
1. Check the edge function logs
2. Review OpenAI API status
3. Verify Supabase project configuration
4. Check the main project README for general setup issues

