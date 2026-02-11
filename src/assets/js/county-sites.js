function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatAddress(site) {
  const parts = [];
  if (site.address1) parts.push(site.address1);
  const cityLine = [site.city, site.state, site.zip].filter(Boolean).join(", ");
  if (cityLine) parts.push(cityLine);
  return parts.join("<br />");
}

function directionsHref(site) {
  if (typeof site.lat === "number" && typeof site.lng === "number") {
    return `https://www.google.com/maps/dir/?api=1&destination=${site.lat},${site.lng}`;
  }
  // fallback to address
  const q = encodeURIComponent([site.name, site.address1, site.city, site.state, site.zip].filter(Boolean).join(" "));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function uniqueNotes(windows) {
  const out = [];
  const seen = new Set();
  for (const w of (windows || [])) {
    const n = String(w?.notes || "").trim();
    if (!n) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

function renderSiteCard(site) {
  const notes = uniqueNotes(site.windows);
  const notesHtml = notes.length
    ? `<ul class="mini-list">${notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`
    : `<p class="muted">Hours coming soon.</p>`;

  return `
    <div class="card stack site-card">
      <div class="spread">
        <div>
          <div class="h4">${esc(site.name)}</div>
          <div class="muted">${formatAddress(site)}</div>
        </div>
        <div class="row">
          <a class="btn sm" target="_blank" rel="noopener" href="${directionsHref(site)}">Directions</a>
        </div>
      </div>
      <details class="details">
        <summary>Hours</summary>
        ${notesHtml}
      </details>
    </div>
  `;
}

function renderTabs({ election, earlyVoting, electionDay }) {
  const earlyCount = (earlyVoting || []).length;
  const dayCount = (electionDay || []).length;

  return `
    <div class="stack">
      <div class="spread">
        <div>
          <h2>Where to Vote</h2>
          <p class="muted">${esc(election?.name || "")}</p>
        </div>
      </div>

      <div class="tabs" role="tablist" aria-label="Voting options">
        <button class="tab is-active" type="button" data-tab="early" role="tab" aria-selected="true">
          Early Voting <span class="pill">${earlyCount}</span>
        </button>
        <button class="tab" type="button" data-tab="day" role="tab" aria-selected="false">
          Election Day <span class="pill">${dayCount}</span>
        </button>
      </div>

      <div class="tabpanels">
        <div class="tabpanel is-active" data-panel="early" role="tabpanel">
          <div class="grid cols-2 gap">
            ${(earlyVoting || []).map(renderSiteCard).join("")}
          </div>
        </div>

        <div class="tabpanel" data-panel="day" role="tabpanel">
          <div class="grid cols-2 gap">
            ${(electionDay || []).map(renderSiteCard).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

function wireTabs(mount) {
  const tabs = mount.querySelectorAll("[data-tab]");
  const panels = mount.querySelectorAll("[data-panel]");

  function activate(name) {
    tabs.forEach((t) => {
      const active = t.dataset.tab === name;
      t.classList.toggle("is-active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });
    panels.forEach((p) => {
      p.classList.toggle("is-active", p.dataset.panel === name);
    });
  }

  tabs.forEach((t) => {
    t.addEventListener("click", () => activate(t.dataset.tab));
  });
}

export async function initCountySites({ countySlug, electionDate, mount }) {
  mount.innerHTML = `<div class="card stack"><p class="muted">Loading voting locations…</p></div>`;
  const qs = new URLSearchParams({ county: countySlug, election: electionDate });

  try {
    const res = await fetch(`/.netlify/functions/public-county-sites?${qs.toString()}`);
    const data = await res.json();

    if (!res.ok) {
      mount.innerHTML = `<div class="card stack"><h2>Where to Vote</h2><p class="muted">Voting-site data is not available yet.</p></div>`;
      return;
    }

    if (!data?.found) {
      mount.innerHTML = `<div class="card stack"><h2>Where to Vote</h2><p class="muted">${esc(data?.message || "Voting-site data coming soon.")}</p></div>`;
      return;
    }

    mount.innerHTML = renderTabs({
      election: data.election,
      earlyVoting: data.earlyVoting,
      electionDay: data.electionDay,
    });
    wireTabs(mount);
  } catch (err) {
    console.error("county-sites failed", err);
    mount.innerHTML = `<div class="card stack"><h2>Where to Vote</h2><p class="muted">Could not load voting-site data.</p></div>`;
  }
}
