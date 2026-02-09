import { getStore } from "@netlify/blobs";
import { json, requireUser } from "./_lib/team.js";

export default async (req, context) => {
  if (req.method !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const auth = requireUser(context);
  if (!auth.ok) return auth.response;

  const ownerId = auth.user.sub;
  const store = getStore("teams");

  const ownerKey = `owners/${ownerId}.json`;
  const ownerMapping = await store.get(ownerKey, { type: "json" });

  if (!ownerMapping || !ownerMapping.teamId) {
    return json(200, { team: null });
  }

  const teamKey = `teams/${ownerMapping.teamId}.json`;
  const team = await store.get(teamKey, { type: "json" });
  return json(200, { team: team || null });
};
