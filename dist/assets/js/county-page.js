import { initCountyIntel } from "./county-intel.js";
import { initCountySites } from "./county-sites.js";

function getCountySlug() {
  const bodySlug = document.body?.dataset?.countySlug;
  if (bodySlug) return String(bodySlug).trim();
  // fallback: /counties/<slug>/
  const parts = window.location.pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("counties");
  if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  return "";
}

document.addEventListener("DOMContentLoaded", () => {
  const slug = getCountySlug();
  const intelMount = document.querySelector("[data-county-intel]");
  if (intelMount) {
    initCountyIntel({ countySlug: slug, mount: intelMount });
  }

  const sitesMount = document.querySelector("[data-county-sites]");
  const electionDate = sitesMount?.dataset?.electionDate;
  if (sitesMount && electionDate) {
    initCountySites({ countySlug: slug, electionDate, mount: sitesMount });
  }
});
