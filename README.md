# SuperStore — AI Storefront Generator

Turn a creator's one-line self-description (typed, or spoken in English, Hindi
or Hinglish) into a ready-to-publish storefront: an AI-written bio, 2–4 product ideas with
India-appropriate INR pricing and a "why this price" line, product descriptions,
and a clean, phone-first public page you can share with a link.

Built for the SuperProfile PM (AI-native, 0→1) take-home.

**Live demo:** https://superprofile-storefront.vercel.app

![flow](docs/flow.png)

## What it does

- **Input:** a short self-description (typed, or spoken in English, Hindi or Hinglish via the mic), plus a language
  choice (English / Hinglish / Hindi). A self-description alone is a valid input —
  we do **not** scrape Instagram (see Decisions below).
- **Generate:** one real LLM call returns structured JSON — `creatorName`,
  `tagline`, `bio`, 2–4 `products` (each with `format`, `priceInr`,
  `priceRationale`, `description`), an `accent` colour, and an `assumptions`
  note when the input was thin.
- **Edit & regenerate:** tap any field to edit it; rewrite just the bio,
  regenerate a single product, delete a product, or regenerate the whole page.
- **Share:** the finished storefront is encoded into a public URL (`/s/...`) —
  no database, no login, links never expire.

## Tech

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS**
- **Google Gemini** (`gemini-flash-lite-latest`) via REST — free tier, any
  provider works
- **Zod** for output validation, **lz-string** for the shareable URL
- Deployed on **Vercel**

## Run locally

```bash
# 1. Install dependencies
npm install

# 2. Add your Gemini API key (free: https://aistudio.google.com/apikey)
cp .env.example .env.local
#   then edit .env.local and paste your key into GEMINI_API_KEY

# 3. Start the dev server
npm run dev
# open http://localhost:3000
```

### Environment variables

| Variable          | Required | Notes                                                        |
| ----------------- | -------- | ------------------------------------------------------------ |
| `GEMINI_API_KEY`  | yes      | Free key from Google AI Studio                               |
| `GEMINI_MODEL`    | no       | Defaults to `gemini-flash-lite-latest`                       |

`.env.local` is git-ignored — **never commit your key.**

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add the `GEMINI_API_KEY` environment variable in the project settings.
4. Deploy. (No database or other services needed.)

## How the AI part works

- One server route (`src/app/api/generate/route.ts`) holds all model calls, so
  the key never reaches the browser.
- Prompts live in `src/lib/llm.ts`: a fixed system prompt (brand voice + an
  India pricing guide) plus a per-request user prompt. Output is requested as
  JSON (`responseMimeType: application/json`).
- Every response is **validated with Zod** before it reaches the UI. On a parse
  or schema failure we **retry once**; if the model still fails or times out
  (28s), the API returns a friendly error and the UI offers a retry — the
  creator never sees a broken page.
- Partial regeneration (`bio`, `product`) sends the current storefront as
  context so new copy stays consistent.

## Handling messy input

| Input                         | Behaviour                                                        |
| ----------------------------- | --------------------------------------------------------------- |
| Empty / whitespace            | Blocked client + server side with a gentle prompt               |
| One word (e.g. "yoga")        | Generates a full store; notes what it assumed                   |
| Gibberish                     | Generates a plausible store + an `assumptions` banner           |
| Slow / failed model           | 28s timeout → retry → friendly error with a retry button        |
| Broken share link             | "This link looks broken" page with a CTA to create a new store  |

## Key decisions (short version)

- **No Instagram scraping.** It's blocked, fragile and against platform terms
  (the brief allows skipping it). A self-description is the only input, so the
  MVP drops the handle field entirely rather than ask for data it can't use.
- **No database for sharing.** The storefront is packed into the URL, so links
  are instantly public, never expire, and cost nothing to keep live past the
  required two weeks. Trade-off: long URLs and no server-side analytics.
- **Cheap, fast model.** `gemini-flash-lite-latest` keeps cost at ~₹0 and
  responses at ~2s. One env var swaps to a stronger model.

Full reasoning, the rejected alternative, metrics and the 2-week roadmap are in
the decision doc.

## AI coding tools

Built with **Claude Code** — used to scaffold the app, write the typed LLM layer
and prompts, debug a URL-encoding bug in the share links, and run the end-to-end
tests. See the decision doc for specifics.
