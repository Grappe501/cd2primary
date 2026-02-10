import { initIdentity, currentUser, onAuthChange, logout, getAccessToken } from "/assets/js/auth.js";

const statusEl = document.getElementById("status");
const btnOpen = document.getElementById("btnOpen");
const btnLogout = document.getElementById("btnLogout");
const notAuthEl = document.getElementById("notAuthorized");
const adminEl = document.getElementById("adminPanel");
const configEl = document.getElementById("adminConfigHint");

const filterStatus = document.getElementById("filterStatus");
const filterSearch = document.getElementById("filterSearch");
const btnRefresh = document.getElementById("btnRefresh");
const queueMeta = document.getElementById("queueMeta");
const queueBody = document.getElementById("queueBody");

const identity = initIdentity();

function show(el, yes) {
  if (!el) return;
  el.hidden = !yes;
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function api(path, { method = "GET", body } = {}) {
  const token = await getAccessToken();
  const headers = { Authorization: `Bearer ${token}` };
  if (body) headers["content-type"] = "application/json";
  const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function fetchAdminStatus() {
  const token = await getAccessToken();
  if (!token) return null;

  const res = await fetch("/.netlify/functions/admin-whoami", {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, status: res.status, data };
  }
  const data = await res.json();
  return { ok: true, data };
}

function platformBadges(platformLinks = {}) {
  const entries = Object.entries(platformLinks)
    .filter(([_, v]) => typeof v === "string" && v.trim())
    .slice(0, 5);
  if (!entries.length) return "—";

  const label = {
    tiktok: "TikTok",
    instagram: "Instagram",
    facebook: "Facebook",
    x: "X",
    bluesky: "Bluesky"
  };

  return entries
    .map(([k, url]) => {
      const text = label[k] || k;
      return `<a class="badge" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
    })
    .join(" ");
}

function statusBadge(status) {
  const s = String(status || "pending");
  if (s === "approved") return `<span class="badge success">Approved</span>`;
  if (s === "rejected") return `<span class="badge danger">Rejected</span>`;
  return `<span class="badge">Pending</span>`;
}

function renderRows(items, search) {
  const q = String(search || "").trim().toLowerCase();
  const filtered = q
    ? items.filter((it) => {
        const hay = [
          it.teamName,
          it.teamId,
          it.submissionId,
          it.submissionTypeLabel,
          it.ownerEmail,
          it.member1Name,
          it.member2Name
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
    : items;

  if (!filtered.length) {
    queueBody.innerHTML = `<tr><td colspan="7"><em>No submissions match your filters.</em></td></tr>`;
    return;
  }

  queueBody.innerHTML = filtered
    .map((it) => {
      const points = typeof it.calculatedPoints === "number" ? it.calculatedPoints : 0;
      const note = it.adminNote ? `<div style="margin-top:.25rem;"><small><strong>Note:</strong> ${escapeHtml(it.adminNote)}</small></div>` : "";
      return `
        <tr data-team-id="${escapeHtml(it.teamId)}" data-submission-id="${escapeHtml(it.submissionId)}">
          <td>
            <div><strong>${escapeHtml(it.teamName || "(Unnamed Team)")}</strong></div>
            <small>${escapeHtml(it.homeCountyName || it.homeCounty || "")}${it.teamId ? ` • <code>${escapeHtml(it.teamId)}</code>` : ""}</small>
          </td>
          <td>
            <div>${escapeHtml(it.submissionTypeLabel || it.submissionType || "")}</div>
            <small><code>${escapeHtml(it.submissionId)}</code></small>
          </td>
          <td>
            <div>${escapeHtml(it.submissionDate || "—")}</div>
            <small>${escapeHtml(new Date(it.createdAt).toLocaleString())}</small>
          </td>
          <td>${platformBadges(it.platformLinks)}</td>
          <td>
            <div><strong>${points}</strong></div>
            <small>Base ${it.basePoints} + Hashtag ${it.hashtagBonus} + Cross-post ${it.crossPostBonus}</small>
          </td>
          <td>
            ${statusBadge(it.status)}
            ${note}
          </td>
          <td>
            <div class="row" style="gap:.5rem; flex-wrap:wrap;">
              <button class="btn small primary" data-action="approve" type="button">Approve</button>
              <button class="btn small" data-action="reject" type="button">Reject</button>
              <button class="btn small" data-action="pending" type="button">Set Pending</button>
              <button class="btn small" data-action="details" type="button">Details</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

function detailsText(it) {
  const lines = [];
  lines.push(`Team: ${it.teamName || ""} (${it.teamId})`);
  lines.push(`Home county: ${it.homeCountyName || it.homeCounty || ""}`);
  lines.push(`Type: ${it.submissionTypeLabel || it.submissionType}`);
  lines.push(`Status: ${it.status}`);
  lines.push(`Posted date: ${it.submissionDate}`);
  lines.push(`Created: ${it.createdAt}`);
  lines.push(`Points: ${it.calculatedPoints} (base ${it.basePoints}, hashtag ${it.hashtagBonus}, cross-post ${it.crossPostBonus})`);
  if (it.pollingCountyName || it.pollingCounty) lines.push(`Polling county: ${it.pollingCountyName || it.pollingCounty}`);
  if (it.pollingAreaType) lines.push(`Area type: ${it.pollingAreaType}`);
  if (Array.isArray(it.claimedItems) && it.claimedItems.length) lines.push(`Checklist: ${it.claimedItems.join(", ")}`);
  if (it.primaryUrl) lines.push(`Primary URL: ${it.primaryUrl}`);
  const platforms = it.platformLinks || {};
  const pKeys = Object.keys(platforms).filter((k) => platforms[k]);
  if (pKeys.length) {
    lines.push("Platform links:");
    for (const k of pKeys) lines.push(`- ${k}: ${platforms[k]}`);
  }
  if (it.notes) lines.push(`Notes: ${it.notes}`);
  if (it.adminNote) lines.push(`Admin note: ${it.adminNote}`);
  return lines.join("\n");
}

let lastQueue = [];

async function loadQueue() {
  if (!queueMeta || !queueBody) return;

  const status = filterStatus?.value || "pending";
  queueMeta.textContent = "Loading submissions…";
  queueBody.innerHTML = `<tr><td colspan="7"><em>Loading…</em></td></tr>`;

  const data = await api(`/.netlify/functions/admin-submissions-list?status=${encodeURIComponent(status)}`);
  lastQueue = Array.isArray(data.items) ? data.items : [];
  const total = lastQueue.length;
  queueMeta.textContent = `${total} submissions loaded (${status}).`;
  renderRows(lastQueue, filterSearch?.value || "");
}

async function updateStatus(teamId, submissionId, status) {
  const adminNote = status === "rejected" ? prompt("Optional: add a rejection note (shown to team)", "") : "";
  await api("/.netlify/functions/admin-submission-update", {
    method: "POST",
    body: { teamId, submissionId, status, adminNote }
  });
}

queueBody?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const tr = btn.closest("tr[data-team-id][data-submission-id]");
  if (!tr) return;

  const teamId = tr.getAttribute("data-team-id");
  const submissionId = tr.getAttribute("data-submission-id");
  const action = btn.getAttribute("data-action");

  const it = lastQueue.find((x) => x.teamId === teamId && x.submissionId === submissionId);
  if (action === "details") {
    alert(detailsText(it || { teamId, submissionId }));
    return;
  }

  btn.disabled = true;
  try {
    if (action === "approve") await updateStatus(teamId, submissionId, "approved");
    if (action === "reject") await updateStatus(teamId, submissionId, "rejected");
    if (action === "pending") await updateStatus(teamId, submissionId, "pending");
    await loadQueue();
  } catch (err) {
    alert(`Update failed: ${err.message}`);
  } finally {
    btn.disabled = false;
  }
});

btnRefresh?.addEventListener("click", () => loadQueue());
filterStatus?.addEventListener("change", () => loadQueue());
filterSearch?.addEventListener("input", () => renderRows(lastQueue, filterSearch.value));

async function render() {
  const user = currentUser();
  if (!user) {
    statusEl.textContent = "You are not signed in yet.";
    statusEl.classList.remove("success");
    show(btnLogout, false);
    show(notAuthEl, false);
    show(adminEl, false);
    show(configEl, false);
    btnOpen.textContent = "Open Sign In";
    return;
  }

  statusEl.textContent = `Signed in as ${user.email}`;
  statusEl.classList.add("success");
  show(btnLogout, true);
  btnOpen.textContent = "Manage Account";

  statusEl.textContent = "Checking admin access…";
  const adminStatus = await fetchAdminStatus();

  if (!adminStatus) {
    statusEl.textContent = `Signed in as ${user.email} (no token)`;
    show(notAuthEl, true);
    show(adminEl, false);
    show(configEl, false);
    return;
  }

  if (!adminStatus.ok) {
    statusEl.textContent = `Admin check failed (HTTP ${adminStatus.status})`;
    show(notAuthEl, true);
    show(adminEl, false);
    show(configEl, true);
    return;
  }

  const { isAdmin, adminsConfigured } = adminStatus.data;
  if (!adminsConfigured) {
    statusEl.textContent = "Admin allowlist is not configured yet.";
    show(notAuthEl, true);
    show(adminEl, false);
    show(configEl, true);
    return;
  }

  if (isAdmin) {
    statusEl.textContent = `Admin access granted: ${user.email}`;
    show(notAuthEl, false);
    show(adminEl, true);
    show(configEl, false);
    await loadQueue();
  } else {
    statusEl.textContent = `Not authorized for admin: ${user.email}`;
    show(notAuthEl, true);
    show(adminEl, false);
    show(configEl, false);
  }
}

btnOpen?.addEventListener("click", () => {
  if (!identity) return;
  identity.open();
});
btnLogout?.addEventListener("click", () => logout({ redirectTo: "/" }));

onAuthChange(render);
render();
