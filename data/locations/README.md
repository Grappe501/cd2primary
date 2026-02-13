# Legacy Location Stubs (Deprecated)

This directory contains early overlay JSON stubs for county polling locations.

**Current system of record:**
- Polling locations and elections are served from the Neon/Postgres database
- County intel pages fetch live data via Netlify Functions

These JSON stubs are retained only for historical reference during audit.
Do not wire any production UI or scoring logic to these files.

If we later decide to remove this directory, note that the overlay unzip
workflow does not delete files — removal must be done via an explicit
repo cleanup step (separate from overlays).
