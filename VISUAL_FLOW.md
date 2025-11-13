# Visual Flow: How the Fix Works

## Before Fix (Broken) ❌

```
User types message in chat
         ↓
Frontend sends POST to /api/chat
         ↓
Backend receives request
         ↓
Attempts to use model = "openai/gpt-4o-mini" (just a string!)
         ↓
streamText() receives a string instead of model object
         ↓
❌ FAILS SILENTLY - No response generated
         ↓
User sees loading indicator forever
```

## After Fix (Working) ✅

```
User types message in chat
         ↓
Frontend sends POST to /api/chat
         ↓
Backend receives request
         ↓
Check environment variables:
  - GITHUB_TOKEN available? → Use GitHub Models API
  - OPENAI_API_KEY available? → Use OpenAI API
  - Neither? → Return clear error message
         ↓
createOpenAI({ apiKey, baseURL }) creates provider instance
         ↓
openai("gpt-4o-mini") creates proper model object
         ↓
streamText({ model, messages, tools, ... })
         ↓
✅ AI generates natural language response
         ↓
Response streams back to frontend
         ↓
User sees AI response in chat interface
```

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │  chat-interface-home.tsx                           │     │
│  │  - Uses useChat hook from @ai-sdk/react           │     │
│  │  - Sends messages to /api/chat                    │     │
│  │  - Displays streamed responses                    │     │
│  └────────────────────────────────────────────────────┘     │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP POST
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                  Backend API Route                           │
│  ┌────────────────────────────────────────────────────┐     │
│  │  /app/api/chat/route.ts                            │     │
│  │                                                     │     │
│  │  1. Import AI SDK providers                        │     │
│  │     import { createOpenAI } from "@ai-sdk/openai"  │     │
│  │                                                     │     │
│  │  2. Configure provider based on env vars           │     │
│  │     if (GITHUB_TOKEN)                              │     │
│  │       → GitHub Models API                          │     │
│  │     else if (OPENAI_API_KEY)                       │     │
│  │       → OpenAI API                                 │     │
│  │                                                     │     │
│  │  3. Create model object                            │     │
│  │     const openai = createOpenAI({ ... })           │     │
│  │     const model = openai("gpt-4o-mini")            │     │
│  │                                                     │     │
│  │  4. Stream response                                │     │
│  │     streamText({ model, messages, tools })         │     │
│  │                                                     │     │
│  │  5. Return streaming response to client            │     │
│  └────────────────────────────────────────────────────┘     │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                      AI Provider                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │  GitHub Models API                                 │     │
│  │  OR                                                │     │
│  │  OpenAI API                                        │     │
│  │                                                     │     │
│  │  - Receives prompts and messages                   │     │
│  │  - Generates AI responses                          │     │
│  │  - Can call tools (getTalks, searchTranscripts)    │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Key Differences

| Aspect | Before (Broken) | After (Fixed) |
|--------|-----------------|---------------|
| Model Type | String `"openai/gpt-4o-mini"` | Object from `createOpenAI()` |
| Provider Import | ❌ Missing | ✅ `import { createOpenAI }` |
| API Key Support | Only OPENAI_API_KEY | Both GITHUB_TOKEN & OPENAI_API_KEY |
| Error Handling | ❌ Silent failure | ✅ Clear error messages |
| Response Generation | ❌ No output | ✅ Natural language responses |

## Environment Variables Required

Choose ONE of these options:

### Option 1: GitHub Token (Recommended)
```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
```
- Uses GitHub Models API
- Free tier available
- Endpoint: https://models.inference.ai.azure.com

### Option 2: OpenAI API Key
```bash
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
```
- Uses OpenAI API directly
- Requires OpenAI account with credits
- Endpoint: https://api.openai.com

## Testing the Fix

### Validation Tests
```bash
cd /home/runner/work/v0-web-summit-lisbon-ai/v0-web-summit-lisbon-ai
node /tmp/validate-changes.js
```

Expected output:
```
✅ OpenAI provider is properly imported
✅ GitHub Token environment variable is checked
✅ OpenAI API Key environment variable is checked
✅ createOpenAI function is being called
✅ GitHub Models base URL is configured
✅ Model is initialized as an object (not a string)
✅ API key validation is present
✅ Deprecated parameters have been removed
```

### Manual Testing
1. Set environment variable (GITHUB_TOKEN or OPENAI_API_KEY)
2. Run: `npm run dev`
3. Open: http://localhost:3000
4. Type a message in the chat
5. Verify you receive an AI response

## Expected Behavior After Fix

### User Experience
1. User types: "What talks are available?"
2. Loading indicator appears (animated dots)
3. AI response streams in: "I found X talks at Web Summit! Here are some highlights:..."
4. Response appears with proper markdown formatting
5. If applicable, video player may appear inline

### Error Scenarios
- **No API key set**: Clear error message "No API key configured. Please set either GITHUB_TOKEN or OPENAI_API_KEY environment variable."
- **Invalid API key**: Error message from the provider with details
- **Network error**: Error display in chat interface with retry option
