// app.js — Iowa Weather Radar + Traffic Cameras (GitHub Pages friendly)

// ---------- Helpers ----------
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[c]));
}

function setCameraPanel(html) {
  const el = document.getElementById("cameraDetails");
  if (el) el.innerHTML = html;
}

function setWeatherPanel(html) {
  const el = document.getElementById("weatherDetails");
  if (el) el.innerHTML = html;
}

// ---------- Map ----------
const IOWA_CENTER = [42.0, -93.5];
const map = L.map("map").setView(IOWA_CENTER, 7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

// ---------- Radar (RainViewer) ----------
let radarLayer = null;
let radarEnabled = true;
let radarRefreshTimer = null;

async function refreshRadar() {
  try {
    const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
    const data = await res.json();

    const frames = data?.radar?.past ?? [];
    if (!frames.length) return;

    const latestPath = frames[frames.length - 1].path;
    const tileUrl = `https://tilecache.rainviewer.com${latestPath}/256/{z}/{x}/{y}/2/1_1.png`;

    if (radarLayer) map.removeLayer(radarLayer);

    radarLayer = L.tileLayer(tileUrl, {
      opacity: 0.6,
      attribution: "Radar data &copy; RainViewer",
    });

    if (radarEnabled) radarLayer.addTo(map);
  } catch (e) {
    console.error("Radar refresh failed:", e);
  }
}

function setRadarEnabled(on) {
  radarEnabled = on;
  const btn = document.getElementById("radarToggle");
  if (btn) btn.classList.toggle("active", on);

  if (on) {
    if (radarLayer) radarLayer.addTo(map);
  } else {
    if (radarLayer) map.removeLayer(radarLayer);
  }
}

function startRadarAutoRefresh() {
  if (radarRefreshTimer) clearInterval(radarRefreshTimer);
  radarRefreshTimer = setInterval(refreshRadar, 5 * 60 * 1000);
}

// ---------- Cameras (Iowa DOT ArcGIS) ----------
const CAM_SERVICE =
  "https://services.arcgis.com/8lRhdTsQyJpO52F1/ArcGIS/rest/services/Traffic_Cameras_Video_Request_Form/FeatureServer/0/query";

const camCluster = L.markerClusterGroup({
  chunkedLoading: true,
  removeOutsideVisibleBounds: true,
});
map.addLayer(camCluster);

let lastCamFetchKey = "";

function buildEnvelope(bounds) {
  return {
    xmin: bounds.getWest(),
    ymin: bounds.getSouth(),
    xmax: bounds.getEast(),
    ymax: bounds.getNorth(),
    spatialReference: { wkid: 4326 },
  };
}

function pickVideoUrl(a) {
  return a?.VideoURL_HD || a?.VideoURL_HB || a?.VideoURL || null;
}

async function loadCamerasInView() {
  try {
    const b = map.getBounds();

    const key = [
      b.getSouth().toFixed(2),
      b.getWest().toFixed(2),
      b.getNorth().toFixed(2),
      b.getEast().toFixed(2),
    ].join(",");

    if (key === lastCamFetchKey) return;
    lastCamFetchKey = key;

    camCluster.clearLayers();

    const params = new URLSearchParams({
      f: "pjson",
      where: "1=1",
      outFields: "*",
      outSR: "4326",
      returnGeometry: "true",
      geometryType: "esriGeometryEnvelope",
      spatialRel: "esriSpatialRelIntersects",
      geometry: JSON.stringify(buildEnvelope(b)),
      resultRecordCount: "1000",
    });

    const url = `${CAM_SERVICE}?${params.toString()}`;
    const res = await fetch(url);
    const json = await res.json();

    const feats = json?.features ?? [];
    if (!feats.length) {
      setCameraPanel(`<p class="muted">No cameras in this view. Zoom out or pan.</p>`);
      return;
    }

    feats.forEach((f) => {
      const a = f.attributes || {};
      const g = f.geometry || {};
      const lat = g?.y;
      const lon = g?.x;
      if (typeof lat !== "number" || typeof lon !== "number") return;

      const title = a.Desc_ || a.ImageName || a.COMMON_ID || "Iowa DOT Camera";
      const imageUrl = a.ImageURL || null;
      const videoUrl = pickVideoUrl(a);

      const m = L.marker([lat, lon]);
      m.on("click", () => {
        const bustedImg = imageUrl
          ? `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}t=${Date.now()}`
          : null;

        setCameraPanel(`
          <div class="cam-title">${esc(title)}</div>
          <div class="muted">Lat/Lon: ${lat.toFixed(5)}, ${lon.toFixed(5)}</div>
          ${bustedImg ? `<img class="cam-img" src="${bustedImg}" alt="Camera image">`
                      : `<p class="muted">No image URL for this camera.</p>`}
          ${videoUrl ? `<a class="video-link" href="${videoUrl}" target="_blank" rel="noopener">Play Video ↗</a>`
                    : `<p class="muted">No video link for this camera.</p>`}
        `);

        document.getElementById("sidePanel")?.classList.add("open");
      });

      camCluster.addLayer(m);
    });
  } catch (e) {
    console.error("Camera load failed:", e);
    setCameraPanel(`<p class="muted">Camera load failed. Check console.</p>`);
  }
}

// ---------- Weather Forecast (NWS) ----------
async function loadForecast(lat, lon) {
  try {
    setWeatherPanel(`<p class="muted">Loading forecast…</p>`);

    const pRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
    const pJson = await pRes.json();
    const forecastUrl = pJson?.properties?.forecast;
    if (!forecastUrl) {
      setWeatherPanel(`<p class="muted">Forecast unavailable for this location.</p>`);
      return;
    }

    const fRes = await fetch(forecastUrl);
    const fJson = await fRes.json();
    const periods = (fJson?.properties?.periods ?? []).slice(0, 6);

    if (!periods.length) {
      setWeatherPanel(`<p class="muted">No forecast periods returned.</p>`);
      return;
    }

    setWeatherPanel(periods.map((p) => `
      <div class="forecast-item">
        <div class="forecast-name">${esc(p.name)}</div>
        <div class="forecast-desc">${esc(p.shortForecast)}</div>
        <div class="muted">${p.temperature}°${esc(p.temperatureUnit)} · Wind ${esc(p.windSpeed)} ${esc(p.windDirection)}</div>
      </div>
    `).join(""));
  } catch (e) {
    console.error("Forecast load failed:", e);
    setWeatherPanel(`<p class="muted">Forecast load failed. Check console.</p>`);
  }
}

// ---------- UI Wiring ----------
document.getElementById("radarToggle")?.addEventListener("click", () => {
  setRadarEnabled(!radarEnabled);
});

document.getElementById("closePanel")?.addEventListener("click", () => {
  document.getElementById("sidePanel")?.classList.remove("open");
});

document.getElementById("searchBtn")?.addEventListener("click", async () => {
  const q = (document.getElementById("citySearch")?.value || "").trim();
  if (!q) return;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ", Iowa")}&limit=1`;
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    const data = await res.json();
    if (!data?.length) return;

    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);
    map.setView([lat, lon], 11);
  } catch (e) {
    console.error("Search failed:", e);
  }
});

map.on("click", (e) => {
  const { lat, lng } = e.latlng;
  loadForecast(lat, lng);
});

map.on("moveend", loadCamerasInView);

// ---------- Boot ----------
setCameraPanel(`<p class="muted">Loading cameras…</p>`);
refreshRadar();
startRadarAutoRefresh();
loadCamerasInView();
