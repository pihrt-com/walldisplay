// ===== DATA SOURCE CONFIG =====
// Raspberry Pi (FastAPI):
// const DATA_SOURCE = "/api/status";

// Web mirror (static JSON):
// const DATA_SOURCE = "/status.json";

// Auto-detect json path:
const DATA_SOURCE = location.hostname === "localhost"
  ? "/api/status"
  : "status.json";

const POWER_HISTORY_SOURCE = location.hostname === "localhost"
  ? "/api/power_history"
  : "power_history.json";

const SENSOR_HISTORY_SOURCE = location.hostname === "localhost"
  ? "/api/sensor_history"
  : "sensor_history.json";

const REFRESH_MS = 5000;

function withoutCache(source) {
  const separator = source.includes("?") ? "&" : "?";
  return `${source}${separator}_=${Date.now()}`;
}

const I18N = {
  cs: {
    ui: { title: "3D Tisková farma – Martin Pihrt" },
    states: {
      printing: "Tiskne se",
      idle: "Čeká",
      paused: "Pozastaveno",
      error: "Chyba!",
      offline: "Nedostupná"
    },
    farm: {
      printing: "Tiskne se",
      idle: "Nic se netiskne",
      nearest: "Nejbližší konec",
      printers: "tiskárny",
      data_old: "Data jsou stará",
      data_unknown: "Neznámé stáří dat",
      data_unavailable: "DATA NEDOSTUPNÁ",
      separator: " | "
    },
    labels: {
      remaining: "Zbývá",
      end: "Konec",
      nozzle: "Tryska",
      bed: "Podložka",
      temperature: "Teplota"
    },
    time: {
      year: ["rok", "roky", "let"],
      month: ["měsíc", "měsíce", "měsíců"],
      day: ["den", "dny", "dnů"],
      hour: ["hodina", "hodiny", "hodin"],
      minute: ["minuta", "minuty", "minut"],
      second: ["sekunda", "sekundy", "sekund"]
    },
    energy: {
      title: "Odběr farmy",
      power: "Příkon",
      voltage: "Napětí",
      consumption: "Spotřeba",
      unit_kw: "kW",
      unit_w: "W",
      unit_v: "V",
      unit_kwh: "kWh"
    },
    sensor: {
      temperature: "Teplota",
      humidity: "Vlhkost",
      measured_at: "Údaj z",
      unavailable: "Data ze Shelly nejsou k dispozici",
      temperature_unit: "°C",
      humidity_unit: "%"
    }
  },

  en: {
    ui: { title: "3D Print Farm – Martin Pihrt" },
    states: {
      printing: "Printing",
      idle: "Idle",
      paused: "Paused",
      error: "Error!",
      offline: "Offline"
    },
    farm: {
      printing: "Printing",
      idle: "No active prints",
      nearest: "Next finish",
      printers: "printers",
      data_old: "Data is old",
      data_unknown: "Unknown data age",
      data_unavailable: "DATA UNAVAILABLE",
      separator: " | "
    },
    labels: {
      remaining: "Remaining",
      end: "Ends",
      nozzle: "Nozzle",
      bed: "Bed",
      temperature: "Temperature"
    },
    time: {
      year: ["year", "years"],
      month: ["month", "months"],
      day: ["day", "days"],
      hour: ["hour", "hours"],
      minute: ["minute", "minutes"],
      second: ["second", "seconds"]
    },
    energy: {
      title: "Farm power",
      power: "Power",
      voltage: "Voltage",
      consumption: "Consumption",
      unit_kw: "kW",
      unit_w: "W",
      unit_v: "V",
      unit_kwh: "kWh"
    },
    sensor: {
      temperature: "Temperature",
      humidity: "Humidity",
      measured_at: "Reading from",
      unavailable: "Shelly data is unavailable",
      temperature_unit: "°C",
      humidity_unit: "%"
    }
  },

  de: {
    ui: { title: "3D Druckfarm – Martin Pihrt" },
    states: {
      printing: "Druckt",
      idle: "Bereit",
      paused: "Pausiert",
      error: "Fehler!",
      offline: "Offline"
    },
    farm: {
      printing: "Druck läuft",
      idle: "Kein Druck aktiv",
      nearest: "Nächstes Ende",
      printers: "Drucker",
      data_old: "Daten sind alt",
      data_unknown: "Unbekanntes Datenalter",
      data_unavailable: "DATEN NICHT VERFÜGBAR",
      separator: " | "
    },
    labels: {
      remaining: "Verbleibend",
      end: "Ende",
      nozzle: "Düse",
      bed: "Bett",
      temperature: "Temperatur"
    },
    time: {
      year: ["Jahr", "Jahre"],
      month: ["Monat", "Monate"],
      day: ["Tag", "Tage"],
      hour: ["Stunde", "Stunden"],
      minute: ["Minute", "Minuten"],
      second: ["Sekunde", "Sekunden"]
    },
    energy: {
      title: "Farmleistung",
      power: "Leistung",
      voltage: "Spannung",
      consumption: "Verbrauch",
      unit_kw: "kW",
      unit_w: "W",
      unit_v: "V",
      unit_kwh: "kWh"
    },
    sensor: {
      temperature: "Temperatur",
      humidity: "Luftfeuchtigkeit",
      measured_at: "Messung von",
      unavailable: "Shelly-Daten nicht verfügbar",
      temperature_unit: "°C",
      humidity_unit: "%"
    }
  }
};

