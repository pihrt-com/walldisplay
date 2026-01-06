// ===== DATA SOURCE CONFIG =====
// Raspberry Pi (FastAPI):
// const DATA_SOURCE = "/api/status";

// Web mirror (static JSON):
// const DATA_SOURCE = "/status.json";

// Auto-detect json path:
const DATA_SOURCE = location.hostname === "localhost"
  ? "/api/status"
  : "status.json";

const REFRESH_MS = 5000;

const I18N = {
  cs: {
    ui: {
      title: "3D Tisková farma – Martin Pihrt"
    },
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
      year:   ["rok", "roky", "let"],
      month:  ["měsíc", "měsíce", "měsíců"],
      day:    ["den", "dny", "dnů"],
      hour:   ["hodina", "hodiny", "hodin"],
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
    ui: {
      title: "3D Print Farm – Martin Pihrt"
    },   
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
      year:   ["year", "years"],
      month:  ["month", "months"],
      day:    ["day", "days"],
      hour:   ["hour", "hours"],
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
    ui: {
      title: "3D Druckfarm – Martin Pihrt"
    },    
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
      year:   ["Jahr", "Jahre"],
      month:  ["Monat", "Monate"],
      day:    ["Tag", "Tage"],
      hour:   ["Stunde", "Stunden"],
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
  // 1) manual override ?lang=en
  const urlLang = new URLSearchParams(window.location.search).get("lang");
  if (urlLang) {
    localStorage.setItem("lang", urlLang);
    return urlLang;
  }

  // 2) stored language
  const stored = localStorage.getItem("lang");
  if (stored) return stored;

  // 3) browser language
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith("de")) return "de";
  if (nav.startsWith("en")) return "en";

  // fallback
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
  return d.toLocaleDateString(locale()) + " " +
         d.toLocaleTimeString(locale());
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

  return end.toLocaleTimeString("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function plural(n, forms) {
  // Czech (3 forms)
  if (forms.length === 3) {
    if (n === 1) return forms[0];
    if (n >= 2 && n <= 4) return forms[1];
    return forms[2];
  }
  // EN / DE (2 forms)
  return n === 1 ? forms[0] : forms[1];
}

function formatAge(seconds) {
  if (typeof seconds !== "number" || seconds < 0) return "–";

  const units = [
    { key: "year",   value: 365 * 24 * 3600 },
    { key: "month",  value: 30  * 24 * 3600 },
    { key: "day",    value: 24  * 3600 },
    { key: "hour",   value: 3600 },
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

  // tolerance ±5 s
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

  if (nearEnd) {
    bar.classList.add("near-end");
  } else {
    bar.classList.add("printing");
  }
}

function renderPowerCard(grid, power) {
  if (!power) return;

  const card = document.createElement("div");
  card.classList.add("card", "power");

  if (power.power_kw >= 3) {
    card.classList.add("critical");
  } else if (power.power_kw >= 1.5) {
    card.classList.add("high");
  }

  card.innerHTML = `
    <h2>${T.energy.title}</h2>

    <div class="power-value">
      ${power.power_kw} ${T.energy.unit_kw}
    </div>

    <div class="metric">
      ${T.energy.power}:
      <strong>${power.power_w} ${T.energy.unit_w}</strong>
    </div>

    <div class="metric">
      ${T.energy.voltage}:
      <strong>${power.voltage_v ?? "–"} ${T.energy.unit_v}</strong>
    </div>

    <div class="metric">
      ${T.energy.consumption}:
      <strong>${power.energy_kwh} ${T.energy.unit_kwh}</strong>
    </div>
  `;

  grid.appendChild(card);
}

function render(printers, power, generatedAt) {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  renderPowerCard(grid, power);
  
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
  }
  else if (age > 60) {
    bar.classList.add("outdated");
    farmStatusEl.textContent = `❌ ${T.farm.data_old} ${formatAge(age)}`;

  }
  else if (age > 20) {
    bar.classList.add("stale");
    farmStatusEl.textContent += ` | ⚠️ ${formatAge(age)}`;
  }

  printers
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(p => {
      const timeLeft = normalizeTimeLeft(p.time_left);

      const card = document.createElement("div");
      card.className = `card ${p.state || "offline"}`;

      if (p.progress === 100) {
        card.classList.add("done");
      }
      else if (p.state === "printing" && timeLeft !== null && timeLeft <= 600) {
        card.classList.add("near-end");
      }

      const tempsHtml = p.temps
        ? `<div class="temps">
          ${T.labels.nozzle}: ${formatTemp(p.temps.nozzle)}
          &nbsp;|&nbsp;
          ${T.labels.bed}: ${formatTemp(p.temps.bed)}
           </div>`
        : "";

      card.innerHTML = `
        <h2>${p.name}</h2>
        <div class="model">${p.model || ""}</div>
        <div class="state">${STATE_LABELS[p.state] || p.state}</div>
        ${tempsHtml}
        <div class="progress">
          <div style="width:${p.progress || 0}%"></div>
        </div>
        <div class="time">
          ${p.state === "printing" && timeLeft <= 600 ? "⏰ " : ""}
          ${T.labels.remaining}: ${formatTime(timeLeft)}
        </div>

        <div class="eta">
          ${T.labels.end}: ${formatEndClock(timeLeft)}
        </div>
      `;

      grid.appendChild(card);
    });

  updateStatusBar(printers);
}

async function load() {
  try {
    const r = await fetch(DATA_SOURCE, { cache: "no-store" });

    if (!r.ok) {
      throw new Error(`HTTP ${r.status}`);
    }

    const data = await r.json();
    render(data.printers, data.power, data.generated_at);
    updateDateTime();

  } catch (e) {
    console.error("DATA LOAD ERROR", e);

    const farmStatusEl = document.getElementById("farm-status");
    const bar = document.getElementById("status-bar");

    if (farmStatusEl) {
      farmStatusEl.textContent = `❌ ${T.farm.data_unavailable}`;
    }
    if (bar) {
      bar.classList.add("outdated");
    }
  }
}

load();
setInterval(load, REFRESH_MS);
setInterval(updateDateTime, 1000);
