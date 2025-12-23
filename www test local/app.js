const test_data = [{"name":"XL-01","vendor":"Prusa","model":"XL 5H","state":"printing","job":null,"progress":60.0,"time_left":16320,"temps":{"nozzle":220.0,"bed":60.0}},{"name":"MK4-01","vendor":"Prusa","model":"MK4","state":"printing","job":null,"progress":87.0,"time_left":3660,"temps":{"nozzle":220.3,"bed":60.0}},{"name":"MK3-09","vendor":"Prusa","model":"MK3","state":"printing","job":null,"progress":88.0,"time_left":163},{"name":"MK3-03","vendor":"Prusa","model":"MK3","state":"idle","job":null,"progress":0,"time_left":null},{"name":"MK3-07","vendor":"Prusa","model":"MK3","state":"idle","job":null,"progress":0,"time_left":null},{"name":"MK3-13","vendor":"Prusa","model":"MK3","state":"error","job":null,"progress":0,"time_left":null},{"name":"MK3-12","vendor":"Prusa","model":"MK3","state":"idle","job":null,"progress":0,"time_left":null},{"name":"MK3-10","vendor":"Prusa","model":"MK3","state":"printing","job":null,"progress":60,"time_left": 850},{"name":"MK3-08","vendor":"Prusa","model":"MK3","state":"printing","job":null,"progress":98.0,"time_left":163},{"name":"MK3-11","vendor":"Prusa","model":"MK3","state":"idle","job":null,"progress":0,"time_left":null},{"name":"MK3-02","vendor":"Prusa","model":"MK3","state":"idle","job":null,"progress":0,"time_left":null},{"name":"MK3-06","vendor":"Prusa","model":"MK3","state":"idle","job":null,"progress":0,"time_left":null},{"name":"MK3-05","vendor":"Prusa","model":"MK3","state":"idle","job":null,"progress":0,"time_left":null},{"name":"MK3-01","vendor":"Prusa","model":"MK3","state":"idle","job":null,"progress":0,"time_left":null},{"name":"MK3-04","vendor":"Prusa","model":"MK3","state":"idle","job":null,"progress":0,"time_left":null}];

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
//    const r = await fetch(API_URL, { cache: "no-store" });
//    const data = await r.json();
//    render(data);
    render(test_data);
    updateDateTime();
  } catch (e) {
    console.error("API error", e);
  }
}

load();
setInterval(load, REFRESH_MS);
setInterval(updateDateTime, 1000);
