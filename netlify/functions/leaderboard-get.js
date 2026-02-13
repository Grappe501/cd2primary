
// Overlay 31: Standardized error envelope

import { getStore } from "@netlify/blobs";
import { ok, error } from "./_lib/team.js";
import { getTeamsIndex } from "./_lib/teamsIndex.js";
import { computeTeamScore } from "./_lib/scoring.js";

async function readJSON(store, key) {
  try {
    return await store.get(key, { type: "json" });
  } catch {
    return null;
  }
}

export default async (req) => {
  if (req.method !== "GET") {
    return error(405, "method_not_allowed", "GET required");
  }

  try {
    const store = getStore("teams");
    const idx = await getTeamsIndex(store);
    const teamIds = Array.isArray(idx.items)
      ? idx.items.map((x) => x.teamId).filter(Boolean)
      : [];

    const teams = [];

    for (const teamId of teamIds) {
      const team = await readJSON(store, `teams/${teamId}.json`);
      if (!team) continue;

      const sidx = await readJSON(store, `submissions/index/${teamId}.json`);
      const ids = Array.isArray(sidx?.items)
        ? sidx.items.map((x) => x.submissionId).filter(Boolean)
        : [];

      const subs = [];
      for (const id of ids) {
        const sub = await readJSON(store, `submissions/${teamId}/${id}.json`);
        if (sub) subs.push(sub);
      }

      const score = computeTeamScore(subs, { includeSummaries: false });

      teams.push({
        teamId,
        teamName: team.teamName || "",
        officialPoints: score.officialPoints,
        provisionalPoints: score.provisionalPoints
      });
    }

    teams.sort((a, b) => b.officialPoints - a.officialPoints);

    return ok({ generatedAt: new Date().toISOString(), items: teams });
  } catch (e) {
    return error(
      500,
      "leaderboard_get_failed",
      "Failed to generate leaderboard",
      String(e?.message || e)
    );
  }
};
