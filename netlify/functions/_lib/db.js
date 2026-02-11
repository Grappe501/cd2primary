import { neon } from "@neondatabase/serverless";

function resolveDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL ||
    process.env.NETLIFY_DATABASE_URL_UNPOOLED ||
    ""
  );
}

export function hasDatabaseUrl() {
  const url = resolveDatabaseUrl();
  return Boolean(url && String(url).trim());
}

export function getSql() {
  const connectionString = resolveDatabaseUrl();

  if (!connectionString || !String(connectionString).trim()) {
    throw new Error("Database connection not configured");
  }

  return neon(connectionString);
}

export function badConfigResponse(json) {
  return json(501, {
    error: "County intel database not configured",
    hint:
      "Connect a Neon database via Netlify DB or set DATABASE_URL / NETLIFY_DATABASE_URL in environment variables.",
  });
}
