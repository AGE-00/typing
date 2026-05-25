# JP Typing Lab

English README is the default. For Japanese, see: [README.ja.md](README.ja.md)

JP Typing Lab is a browser-only Japanese romaji typing practice app. It shows Japanese sentences and tracks keystrokes locally for analysis. No input data is sent to any server; everything is stored in IndexedDB.

## What you can do

- Start a session immediately without accounts
- Practice Japanese sentences with romaji input
- Track key-level mistakes, reaction time, and weak keys
- Review per-session results and per-question breakdowns
- See long-term trends (WPM, accuracy) on the dashboard
- Dive into detailed analysis (mistake pairs, slow keys, inefficient romaji)
- Configure typing and motion settings

## Screens / Routes

- /: Start screen
- /practice: Typing practice + option selection
- /result/[id]: Session result
- /mypage: Long-term progress dashboard
- /analysis: Detailed analysis
- /settings: Settings
- /about: Algorithm overview

## Practice flow

- Choose options: question count, sentence length, difficulty, category
- Optional modes:
  - Strict Mode: ends the session on the first mistake and records failure details
  - Focus Mode: hides navigation and secondary UI to reduce distractions
  - Time limit: 30/60/120 seconds or none
- Start typing: key events are captured directly (IME input is not used)
- Results are summarized and saved locally

## Analysis pipeline (how it works)

1) Romanization candidates are generated (e.g., shi/si, chi/ti, tsu/tu)
2) Keystrokes are recorded with expected key, actual key, correctness, and reaction time
3) Session metrics are aggregated (WPM/KPM, accuracy, mistakes, weak/slow keys)
4) Long-term trends and habits are derived from stored sessions

## Metrics

- Accuracy: correct inputs / total inputs
- KPM: correct keystrokes per minute
- WPM: correct characters per minute (KPM / 5)
- Weak keys: sorted by mistake count → accuracy → attempts
- Slow keys: highest average reaction time
- Mistake pairs: expected → actual key
- Romanization efficiency: typed length vs shortest accepted candidate

## Data storage & privacy

- No authentication
- No server-side database
- No external data transmission
- Stored in IndexedDB via Dexie.js

Stored data (minimal MVP scope):
- Practice sessions (summary metrics and options)
- Prompt results (per-question performance)
- Input events (per-keystroke logs)
- User settings

## Tech stack

- Next.js (App Router)
- TypeScript
- React
- Tailwind CSS v4 + @tailwindcss/postcss
- lucide-react
- IndexedDB + Dexie.js
- Recharts
- Vitest + jsdom

## Project structure

app/
  page.tsx                 Start screen
  practice/page.tsx        Typing practice screen
  result/[id]/page.tsx     Session result screen
  mypage/page.tsx          Personal dashboard
  analysis/page.tsx        Detailed analysis page
  settings/page.tsx        Configuration page
  about/page.tsx           Algorithm overview
  layout.tsx               Root layout + navigation
  globals.css              Global styles / Tailwind entry

components/
  nav.tsx                  Global navigation
  ui.tsx                   Small local UI primitives
  typing/                  Typing UI components
  practice-options/        Option UI components
  motion/                  Motion provider

lib/
  db.ts                    Dexie / IndexedDB schema and helpers
  types.ts                 Shared domain types
  utils.ts                 Formatting and className utilities
  typing/                  Typing/analysis logic

tests/
  typing.test.ts           Romanization and analysis tests
  practice-options.test.ts Practice options logic tests
  motion-settings.test.ts  Motion preference tests

## Development commands

npm install
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server after build
npm test         # Run Vitest
npm run lint     # Type check (tsc --noEmit)

## Development notes

- Pages using browser APIs, IndexedDB, window, crypto.randomUUID(), etc. must be Client Components
- Avoid Math.random() or time-dependent values in initial render to prevent SSR hydration mismatch
- Recharts warns on empty data; show an Empty State instead of a chart when no data exists
- Practice screen targets physical keyboards. Capture key events instead of IME input
- For new analysis logic, add expectations to tests/typing.test.ts first
- When changing local DB schema, update Dexie versioning in lib/db.ts

## Quality gates

After changes, run at minimum:

npm test
npm run lint
npm run build
