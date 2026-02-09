# Overlay 08 — Brand & Readability Upgrade

**Goal:** Fix readability issues (low contrast / washed text) and shift the entire UI to match the **Chris Jones for Congress** brand vibe.

This overlay focuses **only** on styling. No logic, scoring, submissions, or admin changes.

## What changed

### Design tokens
- Replaced the previous dark/low-contrast token set with a campaign-style palette:
  - Warm cream background
  - Deep navy primary
  - Orange accent
- Updated shadows, borders, and muted text to remain readable on light surfaces.

### Base styles
- Added missing global defaults that were causing the “light gray on white” problem:
  - `body` background + text color
  - Typography + spacing defaults
  - Strong, visible focus rings (keyboard accessible)

### Components
- Updated nav, cards, buttons, badges, and form fields to match the new palette.
- Tightened hover + active states so everything reads clearly.

## Files changed
- `src/assets/css/tokens.css`
- `src/assets/css/base.css`
- `src/assets/css/components.css`
- `CHANGELOG.md`

## Non-goals
- No new pages
- No scoring logic
- No admin tooling
- No changes to storage or functions
