/* dist/assets/js/leaderboard.live.js */
/* Overlay 26: Hardening
 * - Explicit error states with debug token
 * - Retry button
 * - Fetch timeout + offline awareness
 * - Keep Overlay 15 “One Truth” rule: no silent mock fallback
 */

(() => {
  const API_URL = "/.netlify/functions/leaderboard-get";
  const MOCK_URL = "/data/mock/teams.json";

  const statusEl = document.querySelector("[data-leaderboard-status]");
  const debugEl = document.querySelector("[data-leaderboard-debug]");
  const bodyEl = document.querySelector("[data-leaderboard-body]");
  const searchEl = document.querySelector("[data-leaderboard-search]");
  const sortEl = document.querySelector("[data-leaderboard-sort]");
  const retryBtn = document.querySelector("[data-leaderboard-retry]");

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg || "";
  }

  function setDebug(token) {
    if (!debugEl) return;
    if (!token) {
      debugEl.hidden = true;
      debugEl.textContent = "";
      return;
    }
    debugEl.hidden = false;
    debugEl.textContent = `Ref: ${token}`;
  }

  function esc(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function num(n) {
    const x = Number(n || 0);
    return Number.isFinite(x) ? x : 0;
  }

  function fmtInt(n) {
    return num(n).toLocaleString();
  }

  function refToken() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  function normalizeTeam(t) {
    return {
      teamId: t.teamId ?? t.id ?? "",
      teamName: t.teamName ?? t.name ?? "Unnamed Team",
      homeCounty: t.homeCounty ?? t.county ?? "",
      officialPoints: num(t.officialPoints ?? t.totalPoints ?? t.points ?? 0),
      provisionalPoints: num(
        t.provisionalPoints ??
          t.provisional ??
          t.pendingTotalPoints ??
          t.officialPoints ??
          t.totalPoints ??
          0
      ),
      approvedCount: num(t.approvedCount ?? t.approved ?? 0),
      pendingCount: num(t.pendingCount ?? t.pending ?? 0),
    };
  }

  function renderRows(items) {
    if (!bodyEl) return;

    if (!Array.isArray(items) || items.length === 0) {
      bodyEl.innerHTML = `<tr><td colspan="7" class="muted">No teams yet.</td></tr>`;
      return;
    }

    bodyEl.innerHTML = items
      .map((t, idx) => {
        return `
          <tr>
            <td class="num">${idx + 1}</td>
            <td>${esc(t.teamName)}</td>
            <td>${esc(t.homeCounty)}</td>
            <td class="num">${fmtInt(t.officialPoints)}</td>
            <td class="num">${fmtInt(t.provisionalPoints)}</td>
            <td class="num">${fmtInt(t.approvedCount)}</td>
            <td class="num">${fmtInt(t.pendingCount)}</td>
          </tr>
        `;
      })
      .join("");
  }

  function applyFilterAndSort(all, q, sortKey) {
    let out = all;

    const query = (q || "").trim().toLowerCase();
    if (query) {
      out = out.filter((t) => {
        return (
          (t.teamName || "").toLowerCase().includes(query) ||
          (t.homeCounty || "").toLowerCase().includes(query)
        );
      });
    }

    const key = sortKey || "official_desc";
    out = [...out].sort((a, b) => {
      switch (key) {
        case "provisional_desc":
          return b.provisionalPoints - a.provisionalPoints;
        case "name_asc":
          return a.teamName.localeCompare(b.teamName);
        case "county_asc":
          return a.homeCounty.localeCompare(b.homeCounty);
        case "official_desc":
        default:
          return b.officialPoints - a.officialPoints;
      }
    });

    return out;
  }

  function wireUI(allItems) {
    const sortKey = sortEl?.value || "official_desc";
    const q = searchEl?.value || "";
    renderRows(applyFilterAndSort(allItems, q, sortKey));

    if (searchEl) {
      searchEl.addEventListener("input", () => {
        const sortKeyNow = sortEl?.value || "official_desc";
        renderRows(applyFilterAndSort(allItems, searchEl.value, sortKeyNow));
      });
    }

    if (sortEl) {
      sortEl.addEventListener("change", () => {
        const qNow = searchEl?.value || "";
        renderRows(applyFilterAndSort(allItems, qNow, sortEl.value));
      });
    }
  }

  async function fetchWithTimeout(url, { timeoutMs = 8000, headers } = {}) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        headers: headers || { accept: "application/json" },
        signal: ctrl.signal,
      });
      return res;
    } finally {
      clearTimeout(id);
    }
  }

  async function fetchLive() {
    const res = await fetchWithTimeout(API_URL, { timeoutMs: 9000 });
    if (!res.ok) throw new Error(`Live fetch failed: ${res.status}`);
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items.map(normalizeTeam) : [];
    return { items, generatedAt: data.generatedAt };
  }

  async function fetchMockTeamsJson() {
    const res = await fetchWithTimeout(MOCK_URL, { timeoutMs: 6000, headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`Mock teams.json fetch failed: ${res.status}`);
    const data = await res.json();
    const items = Array.isArray(data) ? data.map(normalizeTeam) : [];
    return { items };
  }

  function renderHardFail(message, ref) {
    setStatus(message);
    setDebug(ref);

    if (bodyEl) {
      bodyEl.innerHTML = `<tr><td colspan="7" class="muted">${esc(message)}</td></tr>`;
    }
  }

  async function initOnce() {
    const params = new URLSearchParams(window.location.search);
    const allowMock = params.get("mock") === "1";

    // offline check
    if (navigator && navigator.onLine === false) {
      renderHardFail("⚠️ You appear to be offline. Reconnect and retry.", refToken());
      return;
    }

    setDebug(null);
    setStatus("Loading live scores…");

    let livePayload;
    try {
      livePayload = await fetchLive();
    } catch (err) {
      const ref = refToken();

      if (!allowMock) {
        renderHardFail("⚠️ Live scores unavailable. No mock data shown.", ref);
        return;
      }

      setStatus("Mock mode • Not live data");
      setDebug(ref);

      try {
        const mock = await fetchMockTeamsJson();
        wireUI(mock.items);
        return;
      } catch (mockErr) {
        renderHardFail("⚠️ Mock data unavailable.", ref);
        return;
      }
    }

    if (livePayload.generatedAt) {
      const d = new Date(livePayload.generatedAt);
      setStatus(`Live • Updated ${d.toLocaleString()}`);
    } else {
      setStatus("Live • Update time unavailable");
    }

    wireUI(livePayload.items);
  }

  function init() {
    // Retry wiring
    if (retryBtn) {
      retryBtn.addEventListener("click", () => initOnce());
    }

    // If connection changes, guide user
    window.addEventListener("offline", () => {
      renderHardFail("⚠️ You went offline. Reconnect and retry.", refToken());
    });

    initOnce().catch(() => {
      renderHardFail("⚠️ Live scores unavailable. No mock data shown.", refToken());
    });
  }

  init();
})();
