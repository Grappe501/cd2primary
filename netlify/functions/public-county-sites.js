import { json } from "./_lib/team.js";
import { getSql, hasDatabaseUrl, badConfigResponse } from "./_lib/db.js";

function normalizeCountySlug(v) {
  return String(v || "").trim().toLowerCase();
}

export default async (req) => {
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  const url = new URL(req.url);
  const county = normalizeCountySlug(url.searchParams.get("county"));
  const electionDate = String(url.searchParams.get("election") || "").trim();

  if (!county) return json(400, { error: "Missing 'county' query param" });
  if (!electionDate)
    return json(400, { error: "Missing 'election' query param (YYYY-MM-DD)" });

  if (!hasDatabaseUrl()) {
    return badConfigResponse(json);
  }

  try {
    const sql = getSql();

    // Schema truth: counties.id is INTEGER and elections.county_id is INTEGER FK -> counties.id
    const electionRows = await sql`
      SELECT e.id, e.election_date, e.name, e.election_type, e.notes
      FROM public.elections e
      JOIN public.counties c ON c.id = e.county_id
      WHERE c.slug = ${county}
        AND e.election_date = ${electionDate}::date
      ORDER BY e.updated_at DESC, e.id DESC
      LIMIT 1
    `;

    if (!electionRows?.length) {
      return json(200, {
        county,
        electionDate,
        found: false,
        message: "No election voting-site data available yet for this county/date.",
      });
    }

    const e = electionRows[0];

    const rows = await sql`
      SELECT
        vs.id,
        vs.name,
        vs.address1,
        vs.city,
        vs.state,
        vs.zip,
        vs.lat,
        vs.lng,
        w.kind,
        w.start_ts,
        w.end_ts,
        w.notes AS window_notes
      FROM public.voting_sites vs
      JOIN public.voting_site_windows w ON w.voting_site_id = vs.id
      WHERE w.election_id = ${e.id}
      ORDER BY w.kind, vs.city, vs.name, w.start_ts
    `;

    const byKind = { early: new Map(), election_day: new Map() };

    for (const r of rows || []) {
      const kind = r.kind === "election_day" ? "election_day" : "early";
      const map = byKind[kind];
      const key = String(r.id);

      if (!map.has(key)) {
        map.set(key, {
          id: r.id,
          name: r.name,
          address1: r.address1,
          city: r.city,
          state: r.state,
          zip: r.zip,
          lat: r.lat,
          lng: r.lng,
          windows: [],
        });
      }

      map.get(key).windows.push({
        startTs: r.start_ts,
        endTs: r.end_ts,
        notes: r.window_notes,
      });
    }

    return json(200, {
      county,
      found: true,
      election: {
        id: e.id,
        date: e.election_date,
        name: e.name,
        type: e.election_type,
        notes: e.notes,
      },
      earlyVoting: Array.from(byKind.early.values()),
      electionDay: Array.from(byKind.election_day.values()),
    });
  } catch (err) {
    console.error("public-county-sites error", err);
    return json(500, { error: "Failed to load county sites" });
  }
};
