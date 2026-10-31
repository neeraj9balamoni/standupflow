# StandupFlow (Standup Flow)

> **Speak it messy. Send it sharp.**  
> Turn messy, rushed work notes into senior-grade daily standup updates in Slack, formal email, and short formats in one click. Voice-first, dictation-friendly, and faithful to your facts.

Powered by Google Gemini (`@ai-sdk/google`), Next.js App Router, Auth.js (NextAuth v5 Google Provider), and Upstash Redis.

---

## 🌟 Why StandupFlow?

Developers lose 15–20 minutes every day writing standups:
- They forget what they worked on when sitting down to write.
- Rushed notes come out vague (`"worked on auth bug, continuing today"`).
- They have to reformat the same update for Slack, formal management emails, and quick syncs.
- Managers ask follow-up questions because blockers, dependencies, and owners were unclear.

**StandupFlow solves this:**
1. **Dictation-First:** Designed with plain `<textarea>` inputs so **Wispr Flow** dictation works flawlessly without rich-text glitches. Tagline: *Voice-First Standup Flow using Wispr Flow*.
2. **Senior Engineer System Prompt:** Crafted by senior engineers to sound human, direct, and concise—with banned generic AI jargon (`"leveraged"`, `"cutting-edge"`, `"synergy"`, emojis).
3. **1 Click = 3 Formats:** One Gemini API call produces **Slack/Teams**, a **Formal Email** (with Subject line and `mailto:` one-click open), and a **Short Summary**.
4. **Strict Fact Faithfulness:** It never invents tasks, numbers, dates, tools, or blockers. If there are no blockers, it explicitly states none exist.
5. **Interactive Tweaks & Edit:** Edit any card as plain text, or use the dictation-friendly Tweak Box (*"Make it punchier"*, *"More formal"*).

---

## 🧭 Application Structure & Navigation

The application uses the **Next.js App Router** with a shared persistent layout (sticky blurred top navigation bar, theme toggle, ticket counter, Google profile/auth, and footer):

| Route | Nav Label | Description |
|---|---|---|
| `/` | **Home** | Voice-first input textareas, 1-click generator, hero with smooth hover/focus preview card, and "How it works". |
| `/history` | **History** | Dedicated page for saved standups in browser localStorage. Expandable cards, one-click copy, search filter, item deletion, and clear all. |
| `/insights` | **Smarter Together** | Full-page productivity dashboard displaying standups generated, words spoken vs written, estimated time saved, estimated effort reduced, and daily streaks. All derived metrics are explicitly labeled *estimated*. |
| `/feedback` | **Feedback** | Zero-backend feedback form. Allows selecting type (Bug, Idea, Praise, Other), drafting a message (1,000 char counter), and launching drafts directly in Gmail or system email apps. |

---

## 🏗️ Architecture & Dev-Mode Safety

```
Browser (Signed in with Google OAuth)
   │  Dictate/type into plain textareas
   ▼
POST /api/generate  (Protected Server Route)
   1. Session verification via Auth.js (Google sub ID)
   2. Origin header CSRF verification
   3. Input validation: 1,500 character limit, HTML stripping, pasted code & script detection
   4. Rate limits: 5 req/min, loose 40/day IP backstop, global daily cap in Upstash Redis
   5. HMAC-SHA256 client IP hashing (no raw IPs stored)
   6. Check weekly tickets balance (6/week, 30 for judges, or console override)
   7. Google Gemini Flash structured call with strict prompt & OutputSchema
   8. Atomically consume 1 ticket with 7-day TTL
   ▼
Browser shows 3 editable cards, saves to localStorage history, updates Smarter Together metrics
```

