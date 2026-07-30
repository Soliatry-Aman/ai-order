# AI Order Assistant

A React + Node.js AI agent that assists customer support reps with order inquiries — featuring a real-time streaming agent loop, human-in-the-loop approval for destructive actions, and automatic fallback across AI providers.

---

## Quick Start (Local)

```bash
# 1. Install dependencies
cd client && npm install
cd ../server && npm install

# 2. Configure your AI provider
cp server/.env.example server/.env
# Edit server/.env and add your API key (see "AI Providers" below)

# 3. Run the mock database (Terminal 1)
cd server && npm run db

# 4. Run the backend proxy (Terminal 2)
cd server && npm run dev

# 5. Run the frontend (Terminal 3)
cd client && npm run dev
```

Open `http://localhost:5173`.

> **Note:** `db.json` is the mock order/inventory database. It resets to sample data on every fresh clone.

---

## AI Providers

Open `server/.env` and set `AI_PROVIDER` to one of:

| `AI_PROVIDER` | Default Model | Get API Key |
|---|---|---|
| `gemini` (default) | `gemini-2.5-flash` | [Google AI Studio](https://aistudio.google.com/apikey) |
| `groq` | `llama-3.3-70b-versatile` | [Groq Console](https://console.groq.com/keys) |
| `openrouter` | `google/gemini-2.5-flash` | [OpenRouter](https://openrouter.ai/settings/keys) |
| `cerebras` | `llama-3.3-70b` | [Cerebras Cloud](https://cloud.cerebras.ai) |

Any provider whose key is also set becomes an **automatic fallback** if the primary fails.

To override the model:
```env
AI_MODEL=gemini-2.5-pro
```

---

## Deploy

This is a monorepo with two deployable services:

```
/client  →  Vercel  (React/Vite frontend)
/server  →  Railway (Node.js/Express backend)
```

### Backend → Railway

1. Create a new project at [railway.app](https://railway.app).
2. Connect your GitHub repo and set the **Root Directory** to `server`.
3. Railway auto-detects the `railway.json` config and runs `npm start`.
4. In **Variables**, add your env vars (copy from `server/.env.example`):
   - `AI_PROVIDER`
   - At least one of: `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `CEREBRAS_API_KEY`
   - `PORT` (Railway sets this automatically, but you can override)
5. Note your Railway service URL (e.g. `https://ai-order-server.up.railway.app`).

> **json-server / db.json**: Railway ephemeral storage means `db.json` resets on redeploy. The mock DB is fine for demos — for a real app, replace it with a persistent database.

### Frontend → Vercel

1. Import your repo at [vercel.com](https://vercel.com).
2. Set the **Root Directory** to `client`.
3. Vercel auto-detects `vercel.json` (Vite framework, SPA rewrites).
4. In **Environment Variables**, add:
   ```
   VITE_API_BASE_URL = https://your-railway-url.up.railway.app
   ```
5. Deploy — the build runs `npm run build` and serves `dist/`.

---

## Architecture

### Agent Loop State
The agent loop lives entirely in the frontend, managed by `useChat` (`client/src/hooks/useChat.ts`):
- **`messages`** — full conversation history (user, model, tool calls, tool results).
- **`isLoading`** — true while a generation or auto-tool is in flight.
- **`pendingApproval`** — holds a `cancel_order` tool call paused for human confirmation.

The loop runs recursively (`runAgentLoop`) — it streams a response, auto-executes read-only tools, and pauses for approval on destructive actions.

### API Key Security
Keys live **only** in `server/.env`. The browser never sees them — the client sends chat history to `/api/chat` on the Express proxy, which calls the AI provider and streams the response back via SSE.

### Provider Fallback
`server/src/providers/` implements a chain: if the primary provider fails (rate limit, bad key, etc.), the next provider with a configured key is tried automatically.

---

## Future Improvements

- **Parallel Tool Calls** — currently sequential; parallel fetches would reduce latency when the AI calls multiple read-only tools at once.
- **Retry with Backoff** — exponential backoff on `429 Too Many Requests` from AI providers.
- **Token Counting** — display token count and estimated cost per turn.
- **Unit Tests** — Vitest tests for the agent state machine and approval gate edge cases.
- **Persistent Database** — replace `json-server` + `db.json` with a real DB (Postgres, Firestore, etc.) for non-ephemeral storage.
