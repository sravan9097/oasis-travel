# Kong Gateway Timeout Issue & Solutions

## Problem

The Supabase Kong gateway has a hardcoded timeout of **150 seconds (2.5 minutes)** for edge function requests. When using slower LLM models like `llama2:7b` or `deepseek-r1:7b`, responses can take 15-60+ seconds, which sometimes triggers the timeout.

## Current Status

- ✅ **Ollama Integration**: Working perfectly
- ✅ **Edge Function**: No timeout limits (5-minute timeout configured)
- ❌ **Kong Gateway**: 150-second timeout (cannot be easily changed in local Supabase)

## Solutions

### Option 1: Use a Faster Model (Recommended for Testing)

Pull and use `tinyllama` which responds in 2-5 seconds:

```bash
# Pull the model
/Applications/AnythingLLM.app/Contents/Resources/ollama/llm pull tinyllama:1.1b

# Update the edge function
# Edit: supabase/functions/ai_bot_chat/index.ts
# Line ~460: Change model to 'tinyllama:1.1b'

# Restart Supabase
npx supabase stop && npx supabase start --ignore-health-check
```

**Pros:** Fast responses (2-5 seconds), no timeouts  
**Cons:** Lower quality responses than llama2

### Option 2: Use Quantized llama2 (Balanced)

```bash
# Pull quantized model (faster, slightly less quality)
/Applications/AnythingLLM.app/Contents/Resources/ollama/llm pull llama2:7b-q4_0
```

**Response Time:** 8-12 seconds  
**Quality:** Good

### Option 3: Deploy to Production

In production Supabase, you can configure Kong timeouts via the dashboard or API.

### Option 4: Workaround - Direct Edge Runtime Access (Development Only)

For local testing, you can call the edge runtime directly, bypassing Kong:

**Not recommended** - requires network configuration changes

## Recommended Approach for Your Testing

1. **Use tinyllama for rapid testing**:

   ```bash
   /Applications/AnythingLLM.app/Contents/Resources/ollama/llm pull tinyllama:1.1b
   ```

2. **Update edge function** (`supabase/functions/ai_bot_chat/index.ts`):

   ```typescript
   model: 'tinyllama:1.1b', // Fast for testing
   ```

3. **Restart**:

   ```bash
   npx supabase stop && npx supabase start --ignore-health-check
   ```

4. **Test** - responses will be under 10 seconds

5. **Switch to better model later** when deploying to production

## Model Comparison

| Model          | Size  | Response Time | Quality   | Best For              |
| -------------- | ----- | ------------- | --------- | --------------------- |
| tinyllama:1.1b | 637MB | 2-5s          | Basic     | Fast testing          |
| llama2:7b-q4_0 | 3.8GB | 8-12s         | Good      | Balanced              |
| llama2:7b      | 3.8GB | 15-25s        | Very Good | Quality (may timeout) |
| deepseek-r1:7b | 4.7GB | 50-90s        | Excellent | Production only       |

## Production Deployment Notes

When deploying to production Supabase:

1. Contact Supabase support to increase Kong timeout
2. Or use Supabase Pro plan with custom Kong config
3. Or deploy edge functions separately from Supabase
4. Or use a faster model in production

## Current Configuration

```
LLM Timeout (Edge Function): 300 seconds (5 minutes) ✅
Kong Gateway Timeout: 150 seconds (2.5 minutes) ❌ Bottleneck
```

**Bottleneck:** Kong timeout kicks in before LLM can finish with slow models.

---

**Recommendation:** Switch to `tinyllama:1.1b` for testing, it works perfectly with the current setup!
