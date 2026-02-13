import { initIdentity, currentUser, getAccessToken, logout, onAuthChange } from "/assets/js/auth.js";
import { initSubmissions } from "/assets/js/submissions.js";

const statusEl = document.getElementById("status");
const signedOutEl = document.getElementById("signedOut");
const signedInEl = document.getElementById("signedIn");
const btnSignIn = document.getElementById("btnSignIn");
const btnAccount = document.getElementById("btnAccount");
const btnLogout = document.getElementById("btnLogout");
const btnReload = document.getElementById("btnReload");

// Optional (added in Overlay 26B profile page)
const btnRetrySubmissions = document.getElementById("btnRetrySubmissions");

const form = document.getElementById("teamForm");
const teamStateEl = document.getElementById("teamState");
const teamMetaEl = document.getElementById("teamMeta");
const scoreBox = document.getElementById("scoreBox");

// Onboarding checklist (Overlay 19)
const chkAuth = document.getElementById("chk_auth");
const chkTeam = document.getElementById("chk_team");
const chkMembers = document.getElementById("chk_members");
const chkSubmit = document.getElementById("chk_submit");

let loadedTeam = null;
let submissions = null;
let lastSubmissions = [];

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function refToken() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function setStatus(text, { ok = true } = {}) {
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.classList.toggle("success", ok);
}

function setCheck(el, done) {
  if (!el) return;
  el.classList.toggle("done", Boolean(done));
}

function renderChecklist() {
  const user = currentUser();
  const hasTeam = Boolean(loadedTeam);
  const membersOk =
    Boolean(loadedTeam?.member1Name) &&
    Boolean(loadedTeam?.member2Name) &&
    Boolean(loadedTeam?.member1TikTok) &&
    Boolean(loadedTeam?.member2TikTok);
  const hasSubmission = Array.isArray(lastSubmissions) && lastSubmissions.length > 0;

  setCheck(chkAuth, Boolean(user));
  setCheck(chkTeam, hasTeam);
  setCheck(chkMembers, hasTeam && membersOk);
  setCheck(chkSubmit, hasTeam && hasSubmission);
}

function clearErrors() {
  const els = document.querySelectorAll("[id^='err_']");
  els.forEach((el) => (el.textContent = ""));
}

function showErrors(errors = {}) {
  Object.entries(errors).forEach(([k, v]) => {
    const el = document.getElementById(`err_${k}`);
    if (el) el.textContent = v;
  });
}

function readForm() {
  const fd = new FormData(form);
  const get = (k) => String(fd.get(k) || "").trim();
  return {
    teamName: get("teamName"),
    homeCounty: get("homeCounty"),
    member1Name: get("member1Name"),
    member1TikTok: get("member1TikTok"),
    member2Name: get("member2Name"),
    member2TikTok: get("member2TikTok")
  };
}

function fillForm(team) {
  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || "";
  };
  set("teamName", team?.teamName);
  set("homeCounty", team?.homeCounty);
  set("member1Name", team?.member1Name);
  set("member1TikTok", team?.member1TikTok);
  set("member2Name", team?.member2Name);
  set("member2TikTok", team?.member2TikTok);
}

function renderScore(score) {
  if (!scoreBox) return;
  if (!score) {
    scoreBox.innerHTML = "";
    return;
  }

  scoreBox.innerHTML = `
    <div class="card mt-3">
      <h3 class="mt-0" style="margin-bottom:.5rem;">Score</h3>
      <div class="score-grid">
        <div class="card stat">
          <div class="help">Official (approved)</div>
          <div class="value"><strong>${esc(score.officialPoints)}</strong></div>
        </div>
        <div class="card stat">
          <div class="help">Provisional (incl. pending)</div>
          <div class="value"><strong>${esc(score.provisionalPoints)}</strong></div>
        </div>
        <div class="card stat">
          <div class="help">Streak bonus</div>
          <div class="value"><strong>${esc(score.postingStreakBonus || 0)}</strong></div>
        </div>
        <div class="card stat">
          <div class="help">8-county sweep bonus</div>
          <div class="value"><strong>${esc(score.eightCountySweepBonus)}</strong></div>
        </div>
      </div>
      <div class="help mt-3">
        Official points only count once a submission is approved (admin review comes later).
        Provisional points help you self-check.
      </div>
    </div>
  `;
}

async function fetchWithTimeout(url, opts = {}, timeoutMs = 9000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function api(path, { method = "GET", body, timeoutMs } = {}) {
  const token = await getAccessToken();
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body ? { "content-type": "application/json" } : {})
  };

  const res = await fetchWithTimeout(
    path,
    {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    },
    timeoutMs ?? 9000
  );

  const data = await res.json().catch(() => ({}));
  return { res, data };
}

function isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

async function loadScore() {
  const user = currentUser();
  if (!user) return;

  if (isOffline()) {
    const ref = refToken();
    setStatus(`⚠️ You appear to be offline. Reconnect and retry. (Ref: ${ref})`, { ok: false });
    return;
  }

  try {
    const { res, data } = await api("/.netlify/functions/score-get", { timeoutMs: 9000 });
    if (!res.ok) {
      const ref = refToken();
      setStatus(`⚠️ Could not load score. (Ref: ${ref})`, { ok: false });
      return;
    }
    renderScore(data.score);
  } catch (err) {
    const ref = refToken();
    const msg = String(err?.message || err);
    const hint = msg.includes("AbortError") ? "Request timed out" : "Network error";
    setStatus(`⚠️ ${hint} while loading score. (Ref: ${ref})`, { ok: false });
  }
}