function detectLanguage() {
  const urlLang = new URLSearchParams(window.location.search).get("lang");
  if (urlLang) {
    localStorage.setItem("lang", urlLang);
    return urlLang;
  }
  const stored = localStorage.getItem("lang");
  if (stored) return stored;

  const nav = navigator.language.toLowerCase();
  if (nav.startsWith("de")) return "de";
  if (nav.startsWith("en")) return "en";
  return "cs";
}

const LANG = detectLanguage();
const T = I18N[LANG] || I18N.cs;
const STATE_LABELS = T.states;

function locale() {
  if (LANG === "de") return "de-DE";
  if (LANG === "en") return "en-GB";
  return "cs-CZ";
}

function formatDateTime() {
  const d = new Date();
  return d.toLocaleDateString(locale()) + " " + d.toLocaleTimeString(locale());
}

document.getElementById("status-text").textContent = T.ui.title;
document.title = T.ui.title;

function updateDateTime() {
  document.getElementById("datetime").textContent = formatDateTime();
}

function getDataAgeSeconds(generatedAt) {
  if (typeof generatedAt !== "number") return null;
  return Math.floor(Date.now() / 1000 - generatedAt);
}

function formatTime(seconds) {
  if (!seconds || seconds <= 0) return "–";
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);

  let parts = [];
  if (days > 0) parts.push(`${days} d`);
  if (hours > 0) parts.push(`${hours} h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} min`);
  return parts.join(" ");
}

function formatEndClock(seconds) {
  if (typeof seconds !== "number" || seconds <= 0) return "–";
  const end = new Date(Date.now() + seconds * 1000);
  return end.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
}

function plural(n, forms) {
  if (forms.length === 3) {
    if (n === 1) return forms[0];
    if (n >= 2 && n <= 4) return forms[1];
    return forms[2];
  }
  return n === 1 ? forms[0] : forms[1];
}

function formatAge(seconds) {
  if (typeof seconds !== "number" || seconds < 0) return "–";

  const units = [
    { key: "year", value: 365 * 24 * 3600 },
    { key: "month", value: 30 * 24 * 3600 },
    { key: "day", value: 24 * 3600 },
    { key: "hour", value: 3600 },
    { key: "minute", value: 60 },
    { key: "second", value: 1 }
  ];

  let remaining = seconds;
  const parts = [];

  for (const u of units) {
    const amount = Math.floor(remaining / u.value);
    if (amount > 0) {
      const label = plural(amount, T.time[u.key]);
      parts.push(`${amount} ${label}`);
      remaining -= amount * u.value;
    }
  }

  return parts.length ? parts.join(" ") : `0 ${plural(0, T.time.second)}`;
}

