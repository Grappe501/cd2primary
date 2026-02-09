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
