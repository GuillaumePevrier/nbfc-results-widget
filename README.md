# nbfc-results-widget

Modern web widget built with Next.js 14 (App Router + TypeScript) to display football club results, fixtures, and rankings using the French Football Federation (FFF) DOFA API. Designed for responsive iframe embedding on WordPress (no WP-specific code required).

## Getting started

```bash
npm install
npm run dev
```

- Widget page: `http://localhost:3000/widget?club=547517&clubName=Your%20Club`
- Results API route: `http://localhost:3000/api/club/{clubId}/results`
- Teams API route: `http://localhost:3000/api/club/{clubId}/teams`

## Features
- Server-side data fetching only (DOFA API or mocked fallback).
- Embed-friendly horizontal card layout with last match, next match, and ranking summary.
- Modern styling with blue/red/white palette, rounded cards, and soft shadows.
- Mocked data used automatically if the DOFA API is unreachable.

## Project structure
- `app/widget/page.tsx` – Renders the widget UI and pulls club data server-side with club defaults and team context.
- `app/api/club/[clubId]/results/route.ts` – Server route proxying DOFA API with graceful fallback.
- `app/api/club/[clubId]/teams/route.ts` – Server route exposing the club's teams and default selection helper.
- `components/Widget.tsx`, `MatchCard.tsx`, `RankingCard.tsx` – Core UI components.
- `lib/dofa.ts`, `lib/mockData.ts` – Data fetching, team parsing, and mock responses.
- `types/results.ts` – Shared TypeScript types.
