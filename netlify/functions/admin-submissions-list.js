
// Overlay 28: Admin List Wiring Repair
// Backward-compatible response shape fix
// Returns both { items } and { submissions }

import { getStore } from "@netlify/blobs";
import { requireAdmin } from "./_lib/adminAuth.js";
import { json } from "./_lib/team.js";

export default async (req) => {
  const admin = await requireAdmin(req);
  if (!admin.ok) return admin.res;

  try {
    const store = getStore("primary");
    const indexRaw = await store.get("submissions/index.json", { type: "json" });
    const items = Array.isArray(indexRaw) ? indexRaw : [];

    // Backward compatibility: return both keys
    return json(200, {
      items,
      submissions: items
    });

  } catch (err) {
    return json(500, {
      error: {
        code: "admin_submissions_list_failed",
        message: "Failed to load submissions list"
      },
      details: String(err?.message || err)
    });
  }
};
