const { getStore } = require("@netlify/blobs");

function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
}

function getIdentity(event) {
  // Netlify Identity JWT is validated by Netlify when using "Authorization: Bearer"
  // We rely on context.clientContext.user for identity.
  return event?.context?.clientContext?.user || null;
}

async function readJSON(store, key) {
  try { return await store.get(key, { type: "json" }) || null; }
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
    "submissionId","status","type","createdAt",
    "calculatedPoints","platforms","links",
    "locationCounty","locations"
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(header.map(k => esc(r[k])).join(","));
  }
  return lines.join("\n");
}

exports.handler = async (event) => {
  try {
    const user = getIdentity(event);
    const admins = parseAdminEmails();
    const email = (user?.email || "").toLowerCase();
    if (!email || !admins.includes(email)) {
      return { statusCode: 401, body: "Not authorized" };
    }

    const format = (event.queryStringParameters?.format || "csv").toLowerCase();
    const store = getStore("primaryvote");

    const tIndex = await readJSON(store, "teams/index.json");
    const teamIds = Array.isArray(tIndex?.teamIds) ? tIndex.teamIds : [];

    const out = [];
    for (const teamId of teamIds) {
      const team = await readJSON(store, `teams/${teamId}.json`);
      if (!team) continue;

      const sidx = await readJSON(store, `submissions/index/${teamId}.json`);
      const submissionIds = Array.isArray(sidx?.submissionIds) ? sidx.submissionIds : [];

      for (const submissionId of submissionIds) {
        const sub = await readJSON(store, `submissions/${teamId}/${submissionId}.json`);
        if (!sub) continue;
        out.push({
          teamId,
          teamName: team.teamName || "",
          homeCounty: team.homeCounty || "",
          submissionId,
          status: sub.status || "pending",
          type: sub.type || "",
          createdAt: sub.createdAt || "",
          calculatedPoints: sub.calculatedPoints ?? sub.points ?? 0,
          platforms: Array.isArray(sub.platforms) ? sub.platforms.join("|") : Object.keys(sub.links || {}).join("|"),
          links: JSON.stringify(sub.links || {}),
          locationCounty: sub.locationCounty || "",
          locations: JSON.stringify(sub.locations || []),
        });
      }
    }

    if (format === "json") {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": "attachment; filename=\"primaryvote_export.json\"",
          "Cache-Control": "no-store"
        },
        body: JSON.stringify({ generatedAt: new Date().toISOString(), rows: out })
      };
    }

    const csv = toCSV(out);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"primaryvote_export.csv\"",
        "Cache-Control": "no-store"
      },
      body: csv
    };
  } catch (e) {
    return { statusCode: 500, body: "Export failed" };
  }
};