function normalizeTimeLeft(value) {
  if (typeof value !== "number") return null;
  if (value > 100000) return Math.floor(value / 1000);
  return value;
}

function formatTemp(value) {
  if (typeof value !== "number") return "–";
  return `${Math.round(value)}°C`;
}

function getNearestFinishes(printers) {
  const printing = printers
    .map(p => ({
      name: p.name,
      timeLeft: normalizeTimeLeft(p.time_left),
      state: p.state
    }))
    .filter(p => p.state === "printing" && typeof p.timeLeft === "number" && p.timeLeft > 0);

  if (printing.length === 0) return null;

  const minTime = Math.min(...printing.map(p => p.timeLeft));
  const sameTime = printing.filter(p => Math.abs(p.timeLeft - minTime) <= 5);

  return {
    timeLeft: minTime,
    printers: sameTime.map(p => p.name)
  };
}

function updateStatusBar(printers) {
  const bar = document.getElementById("status-bar");
  bar.classList.remove("idle", "printing", "near-end", "error");

  const printing = printers.filter(p => p.state === "printing");
  if (printing.length === 0) {
    bar.classList.add("idle");
    return;
  }

  const nearEnd = printing.some(p => {
    const t = normalizeTimeLeft(p.time_left);
    return typeof t === "number" && t <= 600;
  });

  bar.classList.add(nearEnd ? "near-end" : "printing");
}

// =======================
// DOM CACHE
// =======================
const DOM = {
  grid: document.getElementById("grid"),
  powerCard: null,
  printerCards: new Map(), // key=name -> element
  sensorCards: new Map(), // key=device_id -> element
};

let lastPowerHistoryHash = null;
const lastSensorHistoryHashes = new Map();

// =======================
// POWER CARD CREATE/UPDATE
// =======================
function createPowerCard() {
  const card = document.createElement("div");
  card.className = "card power";

  card.innerHTML = `
    <h2 class="power-title"></h2>
    <div class="power-value"></div>

    <div class="metric power-power"></div>
    <div class="metric power-voltage"></div>
    <div class="metric power-consumption"></div>

    <div class="power-graph-wrap">
      <canvas class="power-graph telemetry-graph"></canvas>
      <div class="power-graph-tooltip telemetry-graph-tooltip"></div>
    </div>
  `;

  return card;
}

function updatePowerCard(power, powerHistory) {
  if (!power) return;

  if (!DOM.powerCard) {
    DOM.powerCard = createPowerCard();
    DOM.grid.appendChild(DOM.powerCard);
  }

  const card = DOM.powerCard;

  card.classList.remove("high", "critical");
  if (power.power_kw >= 3) card.classList.add("critical");
  else if (power.power_kw >= 1.5) card.classList.add("high");

  card.querySelector(".power-title").textContent = T.energy.title;
  card.querySelector(".power-value").textContent = `${power.power_kw} ${T.energy.unit_kw}`;

  card.querySelector(".power-power").innerHTML =
    `${T.energy.power}: <strong>${power.power_w} ${T.energy.unit_w}</strong>`;

  card.querySelector(".power-voltage").innerHTML =
    `${T.energy.voltage}: <strong>${power.voltage_v ?? "–"} ${T.energy.unit_v}</strong>`;

  card.querySelector(".power-consumption").innerHTML =
    `${T.energy.consumption}: <strong>${power.energy_kwh} ${T.energy.unit_kwh}</strong>`;

  // redraw graph only when history changed
  const samples = powerHistory?.samples || [];
  const hash = samples.length ? `${samples.length}:${samples[samples.length - 1].ts}:${samples[samples.length - 1].kw}` : "empty";

  if (hash !== lastPowerHistoryHash) {
    lastPowerHistoryHash = hash;
    const canvas = card.querySelector(".power-graph");
    renderTelemetryGraph(canvas, samples, [{ key: "kw", color: "#ffffff", unit: T.energy.unit_kw, digits: 2 }]);
  }
}

