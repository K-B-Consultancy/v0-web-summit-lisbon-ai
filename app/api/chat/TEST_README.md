# Chat API Tests

This directory contains tests for the Chat API implementation to validate the expected behavior of the ChatGPT/OpenAI integration.

## Running the Tests

```bash
npm run test:chat
```

This will run both test files:
1. `route.test.js` - Static code analysis and configuration validation
2. `route.mock-test.js` - Mock simulation of the multi-step AI response flow

## Test Files

### 1. route.test.js
**Purpose**: Validates the static code structure and configuration

**What it tests**:
- ✅ Correct imports (createOpenAI from @ai-sdk/openai)
- ✅ Model initialization uses object, not string
- ✅ maxSteps parameter is configured (>1 for multi-step)
- ✅ API key configuration (GITHUB_TOKEN and OPENAI_API_KEY)
- ✅ Tools are properly defined (getTalks, searchTranscripts, showVideo)
- ✅ System message instructs AI to respond with text
- ✅ Response uses toUIMessageStreamResponse
- ✅ Proper logging for debugging
- ✅ GitHub Models API base URL

**Expected Output**: 10/10 tests passed

### 2. route.mock-test.js
**Purpose**: Simulates the actual multi-step flow of AI responses

**What it tests**:
- ✅ Model initialization process
- ✅ streamText configuration with maxSteps
- ✅ Multi-step flow: tool call → tool result → text generation
- ✅ Response streaming configuration

**Expected Output**: All mock tests passed

## Expected Behavior

When working correctly, the chat API should:

1. **Initialize Model**: Create OpenAI provider with `createOpenAI()`
2. **Configure Multi-Step**: Set `maxSteps: 5` to enable tool calls + text generation
3. **Process Request**: 
   - Step 1: Receive user message
   - Step 2: Call appropriate tool (getTalks, searchTranscripts)
   - Step 3: Process tool results
   - Step 4: Generate natural language response
   - Step 5: Stream response to client
4. **Return Response**: User sees AI-generated text based on database content

## Troubleshooting

If tests pass but the chat still doesn't show text responses, check:

### 1. API Key Issues
```bash
# Verify environment variable is set
echo $GITHUB_TOKEN
# or
echo $OPENAI_API_KEY

# Test with a fresh API key
```

### 2. Database Issues
- Check Supabase connection in environment variables
- Verify `talks` table has records with `status = 'published'`
- Check RLS (Row Level Security) policies allow read access
- Run query manually: `SELECT * FROM talks WHERE status = 'published' LIMIT 5;`

### 3. Server Logs
Look for these log patterns:
```
[v0] ====== Chat API called ======
[v0] Using model: gpt-4o-mini
[v0] ====== Step Finished ======
[v0] Tool calls: 1
[v0] Text present: true
[v0] Text length: 150
[v0] Generated text: I found...
[v0] ====== Response Finished ======
```

If you see:
- `Text present: false` → maxSteps might not be working
- No "Step Finished" logs → Model might not be calling tools
- No "Response Finished" log → Stream might be failing

### 4. Frontend Issues
Check browser console for:
- Network errors in the /api/chat request
- Response streaming errors
- JavaScript errors in the chat component

Verify in Network tab:
- Request is being sent to /api/chat
- Response status is 200
- Response type is text/event-stream
- Response body contains data

### 5. Model/API Issues
Try these debugging steps:
```typescript
// In route.ts, temporarily add before tools:
console.log('[v0] Model config:', { 
  hasApiKey: !!githubToken || !!openaiKey,
  modelName 
});

// After streamText result:
console.log('[v0] Result type:', typeof result);
```

## What the Tests Validate

### Critical Fix #1: Model Initialization
**Before (broken)**: 
```typescript
const model = "openai/gpt-4o-mini" // Just a string
```

**After (fixed)**:
```typescript
const openai = createOpenAI({ apiKey })
const model = openai("gpt-4o-mini") // Model object
```

**Test Coverage**: ✅ route.test.js validates this

### Critical Fix #2: Multi-Step Responses
**Before (broken)**:
```typescript
streamText({ model, tools }) // Stops after first tool call
```

**After (fixed)**:
```typescript
streamText({ 
  model, 
  tools,
  maxSteps: 5 // Allows tool call + text generation
})
```

**Test Coverage**: ✅ Both tests validate this

## Manual Testing

After tests pass, manually test with:

```bash
# 1. Set API key
export OPENAI_API_KEY=your_key_here

# 2. Run dev server
npm run dev

# 3. Open browser
open http://localhost:3000

# 4. Send test messages:
- "What talks are available?"
- "Tell me about AI talks"
- "Show me talks about sustainability"

# Expected: Natural language responses describing talks from the database
```

## Success Criteria

✅ All automated tests pass (npm run test:chat)
✅ Server logs show text generation in onStepFinish
✅ Browser receives streaming response
✅ User sees AI-generated text in chat interface
✅ Text mentions specific talks from the database

## Additional Notes

- Tests use no external dependencies (just Node.js built-ins)
- Tests validate code structure, not runtime behavior
- For runtime testing, you need valid API keys and database connection
- Tests are designed to run in CI/CD pipelines

## CI/CD Integration

Add to GitHub Actions workflow:
```yaml
- name: Run Chat API Tests
  run: npm run test:chat
```

This validates the implementation structure without requiring API keys or database access.
