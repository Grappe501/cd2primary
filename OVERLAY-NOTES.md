# OVERLAY-NOTES.md

Operational verification notes for each overlay.
After applying an overlay, confirm all checklist items before committing.

---

## Overlay 13 — Style Unification Hotfix

Verify:
- styles.css imports site.css
- No page renders unstyled
- No CJ fallback dependency required
- site.css is primary stylesheet everywhere

---

## Overlay 14 — Functions Normalization

Verify:
- All normalized functions use ESM
- Blob store name is `teams`
- leaderboard-get returns:
  - `{ items: [...], generatedAt }`
- admin-export works for CSV and JSON
- admin-audit-list reads correct index schema
- Netlify deploy succeeds with no CommonJS errors

---

## Overlay 15 — Leaderboard “One Truth” Wiring

Verify:
- /leaderboard loads live data by default
- No leaderboard.mock.js included
- If live API fails:
  - Page shows explicit warning
  - No mock data rendered
- Visiting `/leaderboard/?mock=1`:
  - Mock data loads
  - Visible “Mock mode” status shown
- `generatedAt` timestamp displays properly
- Sorting + search function correctly
- No console errors in normal operation

---

## Overlay 16 — Submission Consistency + Hardening

Verify:
- Submissions without required hashtags score 0
- Provisional score != official score until approved
- Duplicate submissions do not inflate totals
- Malformed numeric fields normalize to 0 safely
- Approved count and pending count match actual submissions
- Admin approval changes update leaderboard correctly
- Audit log records every status change
- No bonus applied twice
- No negative or NaN scores possible

---

## Overlay 17 — Design System Completion + Routing Fix

Verify:
- /app/profile/ loads (no redirect loop)
- /app/profile/* deep links resolve correctly
- Two-column layouts render correctly (no missing .cols-2 utility)
- No inline layout styles remain on /app/* pages

---

## Overlay 18 — Launch Polish

Verify:
- Public pages render with consistent typography and spacing
- No broken links or 404s introduced
- No schema/scoring changes

---

## Overlay 19 — Onboarding Friction Killer

Verify:
- /app/ shows a first-time walkthrough with hover/focus help bubbles
- Help bubbles are keyboard accessible (tab + focus)
- /app/profile/ shows “Your next steps” checklist
- Checklist updates:
  - Signed in toggles when user is authed
  - Team profile saved toggles after create/save
  - Both members toggles when both names and TikTok handles are present
  - First submission toggles after at least one submission is listed
- Tooltip bubbles appear on key form fields (team name, home county, expected points, hashtag confirmation)
- No changes to scoring, schema, or admin tooling

---

## Overlay 20 — County Intel DB Foundation + Pulaski Map Scaffold

Adds a canonical **Postgres (Neon)** backed data foundation for county pages:

- County snapshot (VEP, registered voters, registered %)
- County-level election results (2020 President, 2022 Governor, 2022 Secretary of State; 2026 President placeholder)
- Polling locations + precinct mapping (for maps/drilldowns)
- Pulaski county map scaffold (Leaflet)

### New environment variable

- `DATABASE_URL` (Production scope recommended)

### Setup

1) Provision Neon Postgres (or any Postgres) and set `DATABASE_URL` in Netlify.
2) Run `db/schema.sql` against the database.
3) Load county data via SQL or CSV import (see `db/seed.example.sql` for structure; do not treat placeholder numbers as authoritative).

### New public endpoints

- `/.netlify/functions/public-county-summary?county=<slug>`
- `/.netlify/functions/public-county-locations?county=<slug>`

If `DATABASE_URL` is missing, endpoints return **501** with a helpful message.

Verify:
- Visiting a county page shows “County Snapshot” panel
- With DB not configured: panel displays a safe “not configured” message (no broken layout)
- With DB configured: panel shows VEP + registration + collapsible election results
- Pulaski page shows map scaffold:
  - Without coordinates: map loads with friendly “no geocoded coords yet” message
  - With coordinates: markers appear and popups provide directions links
- No scoring, team schema, or admin workflow changes

---

## Overlay 21 — Elections + Voting Sites + Faulkner Seed (End-to-End)

Adds a **county election + voting-site** data model and a first real dataset seed (Faulkner) so the county page can show voters **where to vote** without overwhelming them.

### Schema additions

- `elections` (county-scoped elections)
- `voting_sites` (shared table for early voting centers + election-day vote centers)
- `voting_site_windows` (date/time windows per site per election, supports special-day hours)

### New seed

- `db/seed.faulkner_2026-03-03.sql`
  - Creates `Faulkner` county (if missing)
  - Creates election record for March 3, 2026
  - Inserts early voting centers + election day vote centers
  - Inserts special-day early voting windows and election-day window

### New public endpoint

- `/.netlify/functions/public-county-sites?county=<slug>&election=YYYY-MM-DD`

Returns voting-site cards grouped into:
- `earlyVoting`
- `electionDay`

If `DATABASE_URL` is missing, endpoint returns **501**.

### County page UX

- Faulkner county page now includes a volunteer-friendly **Where to Vote** panel with tabs:
  - Early Voting
  - Election Day
  - Each site card includes Directions + collapsible Hours

### Setup / Verify

1) Ensure `DATABASE_URL` is set in Netlify (Production scope recommended).
2) Run `db/schema.sql` (this overlay adds the new elections + voting sites tables).
3) Run `db/seed.faulkner_2026-03-03.sql`.
4) Deploy.

Verify:
- `/counties/faulkner/` shows the **Where to Vote** panel with populated sites and hours.
- Toggling tabs works (Early Voting vs Election Day).
- Directions links work.
- Other counties show “coming soon” messaging (no broken UI).

Out of scope:
- No scoring changes
- No team/admin tooling changes
- No schema migrations beyond the new elections/voting tables
