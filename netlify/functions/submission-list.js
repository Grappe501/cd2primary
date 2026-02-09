import { getStore } from "@netlify/blobs";
import { json, requireUser } from "./_lib/team.js";

export default async (req, context) => {
  if (req.method !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const auth = requireUser(context);
  if (!auth.ok) return auth.response;

  const store = getStore("teams");
  const ownerId = auth.user.sub;

  // Resolve team
  const ownerKey = `owners/${ownerId}.json`;
  const ownerMapping = await store.get(ownerKey, { type: "json" });
  const teamId = ownerMapping?.teamId;
  if (!teamId) {
    return json(200, { teamId: null, submissions: [] });
  }

  const idxKey = `submissions/index/${teamId}.json`;
  const idx = (await store.get(idxKey, { type: "json" })) || { items: [] };

  // Fetch each submission (small volume; can optimize later)
  const items = Array.isArray(idx.items) ? idx.items : [];
  const subs = [];
  for (const it of items) {
    const id = it?.submissionId;
    if (!id) continue;
    const key = `submissions/${teamId}/${id}.json`;
    const sub = await store.get(key, { type: "json" });
    if (sub) subs.push(sub);
  }

  return json(200, { teamId, submissions: subs });
};
