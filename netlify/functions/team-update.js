import { getStore } from "@netlify/blobs";
import { json, requireUser, validateTeamInput } from "./_lib/team.js";

export default async (req, context) => {
  if (req.method !== "PUT" && req.method !== "PATCH") {
    return json(405, { error: "Method not allowed" });
  }

  const auth = requireUser(context);
  if (!auth.ok) return auth.response;

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const { ok, errors, cleaned } = validateTeamInput(body || {});
  if (!ok) return json(422, { error: "Validation failed", errors });

  const ownerId = auth.user.sub;
  const store = getStore("teams");

  const ownerKey = `owners/${ownerId}.json`;
  const ownerMapping = await store.get(ownerKey, { type: "json" });
  if (!ownerMapping || !ownerMapping.teamId) {
    return json(404, { error: "No team found for this user." });
  }

  const teamKey = `teams/${ownerMapping.teamId}.json`;
  const existing = await store.get(teamKey, { type: "json" });
  if (!existing) {
    return json(404, { error: "Team record missing." });
  }

  if (existing.ownerId !== ownerId) {
    return json(403, { error: "Forbidden" });
  }

  const now = new Date().toISOString();
  const updated = {
    ...existing,
    ...cleaned,
    updatedAt: now
  };

  await store.setJSON(teamKey, updated);
  return json(200, { team: updated });
};
