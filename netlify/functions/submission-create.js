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
  const idxKey = `submissions/index/${teamId}.json`;
  const idx = (await store.get(idxKey, { type: "json" })) || { items: [] };
  const items = Array.isArray(idx.items) ? idx.items : [];
  items.push({
    submissionId,
    createdAt: now,
    submissionType: submission.submissionType,
    expectedPoints: submission.expectedPoints,
    calculatedPoints: submission.calculatedPoints
  });
  await store.set(idxKey, JSON.stringify({ items }), { contentType: "application/json" });

  return json(201, { submission });
};
