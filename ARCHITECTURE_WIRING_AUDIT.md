# ARCHITECTURE_WIRING_AUDIT
_Audit source:_ `CD2 (2).zip` extracted to `/mnt/data/CD2`  
_Generated:_ 2026-02-10 16:44:12 (local sandbox time)

---

## 1. High-level wiring map
**Runtime model:** static site published from `dist/` + Netlify Functions under `/.netlify/functions/*`.

**Build:** `npm run build` executes `scripts/build.mjs` which **copies `src/` → `dist/`** (no bundling/transpilation).

**Auth:** Netlify Identity (client) + function-side auth via `context.clientContext.user`.

**Storage:** Netlify Blobs via `@netlify/blobs`.

**Core user journey:**
- Public: Landing (`/`) → Rules (`/rules/`) → Counties (`/counties/`) → Leaderboard (`/leaderboard/`)
- Auth: Team Portal (`/app/`) → Team Profile + Submissions (`/app/profile/`)
- Admin: Admin gate (`/admin/`) → Review/approve submissions → exports/audit

---

## 2. Critical current breakpoints (observed from code)
### 2.1 Styling disappears on some pages
Several pages load **`/assets/css/styles.css`**, but **that file does not exist** in `src/assets/css/` nor `dist/assets/css/`.

Pages referencing missing CSS:
- `src/index.html`
- `src/leaderboard/index.html`
- `src/admin/index.html`

CSS that *does* exist and is used elsewhere:
- `src/assets/css/site.css` (imports tokens/base/layout/components)

✅ Fix options (pick one):
1) Create `src/assets/css/styles.css` as an alias/entrypoint (recommended quick fix), **or**
2) Update the three pages above to reference `site.css` and convert their `cj-*` classes to the site design-system classes.

### 2.2 Live leaderboard is structurally incompatible with the rest of the app
`netlify/functions/leaderboard-get.js` is written in **CommonJS** in a repo that declares `"type": "module"` (ESM), and it also:
- Uses blob store **`getStore("primaryvote")`** while most other functions use **`getStore("teams")`**
- Expects team index schema: `teams/index.json` with `{ teamIds: [...] }`
- Expects submission index schema: `submissions/index/{teamId}.json` with `{ submissionIds: [...] }`

But the rest of the app (team + submissions) uses `getStore("teams")` and the submissions index format is `{ items: [...] }`.

✅ Outcome: live leaderboard will often appear as unavailable/empty and fall back to mock.

### 2.3 Audit/export functions are also CommonJS
These are CommonJS and should be converted to ESM for consistency with the repo:
- `netlify/functions/admin-export.js`
- `netlify/functions/admin-audit-list.js`
- `netlify/functions/admin-audit-reindex.js`

---

## 3. Route map (pages → scripts → functions)
### 3.1 Public routes
| Route | Source file | Client JS | Functions called |
|---|---|---|---|
| `/` | `src/index.html` | `src/assets/js/leaderboard.live.js` (and mock fallback) | `leaderboard-get` |
| `/rules/` | `src/rules/index.html` | none | none |
| `/handout/` | `src/handout/index.html` | none | none |
| `/counties/` | `src/counties/index.html` | none | none |
| `/counties/<county>/` | `src/counties/<county>/index.html` | none | none |
| `/leaderboard/` | `src/leaderboard/index.html` | `leaderboard.live.js` + mock fallback | `leaderboard-get` |

### 3.2 Auth routes
| Route | Source file | Client JS | Functions called |
|---|---|---|---|
| `/app/` | `src/app/index.html` | `src/assets/js/auth.js` (via inline usage) | none |
| `/app/profile/` | `src/app/profile/index.html` | `auth.js`, `profile.js`, `submissions.js` | `team-get`, `team-create`, `team-update`, `submission-create`, `submission-list`, `score-get` |

