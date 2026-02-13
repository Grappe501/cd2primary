# MASTER BUILD PLAN — Stabilization Track (Overlays 13–17)

_This plan is an add-on to the existing `MASTER_BUILD_PLAN.md`._
It exists because the current repo state contains mixed assumptions (CSS entrypoint mismatch, ESM/CJS function mismatch, and blob store/index schema drift).
The purpose of this track is to restore **one coherent, deploy-stable wiring** without adding new product surface area.

---

## Guiding rules
- Overlays remain **atomic** and **independently deployable**
- Prefer **clarity + enforceability** over cleverness
- If a page or function can fail silently, we add explicit messaging
- One truth:
  - One CSS entrypoint (plus compatibility alias if needed)
  - One blob store name
  - One index schema for teams and submissions
  - One authoritative scoring engine

---

## Overlay 13 — Style Unification Hotfix (Stop the bleeding)
### Objective
Restore the missing CSS entrypoint and ensure all pages render styled.

### Changes
- Add `src/assets/css/styles.css` that imports `site.css` and provides `cj-*` compatibility.

### Acceptance
- `/`, `/leaderboard/`, `/admin/` render styled
- `/assets/css/styles.css` returns 200

---

## Overlay 14 — Functions ESM + Store/Schema Normalization
### Objective
Make live data (leaderboard/exports/audits) reliable by removing module-format and storage drift.

### Changes
- Convert CommonJS functions to ESM:
  - `netlify/functions/leaderboard-get.js`
  - `netlify/functions/admin-export.js`
  - `netlify/functions/admin-audit-list.js`
  - (optional) `netlify/functions/admin-audit-reindex.js`
- Standardize blob store: `getStore("teams")`
- Normalize index schema:
  - `teams/index.json` → `{ "teamIds": ["..."] }`
  - `submissions/index/{teamId}.json` → `{ "items":[{"submissionId":"...","createdAt":"..."}] }`

### Acceptance
- Leaderboard loads live without fallback on a site with data
- Admin export works for allowlisted admin
- Audit list endpoint returns entries when audits exist

---

## Overlay 15 — Leaderboard “One Truth” Wiring
### Objective
Stop silent fallback behavior and make leaderboard trustable.

### Changes
- Client leaderboard scripts:
  - Render live when available
  - If live fails, show explicit “Live unavailable” message (no pretending)
  - Include `lastUpdated` timestamp from API

### Acceptance
- Public pages clearly distinguish live vs fallback states
- No misleading score displays

---

## Overlay 16 — Scoring Integrity Pass
### Objective
Ensure submission preview, stored computed points, score totals, and leaderboard totals match.

### Changes
- Ensure scoring is computed/stored on submission creation and recomputed on score fetch
- Ensure leaderboard uses shared scoring lib
- Align client preview with server constants

### Acceptance
- Same submission yields same points across UI + API
- Cross-post bonus = +5 per additional platform beyond the first
- Posting streak bonus and caps behave per rules

---

## Overlay 17 — Admin Review Hardening + Audit Guarantees
### Objective
Make admin actions safe and fully traceable.

### Changes
- Ensure every status change writes an audit record
- Improve admin UI confirmations and audit visibility
- Harden filters/search and edge-cases (missing team index, missing submission record)

### Acceptance
- Approve/Reject/Pending always produces audit log
- Admin can view audit history per submission

---

## Overlay packaging checklist (every overlay)
- Includes `OVERLAY-NOTES.md` update
- Updates `CHANGELOG.md`
- Only includes files touched by that overlay
- Must deploy clean on Netlify

---

# Overlay 35 — Stabilization Doc Reconciliation
Last updated: 2026-02-13

This stabilization plan must be interpreted to include the post-stabilization hardening that now exists in-repo
(Overlays 19/20/21/26/27) and the completion overlays (28–35).

## Stabilization Must Cover (Non-Negotiable)
- No silent failures in portals; all network/DB errors surfaced to the user.
- Status page is authoritative for diagnosing outages.
- Auth gates enforced for `/app/*` and `/admin/*`.
- Admin actions are auditable (append-only audit trail) and reviewable in UI.
- Deterministic scoring: one canonical scoring path used by every surface.

## Completion Overlay Dependencies
- Overlay 29 audit indexing and schema alignment is required to satisfy the auditability requirement.
- Overlay 30 scoring unification is required to satisfy determinism requirement.
- Overlay 31 standard envelopes reduce drift and simplify operational debugging.

