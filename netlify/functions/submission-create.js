import { getStore } from "@netlify/blobs";
import { json, requireUser } from "./_lib/team.js";
import { error422, isDeadlinePassed, validateSubmissionInput } from "./_lib/submissions.js";
import { calcCalculatedPoints, SCORING_VERSION } from "./_lib/scoring.js";

export default async (req, context) => {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const auth = requireUser(context);
  if (!auth.ok) return auth.response;

  if (isDeadlinePassed()) {
    return json(403, { error: "Submissions are closed (deadline passed)." });
  }

  const body = await req.json().catch(() => ({}));
  const v = validateSubmissionInput(body);
  if (!v.ok) return error422(v.errors);

  const store = getStore("teams");
  const ownerId = auth.user.sub;

  // Resolve team
  const ownerKey = `owners/${ownerId}.json`;
  const ownerMapping = await store.get(ownerKey, { type: "json" });
  const teamId = ownerMapping?.teamId;
  if (!teamId) {
    return json(409, { error: "Create your team profile first." });
  }

  // Make sure the team exists
  const teamKey = `teams/${teamId}.json`;
  const team = await store.get(teamKey, { type: "json" });
  if (!team) {
    return json(409, { error: "Team profile not found. Please recreate your team profile." });
  }

  const submissionId = crypto.randomUUID();
  const now = new Date().toISOString();

  const cleaned = v.cleaned;

  // Duplicate guard (same team + same normalized primaryUrl).
  // We scan the team index; volume is expected to be small.
  const existingIdxKey = `submissions/index/${teamId}.json`;
  const existingIdx = (await store.get(existingIdxKey, { type: "json" }).catch(() => null)) || { items: [] };
  const existingItems = Array.isArray(existingIdx.items) ? existingIdx.items : [];
  const existingIds = existingItems.map((x) => x.submissionId).filter(Boolean);
  for (const existingId of existingIds) {
    const existing = await store.get(`submissions/${teamId}/${existingId}.json`, { type: "json" }).catch(() => null);
    if (!existing) continue;
    if (String(existing.primaryUrl || "").trim() && String(existing.primaryUrl || "").trim() === cleaned.primaryUrl) {
      return json(409, { error: "Duplicate submission detected (same link already submitted)." });
    }
  }
  const computed = calcCalculatedPoints(cleaned);

  const submission = {
    submissionId,
    teamId,
    ownerId,
    createdAt: now,
    updatedAt: now,
    status: "pending",
    ...cleaned,
    scoringVersion: SCORING_VERSION,
    basePoints: computed.basePoints,
    hashtagBonus: computed.hashtagBonus,
    crossPostBonus: computed.crossPostBonus,
    calculatedPoints: computed.calculatedPoints,
    platformCount: computed.platformCount
  };

  const key = `submissions/${teamId}/${submissionId}.json`;
  await store.set(key, JSON.stringify(submission), { contentType: "application/json" });

  // Update index
  const idxKey = existingIdxKey;
  const items = existingItems;
  items.push({
    submissionId,
    createdAt: now,
    submissionType: submission.submissionType,
    submissionDate: submission.submissionDate,
    primaryUrl: submission.primaryUrl,
    expectedPoints: submission.expectedPoints,
    calculatedPoints: submission.calculatedPoints
  });
  await store.set(idxKey, JSON.stringify({ items }), { contentType: "application/json" });

  return json(201, { submission });
};
