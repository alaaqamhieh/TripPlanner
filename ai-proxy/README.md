# TripPlanner AI proxy

A tiny Vercel serverless function set that lets the static TripPlanner site use
Claude without exposing an API key in the browser. Two routes:

- `POST /api/ai` — the in-app assistant (structured trip edits).
- `POST /api/research` — deep destination research. Runs Claude with the
  Anthropic **web_search + web_fetch** server tools to research a place across
  forums, local blogs and review sites (in the local language too) and returns a
  structured guide of real, named, review-backed places. The site then grounds
  each one through Google Places. This route can run for a while (multiple
  searches), so it sets `maxDuration: 300`; on Vercel Hobby, raise the plan or
  lower it if needed. **Cost note:** each research call spends Claude tokens plus
  web-search usage, so the site caches the result on the trip and only re-runs on
  a new destination or a manual "Re-research".

## Deploy

1. Deploy this folder to Vercel (any Vercel account). It needs no build config —
   `api/ai.js` becomes the `/api/ai` function automatically.
2. In the Vercel project's **Settings → Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your key from https://console.anthropic.com
3. Copy the deployment URL (e.g. `https://tripplanner-ai-proxy.vercel.app`) and
   add it to the TripPlanner GitHub repo as an Actions secret named
   `VITE_AI_PROXY_URL`, then re-run the deploy workflow.

Until `ANTHROPIC_API_KEY` is set the endpoint returns a friendly
"not switched on yet" message and the rest of the app keeps working.
