# Overlay 09 (Update) – Scoring Engine Completeness Patch

## Goal
Finish the scoring engine so it matches the published rules more closely before we move on to admin overlays.

## What changed
- Added **posting streak bonus** to the official score calculation (approved submissions only):
  - 3-day: +10
  - 5-day: +25
  - 7-day: +40
  - 10-day: +60
  - Conservative interpretation: **highest milestone only** (not cumulative).
- Enforced **cap** for “Why I Support Chris Jones” submissions:
  - Max **2** counted (anything beyond is scored as 0, marked `capBlocked: true` in the score summary).
- Score API now returns `postingStreakBonus` in the breakdown.
- Team Profile score card now displays the streak bonus.

## Notes
- Distance/Coverage bonus is still not computable because the rules do not specify point values yet.
- Admin review is still a future overlay, so official points remain dependent on approvals.
