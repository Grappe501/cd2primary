import { getStore } from "@netlify/blobs";
import { json, requireUser } from "./_lib/team.js";
import {
  calcCalculatedPoints,
  calcEightCountySweepBonus,
  isApproved,
  SCORING_VERSION
} from "./_lib/scoring.js";

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

  let official = 0;
  let provisional = 0;

  const approvedSubs = [];
  const subsSummary = [];

  for (const it of items) {
    const id = it?.submissionId;
    if (!id) continue;

    const key = `submissions/${teamId}/${id}.json`;
    const sub = await store.get(key, { type: "json" });
    if (!sub) continue;

    const computed = calcCalculatedPoints(sub);
    const points = computed.calculatedPoints || 0;

    provisional += points;

    if (isApproved(sub)) {
      official += points;
      approvedSubs.push(sub);
    }

    subsSummary.push({
      submissionId: sub.submissionId,
      submissionType: sub.submissionType,
      status: sub.status || "pending",
      createdAt: sub.createdAt,
      submissionDate: sub.submissionDate,
      points
    });
  }

  const sweepBonus = calcEightCountySweepBonus(approvedSubs);
  official += sweepBonus;

  return json(200, {
    teamId,
    score: {
      scoringVersion: SCORING_VERSION,
      officialPoints: official,
      provisionalPoints: provisional,
      eightCountySweepBonus: sweepBonus,
      submissionCount: subsSummary.length,
      submissions: subsSummary
    }
  });
};
