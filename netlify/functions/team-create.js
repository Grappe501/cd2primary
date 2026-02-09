import { getStore } from "@netlify/blobs";
import { json, requireUser, validateTeamInput } from "./_lib/team.js";

export default async (req, context) => {
  if (req.method !== "POST") {
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
  const ownerEmail = auth.user.email || null;
  const store = getStore("teams");

  // Enforce: one team per user.
  const ownerKey = `owners/${ownerId}.json`;
  const existingMapping = await store.get(ownerKey, { type: "json" });
  if (existingMapping && existingMapping.teamId) {
    return json(409, { error: "Team already exists for this user.", teamId: existingMapping.teamId });
  }

  const teamId = crypto.randomUUID();
  const now = new Date().toISOString();

  const team = {
    teamId,
    ownerId,
    ownerEmail,
    createdAt: now,
    updatedAt: now,
    ...cleaned
  };

  const teamKey = `teams/${teamId}.json`;

  // Save team first.
  await store.setJSON(teamKey, team, { onlyIfNew: true });

  // Save owner mapping.
  const { modified } = await store.setJSON(ownerKey, { teamId }, { onlyIfNew: true });
  if (!modified) {
    // Extremely unlikely race; keep system consistent by deleting the team record.
    await store.delete(teamKey);
    return json(409, { error: "Team already exists for this user." });
  }

  return json(201, { team });
};
