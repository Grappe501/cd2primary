## Overlay 12 – Operations: Live Leaderboard + Exports + Audit Viewer

### Goals
- Replace mock leaderboard with live computed scores derived from approved submissions (official) and pending-inclusive (provisional).
- Provide admin export (CSV/JSON) for reporting, compliance, and rapid troubleshooting.
- Provide audit history viewer per submission to ensure transparent, inspectable moderation.

### Deliverables
- Public function: `/.netlify/functions/leaderboard-get`
- Admin-only functions:
  - `/.netlify/functions/admin-export` (CSV + JSON)
  - `/.netlify/functions/admin-audit-list`
- `/leaderboard/` loads live data with fallback to mock.
- Landing page Top 5 loads live data with fallback to mock.
- `/admin/` adds Export buttons + Audit panel.

### Constraints
- No new scoring rules; use the existing scoring library.
- No new admin roles; `ADMIN_EMAILS` allowlist remains the gate.