// =======================
// SHELLY CLOUD SENSOR CARDS
// =======================
function createSensorCard(sensor) {
  const card = document.createElement("div");
  card.className = "card sensor";
  card.dataset.sensorId = sensor.device_id;
  card.innerHTML = `
    <h2 class="sensor-name"></h2>
    <div class="sensor-temperature"></div>
    <div class="sensor-humidity"></div>
    <div class="sensor-measured-at"></div>
    <div class="power-graph-wrap sensor-graph-wrap">
      <canvas class="power-graph telemetry-graph sensor-graph"></canvas>
      <div class="power-graph-tooltip telemetry-graph-tooltip"></div>
    </div>
  `;
  return card;
}

function formatSensorTimestamp(value) {
  if (typeof value === "number") {
    return new Date(value * 1000).toLocaleString(locale());
  }
  if (typeof value !== "string" || !value.trim()) return "–";

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? value : new Date(parsed).toLocaleString(locale());
}

function updateSensorCard(card, sensor, sensorHistory) {
  const online = sensor.state === "online";
  card.className = `card sensor ${online ? "online" : "offline"}`;
  card.querySelector(".sensor-name").textContent = sensor.name || sensor.device_id;

  const temperature = card.querySelector(".sensor-temperature");
  const humidity = card.querySelector(".sensor-humidity");
  const measuredAt = card.querySelector(".sensor-measured-at");
  if (!online) {
    temperature.textContent = T.sensor.unavailable;
    humidity.textContent = "";
    measuredAt.textContent = sensor.measured_at
      ? `${T.sensor.measured_at}: ${formatSensorTimestamp(sensor.measured_at)}`
      : "";
  } else {
    temperature.textContent = `${T.sensor.temperature}: ${sensor.temperature_c ?? "–"} ${T.sensor.temperature_unit}`;
    humidity.textContent = `${T.sensor.humidity}: ${sensor.humidity_percent ?? "–"} ${T.sensor.humidity_unit}`;
    measuredAt.textContent = `${T.sensor.measured_at}: ${formatSensorTimestamp(sensor.measured_at)}`;
  }

  const samples = (sensorHistory?.samples || []).filter(sample => sample.device_id === sensor.device_id);
  const hash = samples.length ? `${samples.length}:${samples[samples.length - 1].ts}:${samples[samples.length - 1].temperature_c}:${samples[samples.length - 1].humidity_percent}` : "empty";
  if (lastSensorHistoryHashes.get(sensor.device_id) !== hash) {
    lastSensorHistoryHashes.set(sensor.device_id, hash);
    renderTelemetryGraph(card.querySelector(".sensor-graph"), samples, [
      { key: "temperature_c", color: "#f0ad4e", unit: T.sensor.temperature_unit, digits: 1 },
      { key: "humidity_percent", color: "#5bc0de", unit: T.sensor.humidity_unit, digits: 0 }
    ]);
  }
}

function updateSensors(sensors, sensorHistory) {
  const sorted = sensors.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  for (const sensor of sorted) {
    if (!sensor.device_id) continue;
    let card = DOM.sensorCards.get(sensor.device_id);
    if (!card) {
      card = createSensorCard(sensor);
      DOM.sensorCards.set(sensor.device_id, card);
      DOM.grid.appendChild(card);
    }
    updateSensorCard(card, sensor, sensorHistory);
  }

  const ids = new Set(sorted.map(sensor => sensor.device_id));
  for (const [id, card] of DOM.sensorCards.entries()) {
    if (!ids.has(id)) {
      card.remove();
      DOM.sensorCards.delete(id);
    }
  }
}

