/**
 * Scoring Engine (Overlay 09)
 * Points are awarded only for what the team submits/claims.
 *
 * Overlay 30: Deterministic scoring unification
 * - Centralize caps + per-team scoring computation here
 * - Ensure leaderboard + score-get compute totals identically
 */

export const SCORING_VERSION = 3;

export const PLATFORM_KEYS = [
  "tiktok",
  "instagram",
  "facebook",
  "x",
  "bluesky"
];

// Centralized caps (applies to BOTH provisional + official scoring)
export const SCORING_CAPS = {
  support_chris: 2
};

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
      // 25 points each (cap enforced centrally via SCORING_CAPS)
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

function stableSortSubs(subs = []) {
  // Deterministic order across endpoints to ensure caps behave identically everywhere.
  // Primary: createdAt (ISO string). Secondary: submissionId.
  return [...subs].sort((a, b) => {
    const ac = a?.createdAt || "";
    const bc = b?.createdAt || "";
    if (ac < bc) return -1;
    if (ac > bc) return 1;
    const aid = a?.submissionId || "";
    const bid = b?.submissionId || "";
    if (aid < bid) return -1;
    if (aid > bid) return 1;
    return 0;
  });
}

function applyCap(type, countedByType) {
  const cap = SCORING_CAPS?.[type];
  if (!(typeof cap === "number" && cap > 0)) return { capBlocked: false };
  const already = countedByType[type] || 0;
  if (already >= cap) return { capBlocked: true };
  countedByType[type] = already + 1;
  return { capBlocked: false };
}

/**
 * Deterministic per-team scoring from raw submission objects.
 * - Computes provisional + official points with centralized caps.
 * - Computes official-only bonuses.
 * - Optionally returns a per-submission summary with capBlocked + points.
 */
export function computeTeamScore(submissions = [], opts = {}) {
  const includeSummaries = opts?.includeSummaries !== false;

  let official = 0;
  let provisional = 0;

  let approvedCount = 0;
  let pendingCount = 0;

  const approvedSubs = [];
  const countedByType = Object.create(null);

  const subsSorted = stableSortSubs(Array.isArray(submissions) ? submissions : []);
  const summaries = [];

  for (const sub of subsSorted) {
    if (!sub) continue;

    const computed = calcCalculatedPoints(sub);
    let points = Number(computed.calculatedPoints || 0) || 0;

    const type = sub.submissionType || "";
    const { capBlocked } = applyCap(type, countedByType);
    if (capBlocked) points = 0;

    const status = sub.status || "pending";

    // Provisional includes pending + approved
    if (status === "approved") {
      approvedCount += 1;
      approvedSubs.push(sub);
      official += points;
      provisional += points;
    } else if (status === "pending") {
      pendingCount += 1;
      provisional += points;
    } else {
      // rejected: neither official nor provisional (consistent with existing leaderboard behavior)
    }

    if (includeSummaries) {
      summaries.push({
        submissionId: sub.submissionId,
        submissionType: sub.submissionType,
        status,
        createdAt: sub.createdAt,
        submissionDate: sub.submissionDate,
        points,
        capBlocked: !!capBlocked
      });
    }
  }

  const sweepBonus = calcEightCountySweepBonus(approvedSubs);
  const streakBonus = calcPostingStreakBonus(approvedSubs);

  official += (Number(sweepBonus) || 0) + (Number(streakBonus) || 0);

  return {
    scoringVersion: SCORING_VERSION,
    officialPoints: official,
    provisionalPoints: provisional,
    eightCountySweepBonus: sweepBonus,
    postingStreakBonus: streakBonus,
    approvedCount,
    pendingCount,
    submissionCount: includeSummaries ? summaries.length : subsSorted.length,
    submissions: includeSummaries ? summaries : undefined
  };
}
