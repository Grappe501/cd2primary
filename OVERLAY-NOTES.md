# Overlay 11 – Review + Approve Submissions

## Goal
Provide a simple, enforceable admin workflow to **review** submissions and set their status to **approved**, **rejected**, or **pending**.

Only **approved** submissions count toward **official** points.

## What’s included
- `src/admin/index.html` — Admin review queue UI (filters + actions)
- `src/assets/js/admin.js` — Admin client logic to load queue + approve/reject
- `netlify/functions/admin-submissions-list.js` — Server-side list of submissions across teams
- `netlify/functions/admin-submission-update.js` — Server-side approve/reject/pending with audit trail
- `netlify/functions/_lib/teamsIndex.js` — Lightweight team index helper for admin browsing
- `admin-notes/review-process.md` — How to review, approve, and what “approved” means
- Updates to `team-create` / `team-update` to maintain a lightweight team index (`teams/index.json`)
- Updated `CHANGELOG.md`

## Data model notes
Storage remains JSON + Netlify Blobs.

- Team record: `teams/{teamId}.json`
- Team index: `teams/index.json` (admin convenience; not used for scoring)
- Submission record: `submissions/{teamId}/{submissionId}.json`
- Submission index: `submissions/index/{teamId}.json`
- Audit trail: `audits/{teamId}/{submissionId}/{timestamp}.json`

## Acceptance checklist
- Non-admin users cannot access review endpoints (403)
- Admin can see pending queue in `/admin/`
- Admin can approve / reject / set pending
- Status changes persist and immediately affect **official** scoring
- Each review action writes a minimal audit record
