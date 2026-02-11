import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./_lib/admin.js";
import { json } from "./_lib/team.js";

const ALLOWED = new Set(["pending", "approved", "rejected"]);

export default async (req, context) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const admin = requireAdmin(context);
  if (!admin.ok) return admin.response;

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const teamId = String(body?.teamId || "").trim();
  const submissionId = String(body?.submissionId || "").trim();
  const status = String(body?.status || "").trim().toLowerCase();
  const adminNote = String(body?.adminNote || "").trim();

  if (!teamId) return json(422, { error: "teamId is required" });
  if (!submissionId) return json(422, { error: "submissionId is required" });
  if (!ALLOWED.has(status)) return json(422, { error: "status must be pending|approved|rejected" });

  const store = getStore("teams");
  const key = `submissions/${teamId}/${submissionId}.json`;
  const sub = await store.get(key, { type: "json" }).catch(() => null);
  if (!sub) return json(404, { error: "Submission not found" });

  const before = { status: sub.status || "pending", adminNote: sub.adminNote || "" };
  const now = new Date().toISOString();

  const updated = {
    ...sub,
    status,
    adminNote,
    updatedAt: now,
    reviewedAt: now,
    reviewedBy: admin.user.email || admin.user.sub
  };

  await store.setJSON(key, updated);

  // Minimal audit trail (one file per review action)
  const auditKey = `audits/${teamId}/${submissionId}/${now.replace(/[:.]/g, "-")}.json`;
  await store.setJSON(auditKey, {
    teamId,
    submissionId,
    reviewedAt: now,
    reviewedBy: updated.reviewedBy,
    before,
    after: { status, adminNote }
  }).catch(() => {});

  return json(200, { submission: updated });
};
