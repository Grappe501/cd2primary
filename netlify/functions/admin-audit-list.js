import { getStore } from "@netlify/blobs";
import { json } from "./_lib/team.js";
import { requireAdmin } from "./_lib/admin.js";

async function readJSON(store, key) {
  try { return (await store.get(key, { type: "json" })) || null; }
  catch { return null; }
}

export default async (req, context) => {
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  const admin = requireAdmin(context);
  if (!admin.ok) return admin.response;

  try {
    const url = new URL(req.url);
    const teamId = url.searchParams.get("teamId");
    const submissionId = url.searchParams.get("submissionId");
    if (!teamId || !submissionId) return json(400, { error: "Missing teamId/submissionId" });

    const store = getStore("teams");

    // Index is required for listing; if missing, return empty (older data).
    const idxKey = `audits/${teamId}/${submissionId}/index.json`;
    const idx = await readJSON(store, idxKey);
    const keys = Array.isArray(idx?.keys) ? idx.keys : [];

    const audits = [];
    for (const k of keys) {
      const a = await readJSON(store, k);
      if (a) audits.push(a);
    }
    audits.sort((a, b) => new Date(b.at || b.timestamp || 0) - new Date(a.at || a.timestamp || 0));

    return json(200, { audits });
  } catch {
    return json(500, { error: "audit_list_failed" });
  }
};
