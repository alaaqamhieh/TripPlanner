# 🧭 TripPlanner

A personalized trip planner. Answer a short, friendly travel quiz — get a day-by-day plan matched to how *you* travel — then edit everything with total freedom.

**Live site:** https://alaaqamhieh.github.io/TripPlanner/

## How it works

1. **Plan a new trip** — a two-minute questionnaire asks where you're going, who's coming, your budget vibe, your pace, and runs a rapid-fire round of personal questions ("Would you cross the city just to try a dish the locals swear by?" — *Love it ❤️ / Could be nice 🙂 / Not for me 🙅*). Every question is skippable.
2. **Get your plan** — a recommendation list ranked against your answers (with "why this matches you" hints) and a starter day-by-day itinerary paced to your style: relaxed travelers get one thing a day, planners get clock times, night owls never get 9am hikes, and trips with kids never get nightclubs.
3. **Discover by swiping** — a TikTok/Tinder-style photo deck of real, famous places for your destination: swipe right to shortlist ❤️, left to skip, up to plan it now. Shortlisted spots collect in a tray you can drop onto any day. Curated must-sees for popular cities work instantly; with a Google Places key, live rated places for *any* destination join in.
4. **Plan with AI** — tap **✨ Ask AI** and just talk: "add a romantic dinner on day 2", "make my trip more relaxed", "I'm vegetarian — fix the food", "suggest 3 hidden gems". The assistant replies and edits your plan on the spot (needs an AI key — see below).
5. **Make it yours** — day / **7-day Mon–Sun calendar** / timeline views; drag ideas onto days, drag plans between days, tap anything to retime/annotate/remove it, add your own plans, dismiss suggestions, retake the quiz anytime (your itinerary and custom additions are kept unless you choose to rebuild).

## Where your changes live

- **Auto-saved** to your browser (localStorage) on every single change — a "Saved ✓" chip confirms it.
- **Share links** carry the whole trip compressed in the URL — open one on any device to import the trip there (also works as a backup).
- **Optional cloud sync** — set a `VITE_FIREBASE_DB_URL` repo secret and every trip live-syncs across devices that opened its share link.
- **Calendar export** — download the plan as an `.ics` file for Google/Apple Calendar.

## Optional integrations (app works fully without them)

| Secret | What it unlocks |
|---|---|
| `VITE_GOOGLE_PLACES_KEY` (or `VITE_GOOGLE_MAPS_API_KEY`) | "Find real places" (rated spots + photos matched to your quiz), the swipe deck for any destination, and map place search. Use a referrer-restricted key. |
| `VITE_FIREBASE_DB_URL` (or `VITE_FIREBASE_DATABASE_URL`) | Live cross-device trip sync (Firebase Realtime Database URL). |
| `VITE_AI_PROXY_URL` | The **✨ Ask AI** planner. Points at the `ai-proxy/` serverless function (deployed to Vercel), which holds your Anthropic key server-side. |

Without a Places key the planner uses its built-in idea catalog + curated signature spots (with free Wikipedia photos), which works for any destination offline. Without an AI proxy URL, the AI panel simply stays dormant. Everything else works regardless.

### Switching on the AI planner

1. Create an Anthropic API key at [console.anthropic.com](https://console.anthropic.com) → **API Keys** → *Create Key* (add a little credit).
2. Deploy `ai-proxy/` to Vercel (see [`ai-proxy/README.md`](ai-proxy/README.md)); in that Vercel project add `ANTHROPIC_API_KEY` as an environment variable, and make sure **Deployment Protection is off** so the browser can reach it.
3. Add the proxy's URL as a GitHub Actions repo secret named `VITE_AI_PROXY_URL`, then re-run the deploy workflow. The **✨ Ask AI** button lights up.

## Development

```bash
npm install
npm run dev       # local dev server
npm run build     # typecheck + production build
npm run lint      # oxlint
```

Deploys automatically to GitHub Pages via `.github/workflows/deploy.yml` on push.

React 19 + Vite + TypeScript. No backend, no router, no state library — hand-rolled CSS design tokens (light + dark), Leaflet + OpenStreetMap, and localStorage. Architecture shared with the family's previous vacation sites ([Vacation](https://github.com/alaaqamhieh/Vacation), [Naser-Reem-US-Vacation-2026](https://github.com/alaaqamhieh/Naser-Reem-US-Vacation-2026)).
