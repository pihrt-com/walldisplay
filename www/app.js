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

const REFRESH_MS = 5000;

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
};

let lastPowerHistoryHash = null;

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
      <canvas class="power-graph"></canvas>
      <div class="power-graph-tooltip"></div>
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
    renderPowerGraph(canvas, samples);
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
function renderPowerGraph(canvas, samples) {
  if (!canvas || !samples || samples.length < 2) return;

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

  const points = samples
    .filter(s => typeof s.ts === "number" && typeof s.kw === "number")
    .map(s => ({ ts: s.ts, kw: s.kw }));

  if (points.length < 2) return;

  const padL = 42, padR = 8, padT = 8, padB = 18;
  const gw = w - padL - padR;
  const gh = h - padT - padB;

  const minTs = Math.min(...points.map(p => p.ts));
  const maxTs = Math.max(...points.map(p => p.ts));

  let minKw = Math.min(...points.map(p => p.kw));
  let maxKw = Math.max(...points.map(p => p.kw));

  if (Math.abs(maxKw - minKw) < 0.2) {
    maxKw += 0.1;
    minKw -= 0.1;
  }

  const yPad = (maxKw - minKw) * 0.1;
  minKw = Math.max(0, minKw - yPad);
  maxKw = maxKw + yPad;

  const spanTs = Math.max(1, maxTs - minTs);
  const spanKw = Math.max(0.1, maxKw - minKw);

  const x = (ts) => padL + ((ts - minTs) / spanTs) * gw;
  const y = (kw) => padT + (1 - ((kw - minKw) / spanKw)) * gh;

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
      const value = (maxKw - spanKw * t);

      ctx.beginPath();
      ctx.moveTo(padL, yy);
      ctx.lineTo(padL + gw, yy);
      ctx.stroke();

      ctx.fillText(value.toFixed(1), 4, yy + 4);
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
    points.forEach((p, i) => {
      const xx = x(p.ts);
      const yy = y(p.kw);
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    });
    ctx.stroke();

    // last dot
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(x(last.ts), y(last.kw), 3, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.restore();
  }

  drawBase();

  // tooltip + crosshair
  const tooltip = wrap?.querySelector(".power-graph-tooltip");
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
    const ny = y(nearest.kw);

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(nx, padT);
    ctx.lineTo(nx, padT + gh);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(nx, ny, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

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

    tooltip.innerHTML = `<strong>${nearest.kw.toFixed(2)} kW</strong><br>${time}`;
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
async function loadPowerHistory() {
  try {
    const r = await fetch(POWER_HISTORY_SOURCE, { cache: "no-store" });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function load() {
  try {
    const r = await fetch(DATA_SOURCE, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);

    const data = await r.json();

    // power history - can be slow or missing
    const powerHistory = await loadPowerHistory();

    // update DOM without full rebuild
    updatePowerCard(data.power, powerHistory);
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
