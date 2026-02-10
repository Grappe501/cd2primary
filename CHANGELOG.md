## Overlay 00
- Repo bootstrap and Netlify skeleton

## Overlay 01
- Added initial campaign design system (tokens, layout, components)
- Added partials and updated landing page styling

## Overlay 02
- Published official rules page
- Published one-page printable handout
- Added training hub stub
- Added print CSS

## Overlay 03
- Added county directory and 8 county drilldown stubs
- Added per-county location JSON stub files
- Added helper script to create/refresh location templates

## Overlay 04
- Added public leaderboard page with ALL teams (mock data)
- Added Top 5 teams module to landing page (mock data)
- Added sorting, county filtering, and search

## Overlay 05
- Integrated Netlify Identity (client-side)
- Added /app sign-in + join page
- Added auth-gated /app/profile stub (to be expanded in Overlay 06)
- Added auth helper utilities
- Added Netlify redirects for /app/* and /admin/*

## Overlay 06
- Implemented Team Profile creation + editing (auth-gated)
- Added Netlify Functions for team create/get/update
- Added durable storage via Netlify Blobs (one record per team)
- Added client-side validation and ownership enforcement

## Overlay 07
- Implemented Submissions hub on Team Profile page
- Added submission create + list Netlify Functions
- Enforced “if you don’t list it, you don’t get it” flow (teams submit link + expected points)
- Added polling-location checklist claim capture and hashtag confirmation gate

## Overlay 08
- Major brand + readability upgrade across the entire site
- Switched to campaign-style palette (warm cream background, deep navy primary, orange accents)
- Set sensible global defaults (body background/text, links, focus rings, headings)
- Improved contrast on cards, buttons, nav, and form fields

## Overlay 08 (Update)
- Added cross-post platform support for submissions (TikTok / Instagram / Facebook / X / Bluesky)
- Updated rules + handout to define +5 bonus per additional platform cross-posted
- Updated submission validation and list rendering to handle multiple platform links

## Overlay 09
- Added deterministic scoring engine (server-side) based on submission fields (base points + hashtag bonus + cross-post bonus)
- Added polling-location area type field (Little Rock / major city limits / other) to compute checklist points correctly
- Added score API (/.netlify/functions/score-get) returning official vs provisional totals and 8-county sweep bonus (official only)
- Team Profile now displays score summary card and shows calculated points per submission
- Added client-side scoring preview to help teams estimate expected points consistently

## Overlay 09 (Update)
- Added posting streak bonus computation (official score only; highest milestone only)
- Enforced cap on “Why I Support Chris Jones” (max 2 counted)
- Score API now returns streak bonus and capBlocked flags
- Team Profile score card now displays streak bonus