async function loadTeam() {
  clearErrors();
  const user = currentUser();
  if (!user) return;

  if (isOffline()) {
    const ref = refToken();
    teamStateEl.textContent = "Offline";
    teamStateEl.classList.remove("success");
    teamMetaEl.textContent = "";
    setStatus(`⚠️ You appear to be offline. Reconnect and retry. (Ref: ${ref})`, { ok: false });
    return;
  }

  teamStateEl.textContent = "Loading…";
  teamStateEl.classList.remove("success");
  teamMetaEl.textContent = "";

  try {
    const { res, data } = await api("/.netlify/functions/team-get", { timeoutMs: 9000 });

    if (!res.ok) {
      const ref = refToken();
      teamStateEl.textContent = "Error";
      setStatus(`${data?.error || "Could not load team."} (Ref: ${ref})`, { ok: false });
      return;
    }

    loadedTeam = data.team;

    if (!loadedTeam) {
      teamStateEl.textContent = "No team yet — create one below.";
      teamStateEl.classList.remove("success");
      fillForm(null);
      teamMetaEl.textContent = "";
      renderScore(null);

      submissions?.setTeam(null);
      renderChecklist();
      return;
    }

    teamStateEl.textContent = `Team loaded: ${loadedTeam.teamName}`;
    teamStateEl.classList.add("success");
    fillForm(loadedTeam);
    teamMetaEl.textContent = `Team ID: ${loadedTeam.teamId} • Updated: ${new Date(loadedTeam.updatedAt).toLocaleString()}`;

    submissions?.setTeam(loadedTeam);
    await loadScore();
    renderChecklist();
  } catch (err) {
    const ref = refToken();
    const msg = String(err?.message || err);
    const hint = msg.includes("AbortError") ? "Request timed out" : "Network error";
    teamStateEl.textContent = "Error";
    setStatus(`⚠️ ${hint} while loading team. (Ref: ${ref})`, { ok: false });
  }
}

async function saveTeam(e) {
  e.preventDefault();
  clearErrors();

  const user = currentUser();
  if (!user) {
    setStatus("You must sign in first.", { ok: false });
    return;
  }

  if (isOffline()) {
    const ref = refToken();
    setStatus(`⚠️ You appear to be offline. Reconnect and retry. (Ref: ${ref})`, { ok: false });
    return;
  }

  const payload = readForm();
  const creating = !loadedTeam;

  const btn = document.getElementById("btnSave");
  btn.disabled = true;
  btn.textContent = creating ? "Creating…" : "Saving…";

  try {
    const { res, data } = await api(`/.netlify/functions/${creating ? "team-create" : "team-update"}`, {
      method: creating ? "POST" : "PUT",
      body: payload,
      timeoutMs: 12000
    });

    if (!res.ok) {
      if (res.status === 422) {
        showErrors(data.errors || {});
        setStatus("Fix the highlighted fields and try again.", { ok: false });
        return;
      }
      const ref = refToken();
      setStatus(`${data?.error || "Save failed."} (Ref: ${ref})`, { ok: false });
      return;
    }

    loadedTeam = data.team;
    setStatus("Saved.");
    await loadTeam();
  } catch (err) {
    const ref = refToken();
    const msg = String(err?.message || err);
    const hint = msg.includes("AbortError") ? "Request timed out" : "Network error";
    setStatus(`⚠️ ${hint} while saving. (Ref: ${ref})`, { ok: false });
  } finally {
    btn.disabled = false;
    btn.textContent = "Save Team Profile";
  }
}

function renderAuth() {
  const user = currentUser();
  if (!user) {
    setStatus("Not signed in. Please sign in to continue.", { ok: false });
    signedOutEl.hidden = false;
    signedInEl.hidden = true;
    renderScore(null);
    renderChecklist();
    return;
  }

  setStatus(`Signed in as ${user.email}`);
  signedOutEl.hidden = true;
  signedInEl.hidden = false;

  renderChecklist();
  loadTeam();
}

// Boot
const identity = initIdentity();

submissions = initSubmissions({
  api,
  onChanged: (items = []) => {
    lastSubmissions = Array.isArray(items) ? items : [];
    renderChecklist();
    loadScore();
  }
});

btnSignIn?.addEventListener("click", () => identity && identity.open());
btnAccount?.addEventListener("click", () => identity && identity.open());
btnLogout?.addEventListener("click", () => logout({ redirectTo: "/" }));
btnReload?.addEventListener("click", () => loadTeam());

// If profile page has "Retry Load" button for submissions, make it reload everything.
btnRetrySubmissions?.addEventListener("click", () => loadTeam());

form?.addEventListener("submit", saveTeam);

onAuthChange(renderAuth);
renderAuth();

// If they go offline while viewing, be explicit
window.addEventListener("offline", () => {
  const ref = refToken();
  setStatus(`⚠️ You went offline. Reconnect and retry. (Ref: ${ref})`, { ok: false });
});
