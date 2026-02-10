/* Live leaderboard loader with graceful fallback to mock data.
 * Requires existing design system CSS already in the project.
 */
(function () {
  const API = "/.netlify/functions/leaderboard-get";

  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function fmt(n) {
    const x = Number(n || 0);
    return Number.isFinite(x) ? x.toLocaleString() : "0";
  }

  async function fetchJSON(url) {
    const res = await fetch(url, { headers: { "Accept": "application/json" }});
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function renderTop5(container, teams) {
    if (!container) return;
    const top = (teams || []).slice(0, 5);
    if (!top.length) {
      container.innerHTML = '<div class="cj-card"><div class="cj-card__body"><p class="cj-muted">No teams yet.</p></div></div>';
      return;
    }
    container.innerHTML = top.map((t, i) => `
      <div class="cj-card cj-card--tight">
        <div class="cj-card__body">
          <div class="cj-row cj-row--between cj-row--center">
            <div>
              <div class="cj-kicker">#${i + 1}</div>
              <div class="cj-h3">${escapeHtml(t.teamName || "Unnamed Team")}</div>
              <div class="cj-muted">${escapeHtml(t.homeCounty || "")}</div>
            </div>
            <div class="cj-score">
              <div class="cj-score__num">${fmt(t.officialScore)}</div>
              <div class="cj-score__label">Official</div>
            </div>
          </div>
          <div class="cj-muted cj-mt-2">Provisional: <strong>${fmt(t.provisionalScore)}</strong></div>
        </div>
      </div>
    `).join("");
  }

  function renderLeaderboardTable(tbody, teams) {
    if (!tbody) return;
    const rows = (teams || []).map((t, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(t.teamName || "Unnamed Team")}</td>
        <td>${escapeHtml(t.homeCounty || "")}</td>
        <td><strong>${fmt(t.officialScore)}</strong></td>
        <td>${fmt(t.provisionalScore)}</td>
        <td>${fmt(t.approvedCount)}</td>
        <td>${fmt(t.pendingCount)}</td>
      </tr>
    `).join("");
    tbody.innerHTML = rows || `<tr><td colspan="7" class="cj-muted">No teams yet.</td></tr>`;
  }

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function wireSearchAndSort(teams, opts) {
    const { searchInput, sortSelect, onUpdate } = opts;
    let state = { q: "", sort: "official_desc" };

    function apply() {
      const q = state.q.trim().toLowerCase();
      let filtered = teams.slice();
      if (q) {
        filtered = filtered.filter(t =>
          (t.teamName || "").toLowerCase().includes(q) ||
          (t.homeCounty || "").toLowerCase().includes(q)
        );
      }
      switch (state.sort) {
        case "official_desc":
          filtered.sort((a,b) => (b.officialScore||0)-(a.officialScore||0));
          break;
        case "provisional_desc":
          filtered.sort((a,b) => (b.provisionalScore||0)-(a.provisionalScore||0));
          break;
        case "name_asc":
          filtered.sort((a,b) => String(a.teamName||"").localeCompare(String(b.teamName||"")));
          break;
        case "county_asc":
          filtered.sort((a,b) => String(a.homeCounty||"").localeCompare(String(b.homeCounty||"")));
          break;
      }
      onUpdate(filtered);
    }

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        state.q = searchInput.value || "";
        apply();
      });
    }
    if (sortSelect) {
      sortSelect.addEventListener("change", () => {
        state.sort = sortSelect.value || "official_desc";
        apply();
      });
    }

    apply();
  }

  async function main() {
    const top5Root = qs("[data-top5]");
    const tableBody = qs("[data-leaderboard-body]");
    const searchInput = qs("[data-leaderboard-search]");
    const sortSelect = qs("[data-leaderboard-sort]");
    const statusEl = qs("[data-leaderboard-status]");

    try {
      if (statusEl) statusEl.textContent = "Loading live scores…";
      const data = await fetchJSON(API);
      const teams = Array.isArray(data.teams) ? data.teams : [];

      // Default sort: official score desc
      teams.sort((a,b) => (b.officialScore||0)-(a.officialScore||0));

      renderTop5(top5Root, teams);
      wireSearchAndSort(teams, {
        searchInput,
        sortSelect,
        onUpdate: (list) => renderLeaderboardTable(tableBody, list)
      });

      if (statusEl) statusEl.textContent = data.generatedAt ? `Updated ${data.generatedAt}` : "Updated";
    } catch (e) {
      console.warn("Live leaderboard failed, falling back to mock if available.", e);
      if (statusEl) statusEl.textContent = "Live scores unavailable — showing mock data (if configured).";
      // If the page already includes the mock script, it will render on its own.
    }
  }

  document.addEventListener("DOMContentLoaded", main);
})();
