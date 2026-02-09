# Overlay 07 — Submissions Hub

**Goal:** Add the “Submit a Video” workflow on the Team Profile page. Teams must log every video here (link + type + claimed items + expected points) so campaign staff can later review and score.

## What changed

### UI
- `/app/profile/` now includes a **Submissions** section (auth-gated via existing profile page).
- “Submit a Video” opens an in-page form:
  - Video link (public)
  - Submission type
  - Posting date
  - Expected points
  - **Polling Location** specific fields:
    - County
    - Polling location name (optional)
    - Claimed checklist items (required: at least one)
  - Hashtag confirmation checkbox (required)
  - Notes (optional)
- Submissions render as cards with status **Pending review**.

### Backend
- Netlify Functions:
  - `/.netlify/functions/submission-create` (POST)
  - `/.netlify/functions/submission-list` (GET)
- Validation is enforced server-side (422 with field-level errors).
- Deadline enforced server-side:
  - **Mar 3, 2026 • 5:00 PM America/Chicago** (stored as 2026-03-03T23:00:00Z).

## Storage
- Uses **Netlify Blobs** store: `teams`
- One-record-per-submission:
  - `submissions/{teamId}/{submissionId}.json`
- Per-team submission index:
  - `submissions/index/{teamId}.json`

## Non-goals (explicitly not included)
- No scoring engine (Overlay 08)
- No admin review tooling (Overlay 10+)
- No submission edits/deletes yet
