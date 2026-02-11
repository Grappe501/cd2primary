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
- `/app/` loads normally (Join / Sign In)
- `/app/profile/` loads profile UI (not redirected to `/app/index.html`)
- No inline `style="..."` attributes remain in:
  - `dist/app/index.html`
  - `dist/app/profile/index.html`
  - `dist/assets/js/profile.js`
- `.grid.cols-2` renders a 2-column layout on desktop and stacks on mobile
- Score box renders without inline styles and remains readable across breakpoints
