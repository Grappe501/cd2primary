/* src/assets/js/leaderboard.live.js */
/* Overlay 15: Leaderboard One-Truth Wiring
 *
 * Goals:
 * - Live data is the only default source of truth
 * - No silent fallback to mock
 * - If live fails, show an explicit warning (and do not show fake scores)
 * - Allow mock ONLY with ?mock=1 (explicit, visible)
 * - Display generatedAt (“last updated”) from leaderboard-get
 */

(() => {
  const API_URL = "/.netlify/functions/leaderboard-get";

  const statusEl = document.querySelector("[data-leaderboard-status]");
  const bodyEl = document.querySelector("[data-leaderboard-body]");
  const searchEl = document.querySelector("[data-leaderboard-search]");
  const sortEl = document.querySelector("[data-leaderboard-sort]");

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg || "";
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

  async function fetchLive() {
    const res = await fetch(API_URL, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Live fetch failed: ${res.status}`);
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items.map(normalizeTeam) : [];
    return { items, generatedAt: data.generatedAt };
  }

  async function fetchMockTeamsJson() {
    const res = await fetch("/data/mock/teams.json", {
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Mock teams.json fetch failed: ${res.status}`);
    const data = await res.json();
    const items = Array.isArray(data) ? data.map(normalizeTeam) : [];
    return { items };
  }

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const allowMock = params.get("mock") === "1";

    setStatus("Loading live scores…");

    let livePayload;
    try {
      livePayload = await fetchLive();
    } catch (err) {
      if (!allowMock) {
        setStatus("⚠️ Live scores unavailable. No mock data shown.");
        if (bodyEl) {
          bodyEl.innerHTML = `<tr><td colspan="7" class="muted">Live scores unavailable.</td></tr>`;
        }
        return;
      }

      setStatus("Mock mode • Not live data");

      try {
        const mock = await fetchMockTeamsJson();
        wireUI(mock.items);
        return;
      } catch (mockErr) {
        setStatus("⚠️ Mock data unavailable.");
        if (bodyEl) {
          bodyEl.innerHTML = `<tr><td colspan="7" class="muted">Mock data unavailable.</td></tr>`;
        }
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

  init().catch(() => {
    setStatus("⚠️ Live scores unavailable. No mock data shown.");
    if (bodyEl) {
      bodyEl.innerHTML = `<tr><td colspan="7" class="muted">Live scores unavailable.</td></tr>`;
    }
  });
})();
