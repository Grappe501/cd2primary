const { getStore } = require("@netlify/blobs");

async function readJSON(store, key) {
  try {
    const v = await store.get(key, { type: "json" });
    return v || null;
  } catch (e) {
    return null;
  }
}

exports.handler = async () => {
  try {
    const store = getStore("primaryvote");

    const index = await readJSON(store, "teams/index.json");
    const teamIds = Array.isArray(index?.teamIds) ? index.teamIds : [];

    // Import scoring helpers if present
    let scoring;
    try { scoring = require("./_lib/scoring"); } catch { scoring = null; }

    const teams = [];
    for (const teamId of teamIds) {
      const team = await readJSON(store, `teams/${teamId}.json`);
      if (!team) continue;

      // Get submissions index
      const sidx = await readJSON(store, `submissions/index/${teamId}.json`);
      const submissionIds = Array.isArray(sidx?.submissionIds) ? sidx.submissionIds : [];

      let approved = 0, pending = 0;
      let officialScore = 0, provisionalScore = 0;

      for (const submissionId of submissionIds) {
        const sub = await readJSON(store, `submissions/${teamId}/${submissionId}.json`);
        if (!sub) continue;
        const status = sub.status || "pending";
        const pts = Number(sub.calculatedPoints ?? sub.points ?? 0) || 0;

        if (status === "approved") {
          approved += 1;
          officialScore += pts;
          provisionalScore += pts;
        } else if (status === "pending") {
          pending += 1;
          provisionalScore += pts;
        } // rejected contributes 0
      }

      // Apply sweep / streak bonuses if scoring lib provides those helpers
      // We assume official bonuses were already integrated into stored score API,
      // but leaderboard uses the simple sums above to remain fast and stable.
      // If scoring helper exists with bonuses, apply them.
      if (scoring && typeof scoring.computeOfficialBonuses === "function") {
        const bonus = await scoring.computeOfficialBonuses({ store, teamId });
        officialScore += Number(bonus?.totalBonus || 0) || 0;
      }

      teams.push({
        teamId,
        teamName: team.teamName || "",
        homeCounty: team.homeCounty || "",
        officialScore,
        provisionalScore,
        approvedCount: approved,
        pendingCount: pending,
        updatedAt: team.updatedAt || team.createdAt || null,
      });
    }

    // sort
    teams.sort((a,b) => (b.officialScore||0) - (a.officialScore||0));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({
        generatedAt: new Date().toISOString(),
        teams
      })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "leaderboard_get_failed" }) };
  }
};
