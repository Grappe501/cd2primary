const { getStore } = require("@netlify/blobs");

function parseAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
}

function getIdentity(event) {
  return event?.context?.clientContext?.user || null;
}

async function readJSON(store, key) {
  try { return await store.get(key, { type: "json" }) || null; }
  catch { return null; }
}

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

    // Audits are stored as separate keys; we maintain a lightweight index to list them efficiently.
    // If index doesn't exist (older data), attempt a best-effort: return empty.
    const idxKey = `audits/${teamId}/${submissionId}/index.json`;
    const idx = await readJSON(store, idxKey);
    const keys = Array.isArray(idx?.keys) ? idx.keys : [];

    const audits = [];
    for (const k of keys) {
      const a = await readJSON(store, k);
      if (a) audits.push(a);
    }
    audits.sort((a,b)=> new Date(b.at||b.timestamp||0) - new Date(a.at||a.timestamp||0));

    return {
      statusCode: 200,
      headers: { "Content-Type":"application/json", "Cache-Control":"no-store" },
      body: JSON.stringify({ audits })
    };
  } catch (e) {
    return { statusCode: 500, body: "Audit list failed" };
  }
};
