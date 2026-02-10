import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./_lib/admin.js";
import { COUNTY_OPTIONS, json } from "./_lib/team.js";
import { listTeams } from "./_lib/teamsIndex.js";
import { calcCalculatedPoints } from "./_lib/scoring.js";
import { SUBMISSION_TYPES } from "./_lib/submissions.js";

const typeLabel = new Map(SUBMISSION_TYPES.map((t) => [t.slug, t.label]));
const countyName = new Map(COUNTY_OPTIONS.map((c) => [c.slug, c.name]));

function getQuery(req) {
  const u = new URL(req.url);
  return u.searchParams;
}

export default async (req, context) => {
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  const admin = requireAdmin(context);
  if (!admin.ok) return admin.response;

  const qp = getQuery(req);
  const status = String(qp.get("status") || "pending").toLowerCase();
  const store = getStore("teams");

  const teams = await listTeams(store);
  const out = [];

  for (const t of teams) {
    const teamId = t.teamId;
    if (!teamId) continue;

    const teamKey = `teams/${teamId}.json`;
    const teamRec = await store.get(teamKey, { type: "json" }).catch(() => ({}));
    const member1Name = teamRec?.member1Name || "";
    const member2Name = teamRec?.member2Name || "";

    const idxKey = `submissions/index/${teamId}.json`;
    const idx = (await store.get(idxKey, { type: "json" }).catch(() => null)) || { items: [] };
    const items = Array.isArray(idx.items) ? idx.items : [];
    for (const it of items) {
      const submissionId = it?.submissionId;
      if (!submissionId) continue;
      const key = `submissions/${teamId}/${submissionId}.json`;
      const sub = await store.get(key, { type: "json" }).catch(() => null);
      if (!sub) continue;

      const s = String(sub.status || "pending").toLowerCase();
      if (status !== "all" && s !== status) continue;

      const computed = calcCalculatedPoints(sub);

      out.push({
        teamId,
        teamName: t.teamName || "",
        homeCounty: t.homeCounty || "",
        homeCountyName: countyName.get(t.homeCounty) || "",
        ownerEmail: t.ownerEmail || "",
        member1Name,
        member2Name,
        submissionId: sub.submissionId,
        submissionType: sub.submissionType,
        submissionTypeLabel: typeLabel.get(sub.submissionType) || sub.submissionType,
        status: s,
        createdAt: sub.createdAt,
        submissionDate: sub.submissionDate,
        primaryUrl: sub.primaryUrl || "",
        platformLinks: sub.platformLinks || {},
        notes: sub.notes || "",
        pollingCounty: sub.pollingCounty || "",
        pollingCountyName: countyName.get(sub.pollingCounty) || "",
        pollingAreaType: sub.pollingAreaType || "",
        claimedItems: sub.claimedItems || [],
        confirmHashtags: Boolean(sub.confirmHashtags),
        adminNote: sub.adminNote || "",
        reviewedAt: sub.reviewedAt || "",
        reviewedBy: sub.reviewedBy || "",
        ...computed
      });
    }
  }

  out.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  return json(200, { items: out });
};
