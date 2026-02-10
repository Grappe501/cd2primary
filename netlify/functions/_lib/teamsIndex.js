import { getStore } from "@netlify/blobs";

const STORE_NAME = "teams";
const INDEX_KEY = "teams/index.json";

export async function getTeamsIndex(store) {
  const s = store || getStore(STORE_NAME);
  const idx = await s.get(INDEX_KEY, { type: "json" }).catch(() => null);
  const items = Array.isArray(idx?.items) ? idx.items : [];
  return { key: INDEX_KEY, items, raw: idx };
}

export async function upsertTeamsIndexItem(store, item) {
  const s = store || getStore(STORE_NAME);
  const { items } = await getTeamsIndex(s);
  const teamId = item?.teamId;
  if (!teamId) return;
  const next = items.filter((x) => x?.teamId !== teamId);
  next.push(item);
  next.sort((a, b) => String(a?.teamName || "").localeCompare(String(b?.teamName || "")));
  await s.setJSON(INDEX_KEY, { items: next, updatedAt: new Date().toISOString() });
}

export async function listTeams(store) {
  const s = store || getStore(STORE_NAME);
  const { items } = await getTeamsIndex(s);
  if (items.length) return items;

  // Fallback: attempt to list keys with prefix if index isn't built yet.
  if (typeof s.list !== "function") return [];

  const found = [];
  let cursor = undefined;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Netlify Blobs list API supports prefix + cursor.
    // We defensively handle different response shapes.
    const res = await s.list({ prefix: "teams/", cursor }).catch(() => null);
    const blobs = res?.blobs || res?.items || res?.keys || [];
    for (const b of blobs) {
      const key = typeof b === "string" ? b : b?.key;
      if (!key || key === INDEX_KEY) continue;
      if (!key.startsWith("teams/") || !key.endsWith(".json")) continue;
      const team = await s.get(key, { type: "json" }).catch(() => null);
      if (!team?.teamId) continue;
      found.push({
        teamId: team.teamId,
        teamName: team.teamName,
        homeCounty: team.homeCounty,
        createdAt: team.createdAt,
        ownerEmail: team.ownerEmail
      });
    }
    cursor = res?.cursor || res?.nextCursor || res?.next_cursor;
    if (!cursor) break;
  }

  // Try to persist for next time.
  if (found.length) {
    await s.setJSON(INDEX_KEY, { items: found, updatedAt: new Date().toISOString() }).catch(() => {});
  }
  return found;
}
