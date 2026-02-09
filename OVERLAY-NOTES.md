# Overlay 09 – Scoring Engine

## Goal
Introduce a deterministic, auditable scoring engine that computes points from what teams actually submit, while keeping the system aligned with the “No Confusion Policy” (teams only earn what they list).

## What changed
- **Server-side scoring library**: `netlify/functions/_lib/scoring.js` (versioned).
- **Score endpoint**: `/.netlify/functions/score-get` returns:
  - Official points (approved submissions only)
  - Provisional points (includes pending)
  - 8-county sweep bonus (+50) applied to official score only
- **Polling-location area type** added to submissions:
  - `little_rock` (2 pts/item, cap 10)
  - `major_city` (3 pts/item, cap 15)
  - `other` (4 pts/item, cap 20)
- `submission-create` now stores computed fields (`basePoints`, `hashtagBonus`, `crossPostBonus`, `calculatedPoints`, `platformCount`).
- `submission-list` backfills computed fields for older submissions.
- Team Profile UI now:
  - shows a score summary card
  - shows calculated points for each submission
  - provides a live “expected points” preview while filling the submission form

## Notes
- Admin review is still a future overlay, so **all new submissions remain `pending`** and official score will be 0 until approvals exist.
- Leaderboard remains mock/live swap happens in later overlays per `MASTER_BUILD_PLAN.md`.
