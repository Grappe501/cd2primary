
// Overlay 32: Submission Idempotency Guard
// Deterministic submissionId based on teamId + normalizedPrimaryUrl

import { getStore } from "@netlify/blobs";
import crypto from "crypto";
import { requireUser, ok, error } from "./_lib/team.js";
import { normalizeUrl } from "./_lib/submissions.js";

function deterministicId(teamId, url) {
  const hash = crypto
    .createHash("sha256")
    .update(teamId + "::" + url)
    .digest("hex");
  return hash.substring(0, 16);
}

export default async (req, context) => {
  if (req.method !== "POST") {
    return error(405, "method_not_allowed", "POST required");
  }

  const auth = requireUser(context);
  if (!auth.ok) return auth.response;

  try {
    const body = JSON.parse(req.body || "{}");
    const teamId = body.teamId;
    const primaryUrl = normalizeUrl(body.primaryUrl || "");

    if (!teamId || !primaryUrl) {
      return error(400, "invalid_payload", "Missing teamId or primaryUrl");
    }

    const store = getStore("teams");

    const submissionId = deterministicId(teamId, primaryUrl);
    const key = `submissions/${teamId}/${submissionId}.json`;

    const existing = await store.get(key, { type: "json" });
    if (existing) {
      // Idempotent return — do not duplicate
      return ok({ submissionId, duplicate: true });
    }

    const submission = {
      ...body,
      submissionId,
      primaryUrl,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    await store.setJSON(key, submission);

    // Update team index safely
    const idxKey = `submissions/index/${teamId}.json`;
    const idx = (await store.get(idxKey, { type: "json" })) || { items: [] };

    if (!idx.items.find(x => x.submissionId === submissionId)) {
      idx.items.push({ submissionId });
      await store.setJSON(idxKey, idx);
    }

    return ok({ submissionId, duplicate: false });

  } catch (e) {
    return error(
      500,
      "submission_create_failed",
      "Failed to create submission",
      String(e?.message || e)
    );
  }
};
