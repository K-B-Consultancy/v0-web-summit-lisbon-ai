# Chat API Configuration

## Overview
The Web Summit Lisbon AI chat requires an API key to function. You can use either:
- **GitHub Token** (for GitHub Models/Copilot API) - Recommended
- **OpenAI API Key** (for direct OpenAI access)

## Setup Instructions

### Option 1: Using GitHub Token (Recommended)
1. Obtain a GitHub Token with access to GitHub Models API
2. Set the environment variable:
   ```bash
   export GITHUB_TOKEN=your_github_token_here
   ```
   Or add to `.env.local`:
   ```
   GITHUB_TOKEN=your_github_token_here
   ```

### Option 2: Using OpenAI API Key
1. Obtain an OpenAI API key from https://platform.openai.com/api-keys
2. Set the environment variable:
   ```bash
   export OPENAI_API_KEY=your_openai_key_here
   ```
   Or add to `.env.local`:
   ```
   OPENAI_API_KEY=your_openai_key_here
   ```

## GitHub Actions / CI Configuration
To enable the chat API in GitHub Actions or CI environments:

1. Go to your repository settings
2. Navigate to Secrets and Variables > Actions
3. Add either `GITHUB_TOKEN` (use the special GitHub Actions token) or `OPENAI_API_KEY`

## Testing the Fix

### Local Development
```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Set your API key (see above)

# 3. Run the development server
npm run dev

# 4. Open http://localhost:3000 and test the chat
```

### Validation Test
Run the validation script to verify the code changes:
```bash
node /tmp/validate-changes.js
```

## What Was Fixed
The original code was passing a model identifier as a string (`"openai/gpt-4o-mini"`) instead of a properly initialized model object. This PR:
- Imports and configures the OpenAI provider using `@ai-sdk/openai`
- Properly initializes the model as an object
- Adds support for both GitHub Token and OpenAI API Key
- Provides clear error messages when API keys are missing

## API Endpoint
- **Endpoint**: `/api/chat`
- **Method**: POST
- **Content-Type**: application/json
- **Request Body**:
  ```json
  {
    "messages": [
      {
        "id": "msg-1",
        "role": "user",
        "parts": [
          {
            "type": "text",
            "text": "Your message here"
          }
        ]
      }
    ]
  }
  ```

## Troubleshooting

### Error: "No API key configured"
- Make sure you've set either `GITHUB_TOKEN` or `OPENAI_API_KEY` environment variable
- If using `.env.local`, restart the dev server after adding the variable
- In production/Vercel, ensure the environment variable is set in the deployment settings

### Error: "Failed to fetch"
- Check that the API endpoint is accessible
- Verify network connectivity
- Check browser console for CORS or other network errors

### No response from AI
- Verify your API key is valid and has sufficient credits/permissions
- Check the server logs for error messages
- Ensure the model name (`gpt-4o-mini`) is available in your API tier
