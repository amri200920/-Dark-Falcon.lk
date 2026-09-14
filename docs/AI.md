# 🦅 Dark Falcon — AI Engine (Google Gemini)

## Dark Falcon AI 🦅
- **SDK**: `@google/generative-ai` v0.24.
- **Model**: `gemini-1.5-flash` with sovereign Dark Falcon system prompt.
- **Security Rule**: API Key is never exposed to the client; all operations route through Express `/api/ai/*`.
- **Core Endpoints**:
  - `POST /api/ai/chat`: Interactive chat with history.
  - `POST /api/ai/caption`: 3 tailored captions for social posts.
  - `POST /api/ai/hashtags`: Trending hashtag suggestions.
  - `POST /api/ai/rewrite`: Tone rewriting (Cyberpunk, Punchy, Formal, Friendly).
  - `POST /api/ai/summarize`: Key takeaway summarizer.
- **Graceful Fallback**: If `GEMINI_API_KEY` is not present, built-in intelligent templates respond immediately without erroring or crashing.
