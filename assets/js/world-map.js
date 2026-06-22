const { LEADER_MARKERS, COUNTRY_STATS, GEOJSON_URLS } = window.GP_DATA;

const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_LABELS_URL =
  "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png";
const TILE_URL_ALT = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

function rateColor(rate) {
  if (rate == null) return "#4a5568";
  if (rate >= 55) return "#0f7a66";
  if (rate >= 45) return "#5c6678";
  return "#c9453c";
}

function formatRate(rate) {
  if (rate == null) return "Verifying";
  return rate.toFixed(1) + "%";
}

function showMapError(container, message) {
  container.innerHTML =
    '<div class="map-error">' +
    "<strong>Map could not load</strong>" +
    "<p>" +
    (message || "Open the site via START.bat and check your network connection.") +
    "</p>" +
    '<p><a href="map.html">Retry map</a> · <a href="index.html">Back to home</a></p></div>";
}

function leaderIconHtml(leader) {
  const trendClass =
    leader.rate == null || leader.frozen
      ? "is-muted"
      : leader.rate >= 50
        ? "is-support"
        : "is-oppose";
  return (
    '<div class="map-marker ' +
    (leader.historical ? "map-marker--history" : "") +
    " " +
    (leader.frozen ? "map-marker--frozen" : "") +
    '">' +
    '<span class="map-marker-ring" aria-hidden="true"></span>' +
    '<span class="map-marker-dot"></span>' +
    '<span class="map-marker-rate ' +
    trendClass +
    '">' +
    (leader.frozen ? "—" : leader.rate + "%") +
    "</span></div>"
  );
}

function popupHtml(leader) {
  const avatar = window.GP_UI.avatarDataUri(leader.seed, 40);
  const href = leader.slug || window.GP_DATA.leaderUrl(leader.id);
  return (
    '<div class="map-popup">' +
    '<img src="' +
    avatar +
    '" alt="" width="40" height="40" class="map-popup-avatar" />' +
    '<div class="map-popup-body">' +
    '<span class="map-popup-meta">' +
    leader.country +
    " · " +
    leader.role +
    (leader.delta ? " · " + leader.delta : "") +
    "</span>" +
    '<strong class="map-popup-name">' +
    leader.name +
    "</strong>" +
    '<span class="map-popup-rate">' +
    (leader.frozen ? "Under review" : "Approval " + leader.rate + "%") +
    '</span><a href="' +
    href +
    '" class="map-popup-link">View profile →</a></div></div>'
  );
}

function countryPopupHtml(name, stat) {
  if (!stat) {
    return '<div class="map-popup map-popup--country"><strong>' + name + "</strong><p>Not enough aggregated data</p></div>";
  }
  if (stat.frozen) {
    return (
      '<div class="map-popup map-popup--country"><strong>' +
      stat.name +
      "</strong><p>Under review</p></div>"
    );
  }
  const leaderLink = stat.leaderId
    ? '<a href="' + window.GP_DATA.leaderUrl(stat.leaderId) + '" class="map-popup-link">View leader →</a>'
    : "";
  return (
    '<div class="map-popup map-popup--country"><strong>' +
    stat.name +
    "</strong><p class=\"map-popup-rate\">30-day avg. approval <b>" +
    formatRate(stat.rate) +
    "</b></p><p class=\"map-popup-meta\">Valid votes " +
    stat.votes.toLocaleString("en-US") +
    " · Top: " +
    stat.topLeader +
    "</p>" +
    leaderLink +
    "</div>"
  );
}

function resolveCountryCode(feature) {
  return (feature.id || feature.properties?.iso_a2 || "")
    .toString()
    .toUpperCase();
}

function addLeaderMarkers(map, L, leaders) {
  const group = L.layerGroup();
  leaders.forEach((leader) => {
    const icon = L.divIcon({
      className: "map-leader-icon-wrap",
      html: leaderIconHtml(leader),
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });
    const marker = L.marker([leader.lat, leader.lng], { icon });
    marker.bindPopup(popupHtml(leader), {
      className: "leaflet-popup-premium",
      maxWidth: 280,
      offset: [0, -8],
    });
    marker.addTo(group);
  });
  group.addTo(map);
  return group;
}

