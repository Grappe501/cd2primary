
// Overlay 29: Audit List Reader (index-based)

import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./_lib/adminAuth.js";
import { json } from "./_lib/team.js";

export default async (req) => {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.res;

  try {
    const { teamId, submissionId } = req.queryStringParameters || {};
    if (!teamId || !submissionId) {
      return json(400, { error: { code: "invalid_query", message: "Missing teamId or submissionId" } });
    }

    const store = getStore("primary");
    const indexKey = `audits/${teamId}/${submissionId}/index.json`;
    const index = await store.get(indexKey, { type: "json" }) || [];

    return json(200, { data: { audits: index } });

  } catch (err) {
    return json(500, {
      error: { code: "audit_list_failed", message: "Failed to load audit list" },
      details: String(err?.message || err)
    });
  }
};
