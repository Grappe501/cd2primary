## Overlay 12 Patch: Build Output Fix (Restore Styling)
- Added deterministic build step (`npm run build`) that copies `src/` to `dist/`.
- Updated Netlify publish directory to `dist/` to ensure CSS/JS assets ship consistently.
