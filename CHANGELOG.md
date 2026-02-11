# CHANGELOG.md

All notable changes to this project are documented here.
Each overlay is atomic and deployable.

---

## Overlay 00 — Repo Bootstrap
- Initial Netlify scaffold
- Baseline file structure
- MASTER_BUILD_PLAN.md added
- Health function added
- Initial deploy verified

---

## Overlay 01 — Campaign Design System
- Added tokens, layout, components CSS
- Standardized nav + footer
- Established DS primitives (card, btn, badge, hero, etc.)
- Baseline page styling unified

---

## Overlay 02 — Rules + One-Page Handout + Print CSS
- Full rules page implemented
- Printable one-page handout
- print.css added
- Print-friendly layout verified

---

## Overlay 03 — Counties + Location Data Stubs
- /counties/ index page
- Eight AR-02 county pages
- data/locations/*.json stubs created

---

## Overlay 04 — Leaderboard UI (Mock Data)
- Leaderboard layout and table
- Sorting + search UI
- Mock data file at /data/mock/teams.json
- Initial client rendering logic

---

## Overlay 05 — Authentication (Netlify Identity)
- /app/ join + sign-in
- Auth-gated profile
- Redirect rules for /app/* and /admin/*
- Identity widget integrated

---

## Overlay 06 — Team Profile Creation
- Create/edit team profile
- One team per user enforced
- Netlify Functions + Blobs persistence
- Ownership enforcement

---

## Overlay 07 — Submissions Hub
- Team portal converted to submission hub
- Multi-platform support:
  - TikTok
  - Instagram
  - Facebook
  - X (Twitter)
  - Bluesky
- +5 cross-post bonus logic integrated

---

## Overlay 08 — Brand Refresh + Readability Improvements
- Major contrast + spacing improvements
- Typography refinement
- Hero gradient enhancement
- Minor regression risk introduced due to mixed CSS reference

---

## Overlay 09 — Scoring Engine
- Server-side deterministic scoring
- Hashtag gate enforcement
- Cross-post bonus enforcement
- 8-county sweep bonus
- Posting streak bonus
- “Support Chris” cap enforcement

---

## Overlay 10 — Admin Auth Gate
- /admin/ protected via allowlist
- ADMIN_EMAILS env var enforced
- Unauthorized access blocked

---

## Overlay 11 — Review + Approve Submissions
- Admin review queue
- Approve / Reject / Pending states
- Audit record creation on actions

---

## Overlay 12 — Live Leaderboard + Admin Export + Audit Viewer
- Leaderboard live fetch integration
- Admin export (CSV + JSON)
- Admin audit viewer UI
- Fallback logic implemented

---

## Overlay 12 Hotfix — Build / Asset Stability
- Hardened publish assumptions
- Resolved asset reference inconsistencies
- Stabilized deployment behavior

---

## Overlay 13 — Style Unification Hotfix
- Added styles.css alias to prevent unstyled regression
- Unified site.css usage
- Introduced MASTER_BUILD_PLAN_STABILIZATION.md
- Prevented CJ fallback rendering

---

## Overlay 14 — Functions Normalization
- Converted functions to ESM
- Standardized blob store to `teams`
- Normalized leaderboard index schema to `{ items: [...] }`
- Ensured official-only bonus enforcement
- Stabilized export and audit functions

---

## Overlay 15 — Leaderboard “One Truth” Wiring
- Live leaderboard is now the only default source of truth
- Removed silent mock fallback
- Explicit failure state if live API unavailable
- Mock mode allowed only via `?mock=1`
- Visible “Mock mode” label when active
- Display of `generatedAt` timestamp from leaderboard-get
- Public trust enforcement: leaderboard never pretends

---

## Overlay 16 — Submission Consistency + Edge Case Hardening
- Defensive normalization of numeric fields
- Hardened malformed submission handling
- Duplicate submission guard improvements
- Bonus misfire prevention
- Strict provisional vs official separation enforcement
- Audit integrity reinforced

---

## Overlay 17 — Design System Completion + Routing Fix
- Fixed /app/profile/* routing conflict caused by rewrite ordering
- Added missing layout utility for two-column grids
- Removed remaining inline layout drift in /app/* pages
- Minor design system consistency cleanup for the profile UI

---

## Overlay 18 — Launch Polish
- Small UX + copy polish across public pages
- Reduced visual drift introduced by earlier brand refresh
- General “ship it” refinements (no schema/scoring changes)

---

## Overlay 19 — Onboarding Friction Killer
- Added first-time user walkthrough on /app/ with hover/focus help bubbles
- Added a “Your next steps” checklist on /app/profile/ that updates automatically
- Added tooltip explanations to key Team Profile and Submission fields
- Introduced small, DS-aligned onboarding utility classes (tip, callout, checklist, score grid)
