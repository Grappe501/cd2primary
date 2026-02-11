# County Intel DB (Overlay 20)

This project now supports a canonical database (recommended: **Neon Postgres**) for:

- County-level voter intel (VEP, registered voters, registered %)
- County-level election results (2020 President, 2022 Governor, 2022 Secretary of State, future placeholders)
- Polling locations + precinct-to-location mapping (for maps and drill-down pages)
- Election-scoped voting sites (early voting centers + election day vote centers) with special-day hours

## Environment variable

Set `DATABASE_URL` in Netlify (Production scope) to your Postgres connection string.

## Schema

Run:

- `db/schema.sql`

## Seeds

Optional (example placeholders only):

- `db/seed.example.sql`

First real dataset seed (Faulkner County voting sites for March 3, 2026):

- `db/seed.faulkner_2026-03-03.sql`

## Public read-only endpoints

These are used by public county pages:

- `/.netlify/functions/public-county-summary?county=pulaski`
- `/.netlify/functions/public-county-locations?county=pulaski`

Voting sites by county + election date:

- `/.netlify/functions/public-county-sites?county=faulkner&election=2026-03-03`

If `DATABASE_URL` is not configured, these functions return a clean error response.
