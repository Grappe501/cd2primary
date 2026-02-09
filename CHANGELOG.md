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
