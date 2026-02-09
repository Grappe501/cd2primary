import { COUNTY_OPTIONS, json } from "./team.js";

export const SUBMISSION_TYPES = [
  { slug: "polling_location", label: "Polling Location Explainer" },
  { slug: "support_chris", label: "Why I Support Chris Jones" },
  { slug: "volunteer_event", label: "Campaign Volunteer Event (Live)" },
  { slug: "recruit_bonus", label: "New Team Recruit Bonus" },
  { slug: "candidate_interview", label: "Candidate Interview Bonus" },
  { slug: "other", label: "Other" }
];

export const POLLING_CLAIM_ITEMS = [
  "address",
  "geography",
  "early_voting",
  "primary_explainer",
  "say_vote_chris"
];

// Mar 3, 2026 @ 5:00 PM America/Chicago == 23:00 UTC
export const SUBMISSION_DEADLINE_UTC = Date.parse("2026-03-03T23:00:00.000Z");

export function isDeadlinePassed(now = Date.now()) {
  return now > SUBMISSION_DEADLINE_UTC;
}

export function validateSubmissionInput(input) {
  const errors = {};
  const clean = {};

  // Cross-post support (TikTok, Instagram, Facebook, X, Bluesky)
  // Teams may submit to any platform and earn +5 expected bonus points per additional platform.
  const rawLinks = input.platformLinks && typeof input.platformLinks === "object" ? input.platformLinks : {};
  const allowedPlatforms = ["tiktok", "instagram", "facebook", "x", "bluesky"];
  const platformLinks = {};
  for (const p of allowedPlatforms) {
    const v = String(rawLinks[p] || "").trim();
    if (v) platformLinks[p] = v;
  }
  const primaryUrl = String(input.primaryUrl || "").trim();
  // Back-compat: allow old clients sending videoUrl
  const legacyVideoUrl = String(input.videoUrl || "").trim();
  const submissionType = String(input.submissionType || "").trim();
  const submissionDate = String(input.submissionDate || "").trim();
  const expectedPointsRaw = String(input.expectedPoints || "").trim();
  const confirmHashtags = Boolean(input.confirmHashtags);

  const linkCount = Object.keys(platformLinks).length;
  const effectivePrimary = primaryUrl || platformLinks.tiktok || platformLinks.instagram || platformLinks.facebook || platformLinks.x || platformLinks.bluesky || legacyVideoUrl;

  if (!linkCount && !effectivePrimary) {
    errors.platformLinks = "Paste at least one public link (TikTok, Instagram, Facebook, X, or Bluesky).";
  }

  // Validate all provided links
  const toValidate = linkCount ? Object.values(platformLinks) : (effectivePrimary ? [effectivePrimary] : []);
  if (toValidate.some((u) => u && !/^https?:\/\//i.test(u))) {
    errors.platformLinks = "Please paste full http(s) links for each platform.";
  }

  if (!submissionType) errors.submissionType = "Submission type is required.";
  if (submissionType && !SUBMISSION_TYPES.some((t) => t.slug === submissionType)) {
    errors.submissionType = "Submission type must be a valid option.";
  }

  if (!submissionDate) errors.submissionDate = "Posting date is required.";
  // Basic YYYY-MM-DD check
  if (submissionDate && !/^\d{4}-\d{2}-\d{2}$/.test(submissionDate)) {
    errors.submissionDate = "Posting date must be a valid date.";
  }

  const expectedPoints = Number.parseInt(expectedPointsRaw, 10);
  if (!expectedPointsRaw && expectedPointsRaw !== "0") errors.expectedPoints = "Expected points is required.";
  if (Number.isNaN(expectedPoints)) errors.expectedPoints = "Expected points must be a whole number.";
  if (!Number.isNaN(expectedPoints) && expectedPoints < 0) errors.expectedPoints = "Expected points cannot be negative.";
  if (!Number.isNaN(expectedPoints) && expectedPoints > 500) errors.expectedPoints = "Expected points looks too high. Double-check.";

  if (!confirmHashtags) {
    errors.confirmHashtags = "You must confirm the required hashtags are present.";
  }

  const notes = String(input.notes || "").trim();
  const pollingCounty = String(input.pollingCounty || "").trim();
  const pollingName = String(input.pollingName || "").trim();

  const claimedItems = Array.isArray(input.claimedItems)
    ? input.claimedItems.map(String)
    : typeof input.claimedItems === "string"
      ? [input.claimedItems]
      : [];

  if (submissionType === "polling_location") {
    if (!pollingCounty) errors.pollingCounty = "Polling county is required for polling-location videos.";
    if (pollingCounty && !COUNTY_OPTIONS.some((c) => c.slug === pollingCounty)) {
      errors.pollingCounty = "Polling county must be one of the official counties.";
    }
    const invalid = claimedItems.filter((c) => !POLLING_CLAIM_ITEMS.includes(c));
    if (invalid.length) errors.claimedItems = "One or more claimed checklist items are invalid.";
    if (!claimedItems.length) errors.claimedItems = "Claim at least one checklist item for polling-location videos.";
  }

  const ok = Object.keys(errors).length === 0;
  if (!ok) return { ok, errors };

  clean.platformLinks = platformLinks;
  clean.primaryUrl = effectivePrimary;
  clean.submissionType = submissionType;
  clean.submissionTypeLabel = SUBMISSION_TYPES.find((t) => t.slug === submissionType)?.label || submissionType;
  clean.submissionDate = submissionDate;
  clean.expectedPoints = expectedPoints;
  clean.notes = notes || "";
  clean.confirmHashtags = confirmHashtags;

  if (submissionType === "polling_location") {
    clean.pollingCounty = pollingCounty;
    clean.pollingName = pollingName || "";
    clean.claimedItems = claimedItems;
  } else {
    clean.pollingCounty = pollingCounty || "";
    clean.pollingName = pollingName || "";
    clean.claimedItems = [];
  }

  return { ok, errors: {}, cleaned: clean };
}

export function error422(errors) {
  return json(422, { error: "Validation failed", errors });
}
