# Teams (Overlay 06)

**Goal:** one record per team.

In production (Netlify deploy), Team Profiles are stored in **Netlify Blobs**:

- Store name: `teams`
- Team record key: `teams/{teamId}.json`
- Owner mapping key: `owners/{ownerId}.json` → `{ "teamId": "..." }`

This folder exists to keep the storage model visible/auditable and to preserve the
"one file per team" convention for later exports or migrations.
