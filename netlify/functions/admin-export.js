import { getStore } from "@netlify/blobs";
import { json } from "./_lib/team.js";
import { requireAdmin } from "./_lib/admin.js";
import { getTeamsIndex } from "./_lib/teamsIndex.js";

async function readJSON(store, key) {
  try { return (await store.get(key, { type: "json" })) || null; }
  catch { return null; }
}

function toCSV(rows) {
  const esc = (v) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const header = [
    "teamId","teamName","homeCounty",
    "submissionId","status","submissionType","createdAt","submissionDate",
    "calculatedPoints","basePoints","hashtagBonus","crossPostBonus","platformCount",
    "links",
    "pollingCounty","pollingPlaces"
  ];
  const lines = [header.join(",")];
  for (const r of rows) lines.push(header.map((k) => esc(r[k])).join(","));
  return lines.join("\n");
}

export default async (req, context) => {
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  const admin = requireAdmin(context);
  if (!admin.ok) return admin.response;

  try {
    const url = new URL(req.url);
    const format = (url.searchParams.get("format") || "csv").toLowerCase();

    const store = getStore("teams");

    const idx = await getTeamsIndex(store);
    const teamIds = Array.isArray(idx.items) ? idx.items.map((x) => x.teamId).filter(Boolean) : [];

    const rows = [];
    for (const teamId of teamIds) {
      const team = await readJSON(store, `teams/${teamId}.json`);
      if (!team) continue;

      const sidx = await readJSON(store, `submissions/index/${teamId}.json`);
      const items = Array.isArray(sidx?.items) ? sidx.items : [];
      const submissionIds = items.map((x) => x.submissionId).filter(Boolean);

      for (const submissionId of submissionIds) {
        const sub = await readJSON(store, `submissions/${teamId}/${submissionId}.json`);
        if (!sub) continue;

        rows.push({
          teamId,
          teamName: team.teamName || "",
          homeCounty: team.homeCounty || "",
          submissionId,
          status: sub.status || "pending",
          submissionType: sub.submissionType || "",
          createdAt: sub.createdAt || "",
          submissionDate: sub.submissionDate || "",
          calculatedPoints: sub.calculatedPoints ?? 0,
          basePoints: sub.basePoints ?? "",
          hashtagBonus: sub.hashtagBonus ?? "",
          crossPostBonus: sub.crossPostBonus ?? "",
          platformCount: sub.platformCount ?? "",
          links: JSON.stringify(sub.links || {}),
          pollingCounty: sub.pollingCounty || "",
          pollingPlaces: JSON.stringify(sub.pollingPlaces || []),
        });
      }
    }

    if (format === "json") {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": "attachment; filename=\"primaryvote_export.json\"",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({ generatedAt: new Date().toISOString(), rows }),
      };
    }

    const csv = toCSV(rows);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"primaryvote_export.csv\"",
        "Cache-Control": "no-store",
      },
      body: csv,
    };
  } catch {
    return json(500, { error: "export_failed" });
  }
};
