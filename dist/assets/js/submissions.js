// Overlay 07: Submissions hub (client)
// Overlay 09: Scoring preview + area type for polling-location videos
// Overlay 26B: Hardening (timeouts + retry + offline + explicit failure states)
// Operating principle: volunteers do not get points unless they list the submission.

const wrap = document.getElementById("submissionsWrap");
const btnNew = document.getElementById("btnNewSubmission");
const btnRetry = document.getElementById("btnRetrySubmissions");
const formWrap = document.getElementById("submissionFormWrap");
const form = document.getElementById("submissionForm");
const btnCancel = document.getElementById("btnCancelSubmission");
const pollingFields = document.getElementById("pollingFields");
const submissionTypeEl = document.getElementById("submissionType");
const statusEl = document.getElementById("submissionsStatus");
const listEl = document.getElementById("submissionsList");
const expectedHintEl = document.getElementById("expectedHint");

function refToken() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, String(v));
  });
  children.forEach((c) => {
    if (c == null) return;
    el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return el;
}

function clearErrors() {
  const els = document.querySelectorAll("#submissionForm [id^='err_']");
  els.forEach((el) => (el.textContent = ""));
}

function showErrors(errors = {}) {
  Object.entries(errors).forEach(([k, v]) => {
    const el = document.getElementById(`err_${k}`);
    if (el) el.textContent = v;
  });
}

function setStatus(msg = "", { ok = true } = {}) {
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.style.color = ok ? "" : "var(--danger, #b42318)";
}

function fetchWithTimeout(promiseFactory, timeoutMs = 9000) {
  let t;
  const timeout = new Promise((_, rej) => {
    t = setTimeout(() => rej(new Error("timeout")), timeoutMs);
  });
  return Promise.race([promiseFactory(), timeout]).finally(() => clearTimeout(t));
}

function readForm() {
  const fd = new FormData(form);
  const get = (k) => String(fd.get(k) || "").trim();
  const claimedItems = fd.getAll("claimedItems").map(String);
  const platformLinks = {
    tiktok: get("link_tiktok"),
    instagram: get("link_instagram"),
    facebook: get("link_facebook"),
    x: get("link_x"),
    bluesky: get("link_bluesky")
  };
  // primaryUrl is optional; server will derive one if missing.
  const primaryUrl = get("primaryUrl");
  return {
    platformLinks,
    primaryUrl,
    submissionType: get("submissionType"),
    submissionDate: get("submissionDate"),
    expectedPoints: get("expectedPoints"),
    pollingCounty: get("pollingCounty"),
    pollingAreaType: get("pollingAreaType"),
    pollingName: get("pollingName"),
    claimedItems,
    notes: get("notes"),
    confirmHashtags: fd.get("confirmHashtags") === "on"
  };
}

function platformLabel(slug) {
  switch (slug) {
    case "tiktok": return "TikTok";
    case "instagram": return "Instagram";
    case "facebook": return "Facebook";
    case "x": return "X";
    case "bluesky": return "Bluesky";
    default: return slug;
  }
}

function getPrimaryLink(sub) {
  if (sub.primaryUrl) return sub.primaryUrl;
  const links = sub.platformLinks && typeof sub.platformLinks === "object" ? sub.platformLinks : {};
  return links.tiktok || links.instagram || links.facebook || links.x || links.bluesky || sub.videoUrl || "";
}

function renderLoadFailCard(message, ref, { showRetry = true } = {}) {
  if (!listEl) return;
  listEl.innerHTML = "";
  listEl.appendChild(
    h("div", { class: "card" }, [
      h("div", { class: "badge", text: "Service unavailable" }),
      h("p", { class: "lede", style: "margin:.5rem 0 0 0;" }, [message]),
      h("div", { class: "help", style: "margin-top:.35rem;" }, [`Ref: ${ref}`]),
      h("div", { class: "row", style: "margin-top:.75rem; flex-wrap:wrap;" }, [
        showRetry ? h("button", { class: "btn", type: "button", id: "btnRetryInline", text: "Retry" }) : null,
        h("a", { class: "btn", href: "/status/" }, ["Status"])
      ])
    ])
  );
  const inline = document.getElementById("btnRetryInline");
  if (inline && showRetry) inline.addEventListener("click", () => btnRetry?.click());
}

function renderList(submissions = []) {
  if (!listEl) return;
  listEl.innerHTML = "";

  if (!submissions.length) {
    listEl.appendChild(
      h("div", { class: "card" }, [
        h("p", { class: "lede", style: "margin:0;" }, [
          "No submissions yet. When you post a video, come back here and submit the link."
        ])
      ])
    );
    return;
  }

  const frag = document.createDocumentFragment();
  submissions
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .forEach((s) => {
      const meta = `${new Date(s.createdAt).toLocaleString()} • ${s.submissionTypeLabel || s.submissionType}`;
      const primary = getPrimaryLink(s);
      const platforms =
        s.platformLinks && typeof s.platformLinks === "object"
          ? Object.entries(s.platformLinks).filter(([, url]) => Boolean(url))
          : [];

      const status = s.status || "pending";
      const points = typeof s.calculatedPoints === "number" ? s.calculatedPoints : s.expectedPoints;

      frag.appendChild(
        h("div", { class: "card", style: "margin-bottom:.75rem;" }, [
          h("div", { class: "spread", style: "gap:1rem; align-items:flex-start;" }, [
            h("div", {}, [
              h("div", {
                class: "badge",
                text:
                  status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending review"
              }),
              h("h3", { style: "margin:.5rem 0 0 0;" }, [
                h(
                  "a",
                  { href: primary || "#", target: "_blank", rel: "noopener" },
                  [primary ? "Open submitted link" : "Link missing"]
                )
              ]),
              h("div", { class: "help", style: "margin-top:.35rem;" }, [meta])
            ]),
            h("div", { class: "badge success", text: `${points ?? "?"} pts (calculated)` })
          ]),
          platforms.length
            ? h(
                "div",
                { class: "row", style: "margin-top:.6rem; flex-wrap:wrap; gap:.35rem;" },
                platforms.map(([slug, url]) =>
                  h(
                    "a",
                    {
                      class: "badge",
                      href: url,
                      target: "_blank",
                      rel: "noopener",
                      title: `Open on ${platformLabel(slug)}`
                    },
                    [platformLabel(slug)]
                  )
                )
              )
            : null,
          s.pollingCounty || s.pollingName
            ? h("div", { class: "help", style: "margin-top:.5rem;" }, [
                `${s.pollingCounty ? `County: ${s.pollingCounty}` : ""}${s.pollingCounty && s.pollingName ? " • " : ""}${s.pollingName ? `Location: ${s.pollingName}` : ""}`
              ])
            : null,
          s.claimedItems?.length
            ? h("div", { class: "help", style: "margin-top:.35rem;" }, [
                `Claimed checklist items: ${s.claimedItems.join(", ")}`
              ])
            : null,
          s.notes ? h("div", { class: "help", style: "margin-top:.35rem;" }, [s.notes]) : null
        ])
      );
    });

  listEl.appendChild(frag);
}

function setTypeUI() {
  const type = submissionTypeEl?.value || "";
  const showPolling = type === "polling_location";
  if (pollingFields) pollingFields.hidden = !showPolling;
  updateExpectedHint();
}

function countPlatforms(platformLinks) {
  return Object.values(platformLinks || {}).filter((v) => typeof v === "string" && v.trim()).length;
}

function calcCrossPostBonus(nPlatforms) {
  return Math.max(0, nPlatforms - 1) * 5;
}

function calcHashtagBonus(confirm) {
  return confirm ? 2 : 0;
}

function calcBasePoints(payload) {
  switch (payload.submissionType) {
    case "support_chris":
      return 25;
    case "volunteer_event":
      return 5;
    case "candidate_interview":
      return 5;
    case "recruit_bonus":
      return 20;
    case "polling_location": {
      const count = Array.isArray(payload.claimedItems) ? payload.claimedItems.length : 0;
      const area = payload.pollingAreaType || "other";
      const perItem = area === "little_rock" ? 2 : area === "major_city" ? 3 : 4;
      const cap = area === "little_rock" ? 10 : area === "major_city" ? 15 : 20;
      return Math.min(cap, count * perItem);
    }
    default:
      return 0;
  }
}

function updateExpectedHint() {
  if (!expectedHintEl) return;
  if (!form) return;

  const payload = readForm();

  const nPlatforms = countPlatforms(payload.platformLinks);
  const cross = calcCrossPostBonus(nPlatforms);
  const hashtag = calcHashtagBonus(payload.confirmHashtags);
  const base = calcBasePoints(payload);
  const calc = payload.confirmHashtags ? base + hashtag + cross : 0;

  expectedHintEl.innerHTML = `
    <span class="badge">Base: ${base}</span>
    <span class="badge">Hashtags: ${hashtag}</span>
    <span class="badge">Cross-post: ${cross}</span>
    <span class="badge">Calculated: ${calc}</span>
  `;

  const expectedInput = document.getElementById("expectedPoints");
  if (expectedInput && (!expectedInput.value || expectedInput.value === "0")) {
    expectedInput.value = String(calc);
  }
}

export function initSubmissions({ api, onChanged } = {}) {
  let currentTeam = null;

  async function load() {
    if (!currentTeam) {
      if (wrap) wrap.hidden = true;
      onChanged && onChanged([]);
      return;
    }

    if (wrap) wrap.hidden = false;

    // Offline? Say it clearly.
    if (navigator && navigator.onLine === false) {
      const ref = refToken();
      setStatus(`⚠️ You appear to be offline. Reconnect and click Retry. (Ref: ${ref})`, { ok: false });
      renderLoadFailCard("You appear to be offline. Reconnect and retry.", ref, { showRetry: true });
      onChanged && onChanged([]);
      return;
    }

    setStatus("Loading submissions...");
    try {
      const { res, data } = await fetchWithTimeout(() => api("/.netlify/functions/submission-list"), 9000);

      if (!res.ok) {
        const ref = refToken();
        const msg = data?.error || "Could not load submissions.";
        setStatus(`⚠️ ${msg} (Ref: ${ref})`, { ok: false });
        renderLoadFailCard(msg, ref, { showRetry: true });
        onChanged && onChanged([]);
        return;
      }

      setStatus("");
      renderList(data.submissions || []);
      onChanged && onChanged(data.submissions || []);
    } catch (err) {
      const ref = refToken();
      const msg =
        err && String(err.message || err).includes("timeout")
          ? "Request timed out while loading submissions."
          : "Network error while loading submissions.";
      setStatus(`⚠️ ${msg} (Ref: ${ref})`, { ok: false });
      renderLoadFailCard(msg, ref, { showRetry: true });
      onChanged && onChanged([]);
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!currentTeam) return;

    clearErrors();
    setStatus("");

    const payload = readForm();
    const btn = document.getElementById("btnSubmitVideo");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Submitting...";
    }

    try {
      const { res, data } = await fetchWithTimeout(
        () =>
          api("/.netlify/functions/submission-create", {
            method: "POST",
            body: payload
          }),
        12000
      );

      if (!res.ok) {
        if (res.status === 422) {
          showErrors(data.errors || {});
          setStatus("Fix the highlighted fields and try again.", { ok: false });
          return;
        }
        const ref = refToken();
        setStatus(`${data?.error || "Submission failed."} (Ref: ${ref})`, { ok: false });
        return;
      }

      // Success
      form.reset();
      if (pollingFields) pollingFields.hidden = true;
      if (formWrap) formWrap.hidden = true;
      setStatus("Submitted. It will appear below as pending review.");
      await load();
    } catch (err) {
      const ref = refToken();
      const msg =
        err && String(err.message || err).includes("timeout")
          ? "Request timed out during submit."
          : "Network error during submit.";
      setStatus(`⚠️ ${msg} (Ref: ${ref})`, { ok: false });
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Submit";
      }
    }
  }

  function openForm() {
    if (formWrap) formWrap.hidden = false;
    setTypeUI();
    document.getElementById("link_tiktok")?.focus();
  }

  function closeForm() {
    if (formWrap) formWrap.hidden = true;
  }

  // Wire events
  btnNew?.addEventListener("click", openForm);
  btnCancel?.addEventListener("click", closeForm);
  btnRetry?.addEventListener("click", load);
  submissionTypeEl?.addEventListener("change", setTypeUI);
  form?.addEventListener("submit", submit);

  // scoring preview listeners
  [
    "link_tiktok",
    "link_instagram",
    "link_facebook",
    "link_x",
    "link_bluesky",
    "submissionType",
    "pollingAreaType",
    "confirmHashtags",
    "pollingCounty"
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", updateExpectedHint);
    el.addEventListener("change", updateExpectedHint);
  });
  document.querySelectorAll('input[name="claimedItems"]').forEach((el) => {
    el.addEventListener("change", updateExpectedHint);
  });

  // If network goes offline, we show explicit status
  window.addEventListener("offline", () => {
    const ref = refToken();
    setStatus(`⚠️ You went offline. Reconnect and click Retry. (Ref: ${ref})`, { ok: false });
  });

  return {
    setTeam(team) {
      currentTeam = team;
      closeForm();
      load();
    }
  };
}
