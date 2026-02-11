function fmtInt(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString();
}

function fmtPct(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "—";
  return `${x.toFixed(1)}%`;
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") node.className = v;
    else if (k.startsWith("data-")) node.setAttribute(k, v);
    else if (k === "html") node.innerHTML = v;
    else node[k] = v;
  });
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c == null) return;
    if (typeof c === "string") node.appendChild(document.createTextNode(c));
    else node.appendChild(c);
  });
  return node;
}

function renderElections(elections) {
  const wrapper = el("div", { class: "elections" });
  const years = Object.keys(elections || {}).sort((a, b) => Number(b) - Number(a));

  if (!years.length) {
    wrapper.appendChild(el("p", { class: "muted" }, "Election results not loaded yet."));
    return wrapper;
  }

  for (const year of years) {
    const offices = elections[year] || {};
    const details = el("details", { class: "details" });
    details.appendChild(el("summary", {}, `${year} results`));

    const inner = el("div", { class: "details-body" });
    const officeNames = Object.keys(offices).sort();
    for (const office of officeNames) {
      inner.appendChild(el("h4", { class: "h5" }, office));
      const list = el("ul", { class: "result-list" });
      for (const row of offices[office]) {
        const label = row.party ? `${row.candidate} (${row.party})` : row.candidate;
        const right = row.percent != null ? fmtPct(row.percent) : (row.votes != null ? fmtInt(row.votes) : "—");
        const li = el("li", { class: "result-item" }, [
          el("span", { class: "result-name" }, label),
          el("span", { class: "result-val" }, right)
        ]);
        list.appendChild(li);
      }
      inner.appendChild(list);
    }

    details.appendChild(inner);
    wrapper.appendChild(details);
  }

  return wrapper;
}

export async function initCountyIntel({ countySlug, mount }) {
  if (!mount) return;
  const slug = String(countySlug || "").trim();
  if (!slug) return;

  mount.innerHTML = "";
  mount.appendChild(el("div", { class: "card callout" }, [
    el("h3", { class: "h4" }, "County Snapshot"),
    el("p", { class: "muted" }, "Loading county voter + election context…")
  ]));

  try {
    const res = await fetch(`/.netlify/functions/public-county-summary?county=${encodeURIComponent(slug)}`, {
      headers: { "accept": "application/json" }
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      mount.innerHTML = "";
      mount.appendChild(el("div", { class: "card callout" }, [
        el("h3", { class: "h4" }, "County Snapshot"),
        el("p", { class: "muted" }, data?.error || "Unable to load county intel."),
        data?.hint ? el("p", { class: "muted" }, data.hint) : null
      ]));
      return;
    }

    const headline = data.headline || null;

    const grid = el("div", { class: "kv-grid" }, [
      el("div", { class: "kv" }, [
        el("div", { class: "kv-k" }, headline?.year ? `VEP (${headline.year})` : "VEP"),
        el("div", { class: "kv-v" }, fmtInt(headline?.vep))
      ]),
      el("div", { class: "kv" }, [
        el("div", { class: "kv-k" }, "Registered voters"),
        el("div", { class: "kv-v" }, fmtInt(headline?.registeredVoters))
      ]),
      el("div", { class: "kv" }, [
        el("div", { class: "kv-k" }, "Registered % of VEP"),
        el("div", { class: "kv-v" }, fmtPct(headline?.registeredPercent))
      ])
    ]);

    const card = el("div", { class: "card" }, [
      el("div", { class: "card-body" }, [
        el("div", { class: "stack" }, [
          el("h3", { class: "h4" }, "County Snapshot"),
          el("p", { class: "muted" }, "These are county-level context numbers to help volunteers plan coverage. Results are collapsible to avoid overwhelm."),
          grid,
          el("div", { class: "spacer" }),
          el("h3", { class: "h4" }, "Election Results"),
          renderElections(data.elections || {})
        ])
      ])
    ]);

    mount.innerHTML = "";
    mount.appendChild(card);
  } catch (err) {
    mount.innerHTML = "";
    mount.appendChild(el("div", { class: "card callout" }, [
      el("h3", { class: "h4" }, "County Snapshot"),
      el("p", { class: "muted" }, "Unable to load county intel."),
      el("p", { class: "muted" }, String(err?.message || err))
    ]));
  }
}
