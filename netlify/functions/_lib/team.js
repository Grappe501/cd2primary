export const COUNTY_OPTIONS = [
  { slug: "cleburne", name: "Cleburne" },
  { slug: "conway", name: "Conway" },
  { slug: "faulkner", name: "Faulkner" },
  { slug: "perry", name: "Perry" },
  { slug: "pulaski", name: "Pulaski" },
  { slug: "saline", name: "Saline" },
  { slug: "van-buren", name: "Van Buren" },
  { slug: "white", name: "White" }
];

export function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

export function requireUser(context) {
  const user = context?.clientContext?.user || null;
  if (!user) {
    return { ok: false, response: json(401, { error: "Unauthorized" }) };
  }
  return { ok: true, user };
}

export function normalizeHandle(handle) {
  const raw = String(handle || "").trim();
  if (!raw) return "";
  return raw.startsWith("@") ? raw : `@${raw}`;
}

export function validateTeamInput(input) {
  const errors = {};

  const teamName = String(input.teamName || "").trim();
  const homeCounty = String(input.homeCounty || "").trim();

  const member1Name = String(input.member1Name || "").trim();
  const member1TikTok = normalizeHandle(input.member1TikTok);
  const member2Name = String(input.member2Name || "").trim();
  const member2TikTok = normalizeHandle(input.member2TikTok);

  if (!teamName) errors.teamName = "Team name is required.";
  if (!homeCounty) errors.homeCounty = "Home county is required.";
  if (!COUNTY_OPTIONS.some((c) => c.slug === homeCounty)) {
    errors.homeCounty = "Home county must be one of the official counties.";
  }
  if (!member1Name) errors.member1Name = "Member 1 name is required.";
  if (!member1TikTok) errors.member1TikTok = "Member 1 TikTok handle is required.";
  if (!member2Name) errors.member2Name = "Member 2 name is required.";
  if (!member2TikTok) errors.member2TikTok = "Member 2 TikTok handle is required.";

  const ok = Object.keys(errors).length === 0;
  return {
    ok,
    errors,
    cleaned: {
      teamName,
      homeCounty,
      member1Name,
      member1TikTok,
      member2Name,
      member2TikTok
    }
  };
}
