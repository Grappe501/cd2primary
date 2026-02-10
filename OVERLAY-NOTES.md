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

---

# Overlay 13: Style Unification Hotfix

## Goal
Ensure **no page renders unstyled** by restoring the missing CSS entrypoint used by the landing, leaderboard, and admin pages.

## What changed
- Added `src/assets/css/styles.css`:
  - Imports the canonical design system stylesheet (`site.css`)
  - Adds a minimal compatibility layer for legacy `cj-*` classnames used by:
    - `/` (landing)
    - `/leaderboard/`
    - `/admin/`

## Why
Some pages referenced `/assets/css/styles.css` which did not exist, causing browser-default styling (hard to read and off-brand).

## Verify
- Load these routes and confirm the site is styled:
  - `/`
  - `/leaderboard/`
  - `/admin/`
- Confirm CSS returns 200:
  - `/assets/css/site.css`
  - `/assets/css/styles.css`
