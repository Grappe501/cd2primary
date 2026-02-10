const { getStore } = require("@netlify/blobs");

function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
}
function getIdentity(event){ return event?.context?.clientContext?.user || null; }

async function readJSON(store, key) { try { return await store.get(key, { type:"json" }) || null; } catch { return null; } }
async function writeJSON(store, key, value) { await store.set(key, JSON.stringify(value), { contentType:"application/json" }); }

exports.handler = async (event) => {
  try {
    const user = getIdentity(event);
    const admins = parseAdminEmails();
    const email = (user?.email || "").toLowerCase();
    if (!email || !admins.includes(email)) return { statusCode: 401, body: "Not authorized" };

    const teamId = event.queryStringParameters?.teamId;
    const submissionId = event.queryStringParameters?.submissionId;
    if (!teamId || !submissionId) return { statusCode: 400, body: "Missing teamId/submissionId" };

    const store = getStore("primaryvote");

    // Best-effort: if admin-submission-update already writes audit entries but not an index,
    // we can't list arbitrary keys. So this endpoint is a placeholder for future enhancement.
    // For now it just creates an empty index file if missing.
    const idxKey = `audits/${teamId}/${submissionId}/index.json`;
    const idx = await readJSON(store, idxKey);
    if (idx) return { statusCode: 200, body: JSON.stringify({ ok:true, keys: idx.keys || [] }) };

    await writeJSON(store, idxKey, { keys: [] });
    return { statusCode: 200, body: JSON.stringify({ ok:true, keys: [] }) };
  } catch (e) {
    return { statusCode: 500, body: "Reindex failed" };
  }
};
