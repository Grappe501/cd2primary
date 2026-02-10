(function () {
  const FN = {
    whoami: "/.netlify/functions/admin-whoami",
    list: "/.netlify/functions/admin-submissions-list",
    update: "/.netlify/functions/admin-submission-update",
    export: "/.netlify/functions/admin-export",
    audits: "/.netlify/functions/admin-audit-list",
  };

  function qs(s, r=document){ return r.querySelector(s); }
  function escapeHtml(s){ return String(s??"").replace(/[&<>"']/g, c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }
  function fmt(n){ const x=Number(n||0); return Number.isFinite(x)?x.toLocaleString():"0"; }
  function toISO(d){ try { return new Date(d).toISOString(); } catch { return ""; } }
  function prettyDate(d){ try { return new Date(d).toLocaleString(); } catch { return ""; } }

  async function authedFetch(url, opts={}) {
    const user = window.netlifyIdentity && window.netlifyIdentity.currentUser && window.netlifyIdentity.currentUser();
    const token = user ? await user.jwt() : null;
    const headers = Object.assign({ "Accept":"application/json" }, opts.headers || {});
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(url, Object.assign({}, opts, { headers }));
    return res;
  }

  async function authedJSON(url, opts={}) {
    const res = await authedFetch(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function platformBadges(platforms) {
    const list = Array.isArray(platforms) ? platforms : [];
    if (!list.length) return '<span class="cj-muted">—</span>';
    return list.map(p => `<span class="cj-badge">${escapeHtml(p)}</span>`).join(" ");
  }

  function renderAudit(panel, bodyEl, audits) {
    panel.hidden = false;
    if (!audits.length) {
      bodyEl.innerHTML = `<p class="cj-muted">No audit entries found.</p>`;
      return;
    }
    bodyEl.innerHTML = audits.map(a => `
      <div class="cj-card cj-card--tight cj-mb-2">
        <div class="cj-card__body">
          <div class="cj-row cj-row--between cj-row--center">
            <div><strong>${escapeHtml(a.action || "ACTION")}</strong></div>
            <div class="cj-muted">${escapeHtml(prettyDate(a.at || a.timestamp || ""))}</div>
          </div>
          ${a.note ? `<div class="cj-mt-1">${escapeHtml(a.note)}</div>` : ""}
          ${a.byEmail ? `<div class="cj-muted cj-mt-1">by ${escapeHtml(a.byEmail)}</div>` : ""}
        </div>
      </div>
    `).join("");
  }

  function applyFilterAndSearch(all, status, q) {
    let items = all.slice();
    if (status && status !== "all") items = items.filter(s => (s.status || "pending") === status);
    const needle = (q || "").trim().toLowerCase();
    if (needle) {
      items = items.filter(s => {
        const hay = [
          s.teamName, s.homeCounty, s.type, s.status,
          ...(s.platforms || []),
          ...(Object.values(s.links || {}))
        ].join(" ").toLowerCase();
        return hay.includes(needle);
      });
    }
    // newest first
    items.sort((a,b)=> new Date(b.createdAt||0) - new Date(a.createdAt||0));
    return items;
  }

  function rowHtml(s) {
    const links = s.links || {};
    const points = s.calculatedPoints ?? s.points ?? 0;
    return `
      <tr>
        <td>${escapeHtml(prettyDate(s.createdAt))}</td>
        <td>
          <div><strong>${escapeHtml(s.teamName || "Team")}</strong></div>
          <div class="cj-muted">${escapeHtml(s.homeCounty || "")}</div>
        </td>
        <td>${escapeHtml(s.type || "")}</td>
        <td>${platformBadges(s.platforms || Object.keys(links))}</td>
        <td><span class="cj-badge cj-badge--${escapeHtml(s.status || "pending")}">${escapeHtml((s.status||"pending").toUpperCase())}</span></td>
        <td><strong>${fmt(points)}</strong></td>
        <td>
          <div class="cj-row cj-gap-1 cj-row--wrap">
            <button class="cj-btn cj-btn--xs cj-btn--primary" data-action="approve" data-team="${escapeHtml(s.teamId)}" data-sub="${escapeHtml(s.submissionId)}">Approve</button>
            <button class="cj-btn cj-btn--xs cj-btn--danger" data-action="reject" data-team="${escapeHtml(s.teamId)}" data-sub="${escapeHtml(s.submissionId)}">Reject</button>
            <button class="cj-btn cj-btn--xs cj-btn--ghost" data-action="pending" data-team="${escapeHtml(s.teamId)}" data-sub="${escapeHtml(s.submissionId)}">Pending</button>
            <button class="cj-btn cj-btn--xs cj-btn--ghost" data-action="audit" data-team="${escapeHtml(s.teamId)}" data-sub="${escapeHtml(s.submissionId)}">Audit</button>
          </div>
        </td>
      </tr>
    `;
  }

  async function ensureAdmin() {
    const statusEl = qs("[data-admin-status]");
    const user = window.netlifyIdentity && window.netlifyIdentity.currentUser && window.netlifyIdentity.currentUser();
    if (!user) {
      if (statusEl) statusEl.textContent = "Please sign in to access admin tools.";
      window.netlifyIdentity && window.netlifyIdentity.open && window.netlifyIdentity.open("login");
      throw new Error("Not logged in");
    }
    const who = await authedJSON(FN.whoami);
    if (!who.isAdmin) {
      if (statusEl) statusEl.textContent = "Not authorized.";
      throw new Error("Not admin");
    }
    if (statusEl) statusEl.textContent = `Signed in as ${who.email || "admin"}`;
    return who;
  }

  async function loadAll() {
    const status = qs("[data-filter]")?.value || "pending";
    const q = qs("[data-search]")?.value || "";
    const tbody = qs("[data-rows]");
    const statusEl = qs("[data-admin-status]");
    if (statusEl) statusEl.textContent = "Loading submissions…";

    const data = await authedJSON(FN.list);
    const all = Array.isArray(data.submissions) ? data.submissions : [];
    const items = applyFilterAndSearch(all, status, q);

    tbody.innerHTML = items.length ? items.map(rowHtml).join("") : `<tr><td colspan="7" class="cj-muted">No submissions found.</td></tr>`;
    if (statusEl) statusEl.textContent = `Showing ${items.length} submissions (${status}).`;
    return all;
  }

  async function updateStatus(teamId, submissionId, status) {
    await authedFetch(FN.update, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ teamId, submissionId, status })
    }).then(async (r)=> {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
  }

  async function showAudits(teamId, submissionId) {
    const panel = qs("[data-audit-panel]");
    const body = qs("[data-audit-body]");
    const data = await authedJSON(`${FN.audits}?teamId=${encodeURIComponent(teamId)}&submissionId=${encodeURIComponent(submissionId)}`);
    const audits = Array.isArray(data.audits) ? data.audits : [];
    renderAudit(panel, body, audits);
  }

  async function doExport(kind) {
    // triggers file download; keep auth header
    const res = await authedFetch(`${FN.export}?format=${encodeURIComponent(kind)}`, { method: "GET" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = kind === "csv" ? "primaryvote_export.csv" : "primaryvote_export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=> URL.revokeObjectURL(url), 1000);
  }

  async function main() {
    const statusEl = qs("[data-admin-status]");
    try {
      // init identity widget if present
      if (window.netlifyIdentity) {
        window.netlifyIdentity.on("login", () => window.location.reload());
      }
      await ensureAdmin();
      await loadAll();

      qs("[data-filter]")?.addEventListener("change", loadAll);
      qs("[data-search]")?.addEventListener("input", () => { clearTimeout(window.__t); window.__t=setTimeout(loadAll, 200); });
      qs("[data-refresh]")?.addEventListener("click", loadAll);

      document.body.addEventListener("click", async (e) => {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;
        const action = btn.getAttribute("data-action");
        const teamId = btn.getAttribute("data-team");
        const subId = btn.getAttribute("data-sub");
        try {
          if (action === "audit") {
            await showAudits(teamId, subId);
            return;
          }
          btn.disabled = true;
          await updateStatus(teamId, subId, action === "approve" ? "approved" : action === "reject" ? "rejected" : "pending");
          await loadAll();
        } catch (err) {
          console.error(err);
          if (statusEl) statusEl.textContent = `Action failed: ${err.message || err}`;
        } finally {
          btn.disabled = false;
        }
      });

      qs("[data-audit-close]")?.addEventListener("click", () => {
        const panel = qs("[data-audit-panel]");
        if (panel) panel.hidden = true;
      });

      qsa("button[data-export]").forEach(b => {
        b.addEventListener("click", async () => {
          const kind = b.getAttribute("data-export");
          try { await doExport(kind); }
          catch (err) {
            console.error(err);
            if (statusEl) statusEl.textContent = `Export failed: ${err.message || err}`;
          }
        });
      });

    } catch (err) {
      console.error(err);
      if (statusEl) statusEl.textContent = err.message || String(err);
    }
  }

  document.addEventListener("DOMContentLoaded", main);
})();
