// Overlay 36: Production Guardrails — Admin integrity summary
//
// Admin-only endpoint to quickly validate key system wiring.
// Avoid heavy enumeration; use indexes where possible.

import { getStore } from "@netlify/blobs";
import { ok, error } from "./_lib/team.js";
import { requireAdmin } from "./_lib/adminAuth.js";

async function safeGetJSON(store, key, fallback) {
  try {
    const v = await store.get(key, { type: "json" });
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export default async (req) => {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.res;

  if (req.method !== "GET") {
    return error(405, "method_not_allowed", "GET required");
  }

  try {
    const teamsStore = getStore("teams");
    const primaryStore = getStore("primary");

    const teamsIndex = await safeGetJSON(teamsStore, "teams/index.json", { items: [] });
    const teamCount = Array.isArray(teamsIndex?.items) ? teamsIndex.items.length : 0;

    const submissionsIndex = await safeGetJSON(primaryStore, "submissions/index.json", []);
    const submissionCount = Array.isArray(submissionsIndex) ? submissionsIndex.length : 0;

    // Spot-check write access in audits path (harmless ping file)
    const auditsPingKey = "audits/_ping.json";
    await primaryStore.setJSON(auditsPingKey, { at: new Date().toISOString(), by: admin.email });

    return ok({
      ok: true,
      now: new Date().toISOString(),
      admin: { email: admin.email },
      counts: {
        teams: teamCount,
        submissions: submissionCount
      },
      notes: [
        "Counts are derived from existing indexes (fast).",
        "Audit ping confirms write access; it does not enumerate audit history."
      ]
    });
  } catch (e) {
    return error(500, "admin_integrity_failed", "Failed to compute integrity summary", String(e?.message || e));
  }
};
