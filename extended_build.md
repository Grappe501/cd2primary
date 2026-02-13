# AR-02 — Completion Punch-List Overlays

**Phase: Production Completion Track**

This is the prioritized overlay roadmap required to reach:

> **“Production Complete — Campaign Ready”**

No speculative work.
Each overlay is atomic.
Each updates `CHANGELOG.md` + `OVERLAY-NOTES.md`.

---

# 🔴 BLOCKER OVERLAYS (Must Fix First)

These are **system integrity failures**, not enhancements.

---

## 🟥 Overlay 28 — Admin List Wiring Repair

### Problem

`admin-submissions-list.js` returns:

```json
{ items: [...] }
```

Admin UI expects:

```json
{ submissions: [...] }
```

Result:
Admin review queue appears empty.

### Fix Strategy (Minimal Risk)

Do **NOT** break backward compatibility.

Update `admin-submissions-list.js` to return:

```json
{
  items: [...],
  submissions: [...]
}
```

(identical array reference)

### Acceptance Criteria

* Admin page loads submissions without console errors.
* No UI changes required.
* No behavior changes.
* No changes to auth logic.
* Overlay fully documented.

### Regression Checks

* Admin page loads with and without submissions.
* 401 still enforced when unauthenticated.

---

## 🟥 Overlay 29 — Audit Trail Index + UI Schema Alignment

### Problems

1. Audit writes do NOT update `index.json`
2. Audit list endpoint depends on index file
3. UI expects different audit schema than is stored

Current stored shape:

```json
{
  reviewedAt,
  reviewedBy,
  before,
  after
}
```

UI expects:

```json
{
  action,
  timestamp,
  note,
  byEmail
}
```

### Required Structural Fix

### A) Write-time indexing

When writing:

```
audits/{teamId}/{submissionId}/{timestamp}.json
```

Also:

* Append entry to `audits/{teamId}/{submissionId}/index.json`
* Index must be append-only
* No overwriting historical entries

### B) Normalize audit schema

Standardize audit entry to:

```json
{
  id,
  action,            // approved | rejected
  reviewedAt,
  reviewedBy,
  before,
  after
}
```

### C) Update admin UI renderer

Render:

* Action
* ReviewedAt
* ReviewedBy
* Points delta (derived from before/after)

### Acceptance Criteria

* Approve a submission → audit entry appears in UI
* Audit list shows multiple entries
* No manual reindex required
* Audit files immutable

### Regression Checks

* Re-approving does not duplicate entries incorrectly
* Reindex endpoint still works but is no longer required

---

## 🟥 Overlay 30 — Deterministic Scoring Unification

### Problem

Scoring caps applied in:

* `score-get.js`

Not applied in:

* `leaderboard-get.js`

Result:
Leaderboard ≠ Team score

This violates:

> Transparent, enforceable scoring with zero ambiguity

### Fix Strategy

Move ALL scoring logic to `_lib/scoring.js`

Include:

* Base rules
* Cap rules
* Dedupe rules
* Deadline rules

Expose single function:

```js
computeTeamScore(submissions)
```

Then:

* `score-get.js` uses it
* `leaderboard-get.js` uses it
* `submission-list.js` uses it for backfill

### Acceptance Criteria

* Team score page = leaderboard score
* Changing scoring rules requires only editing `_lib/scoring.js`
* No logic duplication remains

### Regression Checks

* Past approved submissions still compute same totals
* Caps enforced everywhere

---

# 🟠 HIGH PRIORITY INTEGRITY OVERLAYS

---

## 🟧 Overlay 31 — Error Envelope Standardization

### Current Issue

Inconsistent error shapes:

* `{ error: "export_failed" }`
* `{ error: "Failed to load county summary", details: "..." }`
* raw 500 text responses
* mixed Response vs statusCode return styles

### Required Standard

All functions must return:

```json
{
  error: {
    code: "string_code",
    message: "human readable"
  },
  details?: optional
}
```

