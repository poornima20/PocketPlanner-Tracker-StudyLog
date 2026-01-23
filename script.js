const tracker = document.getElementById("tracker");
const monthLabel = document.getElementById("monthLabel");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");

const MAX_MINUTES = 8 * 60;
let current = new Date();

/* ---------- STORAGE HELPERS ---------- */

function storageKey() {
  const y = current.getFullYear();
  const m = String(current.getMonth() + 1).padStart(2, "0");
  return `study-tracker-${y}-${m}`;
}

function loadData() {
  return JSON.parse(localStorage.getItem(storageKey()) || "{}");
}

function saveData(data) {
  localStorage.setItem(storageKey(), JSON.stringify(data));
}

/* ---------- DATE HELPERS ---------- */

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/* ---------- RENDER ---------- */

function renderMonth() {
  tracker.innerHTML = "";

  const year = current.getFullYear();
  const month = current.getMonth();
  const days = daysInMonth(year, month);
  const data = loadData();

  monthLabel.textContent =
    current.toLocaleString("default", { month: "long" }) + " " + year;

  const rowHeight = Math.floor(
    (tracker.clientHeight - days * 6) / days
  );

  for (let d = 1; d <= days; d++) {
    const day = document.createElement("div");
    day.className = "day";
    day.textContent = d;

    const row = document.createElement("div");
    row.className = "bar-row";
    row.style.height = rowHeight + "px";

    const bar = document.createElement("div");
    bar.className = "bar";

    const minutes = data[d] || 0;
    if (minutes > 0) {
      const percent = minutes / MAX_MINUTES;
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;
      bar.style.width = percent * 100 + "%";
      bar.textContent = `${hrs}h ${mins}m`;
    }

    row.appendChild(bar);

    let dragging = false;

    const updateBar = (x) => {
      const rect = row.getBoundingClientRect();
      let percent = (x - rect.left) / rect.width;
      percent = Math.max(0, Math.min(1, percent));

      const minutes = Math.round(percent * MAX_MINUTES);
      data[d] = minutes;

      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;

      bar.style.width = percent * 100 + "%";
      bar.textContent = minutes === 0 ? "" : `${hrs}h ${mins}m`;

      saveData(data);
    };

    row.addEventListener("mousedown", e => {
      dragging = true;
      updateBar(e.clientX);
    });

    window.addEventListener("mousemove", e => {
      if (dragging) updateBar(e.clientX);
    });

    window.addEventListener("mouseup", () => dragging = false);

    row.addEventListener("touchstart", e => {
      dragging = true;
      updateBar(e.touches[0].clientX);
    });

    window.addEventListener("touchmove", e => {
      if (dragging) updateBar(e.touches[0].clientX);
    });

    window.addEventListener("touchend", () => dragging = false);

    tracker.appendChild(day);
    tracker.appendChild(row);
  }
}

/* ---------- NAVIGATION ---------- */

prevBtn.onclick = () => {
  current.setMonth(current.getMonth() - 1);
  renderMonth();
};

nextBtn.onclick = () => {
  current.setMonth(current.getMonth() + 1);
  renderMonth();
};

window.addEventListener("resize", renderMonth);

/* ---------- INIT ---------- */
renderMonth();