async function addCountryLayer(map, L) {
  let geo = null;
  for (const url of GEOJSON_URLS) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        geo = await res.json();
        break;
      }
    } catch {
      /* next */
    }
  }
  if (!geo) throw new Error("Could not load country boundaries");

  const layer = L.geoJSON(geo, {
    style(feature) {
      const code = resolveCountryCode(feature);
      const stat = COUNTRY_STATS[code];
      const fill = rateColor(stat?.rate);
      return {
        fillColor: fill,
        fillOpacity: stat ? 0.45 : 0.12,
        color: "rgba(255,255,255,0.22)",
        weight: 0.8,
      };
    },
    onEachFeature(feature, featureLayer) {
      const code = resolveCountryCode(feature);
      const stat = COUNTRY_STATS[code];
      const name = stat?.name || feature.properties?.name || code;
      featureLayer.bindPopup(countryPopupHtml(name, stat), {
        className: "leaflet-popup-premium",
        maxWidth: 260,
      });
      featureLayer.on({
        mouseover(e) {
          e.target.setStyle({ fillOpacity: 0.72, weight: 1.2 });
          e.target.bringToFront();
        },
        mouseout(e) {
          layer.resetStyle(e.target);
        },
      });
    },
  });
  layer.addTo(map);
  return layer;
}

async function initWorldMap(container, options = {}) {
  if (!container) return { destroy: () => {}, map: null, countryLayer: null };

  const { mode = "hero", showCountries = true, showLeaders = true } = options;

  let L;
  try {
    L = await window.GP_UI.ensureLeaflet();
  } catch (err) {
    showMapError(container, err.message);
    return { destroy: () => {}, map: null, countryLayer: null };
  }

  const isHero = mode === "hero";
  const map = L.map(container, {
    center: [24, 10],
    zoom: 2,
    minZoom: 2,
    maxZoom: isHero ? 6 : 8,
    zoomControl: !isHero,
    attributionControl: true,
    worldCopyJump: true,
  });

  const tile = L.tileLayer(TILE_URL, {
    attribution: TILE_ATTR,
    subdomains: "abcd",
    maxZoom: 19,
  });
  tile.addTo(map);
  L.tileLayer(TILE_LABELS_URL, {
    subdomains: "abcd",
    maxZoom: 19,
    pane: "overlayPane",
  }).addTo(map);
  tile.on("tileerror", () => {
    if (!map._fallbackTile) {
      map._fallbackTile = true;
      L.tileLayer(TILE_URL_ALT, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map);
    }
  });

  let countryLayer = null;
  if (showCountries) {
    try {
      countryLayer = await addCountryLayer(map, L);
    } catch (err) {
      console.warn(err);
      const note = document.createElement("div");
      note.className = "map-warn-banner";
      note.textContent = "Country shading failed to load; leader markers still work.";
      container.appendChild(note);
    }
  }

  if (showLeaders) {
    addLeaderMarkers(map, L, LEADER_MARKERS);
  }

  map.setMaxBounds([[-85, -180], [85, 180]]);
  if (isHero) L.control.zoom({ position: "bottomright" }).addTo(map);

  const resizeObserver = new ResizeObserver(() => map.invalidateSize());
  resizeObserver.observe(container);
  setTimeout(() => map.invalidateSize(), 200);
  setTimeout(() => map.invalidateSize(), 800);

  const destroy = () => {
    resizeObserver.disconnect();
    map.remove();
  };

  return { destroy, map, countryLayer };
}

function initMapLegend() {
  const el = document.querySelector("[data-map-legend]");
  if (!el) return;
  el.innerHTML =
    '<span class="legend-item"><i style="background:#0f7a66"></i>Approval ≥ 55%</span>' +
    '<span class="legend-item"><i style="background:#5c6678"></i>45% – 55%</span>' +
    '<span class="legend-item"><i style="background:#c9453c"></i>&lt; 45%</span>' +
    '<span class="legend-item"><i style="background:#4a5568"></i>Insufficient data</span>';
}

function initMapSidebar(map, countryLayer) {
  const list = document.querySelector("[data-map-country-list]");
  if (!list) return;

  const sorted = Object.entries(COUNTRY_STATS)
    .filter(([, s]) => s.rate != null && !s.frozen)
    .sort((a, b) => b[1].rate - a[1].rate);

  list.innerHTML = sorted
    .map(function (entry) {
      const code = entry[0];
      const s = entry[1];
      return (
        '<button type="button" class="map-country-row" data-country="' +
        code +
        '"><span class="map-country-name">' +
        s.name +
        '</span><span class="map-country-rate tabular" style="color:' +
        rateColor(s.rate) +
        '">' +
        s.rate +
        '%</span><span class="map-country-votes tabular">' +
        Math.round(s.votes / 1000) +
        "k votes</span></button>"
      );
    })
    .join("");

  if (!map || !countryLayer) return;

  list.querySelectorAll("[data-country]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const code = btn.dataset.country;
      countryLayer.eachLayer((layer) => {
        if (resolveCountryCode(layer.feature) !== code) return;
        map.fitBounds(layer.getBounds(), { padding: [48, 48], maxZoom: 6 });
        layer.openPopup();
      });
    });
  });
}

window.GP_MAP = { initWorldMap, initMapLegend, initMapSidebar };