### 3.3 Admin routes
| Route | Source file | Client JS | Functions called |
|---|---|---|---|
| `/admin/` | `src/admin/index.html` | `src/assets/js/admin.js` | `admin-whoami`, `admin-submissions-list`, `admin-submission-update`, `admin-export`, `admin-audit-list` |

---

## 4. Build + deploy wiring
### 4.1 Build pipeline
- `package.json` → `scripts/build.mjs`
- `scripts/build.mjs` deletes `dist/` and copies `src/` → `dist/`

### 4.2 Netlify configuration
- `netlify.toml` defines:
  - publish dir: `dist`
  - functions dir: `netlify/functions`
  - redirects for `/app/*` and `/admin/*`

### 4.3 Implication
If a file path is wrong in `src/` (like `/assets/css/styles.css`), it will be wrong in production.

---

## 5. Styling system audit
### 5.1 Existing CSS files (authoritative in `src/assets/css/`)
- `tokens.css` — color palette, spacing scale, radii, shadows, type scale variables
- `base.css` — base element styles, typography defaults
- `layout.css` — containers, grids, page layout
- `components.css` — buttons, cards, badges, forms
- `site.css` — imports tokens/base/layout/components
- `print.css` — print rules for `/handout/`

### 5.2 Two HTML class systems are present
1) **Site design system** (works): classes like `container`, `btn`, `card`, etc. Used by `rules`, `handout`, `counties`, `app/profile`.
2) **CJ-prefixed system** (in HTML only): classes like `cj-page`, `cj-header`, `cj-btn`. Used by `index`, `leaderboard`, `admin`.

✅ Required decision:
- Either implement CJ-prefixed CSS (create `styles.css`) **or** migrate those pages to the site design system and standardize on `site.css`.

---

## 6. Client-side JS audit
### `src/assets/js/admin.js`
- **Role:** Admin dashboard controller
- **Calls functions:** admin-audit-list, admin-export, admin-submission-update, admin-submissions-list, admin-whoami

### `src/assets/js/auth.js`
- **Role:** Auth helpers

### `src/assets/js/leaderboard.live.js`
- **Role:** Live leaderboard fetch + render
- **Calls functions:** leaderboard-get

### `src/assets/js/leaderboard.mock.js`
- **Role:** Mock leaderboard renderer

### `src/assets/js/main.js`
- **Role:** Misc / currently unused baseline script

### `src/assets/js/profile.js`
- **Role:** Team profile page controller
- **Calls functions:** score-get, team-get

### `src/assets/js/submissions.js`
- **Role:** Submission form + list controller
- **Calls functions:** submission-create, submission-list

---

## 7. Server-side (Netlify Functions) audit
### 7.1 Function inventory
#### `/.netlify/functions/admin-audit-list`  — `netlify/functions/admin-audit-list.js`
- **Module format:** CommonJS (⚠️ in ESM repo)

#### `/.netlify/functions/admin-audit-reindex`  — `netlify/functions/admin-audit-reindex.js`
- **Module format:** CommonJS (⚠️ in ESM repo)

#### `/.netlify/functions/admin-export`  — `netlify/functions/admin-export.js`
- **Module format:** CommonJS (⚠️ in ESM repo)

#### `/.netlify/functions/admin-submission-update`  — `netlify/functions/admin-submission-update.js`
- **Module format:** ESM
- **HTTP methods referenced:** POST

#### `/.netlify/functions/admin-submissions-list`  — `netlify/functions/admin-submissions-list.js`
- **Module format:** ESM
- **HTTP methods referenced:** GET

#### `/.netlify/functions/admin-whoami`  — `netlify/functions/admin-whoami.js`
- **Module format:** ESM
- **HTTP methods referenced:** GET

#### `/.netlify/functions/health`  — `netlify/functions/health.js`
- **Module format:** ESM

#### `/.netlify/functions/leaderboard-get`  — `netlify/functions/leaderboard-get.js`
- **Module format:** CommonJS (⚠️ in ESM repo)

