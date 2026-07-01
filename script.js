const tracker = document.getElementById("tracker");
const monthLabel = document.getElementById("monthLabel");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");

const MAX_MINUTES = 8 * 60;
let current = new Date();

let activeRow = null;
let activeBar = null;
let activeData = null;
let activeDay = null;
let activeStorage = null;
let activeMonthKey = null;
/* ---------- STORAGE HELPERS ---------- */

const STORAGE_KEY = "fullmoon.pocketplanner.studylog";

function loadData() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

  if (saved && typeof saved === "object" && saved.data) {
    return saved;
  }

  return {
    data: {},
    updatedAt: Date.now(),
  };
}

function saveData(storage) {
  storage.updatedAt = Date.now();

  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

  // Notify Pocket Planner dashboard that this planner changed
  window.parent?.postMessage(
    {
      type: "plannerChanged",
      planner: "studylog",
    },
    "*",
  );
}

/* ---------- DATE HELPERS ---------- */

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function currentMonthKey() {
  const y = current.getFullYear();
  const m = String(current.getMonth() + 1).padStart(2, "0");

  return `${y}-${m}`;
}

function updateBar(clientX) {
  if (!activeRow) return;

  const rect = activeRow.getBoundingClientRect();

  let percent = (clientX - rect.left) / rect.width;
  percent = Math.max(0, Math.min(1, percent));

  const minutes = Math.round(percent * MAX_MINUTES);

  activeData[activeDay] = minutes;

  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  activeBar.style.width = percent * 100 + "%";
  activeBar.textContent = minutes === 0 ? "" : `${hrs}h ${mins}m`;
}

function finishDrag() {
  if (!activeRow) return;

  activeStorage.data[activeMonthKey] = activeData;

  saveData(activeStorage);

  activeRow = null;
  activeBar = null;
  activeData = null;
  activeDay = null;
  activeStorage = null;
  activeMonthKey = null;
}

window.addEventListener("mouseup", finishDrag);
window.addEventListener("touchend", finishDrag);
/* ---------- RENDER ---------- */

function renderMonth() {
  tracker.innerHTML = "";

  const year = current.getFullYear();
  const month = current.getMonth();
  const days = daysInMonth(year, month);
  const storage = loadData();

  const monthKey = currentMonthKey();

  if (!storage.data[monthKey]) {
    storage.data[monthKey] = {};
  }

  if (!storage.data[monthKey]) {
    storage.data[monthKey] = {};
    saveData(storage);
  }

  const data = storage.data[monthKey];

  monthLabel.textContent =
    current.toLocaleString("default", { month: "long" }) + " " + year;

  const rowHeight = Math.floor((tracker.clientHeight - days * 6) / days);

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

    row.addEventListener("mousedown", (e) => {
      e.preventDefault();

      activeRow = row;
      activeBar = bar;
      activeData = data;
      activeDay = d;
      activeStorage = storage;
      activeMonthKey = monthKey;

      updateBar(e.clientX);
    });

    row.addEventListener("touchstart", (e) => {
      e.preventDefault();

      activeRow = row;
      activeBar = bar;
      activeData = data;
      activeDay = d;
      activeStorage = storage;
      activeMonthKey = monthKey;

      updateBar(e.touches[0].clientX);
    });

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

window.addEventListener("mousemove", (e) => {
  updateBar(e.clientX);
});

window.addEventListener(
  "touchmove",
  (e) => {
    if (!activeRow) return;

    e.preventDefault();
    updateBar(e.touches[0].clientX);
  },
  { passive: false },
);

/* ---------- INIT ---------- */
renderMonth();
