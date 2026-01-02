# nbfc-results-widget

Modern web widget built with Next.js 14 (App Router + TypeScript) to display football club results and fixtures using the French Football Federation (FFF) DOFA API. Designed for responsive iframe embedding on WordPress (no WP-specific code required).

## Getting started

```bash
npm install
npm run dev
```

- Widget page: `http://localhost:3000/widget?club=547517&clubName=Your%20Club`
- Results API route: `http://localhost:3000/api/club/{clubId}/results`
- Teams API route: `http://localhost:3000/api/club/{clubId}/teams`

## Features
- Server-side data fetching only (DOFA API via internal Next.js routes).
- Embed-friendly horizontal card layout with last match, next match, and ranking summary.
- Modern styling with blue/red/white palette, rounded cards, and soft shadows.
- Clear "Données indisponibles" state if real data cannot be fetched (no fake fallbacks).

## Project structure
- `app/widget/page.tsx` – Renders the widget UI and pulls club data server-side with club defaults and team context.
- `app/api/club/[clubId]/results/route.ts` – Server route proxying DOFA API with caching and error propagation.
- `app/api/club/[clubId]/teams/route.ts` – Server route exposing the club's teams and default selection helper.
- `components/Widget.tsx`, `MatchCard.tsx`, `RankingCard.tsx` – Core UI components.
- `lib/dofa.ts` – Data fetching and normalization helpers for DOFA responses.
- `types/results.ts` – Shared TypeScript types.

## Finding your club ID and teams
The widget defaults to **clubId = 547517**. If you see another club in the data returned by the DOFA API, use the steps below to confirm your own club identifier:

1. **Open the public DOFA endpoints for your suspected club ID** (no auth required):
   - Results: `https://api-dofa.fff.fr/api/clubs/<clubId>/resultat`
   - Teams: `https://api-dofa.fff.fr/api/clubs/<clubId>/equipes.json?filter=`
   - If the club is correct, team names (Senior A / Senior B / U18, etc.) and recent matches should match what you expect.
2. **If the data does not match, locate the right club ID:**
   - Browse to your club page on the official FFF/Footclubs site while logged in, open DevTools → Network → XHR/Fetch, and look for calls to `api-dofa.fff.fr/api/clubs/<someId>/…`. The `<someId>` value is the clubId to use.
   - Alternatively, start from a known working club URL (like the default 547517), then replace the number in the endpoints above with your suspected ID until the returned club/teams match yours.
3. **Verify inside the widget:**
   - Launch locally: `npm run dev`
   - Load `http://localhost:3000/widget?club=<clubId>&clubName=Your%20Club`
   - Confirm the “Default team” text and team count in the header reflect your club’s teams from the `/teams` endpoint.

If you cannot find your club ID, share the club name and any known competition names; you can then test nearby IDs in the DOFA endpoints until you see the correct teams and fixtures.
