/* dist/assets/js/admin.js */
(function () {
  const FN = {
    whoami: "/.netlify/functions/admin-whoami",
    list: "/.netlify/functions/admin-submissions-list",
    update: "/.netlify/functions/admin-submission-update",
    export: "/.netlify/functions/admin-export",
    audits: "/.netlify/functions/admin-audit-list",
  };

  function qs(s, r = document) { return r.querySelector(s); }
  function qsa(s, r = document) { return Array.from(r.querySelectorAll(s)); }
  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function fmt(n) {
    const x = Number(n || 0);
    return Number.isFinite(x) ? x.toLocaleString() : "0";
  }
  function prettyDate(d) { try { return new Date(d).toLocaleString(); } catch { return ""; } }
  function token() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  async function authedFetch(url, opts = {}) {
    const user = window.netlifyIdentity && window.netlifyIdentity.currentUser && window.netlifyIdentity.currentUser();
    const tokenJwt = user ? await user.jwt() : null;
    const headers = Object.assign({ "Accept": "application/json" }, opts.headers || {});
    if (tokenJwt) headers["Authorization"] = `Bearer ${tokenJwt}`;
    return fetch(url, Object.assign({}, opts, { headers }));
  }

  async function authedJSON(url, opts = {}) {
    const res = await authedFetch(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function statusPill(statusRaw) {
    const status = (statusRaw || "pending").toLowerCase();
    const label = status.toUpperCase();
    const safe = status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending";
    return `<span class="pill ${safe}">${escapeHtml(label)}</span>`;
  }

  function platformBadges(platforms) {
    const list = Array.isArray(platforms) ? platforms : [];
    if (!list.length) return '<span class="muted">—</span>';
    return list.map((p) => `<span class="badge">${escapeHtml(p)}</span>`).join(" ");
  }

  function linksButton(links) {
    const vals = Object.values(links || {}).filter(Boolean);
    if (!vals.length) return `<span class="muted">—</span>`;
    return `<button class="btn sm ghost" data-action="links">Links</button>`;
  }

  function rowHtml(s) {
    const links = s.links || {};
    const points = s.calculatedPoints ?? s.points ?? 0;
    const platforms = s.platforms || Object.keys(links);

    return `
      <tr>
        <td>${escapeHtml(prettyDate(s.createdAt))}</td>
        <td>
          <div><strong>${escapeHtml(s.teamName || "Team")}</strong></div>
          <div class="muted">${escapeHtml(s.homeCounty || "")}</div>
        </td>
        <td>
          <div>${escapeHtml(s.type || "")}</div>
          ${s.pollingCounty ? `<div class="muted">polling: ${escapeHtml(s.pollingCounty)}</div>` : ""}
        </td>
        <td>
          ${platformBadges(platforms)}
          <div class="row" style="margin-top:.25rem;">
            ${linksButton(links)}
          </div>
        </td>
        <td>${statusPill(s.status)}</td>
        <td class="num"><strong>${fmt(points)}</strong></td>
        <td>
          <div class="row" style="flex-wrap:wrap;">
            <button class="btn sm primary" data-action="approve" data-team="${escapeHtml(s.teamId)}" data-sub="${escapeHtml(s.submissionId)}">Approve</button>
            <button class="btn sm danger" data-action="reject" data-team="${escapeHtml(s.teamId)}" data-sub="${escapeHtml(s.submissionId)}">Reject</button>
            <button class="btn sm ghost" data-action="pending" data-team="${escapeHtml(s.teamId)}" data-sub="${escapeHtml(s.submissionId)}">Pending</button>
            <button class="btn sm ghost" data-action="audit" data-team="${escapeHtml(s.teamId)}" data-sub="${escapeHtml(s.submissionId)}">Audit</button>
          </div>
        </td>
      </tr>
    `;
  }

  function applyFilterAndSearch(all, status, q) {
    let items = all.slice();
    if (status && status !== "all") items = items.filter((s) => (s.status || "pending") === status);

    const needle = (q || "").trim().toLowerCase();
    if (needle) {
      items = items.filter((s) => {
        const links = Object.values(s.links || {});
        const claimed = Array.isArray(s.claimedItems) ? s.claimedItems : [];
        const hay = [
          s.teamName,
          s.homeCounty,
          s.type,
          s.status,
          s.pollingCounty,
          s.pollingName,
          s.notes,
          ...(s.platforms || []),
          ...claimed,
          ...links
        ].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(needle);
      });
    }

    items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return items;
  }

  function setCounts(all) {
    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      all: all.length
    };
    for (const s of all) {
      const st = (s.status || "pending").toLowerCase();
      if (st === "approved") counts.approved++;
      else if (st === "rejected") counts.rejected++;
      else counts.pending++;
    }
    Object.entries(counts).forEach(([k, v]) => {
      const el = qs(`[data-count="${k}"]`);
      if (el) el.textContent = `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`;
    });
  }

  function renderAudit(panel, bodyEl, audits) {
    panel.hidden = false;
    if (!audits.length) {
      bodyEl.innerHTML = `<p class="muted">No audit entries found.</p>`;
      return;
    }
    bodyEl.innerHTML = audits.map((a) => `
      <div class="card">
        <div class="spread">
          <div><strong>${escapeHtml(a.action || "ACTION")}</strong></div>
          <div class="muted">${escapeHtml(prettyDate(a.at || a.timestamp || ""))}</div>
        </div>
        ${a.note ? `<div>${escapeHtml(a.note)}</div>` : ""}
        ${a.byEmail ? `<div class="muted">by ${escapeHtml(a.byEmail)}</div>` : ""}
      </div>
    `).join("");
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

  let ALL = [];

  async function loadAll() {
    const status = qs("[data-filter]")?.value || "pending";
    const q = qs("[data-search]")?.value || "";
    const tbody = qs("[data-rows]");
    const statusEl = qs("[data-admin-status]");
    if (statusEl) statusEl.textContent = "Loading submissions…";

    const data = await authedJSON(FN.list);
    ALL = Array.isArray(data.submissions) ? data.submissions : [];
    setCounts(ALL);

    const items = applyFilterAndSearch(ALL, status, q);

    tbody.innerHTML = items.length
      ? items.map(rowHtml).join("")
      : `<tr><td colspan="7" class="muted">No submissions found.</td></tr>`;

    if (statusEl) statusEl.textContent = `Showing ${items.length} submissions (${status}).`;
  }

  async function updateStatus(teamId, submissionId, status, note) {
    // Attempt to pass note if backend supports it; safe if ignored.
    const payload = { teamId, submissionId, status };
    if (note) payload.note = note;

    const res = await authedFetch(FN.update, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json().catch(() => ({}));
  }

  async function showAudits(teamId, submissionId) {
    const panel = qs("[data-audit-panel]");
    const body = qs("[data-audit-body]");
    const data = await authedJSON(`${FN.audits}?teamId=${encodeURIComponent(teamId)}&submissionId=${encodeURIComponent(submissionId)}`);
    const audits = Array.isArray(data.audits) ? data.audits : [];
    renderAudit(panel, body, audits);
  }

  function openLinksFor(teamId, submissionId) {
    const found = ALL.find((s) => s.teamId === teamId && s.submissionId === submissionId);
    const links = Object.values(found?.links || {}).filter(Boolean);
    if (!links.length) return;

    // Open each in a new tab; browsers may block >1 popups, but usually 2-3 is fine.
    links.forEach((u) => window.open(u, "_blank", "noopener,noreferrer"));
  }

  async function doExport(kind) {
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
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function openNotePanel({ title, help, required, teamId, submissionId, status }) {
    const panel = qs("[data-note-panel]");
    const form = qs("[data-note-form]");
    const titleEl = qs("[data-note-title]");
    const helpEl = qs("[data-note-help]");
    const errEl = qs("[data-note-error]");
    const noteEl = qs("#noteText");

    if (!panel || !form || !noteEl) return;

    if (titleEl) titleEl.textContent = title;
    if (helpEl) helpEl.textContent = help;
    if (errEl) errEl.textContent = "";

    form.teamId.value = teamId;
    form.submissionId.value = submissionId;
    form.status.value = status;

    noteEl.value = "";
    noteEl.setAttribute("data-required", required ? "1" : "0");

    panel.hidden = false;
    noteEl.focus();
  }

  function closeNotePanel() {
    const panel = qs("[data-note-panel]");
    if (panel) panel.hidden = true;
  }

  async function main() {
    const statusEl = qs("[data-admin-status]");
    try {
      if (window.netlifyIdentity) {
        window.netlifyIdentity.on("login", () => window.location.reload());
      }
      await ensureAdmin();
      await loadAll();

      qs("[data-filter]")?.addEventListener("change", loadAll);
      qs("[data-search]")?.addEventListener("input", () => { clearTimeout(window.__t); window.__t = setTimeout(loadAll, 200); });
      qs("[data-refresh]")?.addEventListener("click", loadAll);

      qs("[data-audit-close]")?.addEventListener("click", () => {
        const panel = qs("[data-audit-panel]");
        if (panel) panel.hidden = true;
      });

      qs("[data-note-close]")?.addEventListener("click", closeNotePanel);
      qs("[data-note-cancel]")?.addEventListener("click", closeNotePanel);

      qs("[data-note-form]")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const ref = token();
        const btn = qs("[data-note-submit]");
        const errEl = qs("[data-note-error]");
        const noteEl = qs("#noteText");

        const teamId = e.target.teamId.value;
        const submissionId = e.target.submissionId.value;
        const status = e.target.status.value;
        const note = (noteEl?.value || "").trim();
        const required = noteEl?.getAttribute("data-required") === "1";

        if (required && !note) {
          if (errEl) errEl.textContent = "Reason is required to reject a submission.";
          return;
        }

        try {
          if (btn) btn.disabled = true;
          await updateStatus(teamId, submissionId, status, note || undefined);
          closeNotePanel();
          await loadAll();
          if (statusEl) statusEl.textContent = `Updated (${status}).`;
        } catch (err) {
          console.error(err);
          if (statusEl) statusEl.textContent = `Action failed (Ref: ${ref}): ${err.message || err}`;
        } finally {
          if (btn) btn.disabled = false;
        }
      });

      document.body.addEventListener("click", async (e) => {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;

        const ref = token();
        const action = btn.getAttribute("data-action");
        const row = btn.closest("tr");
        const teamId = btn.getAttribute("data-team") || "";
        const subId = btn.getAttribute("data-sub") || "";

        try {
          if (action === "audit") {
            await showAudits(teamId, subId);
            return;
          }

          if (action === "links") {
            openLinksFor(teamId, subId);
            return;
          }

          // For approve/reject/pending, require note only for reject
          if (action === "reject") {
            openNotePanel({
              title: "Reject submission",
              help: "Required: write a short reason. This prevents confusion and protects audit integrity.",
              required: true,
              teamId,
              submissionId: subId,
              status: "rejected"
            });
            return;
          }

          if (action === "approve") {
            openNotePanel({
              title: "Approve submission (optional note)",
              help: "Optional: add a note (ex: what was verified). Leave blank to approve without note.",
              required: false,
              teamId,
              submissionId: subId,
              status: "approved"
            });
            return;
          }

          if (action === "pending") {
            openNotePanel({
              title: "Move to pending (optional note)",
              help: "Optional: note why it was moved back to pending (ex: needs better link).",
              required: false,
              teamId,
              submissionId: subId,
              status: "pending"
            });
            return;
          }

          // fallback: should never reach
          if (row) row.classList.add("muted");
          btn.disabled = true;

        } catch (err) {
          console.error(err);
          if (statusEl) statusEl.textContent = `Action failed (Ref: ${ref}): ${err.message || err}`;
        } finally {
          btn.disabled = false;
          if (row) row.classList.remove("muted");
        }
      });

      qsa("button[data-export]").forEach((b) => {
        b.addEventListener("click", async () => {
          const ref = token();
          const kind = b.getAttribute("data-export");
          try {
            b.disabled = true;
            await doExport(kind);
            if (statusEl) statusEl.textContent = `Exported ${kind.toUpperCase()}.`;
          } catch (err) {
            console.error(err);
            if (statusEl) statusEl.textContent = `Export failed (Ref: ${ref}): ${err.message || err}`;
          } finally {
            b.disabled = false;
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
