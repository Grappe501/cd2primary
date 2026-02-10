/**
 * Scoring Engine (Overlay 09)
 * Points are awarded only for what the team submits/claims.
 */

export const SCORING_VERSION = 2;

export const PLATFORM_KEYS = [
  "tiktok",
  "instagram",
  "facebook",
  "x",
  "bluesky"
];

export function countPlatforms(platformLinks = {}) {
  let n = 0;
  for (const k of PLATFORM_KEYS) {
    const v = platformLinks?.[k];
    if (typeof v === "string" && v.trim()) n += 1;
  }
  return n;
}

export function calcCrossPostBonus(platformCount) {
  const extra = Math.max(0, (platformCount || 0) - 1);
  return extra * 5;
}

export function calcHashtagBonus(confirmHashtags) {
  // Rules: +1 for #PrimaryVote! and +1 for #ChrisJonesforCongress (only if eligible).
  // UI uses a single confirmation checkbox for both required hashtags.
  return confirmHashtags ? 2 : 0;
}

export function calcBasePoints(sub) {
  const type = sub?.submissionType;
  if (!type) return 0;

  switch (type) {
    case "support_chris":
      // 25 points each (cap handled later in admin review).
      return 25;

    case "volunteer_event":
      return 5;

    case "candidate_interview":
      return 5;

    case "recruit_bonus":
      return 20;

    case "polling_location": {
      const claimed = Array.isArray(sub?.claimedItems) ? sub.claimedItems : [];
      const count = claimed.length;

      // little_rock | major_city | other
      const area = sub?.pollingAreaType || "other";
      const perItem = area === "little_rock" ? 2 : area === "major_city" ? 3 : 4;
      const cap = area === "little_rock" ? 10 : area === "major_city" ? 15 : 20;

      return Math.min(cap, count * perItem);
    }

    default:
      return 0;
  }
}

export function calcCalculatedPoints(sub) {
  // Hard stop: if hashtags aren't confirmed, points are 0 (per rules).
  if (!sub?.confirmHashtags) {
    return { basePoints: 0, hashtagBonus: 0, crossPostBonus: 0, calculatedPoints: 0, platformCount: 0 };
  }

  const basePoints = calcBasePoints(sub);

  const platformLinks = sub?.platformLinks || {};
  const platformCount = countPlatforms(platformLinks);
  const crossPostBonus = calcCrossPostBonus(platformCount);

  const hashtagBonus = calcHashtagBonus(true);

  const calculatedPoints = basePoints + hashtagBonus + crossPostBonus;

  return { basePoints, hashtagBonus, crossPostBonus, calculatedPoints, platformCount };
}

export function isApproved(sub) {
  return (sub?.status || "pending") === "approved";
}

/**
 * 8-county sweep bonus (official only): +50 when a team has at least one
 * approved polling-location submission in each county.
 */
export function calcEightCountySweepBonus(approvedSubs = []) {
  const needed = new Set([
    "pulaski",
    "faulkner",
    "saline",
    "white",
    "cleburne",
    "perry",
    "conway",
    "van-buren"
  ]);

  for (const s of approvedSubs) {
    if (s?.submissionType !== "polling_location") continue;
    const c = s?.pollingCounty;
    if (typeof c === "string") needed.delete(c);
  }

  return needed.size === 0 ? 50 : 0;
}

export function calcPostingStreakBonus(approvedSubs = []) {
  const days = new Set();
  for (const s of approvedSubs) {
    const d = s && s.submissionDate;
    if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) days.add(d);
  }
  const sorted = Array.from(days).sort();
  let best = 0;
  let run = 0;
  let prevT = null;
  for (const d of sorted) {
    const t = Date.parse(d + "T00:00:00Z");
    if (prevT === null || (t - prevT) === 86400000) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > best) best = run;
    prevT = t;
  }
  if (best >= 10) return 60;
  if (best >= 7) return 40;
  if (best >= 5) return 25;
  if (best >= 3) return 10;
  return 0;
}