All successful responses:

```json
{
  data: ...
}
```

OR maintain existing shape but wrap errors consistently.

### Acceptance Criteria

* All endpoints use identical error envelope
* No raw stack traces
* No inconsistent statusCode object vs Response object mixing

---

## 🟧 Overlay 32 — Submission Idempotency Guard

### Problem

Race condition possible:
Two simultaneous submissions with same normalized URL.

### Fix Options (choose simplest deterministic)

Option A (Preferred):
Generate deterministic ID:

```
submissionId = hash(teamId + normalizedPrimaryUrl)
```

Use that as blob key.

Result:
Duplicate writes overwrite same key.

### Acceptance Criteria

* Duplicate submission attempts do not create duplicate records
* No race-created duplicates in index

---

## 🟡 MEDIUM PRIORITY STABILITY OVERLAYS

---

## 🟨 Overlay 33 — DB Seed Idempotence Hardening

### Problems

`voting_site_windows` inserts may duplicate on re-run.

### Fix

Add unique constraint:

```sql
UNIQUE (voting_site_id, election_id, kind, start_ts, end_ts)
```

Then use:

```sql
ON CONFLICT DO NOTHING
```

### Acceptance Criteria

* Seed file can run twice without duplication
* No schema drift

---

## 🟨 Overlay 34 — Dead Artifact Cleanup

### Candidates

* `src/assets/profile.js`
* `dist/assets/profile.js`
* `data/locations/*.json` (if confirmed unused)

### Acceptance Criteria

* No file referenced nowhere
* `dist/` remains build-only mirror
* Repo cleaner and smaller

---

## 🟡 GOVERNANCE OVERLAYS

---

## 🟨 Overlay 35 — Documentation Reconciliation

### Must Update

* `CHANGELOG.md`
* `OVERLAY-NOTES.md`
* `MASTER_BUILD_PLAN.md`
* `MASTER_BUILD_PLAN_STABILIZATION.md`

Add:

* Overlays 19–27
* Completion overlays 28–35
* Explicit Campaign Ready criteria

### Acceptance Criteria

* Markdown matches repo reality
* Overlay discipline restored

---

# 🟢 FINALIZATION OVERLAYS (After Integrity Fixes)

---

## 🟩 Overlay 36 — Production Readiness Guardrails

Add:

* Environment variable validation at boot
* Status page check for DB connectivity
* Leaderboard health check endpoint
* Admin-only integrity summary endpoint

---

## 🟩 Overlay 37 — Launch Checklist + Monitoring Playbook

Add root file:

```
LAUNCH_CHECKLIST.md
```

Include:

* DB migration verification
* Identity test
* Submission test
* Approval test
* Leaderboard test
* Audit test
* Timeout test
* Offline simulation
* Ref token test
* Mock mode test

And:

```
POST_LAUNCH_MONITORING.md
```

Including:

* What to watch in Netlify logs
* What errors indicate scoring drift
* When to run audit reindex
* How to detect abuse

---

# 📊 PRIORITY ORDER

1. Overlay 28 — Admin List Fix
2. Overlay 29 — Audit Trail Repair
3. Overlay 30 — Scoring Unification
4. Overlay 31 — Error Envelope Standardization
5. Overlay 32 — Submission Idempotency
6. Overlay 33 — DB Seed Hardening
7. Overlay 34 — Dead Artifact Cleanup
8. Overlay 35 — Documentation Reconciliation
9. Overlay 36 — Production Guardrails
10. Overlay 37 — Launch + Monitoring Docs

---

# ✅ “Campaign Ready” Definition

System is Campaign Ready when:

* Admin queue functions reliably
* Audit trail is immutable + enumerable
* Leaderboard matches canonical scoring
* No duplicate submissions possible
* DB seeds safe to re-run
* Error envelopes consistent
* No silent failures
* Docs match system
* Overlay discipline intact
* No dead code
* Deterministic scoring guaranteed
