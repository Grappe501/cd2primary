function setStatus(msg) {
  const el = document.querySelector("[data-map-status]");
  if (el) el.textContent = msg;
}

function hasLatLng(loc) {
  const lat = Number(loc?.lat);
  const lng = Number(loc?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function directionsLinks(lat, lng) {
  const g = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const a = `http://maps.apple.com/?daddr=${lat},${lng}`;
  return { g, a };
}

async function fetchLocations() {
  const res = await fetch("/.netlify/functions/public-county-locations?county=pulaski", {
    headers: { accept: "application/json" }
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

document.addEventListener("DOMContentLoaded", async () => {
  const mapEl = document.getElementById("pulaski-map");
  if (!mapEl) return;

  if (typeof window.L === "undefined") {
    setStatus("Map library failed to load.");
    return;
  }

  setStatus("Loading polling locations…");
  const { ok, data } = await fetchLocations();
  if (!ok) {
    setStatus(data?.error || "Polling locations not available yet.");
    return;
  }

  const locs = Array.isArray(data?.locations) ? data.locations : [];
  const mappable = locs.filter(hasLatLng);

  const map = window.L.map(mapEl);
  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  if (!mappable.length) {
    map.setView([34.7465, -92.2896], 10); // Little Rock-ish
    setStatus("No geocoded coordinates yet. Locations will appear once lat/lng are loaded into the database.");
    return;
  }

  const bounds = [];
  for (const loc of mappable) {
    const lat = Number(loc.lat);
    const lng = Number(loc.lng);
    bounds.push([lat, lng]);

    const { g, a } = directionsLinks(lat, lng);
    const precinct = Number.isFinite(Number(loc.precinctCount)) ? `${loc.precinctCount} precincts` : "Precincts";

    const popup = `
      <div class="map-pop">
        <div class="map-pop-title"><strong>${loc.name}</strong></div>
        <div class="map-pop-addr">${loc.address1 || ""}${loc.city ? `, ${loc.city}` : ""}</div>
        <div class="map-pop-meta">${precinct}</div>
        <div class="map-pop-actions">
          <a class="btn sm" href="${g}" target="_blank" rel="noopener">Directions (Google)</a>
          <a class="btn sm" href="${a}" target="_blank" rel="noopener">Directions (Apple)</a>
        </div>
      </div>
    `;

    window.L.marker([lat, lng]).addTo(map).bindPopup(popup);
  }

  map.fitBounds(bounds, { padding: [20, 20] });
  setStatus(`${mappable.length} locations mapped. Click a marker for directions.`);
});
