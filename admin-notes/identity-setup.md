# Netlify Identity Setup (Overlay 05)

This project uses **Netlify Identity** to gate `/app/*` routes.

## Enable Identity

1. In Netlify, open the site.
2. Go to **Project configuration → Identity**.
3. Click **Enable Identity**.

## Registration Settings

- Enable **Email** provider.
- For this phase, allow signups (you can switch to invite-only later).

## Redirects

This repo uses `netlify.toml` redirects so `/app/*` resolves to `/app/index.html` for deep links.

## Local dev notes

- The site loads the Identity widget via:
  - `https://identity.netlify.com/v1/netlify-identity-widget.js`
- When running with `netlify dev`, make sure Identity is enabled for the site in Netlify.

## UI behavior

- `/app/` opens the Identity widget for login/signup.
- `/app/profile/` requires login (client-side guard; full profile edit ships in Overlay 06).