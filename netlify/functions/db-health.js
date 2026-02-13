// Overlay 36: Production Guardrails — DB connectivity health endpoint
//
// Safe to expose publicly: returns only UP/DOWN + latency, never secrets.

import { ok, error } from "./_lib/team.js";
import { hasDatabaseUrl, getSql } from "./_lib/db.js";

export default async (req) => {
  if (req.method !== "GET") {
    return error(405, "method_not_allowed", "GET required");
  }

  if (!hasDatabaseUrl()) {
    return error(
      501,
      "db_not_configured",
      "Database connection not configured",
      "Set DATABASE_URL or NETLIFY_DATABASE_URL (or NETLIFY_DATABASE_URL_UNPOOLED)."
    );
  }

  const t0 = Date.now();

  try {
    const sql = getSql();
    await sql`SELECT 1 as ok`;
    const ms = Date.now() - t0;

    return ok({
      ok: true,
      latencyMs: ms,
      now: new Date().toISOString()
    });
  } catch (e) {
    const ms = Date.now() - t0;
    return error(503, "db_unreachable", "Database unreachable", {
      latencyMs: ms,
      message: String(e?.message || e)
    });
  }
};
