
// Overlay 29: Audit Trail Repair
// - Writes audit entry
// - Appends to index.json (append-only)

import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./_lib/adminAuth.js";
import { json } from "./_lib/team.js";

export default async (req) => {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.res;

  if (req.method !== "POST") {
    return json(405, { error: { code: "method_not_allowed", message: "POST required" } });
  }

  try {
    const body = JSON.parse(req.body || "{}");
    const { teamId, submissionId, action } = body;

    if (!teamId || !submissionId || !action) {
      return json(400, { error: { code: "invalid_payload", message: "Missing required fields" } });
    }

    const store = getStore("primary");

    const submissionKey = `submissions/${teamId}/${submissionId}.json`;
    const submission = await store.get(submissionKey, { type: "json" });
    if (!submission) {
      return json(404, { error: { code: "submission_not_found", message: "Submission not found" } });
    }

    const before = { status: submission.status, points: submission.points };
    submission.status = action === "approved" ? "approved" : "rejected";
    const after = { status: submission.status, points: submission.points };

    await store.setJSON(submissionKey, submission);

    const timestamp = new Date().toISOString();
    const auditEntry = {
      id: `${submissionId}-${timestamp}`,
      action,
      reviewedAt: timestamp,
      reviewedBy: admin.email,
      before,
      after
    };

    const auditDir = `audits/${teamId}/${submissionId}`;
    const auditKey = `${auditDir}/${timestamp}.json`;
    await store.setJSON(auditKey, auditEntry);

    const indexKey = `${auditDir}/index.json`;
    const existingIndex = await store.get(indexKey, { type: "json" }) || [];
    existingIndex.push({
      id: auditEntry.id,
      action: auditEntry.action,
      reviewedAt: auditEntry.reviewedAt,
      reviewedBy: auditEntry.reviewedBy
    });

    await store.setJSON(indexKey, existingIndex);

    return json(200, { data: { success: true } });

  } catch (err) {
    return json(500, {
      error: { code: "admin_update_failed", message: "Failed to update submission" },
      details: String(err?.message || err)
    });
  }
};
