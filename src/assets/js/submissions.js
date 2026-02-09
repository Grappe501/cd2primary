// Overlay 07: Submissions hub (client)
// Operating principle: volunteers do not get points unless they list the submission.

const wrap = document.getElementById("submissionsWrap");
const btnNew = document.getElementById("btnNewSubmission");
const formWrap = document.getElementById("submissionFormWrap");
const form = document.getElementById("submissionForm");
const btnCancel = document.getElementById("btnCancelSubmission");
const pollingFields = document.getElementById("pollingFields");
const submissionTypeEl = document.getElementById("submissionType");
const statusEl = document.getElementById("submissionsStatus");
const listEl = document.getElementById("submissionsList");

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
    pollingName: get("pollingName"),
    claimedItems,
    notes: get("notes"),
    confirmHashtags: fd.get("confirmHashtags") === "on"
  };
}

function platformLabel(slug) {
  switch (slug) {
    case "tiktok":
      return "TikTok";
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    case "x":
      return "X";
    case "bluesky":
      return "Bluesky";
    default:
      return slug;
  }
}

function getPrimaryLink(s) {
  return (
    s.primaryUrl ||
    s.videoUrl || // legacy
    s.platformLinks?.tiktok ||
    s.platformLinks?.instagram ||
    s.platformLinks?.facebook ||
    s.platformLinks?.x ||
    s.platformLinks?.bluesky ||
    ""
  );
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
      frag.appendChild(
        h("div", { class: "card", style: "margin-bottom:.75rem;" }, [
          h("div", { class: "spread", style: "gap:1rem; align-items:flex-start;" }, [
            h("div", {}, [
              h("div", { class: "badge", text: "Pending review" }),
              h("h3", { style: "margin:.5rem 0 0 0;" }, [
                h(
                  "a",
                  { href: primary || "#", target: "_blank", rel: "noopener" },
                  [primary ? "Open submitted link" : "Link missing"]
                )
              ]),
              h("div", { class: "help", style: "margin-top:.35rem;" }, [meta])
            ]),
            h("div", { class: "badge success", text: `${s.expectedPoints ?? "?"} pts (expected)` })
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
  pollingFields.hidden = !showPolling;
}

export function initSubmissions({ api }) {
  let currentTeam = null;

  async function load() {
    if (!currentTeam) {
      wrap.hidden = true;
      return;
    }

    wrap.hidden = false;
    setStatus("Loading submissions…");
    const { res, data } = await api("/.netlify/functions/submission-list");
    if (!res.ok) {
      setStatus(data?.error || "Could not load submissions.", { ok: false });
      renderList([]);
      return;
    }
    setStatus("");
    renderList(data.submissions || []);
  }

  async function submit(e) {
    e.preventDefault();
    if (!currentTeam) return;

    clearErrors();
    setStatus("");

    const payload = readForm();
    const btn = document.getElementById("btnSubmitVideo");
    btn.disabled = true;
    btn.textContent = "Submitting…";

    try {
      const { res, data } = await api("/.netlify/functions/submission-create", {
        method: "POST",
        body: payload
      });

      if (!res.ok) {
        if (res.status === 422) {
          showErrors(data.errors || {});
          setStatus("Fix the highlighted fields and try again.", { ok: false });
          return;
        }
        setStatus(data?.error || "Submission failed.", { ok: false });
        return;
      }

      // Success
      form.reset();
      pollingFields.hidden = true;
      formWrap.hidden = true;
      setStatus("Submitted. It will appear below as pending review.");
      await load();
    } finally {
      btn.disabled = false;
      btn.textContent = "Submit";
    }
  }

  function openForm() {
    formWrap.hidden = false;
    setTypeUI();
    document.getElementById("link_tiktok")?.focus();
  }

  function closeForm() {
    formWrap.hidden = true;
  }

  // Wire events
  btnNew?.addEventListener("click", openForm);
  btnCancel?.addEventListener("click", closeForm);
  submissionTypeEl?.addEventListener("change", setTypeUI);
  form?.addEventListener("submit", submit);

  return {
    setTeam(team) {
      currentTeam = team;
      closeForm();
      load();
    }
  };
}
