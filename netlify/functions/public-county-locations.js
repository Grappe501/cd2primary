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

    const rows = await sql`
      SELECT
        pl.id,
        pl.name,
        pl.address1,
        pl.city,
        pl.state,
        pl.zip,
        pl.lat,
        pl.lng,
        pl.kind,
        pl.hours,
        pl.notes,
        (
          SELECT COUNT(*)::int
          FROM precincts p
          WHERE p.polling_location_id = pl.id
        ) as precinct_count
      FROM polling_locations pl
      WHERE pl.county_id = ${c.id}
      ORDER BY pl.kind ASC, pl.name ASC
    `;

    return json(200, {
      county: { slug: c.slug, name: c.name },
      locations: (rows || []).map((r) => ({
        id: r.id,
        name: r.name,
        address1: r.address1,
        city: r.city,
        state: r.state,
        zip: r.zip,
        lat: r.lat,
        lng: r.lng,
        kind: r.kind,
        hours: r.hours,
        notes: r.notes,
        precinctCount: r.precinct_count
      })),
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    return json(500, { error: "Failed to load county locations", details: String(err?.message || err) });
  }
};
