# 🧭 TripPlanner

A personalized trip planner. Answer a short, friendly travel quiz — get a day-by-day plan matched to how *you* travel — then edit everything with total freedom.

**Live site:** https://alaaqamhieh.github.io/TripPlanner/

## How it works

1. **Plan a new trip** — a two-minute questionnaire asks where you're going, who's coming, your budget vibe, your pace, and runs a rapid-fire round of personal questions ("Would you cross the city just to try a dish the locals swear by?" — *Love it ❤️ / Could be nice 🙂 / Not for me 🙅*). Every question is skippable.
2. **Get your plan** — a recommendation list ranked against your answers (with "why this matches you" hints) and a starter day-by-day itinerary paced to your style: relaxed travelers get one thing a day, planners get clock times, night owls never get 9am hikes, and trips with kids never get nightclubs.
3. **Make it yours** — drag ideas onto days, drag plans between days, tap anything to retime/annotate/remove it, add your own plans, dismiss suggestions, retake the quiz anytime (your itinerary and custom additions are kept unless you choose to rebuild).

## Where your changes live

- **Auto-saved** to your browser (localStorage) on every single change — a "Saved ✓" chip confirms it.
- **Share links** carry the whole trip compressed in the URL — open one on any device to import the trip there (also works as a backup).
- **Optional cloud sync** — set a `VITE_FIREBASE_DB_URL` repo secret and every trip live-syncs across devices that opened its share link.
- **Calendar export** — download the plan as an `.ics` file for Google/Apple Calendar.

## Optional integrations (app works fully without them)

| Secret | What it unlocks |
|---|---|
| `VITE_GOOGLE_PLACES_KEY` | "Find real places" (rated spots matched to your quiz) + map place search. Use a referrer-restricted key. |
| `VITE_FIREBASE_DB_URL` | Live cross-device trip sync (Firebase Realtime Database URL). |

Without a Places key the planner uses its built-in idea catalog, which works for any destination offline.

## Development

```bash
npm install
npm run dev       # local dev server
npm run build     # typecheck + production build
npm run lint      # oxlint
```

Deploys automatically to GitHub Pages via `.github/workflows/deploy.yml` on push.

React 19 + Vite + TypeScript. No backend, no router, no state library — hand-rolled CSS design tokens (light + dark), Leaflet + OpenStreetMap, and localStorage. Architecture shared with the family's previous vacation sites ([Vacation](https://github.com/alaaqamhieh/Vacation), [Naser-Reem-US-Vacation-2026](https://github.com/alaaqamhieh/Naser-Reem-US-Vacation-2026)).
