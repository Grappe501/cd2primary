import { getStore } from "@netlify/blobs";
import { json } from "./_lib/team.js";
import { requireAdmin } from "./_lib/admin.js";

/**
 * Best-effort reindex.
 * Note: Netlify Blobs does not provide a general key listing API here,
 * so this endpoint currently only (re)writes an index if the caller
 * supplies explicit audit keys.
 *
 * POST body:
 * { teamId: string, submissionId: string, keys: string[] }
 */
export default async (req, context) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const admin = requireAdmin(context);
  if (!admin.ok) return admin.response;

  try {
    const body = await req.json().catch(() => null);
    const teamId = body?.teamId;
    const submissionId = body?.submissionId;
    const keys = Array.isArray(body?.keys) ? body.keys : [];
    if (!teamId || !submissionId) return json(400, { error: "Missing teamId/submissionId" });

    const store = getStore("teams");
    const idxKey = `audits/${teamId}/${submissionId}/index.json`;
    await store.set(idxKey, JSON.stringify({ keys }), { contentType: "application/json" });

    return json(200, { ok: true, idxKey, count: keys.length });
  } catch {
    return json(500, { error: "audit_reindex_failed" });
  }
};
