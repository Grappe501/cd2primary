# Overlay 12: Live Leaderboard + Admin Export + Audit Viewer

## Purpose
This overlay completes the first end-to-end operational loop:
- Public leaderboard uses **live data** (no longer mock-only).
- Admins can **export** teams/submissions for reporting.
- Admins can **view audit history** per submission.

## Scope
- ✅ Live leaderboard data API + UI integration
- ✅ Admin exports (CSV + JSON)
- ✅ Audit viewer
- ✅ Updates CHANGELOG and MASTER_BUILD_PLAN.md

## Non-goals
- No new scoring rules
- No new submission types
- No moderation workflow changes beyond viewing audit history and exporting data

## Storage assumptions (existing from Overlay 06/07/11)
- Team records: `teams/{teamId}.json`
- Team index: `teams/index.json`
- Submissions: `submissions/{teamId}/{submissionId}.json`
- Submission index per team: `submissions/index/{teamId}.json`
- Audit trail: `audits/{teamId}/{submissionId}/{timestamp}.json`

## New Functions
- `leaderboard-get` (public)
- `admin-export` (admin-only)
- `admin-audit-list` (admin-only)

## Files added/updated
- `src/assets/js/leaderboard.live.js`
- `src/assets/js/admin.js` (enhanced UI with export + audit viewer)
- `src/leaderboard/index.html` (uses live data; fallback to mock)
- `src/index.html` (Top 5 uses live data; fallback to mock)
- `src/admin/index.html` (buttons + audit drawer)
- `netlify/functions/leaderboard-get.js`
- `netlify/functions/admin-export.js`
- `netlify/functions/admin-audit-list.js`
- `CHANGELOG.md`
- `MASTER_BUILD_PLAN.md` (Overlay 12 section updated)

## Manual verification
1) Create 2+ teams, submit videos, approve a few.
2) Visit `/leaderboard/` — verify teams show with **official** + **provisional** scores.
3) Visit `/` — verify Top 5 renders from live endpoint.
4) Visit `/admin/` as allowlisted admin:
   - Export CSV/JSON downloads work
   - Audit history loads for a submission
