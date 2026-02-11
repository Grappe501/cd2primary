import { getStore } from "@netlify/blobs";
import { json, requireUser } from "./_lib/team.js";
import { calcCalculatedPoints, SCORING_VERSION } from "./_lib/scoring.js";

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
    return json(200, { teamId: null, submissions: [] });
  }

  const idxKey = `submissions/index/${teamId}.json`;
  const idx = (await store.get(idxKey, { type: "json" })) || { items: [] };

  // Fetch each submission (small volume; can optimize later)
  const items = Array.isArray(idx.items) ? idx.items : [];
  // Dedupe index (defensive against retries/drift)
  const seen = new Set();
  const deduped = [];
  for (const it of items) {
    const id = it?.submissionId;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    deduped.push(it);
  }
  const subs = [];
  const aliveIndex = [];

  for (const it of deduped) {
    const id = it?.submissionId;
    if (!id) continue;
    const key = `submissions/${teamId}/${id}.json`;
    const sub = await store.get(key, { type: "json" });
    if (!sub) {
      // Heal drift: index points at a missing record.
      continue;
    }
    aliveIndex.push(it);

    // Backfill computed scoring fields for older submissions
    if (typeof sub.calculatedPoints !== "number") {
      const computed = calcCalculatedPoints(sub);
      sub.scoringVersion = SCORING_VERSION;
      sub.basePoints = computed.basePoints;
      sub.hashtagBonus = computed.hashtagBonus;
      sub.crossPostBonus = computed.crossPostBonus;
      sub.calculatedPoints = computed.calculatedPoints;
      sub.platformCount = computed.platformCount;

      await store.set(key, JSON.stringify(sub), { contentType: "application/json" });
    }

    subs.push(sub);
  }

  // If the index was dirty (dupes or missing records), write back the healed index.
  if (aliveIndex.length !== items.length) {
    await store.set(idxKey, JSON.stringify({ items: aliveIndex }), { contentType: "application/json" }).catch(() => {});
  }

  subs.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

  return json(200, { teamId, submissions: subs });
};
