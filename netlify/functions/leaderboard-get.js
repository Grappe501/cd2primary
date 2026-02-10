import { getStore } from "@netlify/blobs";
import { json } from "./_lib/team.js";
import { getTeamsIndex } from "./_lib/teamsIndex.js";
import { calcEightCountySweepBonus, calcPostingStreakBonus } from "./_lib/scoring.js";

async function readJSON(store, key) {
  try {
    const v = await store.get(key, { type: "json" });
    return v || null;
  } catch {
    return null;
  }
}

export default async (req) => {
  if (req.method !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const store = getStore("teams");

    // teams index in this codebase uses { items: [{ teamId, ... }] }
    const idx = await getTeamsIndex(store);
    const teamIds = Array.isArray(idx.items) ? idx.items.map((x) => x.teamId).filter(Boolean) : [];

    const teams = [];
    for (const teamId of teamIds) {
      const team = await readJSON(store, `teams/${teamId}.json`);
      if (!team) continue;

      const sidx = await readJSON(store, `submissions/index/${teamId}.json`);
      const items = Array.isArray(sidx?.items) ? sidx.items : [];
      const submissionIds = items.map((x) => x.submissionId).filter(Boolean);

      let approvedCount = 0;
      let pendingCount = 0;
      let officialScore = 0;
      let provisionalScore = 0;

      const approvedSubs = [];

      for (const submissionId of submissionIds) {
        const sub = await readJSON(store, `submissions/${teamId}/${submissionId}.json`);
        if (!sub) continue;

        const status = sub.status || "pending";
        const pts = Number(sub.calculatedPoints ?? sub.points ?? 0) || 0;

        if (status === "approved") {
          approvedCount += 1;
          officialScore += pts;
          provisionalScore += pts;
          approvedSubs.push(sub);
        } else if (status === "pending") {
          pendingCount += 1;
          provisionalScore += pts;
        }
      }

      // Official-only bonuses: sweep + posting streak
      const sweepBonus = calcEightCountySweepBonus(approvedSubs);
      const streakBonus = calcPostingStreakBonus(approvedSubs);
      officialScore += (Number(sweepBonus) || 0) + (Number(streakBonus) || 0);

      teams.push({
        teamId,
        teamName: team.teamName || "",
        homeCounty: team.homeCounty || "",
        officialScore,
        provisionalScore,
        approvedCount,
        pendingCount,
        updatedAt: team.updatedAt || team.createdAt || null,
      });
    }

    teams.sort((a, b) => (b.officialScore || 0) - (a.officialScore || 0));

    return json(200, { generatedAt: new Date().toISOString(), teams });
  } catch (e) {
    return json(500, { error: "leaderboard_get_failed" });
  }
};
