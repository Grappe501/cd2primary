// Overlay 36: Production Guardrails — Basic health endpoint
//
// Safe to expose publicly. Does not leak secrets.
// Returns whether core dependencies appear configured.

import { ok, error } from "./_lib/team.js";
import { getEnvSummary } from "./_lib/env.js";

export default async (req) => {
  if (req.method !== "GET") {
    return error(405, "method_not_allowed", "GET required");
  }

  try {
    const env = getEnvSummary(process.env);
    return ok({
      ok: true,
      now: new Date().toISOString(),
      env
    });
  } catch (e) {
    return error(500, "healthz_failed", "Health check failed", String(e?.message || e));
  }
};
