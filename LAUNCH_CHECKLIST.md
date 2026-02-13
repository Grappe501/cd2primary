# AR-02 Launch Checklist
Last Updated: 2026-02-13

This checklist must be completed before declaring:

> Production Complete — Campaign Ready

---

## 1. Environment Verification

- [ ] Netlify environment variables set:
  - DATABASE_URL (or NETLIFY_DATABASE_URL / _UNPOOLED)
- [ ] /healthz returns 200
- [ ] /db-health returns 200
- [ ] No secrets exposed in health responses

---

## 2. Authentication Tests

- [ ] Non-auth user blocked from /app
- [ ] Non-admin blocked from /admin
- [ ] Admin login succeeds
- [ ] Admin-integrity-summary endpoint returns 200

---

## 3. Submission Flow Test

- [ ] Create submission
- [ ] Duplicate submission returns duplicate:true
- [ ] Submission appears in admin queue
- [ ] Approve submission
- [ ] Audit entry visible in UI
- [ ] Leaderboard updates
- [ ] Team score matches leaderboard score

---

## 4. Determinism Verification

- [ ] support_chris cap enforced everywhere
- [ ] Pending submissions affect provisional only
- [ ] Approved submissions affect official score
- [ ] 8-county bonus applies correctly
- [ ] Posting streak bonus applies correctly

---

## 5. DB & Seed Safety

- [ ] Seed re-run produces no duplicate voting windows
- [ ] Unique constraints active

---

## 6. Status & Failure Simulation

- [ ] Disable DB env var → /db-health returns 501
- [ ] Simulate DB outage → /db-health returns 503
- [ ] Admin summary still gated properly

---

## 7. Production Readiness Declaration

- [ ] All checklist items verified
- [ ] No console errors in browser
- [ ] Netlify logs clean

If all boxes are checked → Campaign Ready.
