# Overlay 08 (Update) — Cross-Post Platform Bonus

**Goal:** Expand submissions to support multiple social platforms (TikTok, Instagram, Facebook, X, Bluesky) and document the **+5 points per additional platform cross-posted** bonus.

This overlay update:
- Updates rules + one-page handout
- Updates the Team Profile submissions form + validation
- Stores platform links per submission so future scoring/admin review can verify exactly what the team claimed

## What changed

### Rules + handout
- Added a **Cross-Post Platform Bonus** section.
- Clarified that teams may submit to **any** supported platform(s) and must paste the public links they are claiming.

### Submissions (client)
- Submission form now accepts **multiple links** (one per platform).
- Submission list shows **platform badges** linking directly to each platform post.

### Submissions (functions)
- Validation now requires **at least one public link** across the supported platforms.
- Stores:
  - `platformLinks` object (per-platform urls)
  - `primaryUrl` derived for convenience (used for “Open submitted link”)

## Files changed
- `MASTER_BUILD_PLAN.md`
- `CHANGELOG.md`
- `src/rules/index.html`
- `src/handout/index.html`
- `src/app/profile/index.html`
- `src/assets/js/submissions.js`
- `netlify/functions/_lib/submissions.js`

## Non-goals
- No admin tooling
- No scoring engine changes yet (expected points is still team-entered)