// =======================
// PRINTER CARD CREATE/UPDATE
// =======================
function createPrinterCard(p) {
  const card = document.createElement("div");
  card.className = `card ${p.state || "offline"}`;
  card.dataset.printerName = p.name;

  card.innerHTML = `
    <h2 class="p-name"></h2>
    <div class="model p-model"></div>
    <div class="state p-state"></div>
    <div class="temps p-temps" style="display:none"></div>

    <div class="progress">
      <div class="p-progress"></div>
    </div>

    <div class="time p-time"></div>
    <div class="eta p-eta"></div>
  `;

  return card;
}

function updatePrinterCard(card, p) {
  const timeLeft = normalizeTimeLeft(p.time_left);

  // state class
  card.className = `card ${p.state || "offline"}`;
  card.classList.remove("done", "near-end");

  if (p.progress === 100) {
    card.classList.add("done");
  } else if (p.state === "printing" && timeLeft !== null && timeLeft <= 600) {
    card.classList.add("near-end");
  }

  card.querySelector(".p-name").textContent = p.name;
  card.querySelector(".p-model").textContent = p.model || "";
  card.querySelector(".p-state").textContent = STATE_LABELS[p.state] || p.state;

  // temps
  const tempsEl = card.querySelector(".p-temps");
  if (p.temps) {
    tempsEl.style.display = "block";
    tempsEl.innerHTML =
      `${T.labels.nozzle}: ${formatTemp(p.temps.nozzle)} &nbsp;|&nbsp; ${T.labels.bed}: ${formatTemp(p.temps.bed)}`;
  } else {
    tempsEl.style.display = "none";
    tempsEl.textContent = "";
  }

  // progress
  const prog = p.progress || 0;
  card.querySelector(".p-progress").style.width = `${prog}%`;

  // time / eta
  card.querySelector(".p-time").textContent =
    `${p.state === "printing" && timeLeft <= 600 ? "⏰ " : ""}${T.labels.remaining}: ${formatTime(timeLeft)}`;

  card.querySelector(".p-eta").textContent =
    `${T.labels.end}: ${formatEndClock(timeLeft)}`;
}

function updatePrinters(printers) {
  const sorted = printers.slice().sort((a, b) => a.name.localeCompare(b.name));

  // create/update cards
  for (const p of sorted) {
    let card = DOM.printerCards.get(p.name);
    if (!card) {
      card = createPrinterCard(p);
      DOM.printerCards.set(p.name, card);
      DOM.grid.appendChild(card);
    }
    updatePrinterCard(card, p);
  }

  // remove old cards
  const names = new Set(sorted.map(p => p.name));
  for (const [name, card] of DOM.printerCards.entries()) {
    if (!names.has(name)) {
      card.remove();
      DOM.printerCards.delete(name);
    }
  }
}

// =======================
// STATUS BAR UPDATE
// =======================
function updateFarmStatus(printers, generatedAt) {
  const farmStatusEl = document.getElementById("farm-status");
  const bar = document.getElementById("status-bar");

  const nearest = getNearestFinishes(printers);

  if (!nearest) {
    farmStatusEl.textContent = T.farm.idle;
  } else {
    const time = formatEndClock(nearest.timeLeft);
    if (nearest.printers.length === 1) {
      farmStatusEl.textContent =
        `${T.farm.printing}${T.farm.separator}${T.farm.nearest}: ${time} (${nearest.printers[0]})`;
    } else {
      farmStatusEl.textContent =
        `${T.farm.printing}${T.farm.separator}${T.farm.nearest}: ${time} (${nearest.printers.length} ${T.farm.printers})`;
    }
  }

  // ===== DATA AGE =====
  bar.classList.remove("stale", "outdated");

  const age = getDataAgeSeconds(generatedAt);

  if (age === null) {
    bar.classList.add("outdated");
    farmStatusEl.textContent = `⚠️ ${T.farm.data_unknown}`;
  } else if (age > 60) {
    bar.classList.add("outdated");
    farmStatusEl.textContent = `❌ ${T.farm.data_old} ${formatAge(age)}`;
  } else if (age > 20) {
    bar.classList.add("stale");
    farmStatusEl.textContent += ` | ⚠️ ${formatAge(age)}`;
  }

  updateStatusBar(printers);
}

