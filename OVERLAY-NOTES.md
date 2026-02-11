# Overlay 12 (Hotfix): Build + Asset Deployment

## Why this overlay exists
Some Netlify site configurations publish `dist/` while this repo previously published `src/`.
When `dist/` is published without a build step that copies the static assets, CSS/JS can go missing,
causing pages to render unstyled.

## What changed
- Added a deterministic build script (`scripts/build.mjs`) that copies `src/` → `dist/`.
- Updated `package.json` to include `npm run build`.
- Updated `netlify.toml` to publish `dist/` and run `npm run build`.
- Updated `CHANGELOG.md` to record this hotfix.

## After applying
- Commit + push.
- In Netlify, ensure the site is using repository config (netlify.toml) or set:
  - Build command: `npm run build`
  - Publish directory: `dist`

## Overlay 14 — Functions Module + Store Normalization (2026-02-10)
- Purpose: make live leaderboard, exports, and audit list stable and consistent with the rest of the ESM codebase.
- Key changes: convert CommonJS → ESM; standardize blob store to `teams`; align index expectations; apply official bonuses in leaderboard.
- Verify: `/ .netlify/functions/leaderboard-get` returns 200 with teams; `/admin/` export works; audit list returns 200 (empty if no audit index).

## Overlay 16 — Submission Consistency + Edge Case Hardening (2026-02-10)
- Purpose: reduce drift/duplication in submissions and make score/leaderboard reads more resilient.
- Key changes:
  - Normalize submission URLs in validation (drops hashes, trims, lowercases host, removes trailing slashes on paths).
  - Block duplicate submissions for the same team when the primary link matches an existing submission.
  - Submission list now de-dupes the submissions index and heals missing-record pointers.
  - Admin review updates now also set `updatedAt`.
  - Leaderboard get returns both `teams` and `items` with points aliases for client compatibility.
- Verify:
  - Create two submissions with the same link → second should 409 with duplicate error.
  - `/app/` submissions list still loads; no duplicates appear; ordering is newest first.
  - Leaderboard API returns `{ generatedAt, teams, items }` and each item includes `officialPoints`/`provisionalPoints`.
