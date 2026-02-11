import { json } from "./_lib/team.js";
import { getSql, hasDatabaseUrl, badConfigResponse } from "./_lib/db.js";

function normalizeCountySlug(v) {
  return String(v || "").trim().toLowerCase();
}

export default async (req) => {
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  const url = new URL(req.url);
  const county = normalizeCountySlug(url.searchParams.get("county"));
  if (!county) return json(400, { error: "Missing 'county' query param" });

  if (!hasDatabaseUrl()) {
    return badConfigResponse(json);
  }

  try {
    const sql = getSql();

    const countyRows = await sql`
      SELECT id, slug, name
      FROM counties
      WHERE slug = ${county}
      LIMIT 1
    `;

    if (!countyRows?.length) {
      return json(404, { error: "County not found in DB", county });
    }

    const c = countyRows[0];

    const statsRows = await sql`
      SELECT year, vep, registered_voters, registered_percent, updated_at
      FROM county_stats
      WHERE county_id = ${c.id}
      ORDER BY year DESC
    `;

    // Use most recent year for headline stats
    const headline = statsRows?.[0] || null;

    const resultsRows = await sql`
      SELECT election_year, election_type, office, party, candidate, votes, percent, source
      FROM election_results
      WHERE county_id = ${c.id}
      ORDER BY election_year DESC, office ASC, percent DESC NULLS LAST, votes DESC NULLS LAST, candidate ASC
    `;

    // Group results: year -> office
    const elections = {};
    for (const r of (resultsRows || [])) {
      const y = String(r.election_year);
      const office = String(r.office || "");
      elections[y] = elections[y] || {};
      elections[y][office] = elections[y][office] || [];
      elections[y][office].push({
        electionYear: r.election_year,
        electionType: r.election_type,
        office: r.office,
        party: r.party,
        candidate: r.candidate,
        votes: r.votes,
        percent: r.percent,
        source: r.source
      });
    }

    return json(200, {
      county: { slug: c.slug, name: c.name },
      headline: headline
        ? {
            year: headline.year,
            vep: headline.vep,
            registeredVoters: headline.registered_voters,
            registeredPercent: headline.registered_percent
          }
        : null,
      stats: (statsRows || []).map((s) => ({
        year: s.year,
        vep: s.vep,
        registeredVoters: s.registered_voters,
        registeredPercent: s.registered_percent
      })),
      elections,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    return json(500, { error: "Failed to load county summary", details: String(err?.message || err) });
  }
};