// =======================
// GRAPH (unchanged from your working version, only minimal responsive improvements)
// =======================
function renderTelemetryGraph(canvas, samples, series) {
  if (!canvas) return;

  const wrap = canvas.closest(".power-graph-wrap");
  const cssW = (wrap?.clientWidth || canvas.clientWidth || 320);
  const cssH = 90;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);

  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = cssW;
  const h = cssH;

  const points = samples.filter(s => typeof s.ts === "number");
  const validValues = series.flatMap(item => points.map(point => point[item.key]).filter(value => typeof value === "number"));
  if (points.length < 2 || validValues.length < 2) {
    ctx.clearRect(0, 0, cssW, cssH);
    return;
  }

  const padL = 42, padR = series.length > 1 ? 38 : 8, padT = 18, padB = 18;
  const gw = w - padL - padR;
  const gh = h - padT - padB;

  const minTs = Math.min(...points.map(p => p.ts));
  const maxTs = Math.max(...points.map(p => p.ts));

  const spanTs = Math.max(1, maxTs - minTs);

  const x = (ts) => padL + ((ts - minTs) / spanTs) * gw;
  const scales = new Map(series.map(item => {
    const values = points.map(point => point[item.key]).filter(value => typeof value === "number");
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (Math.abs(max - min) < (item.key === "kw" ? 0.2 : 1)) {
      min -= item.key === "kw" ? 0.1 : 0.5;
      max += item.key === "kw" ? 0.1 : 0.5;
    }
    const pad = (max - min) * 0.1;
    min -= pad;
    max += pad;
    if (item.key === "kw") min = Math.max(0, min);
    return [item.key, { min, max, span: Math.max(0.1, max - min) }];
  }));
  const y = (value, key) => {
    const scale = scales.get(key);
    return padT + (1 - ((value - scale.min) / scale.span)) * gh;
  };

  // base draw
  function drawBase() {
    ctx.clearRect(0, 0, w, h);

    // grid + axes
    ctx.save();
    ctx.font = "11px Arial";
    ctx.lineWidth = 1;

    const ticksY = 4;
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.fillStyle = "rgba(255,255,255,0.70)";

    for (let i = 0; i <= ticksY; i++) {
      const t = i / ticksY;
      const yy = padT + gh * t;
      ctx.beginPath();
      ctx.moveTo(padL, yy);
      ctx.lineTo(padL + gw, yy);
      ctx.stroke();
      for (const item of series) {
        const scale = scales.get(item.key);
        const value = scale.max - scale.span * t;
        ctx.fillStyle = item.color;
        const label = value.toFixed(item.digits);
        const labelX = item === series[0] ? 2 : padL + gw + 4;
        ctx.fillText(label, labelX, yy + 4);
      }
    }

    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    ctx.moveTo(padL, padT + gh);
    ctx.lineTo(padL + gw, padT + gh);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.70)";
    const fmt = (d) => d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
    ctx.fillText(fmt(new Date(minTs * 1000)), padL, h - 4);

    const rt = fmt(new Date(maxTs * 1000));
    ctx.fillText(rt, padL + gw - ctx.measureText(rt).width, h - 4);

    ctx.restore();

    // line
    ctx.save();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (const item of series) {
      ctx.strokeStyle = item.color;
      ctx.beginPath();
      let started = false;
      points.forEach(point => {
        const value = point[item.key];
        if (typeof value !== "number") return;
        const xx = x(point.ts);
        const yy = y(value, item.key);
        if (!started) { ctx.moveTo(xx, yy); started = true; }
        else ctx.lineTo(xx, yy);
      });
      ctx.stroke();

      const last = [...points].reverse().find(point => typeof point[item.key] === "number");
      if (last) {
        ctx.beginPath();
        ctx.arc(x(last.ts), y(last[item.key]), 3, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();
      }
    }
    if (series.length > 1) {
      let legendX = padL;
      ctx.font = "10px Arial";
      for (const item of series) {
        ctx.fillStyle = item.color;
        const label = item.key === "temperature_c" ? T.sensor.temperature : item.key === "humidity_percent" ? T.sensor.humidity : item.unit;
        ctx.fillText(`${label} (${item.unit})`, legendX, 11);
        legendX += ctx.measureText(`${label} (${item.unit})`).width + 14;
      }
    }

    ctx.restore();
  }

  drawBase();

  // tooltip + crosshair
  const tooltip = wrap?.querySelector(".telemetry-graph-tooltip");
  if (!wrap || !tooltip) return;

  function findNearestByX(mouseX) {
    const clampedX = Math.min(padL + gw, Math.max(padL, mouseX));
    let best = null;
    let bestDist = Infinity;

    for (const p of points) {
      const px = x(p.ts);
      const d = Math.abs(px - clampedX);
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
    }
    return best;
  }

  function drawOverlay(nearest) {
    drawBase();
    const nx = x(nearest.ts);
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(nx, padT);
    ctx.lineTo(nx, padT + gh);
    ctx.stroke();

    for (const item of series) {
      if (typeof nearest[item.key] !== "number") continue;
      ctx.beginPath();
      ctx.arc(nx, y(nearest[item.key], item.key), 4, 0, Math.PI * 2);
      ctx.fillStyle = item.color;
      ctx.fill();
    }

    ctx.restore();
  }

  // bind only once per canvas
  if (canvas._powerGraphBound) {
    // redraw base only (not bind again)
    return;
  }
  canvas._powerGraphBound = true;

  canvas.addEventListener("mousemove", (ev) => {
    const rect = canvas.getBoundingClientRect();
    const mx = ev.clientX - rect.left;

    const nearest = findNearestByX(mx);
    if (!nearest) return;

    drawOverlay(nearest);

    const d = new Date(nearest.ts * 1000);
    const time = d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });

    const values = series.map(item => typeof nearest[item.key] === "number"
      ? `<span style="color:${item.color}">${nearest[item.key].toFixed(item.digits)} ${item.unit}</span>`
      : null).filter(Boolean).join("<br>");
    tooltip.innerHTML = `${values}<br>${time}`;
    tooltip.style.display = "block";

    const tx = Math.min(rect.width - 90, Math.max(6, mx + 10));
    tooltip.style.left = `${tx}px`;
    tooltip.style.top = `6px`;
  });

  canvas.addEventListener("mouseleave", () => {
    tooltip.style.display = "none";
    drawBase();
  });
}

