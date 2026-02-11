import { neon } from "@neondatabase/serverless";

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL && String(process.env.DATABASE_URL).trim());
}

export function getSql() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL not configured");
  }
  return neon(process.env.DATABASE_URL);
}

export function badConfigResponse(json) {
  return json(501, {
    error: "County intel database not configured",
    hint: "Set DATABASE_URL (Neon Postgres) in Netlify environment variables.",
  });
}