### Dev-Mode Safety & Production Integrity
- **Fail-Closed OAuth Security:** The mock "Local Dev Sign-In" credentials provider is strictly gated to `process.env.NODE_ENV === "development"` when Google OAuth keys are missing. In any production build, missing OAuth keys fail closed—it is impossible to bypass authentication or trigger mock accounts.
- **Fail-Closed API Security:** In production, missing `GOOGLE_GENERATIVE_AI_API_KEY` immediately blocks `/api/generate` with a clear "Service not configured" error.
- **Distributed Redis Ticket Counter and Rate Limiter:** When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are present, the ticket counter and rate limiter communicate directly with Upstash Redis (`tickets:used:<subKey>` with atomic `INCR` and 7-day `EXPIRE`). Ticket storage can use in-memory state in local development when Redis variables are absent; generation rate limits fail closed with a friendly 503 if Redis is unavailable.
- **Zero Client-Side Keys:** `GOOGLE_GENERATIVE_AI_API_KEY`, `AUTH_SECRET`, and `IP_HASH_SECRET` reside strictly on the server and are never exposed in browser bundles.
- **Dev Indicators:** Next.js development indicator badge is disabled via `devIndicators: false` in `next.config.ts`.
- **Privacy:** Notes and standups are **never** stored on our servers. History and metrics live exclusively in client `localStorage` and stay in sync across tabs via the `storage` event.

---

## 🎫 Ticket System & Limits

To protect Gemini quotas and ensure fair usage:
- **Weekly Tickets:** Each user receives **6 tickets per week** (covers a full 5-day work week + 1 extra).
- **First Use 7-Day Window:** The 7-day timer starts on your first successful generation.
- **Judge Allowance:** Emails listed in `JUDGE_EMAILS` receive `JUDGE_TICKET_LIMIT` (default: 30 tickets).
- **Overriding in Upstash:** The project owner can instantly grant more tickets to any user by creating or editing the key in the Upstash console:
  ```
  SET tickets:limit:<googleSub> 50
  ```
  To reset the user's current usage, delete the counter key:
  ```
  DEL tickets:used:<googleSub>
  ```
- **Global Daily Cap:** Controlled by `GLOBAL_DAILY_CAP` (default 200) to ensure API cost predictability.

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/your-username/standupflow.git
cd standupflow
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in the following variables:

| Variable | Description | Where to get it |
|---|---|---|
| `AUTH_SECRET` | Auth encryption secret | Generated automatically or run `openssl rand -base64 32` |
| `AUTH_URL` | App URL | `http://localhost:3000` locally, or Vercel production URL |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | [Google Cloud Console](https://console.cloud.google.com/) |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret | [Google Cloud Console](https://console.cloud.google.com/) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini API Key | [Google AI Studio](https://aistudio.google.com/) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | [Upstash Console](https://console.upstash.com/) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST Token | [Upstash Console](https://console.upstash.com/) |
| `IP_HASH_SECRET` | Salt for HMAC hashing IPs | Random secure 32+ character string |
| `GLOBAL_DAILY_CAP` | Max global API calls per day | Default: `200` |
| `WEEKLY_TICKET_LIMIT` | Tickets per user per week | Default: `6` |
| `JUDGE_TICKET_LIMIT` | Tickets for allowlisted judges | Default: `30` |
| `JUDGE_EMAILS` | Comma-separated allowlisted email addresses | Set to the addresses that should receive the judge allowance. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Contact recipient for feedback and ticket requests | Set to the address that should receive messages. |

#### Google OAuth Setup
1. In Google Cloud Console, create an OAuth 2.0 Client ID (Web Application).
2. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-domain.vercel.app/api/auth/callback/google`
3. In OAuth Consent Screen, add scopes `openid`, `email`, and `profile`.
4. Switch the publishing status from "Testing" to **"In production"** so judges and evaluators can sign in without needing manual whitelist addition.

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📊 "Smarter Together" Metrics Formulas

Metrics are calculated and stored 100% in the user's browser `localStorage`:
- **Manual Typing Time:** `manualMinutes = copiedWords / 40 + 1` (40 wpm typing speed + 1 minute of thinking and formatting)
- **Wispr Flow Speaking Time:** `flowMinutes = inputWords / 150 + 0.5` (150 wpm speech rate + 30 seconds of review)
- **Estimated Time Saved:** `timeSavedMinutes = max(0, manualMinutes - flowMinutes)` (Derived number labeled *estimated*)
- **Estimated Effort Reduced:** `effortReducedPct = min(90, max(0, round(timeSavedMinutes / manualMinutes * 100)))` (Derived number labeled *estimated*)

---

## 📄 License

MIT License &copy; 2026 StandupFlow Contributors. See [LICENSE](LICENSE) for details.
