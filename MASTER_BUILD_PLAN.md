# AR-02 #PrimaryVote! Scavenger Hunt  
## Master Build Plan (Zip Overlay Architecture)

**Project:** Chris Jones for Congress – AR-02 Scavenger Hunt  
**Purpose of this file:**  
This document is the **authoritative build contract** for the scavenger hunt website.  
It exists to **prevent drift**, eliminate ambiguity, and ensure the system can be built incrementally using **zip overlays** without breaking prior functionality.

Any change to scope, rules, scoring, or architecture **must be reflected here first**.

---

## Core Build Philosophy

### Zip Overlay Architecture
- The project is built in **incremental overlays**
- Each overlay is a **self-contained module**
- Each overlay is packaged as a zip file
- Zips are **unzipped over the repo root**
- Overlays may:
  - add new files
  - replace existing files
  - extend existing functionality
- After **every overlay**, the site must:
  - deploy successfully on Netlify
  - remain usable at its current stage

### Non-Negotiable Rules
- No hidden dependencies between overlays
- No “we’ll fix it later” logic
- If it’s required by policy, it must be enforced in code
- **If volunteers don’t list it, they don’t get it**
- Campaign staff does **not hunt for points**

---

## Target Repository Structure (Final State)

/
├── src/
├── netlify/
├── scripts/
├── data/
├── admin-notes/
├── netlify.toml
├── README.md
└── MASTER_BUILD_PLAN.md

---

## Overlay Naming Convention

overlay-XX__ShortName__YYYY-MM-DD.zip

---

## Overlay Sequence

Overlay 00 – Repo Bootstrap  
Overlay 01 – Campaign Design System  
Overlay 02 – Rules + Handout  
Overlay 03 – Counties  
Overlay 04 – Leaderboard (Mock)  
Overlay 05 – Authentication  
Overlay 06 – Team Profiles  
Overlay 07 – Submissions  
Overlay 08 – Brand & Accessibility Refresh  
Overlay 09 – Scoring Engine  
Overlay 10 – Admin Auth  
Overlay 11 – Admin Review  
Overlay 12 – Live Leaderboard  
Overlay 13 – Admin CRUD  
Overlay 14 – County Data  
Overlay 15 – Prizes  
Overlay 16 – Volunteer Verification  
Overlay 17 – Moderation  
Overlay 18 – Launch Polish

---

## Rule Update: Cross-Post Platform Bonus

Teams may submit the same content to one or more social platforms (TikTok, Instagram, Facebook, X, Bluesky).

* Bonus: **+5 points per additional platform cross-posted** for the same content.
* Submissions must include the public link(s) the team is claiming.
* This bonus is still subject to the universal rules: required hashtags, public link, submitted through the Team Profile.

---

## Change Control
This document is the source of truth.

---

# Overlay 35 — Documentation Reconciliation (Campaign-Ready Contract)
Last updated: 2026-02-13

This section reconciles documentation with the current repo state after the stabilization track and completion overlays.

## Completed Overlays (Documented Here)
The following overlays are treated as completed in this repo line of development and should exist in code and/or documentation:

### Stabilization + Post-Stabilization Track
- Overlay 13–17: Stabilization track (timeouts/offline detection/ref tokens/status page hardening/cross-portal consistency)
- Overlay 19: Onboarding friction killer (reduce drop-off, improve first-run)
- Overlay 20: County intel DB + Pulaski map
- Overlay 21: Elections + voting sites + DB env var support
- Overlay 26: Full portal hardening (timeouts + offline detection + ref tokens)
- Overlay 27: CSS normalization + component consistency

### Completion Track (This thread)
- Overlay 28: Admin submissions list wiring (response shape compatibility)
- Overlay 29: Audit trail repair (append-only index + UI schema alignment)
- Overlay 30: Deterministic scoring unification (centralized caps; leaderboard = team score)
- Overlay 31: Error envelope standardization (ok()/error() helpers; consistent envelopes)
- Overlay 32: Submission idempotency guard (deterministic submissionId for duplicate prevention)
- Overlay 33: DB seed idempotence hardening (unique index + ON CONFLICT DO NOTHING)
- Overlay 34: Dead artifact cleanup (tombstones + legacy clarification)
- Overlay 35: Documentation reconciliation (this update)

## Campaign Ready Criteria (Definition of “Production Complete”)
The system is considered **Campaign Ready** only when all of the following are true:

### Determinism + Enforcement
- Leaderboard score equals team portal score for the same dataset.
- Scoring rules are centralized and apply identically everywhere (caps included).
- Volunteers receive points **only** for submissions they create/claim (no admin “hunt for points”).

### Admin + Audit Integrity
- Admin queue reliably loads and supports review/approve/reject.
- Audit trail is **enumerable** (listable), **append-only**, and visible in Admin UI.
- Audit entries are immutable once written.

### Submission Integrity
- Duplicate submissions (same normalized URL) cannot create duplicate records (idempotent writes).
- Submission index cannot drift into duplicated entries.

### DB Safety
- Seeds are safe to re-run (idempotent where required).
- Schema constraints prevent accidental duplication of voting windows.

### API Contracts
- Error envelopes are consistent across endpoints (no silent shape drift).
- Success envelopes are consistent where documented.

### Docs + Overlay Discipline
- `CHANGELOG.md` and `OVERLAY-NOTES.md` reflect the overlays actually in the repo.
- If markdown and code disagree, markdown is updated to be accurate after verification.

