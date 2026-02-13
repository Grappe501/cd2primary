# AR-02 Post-Launch Monitoring Playbook
Last Updated: 2026-02-13

---

## 1. What to Monitor (Daily)

### Netlify Function Logs
- 500 spikes
- leaderboard_get_failed
- submission_create_failed
- admin_integrity_failed
- db_unreachable

### DB Health
- /db-health latency trends
- Unexpected 503 responses

---

## 2. Abuse Signals

- Rapid duplicate submission attempts
- Unusual volume from one team
- Repeated rejected submissions
- Suspicious pattern in support_chris submissions

---

## 3. Scoring Drift Detection

If leaderboard score ≠ team score:

1. Check computeTeamScore()
2. Verify no rogue scoring logic
3. Verify cap rules unchanged

---

## 4. Audit Integrity Checks

- Randomly inspect audit entries weekly
- Confirm append-only behavior
- Confirm index.json matches entry files

---

## 5. Emergency Response Matrix

| Severity | Trigger | Action |
|----------|---------|--------|
| Critical | DB unreachable | Freeze submissions, investigate DB |
| High | Scoring mismatch | Disable leaderboard display temporarily |
| Medium | Admin UI glitch | Patch via overlay |
| Low | Cosmetic issue | Batch in next overlay |

---

## 6. Rollback Procedure

1. Identify last stable overlay zip
2. Redeploy previous version
3. Verify /healthz and /db-health
4. Re-run Launch Checklist

---

## 7. Overlay Discipline Reminder

No hotfixes without:
- Overlay number
- CHANGELOG update
- OVERLAY-NOTES update

This prevents drift and protects integrity.