#### `/.netlify/functions/score-get`  — `netlify/functions/score-get.js`
- **Module format:** ESM
- **HTTP methods referenced:** GET

#### `/.netlify/functions/submission-create`  — `netlify/functions/submission-create.js`
- **Module format:** ESM
- **HTTP methods referenced:** POST

#### `/.netlify/functions/submission-list`  — `netlify/functions/submission-list.js`
- **Module format:** ESM
- **HTTP methods referenced:** GET

#### `/.netlify/functions/team-create`  — `netlify/functions/team-create.js`
- **Module format:** ESM
- **HTTP methods referenced:** POST

#### `/.netlify/functions/team-get`  — `netlify/functions/team-get.js`
- **Module format:** ESM
- **HTTP methods referenced:** GET

#### `/.netlify/functions/team-update`  — `netlify/functions/team-update.js`
- **Module format:** ESM
- **HTTP methods referenced:** PATCH, PUT

### 7.2 Shared libraries (`netlify/functions/_lib/*`)
- `netlify/functions/_lib/admin.js` — admin allowlist parsing + guard helpers
- `netlify/functions/_lib/scoring.js` — authoritative scoring math (base points, hashtag hard-stop, cross-post bonus, streak bonus, 8-county sweep)
- `netlify/functions/_lib/submissions.js` — submission types, deadline rule, validation helpers
- `netlify/functions/_lib/team.js` — auth extraction (`requireUser`), JSON response helper, validation constants
- `netlify/functions/_lib/teamsIndex.js` — maintains team index for leaderboard/admin

---

## 8. Storage schema (as implemented in this zip)
### 8.1 Team ownership
- `owners/{ownerId}.json` → `{ teamId }`
- `teams/{teamId}.json` → team profile (name, county, members, tiktok handles, timestamps)

### 8.2 Submissions
- `submissions/index/{teamId}.json` → `{ items: [{ submissionId, createdAt }] }`
- `submissions/{teamId}/{submissionId}.json` → submission payload + computed scoring fields + status

### 8.3 Teams index
- `teams/index.json` → **expected** by admin/leaderboard; schema varies in current codebase and must be normalized.

### 8.4 Audit trail
- `audits/{teamId}/{submissionId}/{timestamp}.json` → record of admin action

---

## 9. Comprehensive worklist (files to touch) — prioritized
### P0 — User-visible break/failure
1) **Fix missing CSS link** (choose alias vs refactor)
   - `src/index.html`
   - `src/leaderboard/index.html`
   - `src/admin/index.html`
   - **Add**: `src/assets/css/styles.css` (if alias approach)

2) **Unify styling system** (remove the split between `cj-*` and site system)
   - Same three pages above, plus any shared header/footer decisions:
   - `src/partials/header.html`, `src/partials/footer.html`

### P0 — Live leaderboard correctness
3) Convert these functions to ESM + normalize their storage expectations:
   - `netlify/functions/leaderboard-get.js`
   - `netlify/functions/admin-export.js`
   - `netlify/functions/admin-audit-list.js`
   - `netlify/functions/admin-audit-reindex.js`

4) Normalize blob store name and index schema across *all* functions:
   - Standardize `getStore("teams")`
   - Normalize `teams/index.json` structure (recommend: `{ teamIds: [...] }`)
   - Normalize submission index (recommend: `{ items:[{submissionId, createdAt}] }` everywhere)

### P1 — Scoring/approval alignment
5) Ensure UI preview matches authoritative scoring:
   - `src/assets/js/submissions.js`
   - `netlify/functions/_lib/scoring.js`
   - `netlify/functions/submission-create.js`
   - `netlify/functions/score-get.js`

6) Ensure admin approve/reject writes status + audit consistently:
   - `src/assets/js/admin.js`
   - `netlify/functions/admin-submission-update.js`
   - `netlify/functions/admin-audit-list.js` (after ESM conversion)

