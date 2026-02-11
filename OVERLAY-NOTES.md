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
