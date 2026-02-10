# Overlay 10 – Admin Auth

## Goal
Gate `/admin/*` behind Netlify Identity **and** a server-enforced admin allowlist so we can safely add approval tooling in Overlay 11.

This overlay intentionally **does not** add any scoring changes or admin tooling beyond the access foundation.

## What’s included
- `src/admin/index.html` — Admin landing page (login + authorization checks)
- `src/assets/js/admin.js` — client helper that verifies admin access via a function
- `netlify/functions/admin-whoami.js` — returns `{ isAdmin }` for the current authenticated user
- `netlify/functions/_lib/admin.js` — shared admin allowlist logic
- `admin-notes/admin-access.md` — setup instructions for Netlify site settings
- Updated `CHANGELOG.md`

## Admin allowlist
Admins are controlled by the Netlify environment variable:

- `ADMIN_EMAILS` — comma-separated list of authorized admin emails (case-insensitive)

Example:
```
ADMIN_EMAILS=alice@example.com,bob@example.com
```

If `ADMIN_EMAILS` is not set, **no one** is treated as admin.

## Acceptance checklist
- Logged-out users visiting `/admin/` see a login prompt
- Logged-in non-admin users see a clear “Not authorized” message
- Logged-in admin users see the Admin Dashboard stub
- The server (function) enforces admin status — client-side checks are not relied upon

## Notes
This overlay only establishes the gate. Overlay 11 will add review/approval UI and functions.