### P2 — Maintainability cleanup
7) Reduce duplication: decide whether to use `src/partials/*` or remove them.
8) Evaluate `src/assets/js/main.js` (currently minimal) — either make it real or delete.
9) Confirm `dist/` is treated as build output only (no manual edits).

---

## 10. Appendix — Full file inventory (excluding `.git/`)
```
.gitignore
CHANGELOG-OVERLAY12.md
CHANGELOG.append.md
CHANGELOG.md
MASTER_BUILD_PLAN-ADDENDUM-OVERLAY12.md
MASTER_BUILD_PLAN.md
OVERLAY-NOTES.md
README.md
admin-notes/admin-access.md
admin-notes/identity-setup.md
admin-notes/review-process.md
data/locations/cleburne.json
data/locations/conway.json
data/locations/faulkner.json
data/locations/perry.json
data/locations/pulaski.json
data/locations/saline.json
data/locations/van-buren.json
data/locations/white.json
data/mock/teams.json
data/teams/README.md
dist/admin/index.html
dist/app/index.html
dist/app/profile/index.html
dist/assets/css/base.css
dist/assets/css/components.css
dist/assets/css/layout.css
dist/assets/css/print.css
dist/assets/css/site.css
dist/assets/css/tokens.css
dist/assets/js/admin.js
dist/assets/js/auth.js
dist/assets/js/leaderboard.live.js
dist/assets/js/leaderboard.mock.js
dist/assets/js/main.js
dist/assets/js/profile.js
dist/assets/js/submissions.js
dist/counties/cleburne/index.html
dist/counties/conway/index.html
dist/counties/faulkner/index.html
dist/counties/index.html
dist/counties/perry/index.html
dist/counties/pulaski/index.html
dist/counties/saline/index.html
dist/counties/van-buren/index.html
dist/counties/white/index.html
dist/handout/index.html
dist/how-to/index.html
dist/index.html
dist/leaderboard/index.html
dist/partials/footer.html
dist/partials/head.html
dist/partials/header.html
dist/rules/index.html
netlify.toml
netlify/functions/_lib/admin.js
netlify/functions/_lib/scoring.js
netlify/functions/_lib/submissions.js
netlify/functions/_lib/team.js
netlify/functions/_lib/teamsIndex.js
netlify/functions/admin-audit-list.js
netlify/functions/admin-audit-reindex.js
netlify/functions/admin-export.js
netlify/functions/admin-submission-update.js
netlify/functions/admin-submissions-list.js
netlify/functions/admin-whoami.js
netlify/functions/health.js
netlify/functions/leaderboard-get.js
netlify/functions/score-get.js
netlify/functions/submission-create.js
netlify/functions/submission-list.js
netlify/functions/team-create.js
netlify/functions/team-get.js
netlify/functions/team-update.js
package.json
scripts/build.mjs
scripts/seed_locations_template.py
src/admin/index.html
src/app/index.html
src/app/profile/index.html
src/assets/css/base.css
src/assets/css/components.css
src/assets/css/layout.css
src/assets/css/print.css
src/assets/css/site.css
src/assets/css/tokens.css
src/assets/js/admin.js
src/assets/js/auth.js
src/assets/js/leaderboard.live.js
src/assets/js/leaderboard.mock.js
src/assets/js/main.js
src/assets/js/profile.js
src/assets/js/submissions.js
src/counties/cleburne/index.html
src/counties/conway/index.html
src/counties/faulkner/index.html
src/counties/index.html
src/counties/perry/index.html
src/counties/pulaski/index.html
src/counties/saline/index.html
src/counties/van-buren/index.html
src/counties/white/index.html
src/handout/index.html
src/how-to/index.html
src/index.html
src/leaderboard/index.html
src/partials/footer.html
src/partials/head.html
src/partials/header.html
src/rules/index.html
```
