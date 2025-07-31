# Sentiment Analyzer

A modern web application for analyzing sentiment from Reddit posts and custom text.

## Features

- **Reddit Analysis**: Analyze sentiment from Reddit post comments
- **Text Analysis**: Analyze sentiment from custom text input
- **User Authentication**: Secure login and registration system
- **History Tracking**: View past analyses with filtering
- **User Profiles**: Manage account and view analytics

## Reddit Scraping

The app uses web scraping to analyze Reddit posts without requiring API credentials:
- Fetches Reddit post data in JSON format
- Extracts comments recursively including replies
- No authentication or rate limits
- Works with any public Reddit post

## OpenAI API Setup

For advanced harassment detection using OpenAI's language models:

1. **Create an OpenAI Account**:
   - Go to https://platform.openai.com/signup
   - Sign up for a free account

2. **Get Your API Token**:
   - Go to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Give it a name and copy the key
   - Copy your token

3. **Add to Environment Variables**:
   ```
   VITE_OPENAI_API_KEY=sk-your_api_key_here
   ```

4. **Model Used**:
   - Default: `gpt-3.5-turbo` (fast and cost-effective)
   - Configurable via `VITE_OPENAI_MODEL` environment variable
   - Available alternatives:
     - `gpt-4` (more accurate but slower and more expensive)
     - `gpt-4-turbo` (balance of speed and accuracy)
     - `gpt-3.5-turbo` (fastest and cheapest)

5. **Fallback Behavior**:
   - If OpenAI API is unavailable, falls back to simple keyword-based harassment detection

6. **Cost Considerations**:
   - OpenAI charges per token used
   - gpt-3.5-turbo is very affordable for harassment detection
   - Monitor usage at https://platform.openai.com/usage
4. **Important Notes**:
   - Only works with public Reddit posts
   - Some posts may have limited comment visibility
   - Respects Reddit's robots.txt and terms of service

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Security Considerations

- Environment variables are prefixed with `VITE_` to be accessible in the browser
- Reddit scraping is done client-side using public JSON endpoints
- Implement proper error handling for API failures
- Consider implementing caching to reduce requests

## Deployment

For production deployment:
1. Set up Hugging Face API key in your hosting platform
2. Consider rate limiting for Reddit requests
3. Implement proper error monitoring