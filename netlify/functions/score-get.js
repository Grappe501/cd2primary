import { getStore } from "@netlify/blobs";
import { json, requireUser } from "./_lib/team.js";
import { computeTeamScore, SCORING_VERSION } from "./_lib/scoring.js";

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
    return json(200, { teamId: null, score: null });
  }

  const idxKey = `submissions/index/${teamId}.json`;
  const idx = (await store.get(idxKey, { type: "json" })) || { items: [] };
  const items = Array.isArray(idx.items) ? idx.items : [];

  // Load submissions (small volume; deterministic scoring happens in computeTeamScore)
  const subs = [];
  for (const it of items) {
    const id = it?.submissionId;
    if (!id) continue;
    const key = `submissions/${teamId}/${id}.json`;
    const sub = await store.get(key, { type: "json" });
    if (sub) subs.push(sub);
  }

  const score = computeTeamScore(subs, { includeSummaries: true });

  // Preserve legacy shape while ensuring scoring is centralized/deterministic
  return json(200, {
    teamId,
    score: {
      scoringVersion: SCORING_VERSION,
      officialPoints: score.officialPoints,
      provisionalPoints: score.provisionalPoints,
      eightCountySweepBonus: score.eightCountySweepBonus,
      postingStreakBonus: score.postingStreakBonus,
      submissionCount: score.submissionCount,
      submissions: score.submissions || []
    }
  });
};