// =======================
// DATA LOAD
// =======================
async function loadHistory(source) {
  try {
    const r = await fetch(withoutCache(source), { cache: "no-store" });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function load() {
  try {
    const r = await fetch(withoutCache(DATA_SOURCE), { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);

    const data = await r.json();

    const [powerHistory, sensorHistory] = await Promise.all([
      loadHistory(POWER_HISTORY_SOURCE),
      loadHistory(SENSOR_HISTORY_SOURCE)
    ]);
    const effectivePowerHistory = powerHistory || data.power_history || null;
    const effectiveSensorHistory = sensorHistory || data.sensor_history || null;

    // update DOM without full rebuild
    updatePowerCard(data.power, effectivePowerHistory);
    updateSensors(data.sensors || [], effectiveSensorHistory);
    updatePrinters(data.printers || []);
    updateFarmStatus(data.printers || [], data.generated_at);

    updateDateTime();
  } catch (e) {
    console.error("DATA LOAD ERROR", e);

    const farmStatusEl = document.getElementById("farm-status");
    const bar = document.getElementById("status-bar");

    if (farmStatusEl) farmStatusEl.textContent = `❌ ${T.farm.data_unavailable}`;
    if (bar) bar.classList.add("outdated");
  }
}

load();
setInterval(load, REFRESH_MS);
setInterval(updateDateTime, 1000);
