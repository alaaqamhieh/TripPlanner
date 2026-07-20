# TripPlanner AI proxy

A tiny Vercel serverless function that lets the static TripPlanner site use
Claude without exposing an API key in the browser. One route: `POST /api/ai`.

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
