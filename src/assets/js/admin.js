import { initIdentity, currentUser, onAuthChange, logout, getAccessToken } from "/assets/js/auth.js";

const statusEl = document.getElementById("status");
const btnOpen = document.getElementById("btnOpen");
const btnLogout = document.getElementById("btnLogout");
const notAuthEl = document.getElementById("notAuthorized");
const adminEl = document.getElementById("adminPanel");
const configEl = document.getElementById("adminConfigHint");

const identity = initIdentity();

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

function show(el, yes) {
  if (!el) return;
  el.hidden = !yes;
}

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
