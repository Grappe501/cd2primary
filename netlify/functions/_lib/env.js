// Overlay 36: Production Guardrails — Environment validation helpers
//
// Do not leak secret values. Only report presence/absence.
//
// DB env vars are aligned to _lib/db.js resolveDatabaseUrl().

export function resolveDatabaseUrlPresence(env = process.env) {
  const keys = ["DATABASE_URL", "NETLIFY_DATABASE_URL", "NETLIFY_DATABASE_URL_UNPOOLED"];
  for (const k of keys) {
    const v = env?.[k];
    if (typeof v === "string" && v.trim()) return { configured: true, key: k };
  }
  return { configured: false, key: null };
}

export function getEnvSummary(env = process.env) {
  const db = resolveDatabaseUrlPresence(env);
  return {
    database: {
      configured: db.configured,
      sourceKey: db.key
    }
  };
}
