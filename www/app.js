// ===== DATA SOURCE CONFIG =====
// Raspberry Pi (FastAPI):
// const DATA_SOURCE = "/api/status";

// Web mirror (static JSON):
// const DATA_SOURCE = "/walldisplay/status.json";

// Auto-detect json path:
const DATA_SOURCE = location.hostname === "localhost"
  ? "/api/status"
  : "/walldisplay/status.json";

const API_URL = "/api/status";
const REFRESH_MS = 5000;

const STATE_LABELS = {
  printing: "Tiskne se",
  idle: "Čeká",
  paused: "Pozastaveno",
  error: "Chyba!",
  offline: "Nedostupná"
};

function formatDateTime() {
  const d = new Date();
  return d.toLocaleDateString("cs-CZ") + " " +
         d.toLocaleTimeString("cs-CZ");
}

function updateDateTime() {
  document.getElementById("datetime").textContent = formatDateTime();
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

function evaluateFarmStatus(printers) {
  if (printers.some(p => p.state === "printing")) return "Tiskne se";
  return "Nic se netiskne";
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

function render(printers) {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  const farmStatusEl = document.getElementById("farm-status");

  const nearest = getNearestFinishes(printers);

  if (!nearest) {
    farmStatusEl.textContent = "Nic se netiskne";
  } else {
    const time = formatEndClock(nearest.timeLeft);

    if (nearest.printers.length === 1) {
      farmStatusEl.textContent =
        `Tiskne se | Nejbližší konec: ${time} (${nearest.printers[0]})`;
    } else {
      farmStatusEl.textContent =
        `Tiskne se | Nejbližší konec: ${time} (${nearest.printers.length} tiskárny)`;
    }
  }

  printers
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(p => {
    const timeLeft = normalizeTimeLeft(p.time_left);

    const card = document.createElement("div");
    card.className = `card ${p.state || "offline"}`;

    const tempsHtml = p.temps
      ? `<div class="temps">
           Tryska: ${formatTemp(p.temps.nozzle)}
           &nbsp;|&nbsp;
           Podložka: ${formatTemp(p.temps.bed)}
         </div>`
      : "";

    // finish 100%
    if (p.progress === 100) {
      card.classList.add("done");
    }

    // (≤ 10 minutes)
    else if (
      p.state === "printing" &&
      typeof timeLeft === "number" &&
      timeLeft <= 600
    ) {
      card.classList.add("near-end");
    }
    card.innerHTML = `
      <h2>${p.name}</h2>
      <div class="model">${p.model || ""}</div>

      <div class="state">
        ${STATE_LABELS[p.state] || p.state}
      </div>

      ${tempsHtml}

      <div class="progress">
        <div style="width:${p.progress || 0}%"></div>
      </div>

      <div class="time">
        ${p.state === "printing" && typeof timeLeft === "number" && timeLeft <= 600
          ? "⏰ "
          : ""}
        Zbývá: ${formatTime(timeLeft)}
      </div>

      <div class="eta">
        Konec: ${formatEndClock(timeLeft)}
      </div>
    `;
    //console.log(p.name, p.state, timeLeft, card.className);
    grid.appendChild(card);
  });
  updateStatusBar(printers);  
}

async function load() {
  try {
    const r = await fetch(DATA_SOURCE, {
      cache: "no-store"
    });

    if (!r.ok) {
      throw new Error(`HTTP ${r.status}`);
    }

    const data = await r.json();
    render(data);
    updateDateTime();

  } catch (e) {
    console.error("DATA LOAD ERROR", e);

    const farmStatusEl = document.getElementById("farm-status");
    if (farmStatusEl) {
      farmStatusEl.textContent = "DATA NEDOSTUPNÁ";
    }
  }
}

load();
setInterval(load, REFRESH_MS);
setInterval(updateDateTime, 1000);
