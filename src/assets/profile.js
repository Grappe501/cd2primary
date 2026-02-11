import { initIdentity, currentUser, getAccessToken, logout, onAuthChange } from "/assets/js/auth.js";
import { initSubmissions } from "/assets/js/submissions.js";

const statusEl = document.getElementById("status");
const signedOutEl = document.getElementById("signedOut");
const signedInEl = document.getElementById("signedIn");
const btnSignIn = document.getElementById("btnSignIn");
const btnAccount = document.getElementById("btnAccount");
const btnLogout = document.getElementById("btnLogout");
const btnReload = document.getElementById("btnReload");
const form = document.getElementById("teamForm");
const teamStateEl = document.getElementById("teamState");
const teamMetaEl = document.getElementById("teamMeta");
const scoreBox = document.getElementById("scoreBox");

let loadedTeam = null;
let submissions = null;

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStatus(text, { ok = true } = {}) {
  statusEl.textContent = text;
  statusEl.classList.toggle("success", ok);
}

function clearErrors() {
  const els = document.querySelectorAll("[id^='err_']");
  els.forEach((el) => {
    el.textContent = "";
  });
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

async function api(path, { method = "GET", body } = {}) {
  const token = await getAccessToken();
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(body ? { "content-type": "application/json" } : {})
  };
  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

function renderScore(score) {
  if (!scoreBox) return;
  if (!score) {
    scoreBox.innerHTML = "";
    return;
  }

  scoreBox.innerHTML = `
    <div class="card">
      <h3>Score</h3>
      <div class="grid cols-4">
        <div class="card compact">
          <div class="help">Official (approved)</div>
          <div class="stat-value">${esc(score.officialPoints)}</div>
        </div>
        <div class="card compact">
          <div class="help">Provisional (incl. pending)</div>
          <div class="stat-value">${esc(score.provisionalPoints)}</div>
        </div>
        <div class="card compact">
          <div class="help">Streak bonus</div>
          <div class="stat-value">${esc(score.postingStreakBonus || 0)}</div>
        </div>
        <div class="card compact">
          <div class="help">8-county sweep bonus</div>
          <div class="stat-value">${esc(score.eightCountySweepBonus)}</div>
        </div>
      </div>
      <p class="help">Official points only count once a submission is approved (admin review comes later). Provisional points help you self-check.</p>
    </div>
  `;
}

async function loadScore() {
  const user = currentUser();
  if (!user) return;

  const { res, data } = await api("/.netlify/functions/score-get");
  if (!res.ok) return;
  renderScore(data.score);
}

async function loadTeam() {
  clearErrors();
  const user = currentUser();
  if (!user) return;

  teamStateEl.textContent = "Loading…";
  teamStateEl.classList.remove("success");
  teamMetaEl.textContent = "";

  const { res, data } = await api("/.netlify/functions/team-get");
  if (!res.ok) {
    teamStateEl.textContent = "Error";
    setStatus(data?.error || "Could not load team.", { ok: false });
    return;
  }

  loadedTeam = data.team;
  if (!loadedTeam) {
    teamStateEl.textContent = "No team yet — create one below.";
    teamStateEl.classList.remove("success");
    fillForm(null);
    teamMetaEl.textContent = "";
    renderScore(null);

    // Hide submissions until a team exists.
    submissions?.setTeam(null);
    return;
  }

  teamStateEl.textContent = `Team loaded: ${loadedTeam.teamName}`;
  teamStateEl.classList.add("success");
  fillForm(loadedTeam);
  teamMetaEl.textContent = `Team ID: ${loadedTeam.teamId} • Updated: ${new Date(loadedTeam.updatedAt).toLocaleString()}`;

  // Enable submissions hub
  submissions?.setTeam(loadedTeam);
  await loadScore();
}

async function saveTeam(e) {
  e.preventDefault();
  clearErrors();

  const user = currentUser();
  if (!user) {
    setStatus("You must sign in first.", { ok: false });
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
      body: payload
    });

    if (!res.ok) {
      if (res.status === 422) {
        showErrors(data.errors || {});
        setStatus("Fix the highlighted fields and try again.", { ok: false });
        return;
      }
      setStatus(data?.error || "Save failed.", { ok: false });
      return;
    }

    loadedTeam = data.team;
    setStatus("Saved.");
    await loadTeam();
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
    return;
  }

  setStatus(`Signed in as ${user.email}`);
  signedOutEl.hidden = true;
  signedInEl.hidden = false;

  loadTeam();
}

// Boot
const identity = initIdentity();

submissions = initSubmissions({
  api,
  onChanged: () => loadScore()
});

btnSignIn?.addEventListener("click", () => identity && identity.open());
btnAccount?.addEventListener("click", () => identity && identity.open());
btnLogout?.addEventListener("click", () => logout({ redirectTo: "/" }));
btnReload?.addEventListener("click", () => loadTeam());
form?.addEventListener("submit", saveTeam);

onAuthChange(renderAuth);
renderAuth();
