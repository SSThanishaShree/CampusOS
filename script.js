
"use strict";

const $ = id => document.getElementById(id);
// Each signed-in account gets its own browser storage namespace.
const ACCOUNT_KEY = window.CAMPUSOS_UID || "unavailable-user";
const STORAGE = {
  items: `campusos-items-v1-${ACCOUNT_KEY}`,
  tasks: `campusos-tasks-v1-${ACCOUNT_KEY}`,
  attendance: `campusos-attendance-v1-${ACCOUNT_KEY}`
};

function loadData(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    toast("Could not save data. Check your browser storage.");
    return false;
  }
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[char]);
}

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2800);
}

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function prettyDate(value) {
  if (!value) return "No date";
  const date = new Date(value + "T12:00:00");
  return Number.isNaN(date.getTime())
    ? "No date"
    : date.toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
      });
}

// ---------------- NAVIGATION ----------------

const pageNames = {
  dashboard: "Dashboard",
  notices: "Campus notices",
  lost: "Lost & found",
  attendance: "Attendance",
  assignments: "Assignments"
};

function showPage(name) {
  if (!pageNames[name]) return;

  document.querySelectorAll(".page").forEach(page => {
    page.classList.toggle("active", page.id === `page-${name}`);
  });

  document.querySelectorAll(".nav-link").forEach(button => {
    button.classList.toggle("active", button.dataset.page === name);
  });

  $("crumb").textContent = pageNames[name];
  document.querySelector(".sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (name === "dashboard") updateDashboard();
  if (name === "notices") renderNotices();
  if (name === "lost") renderItems();
  if (name === "assignments") renderTasks();
}

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

document.querySelectorAll("[data-go]").forEach(button => {
  button.addEventListener("click", () => showPage(button.dataset.go));
});

$("mobileMenu").addEventListener("click", () => {
  document.querySelector(".sidebar").classList.toggle("open");
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    document.querySelectorAll(".modal-backdrop").forEach(modal => {
      modal.hidden = true;
    });
    document.querySelector(".sidebar").classList.remove("open");
  }
});

$("todayDate").textContent = new Date().toLocaleDateString("en-IN", {
  weekday: "short", day: "numeric", month: "short", year: "numeric"
});

// ---------------- CAMPUS NOTICES ----------------

// These are curated official-resource links, not scraped announcements.
const notices = [
  {
    title: "Official college notifications",
    category: "Academics",
    description: "Visit the official notification page to check circulars, registrations and academic updates.",
    url: "https://bmsce.ac.in/home/Notifications",
    icon: "▤"
  },
  {
    title: "Examination notifications",
    category: "Examinations",
    description: "Check the official Controller of Examinations page for examination-related information.",
    url: "https://bmsce.ac.in/home/COE-Notifications",
    icon: "◷"
  },
  {
    title: "BMSCE news and events",
    category: "Events",
    description: "Explore the college website for published news, events and campus information.",
    url: "https://bmsce.ac.in/",
    icon: "✳"
  },
  {
    title: "Career and placement resources",
    category: "Placements",
    description: "Start from the official college website to locate career and placement information.",
    url: "https://bmsce.ac.in/",
    icon: "↗"
  },
  {
    title: "College website and contacts",
    category: "College information",
    description: "Use the official website to find institutional information and available contact details.",
    url: "https://bmsce.ac.in/",
    icon: "⌂"
  }
];

function renderNotices() {
  const query = $("noticeSearch").value.trim().toLowerCase();
  const category = $("noticeCategory").value;

  const results = notices.filter(notice => {
    const text = `${notice.title} ${notice.category} ${notice.description}`.toLowerCase();
    return text.includes(query) &&
      (category === "All" || notice.category === category);
  });

  $("noticeCount").textContent = `${results.length} RESOURCE${results.length === 1 ? "" : "S"}`;

  $("noticeGrid").innerHTML = results.length
    ? results.map(notice => `
      <article class="notice-card">
        <span class="notice-tag">${esc(notice.category)}</span>
        <h3>${esc(notice.icon)} &nbsp; ${esc(notice.title)}</h3>
        <p>${esc(notice.description)}</p>
        <a href="${esc(notice.url)}" target="_blank" rel="noopener noreferrer">
          Visit official source ↗
        </a>
      </article>
    `).join("")
    : `<div class="empty-state"><h3>No matching resources</h3><p>Try a different keyword or category.</p></div>`;
}

$("noticeSearch").addEventListener("input", renderNotices);
$("noticeCategory").addEventListener("change", renderNotices);

// ---------------- LOST & FOUND ----------------

const sampleItems = [
  {
    id: "sample1", name: "Wireless Earbuds Case",
    category: "Electronics", type: "Lost",
    location: "Central Library",
    description: "Small white charging case. Demo listing.",
    contact: "demo@example.com", date: "2026-10-25"
  },
  {
    id: "sample2", name: "Blue Student ID Card",
    category: "ID & Cards", type: "Found",
    location: "Main Entrance",
    description: "Example ID-card report. No real student details.",
    contact: "demo@example.com", date: "2026-10-25"
  },
  {
    id: "sample3", name: "Black Backpack",
    category: "Bags", type: "Lost",
    location: "Computer Lab",
    description: "Black backpack with notebooks. Demo listing.",
    contact: "demo@example.com", date: "2026-10-24"
  },
  {
    id: "sample4", name: "House Keys",
    category: "Keys", type: "Found",
    location: "Cafeteria",
    description: "Small set of keys. Example listing.",
    contact: "demo@example.com", date: "2026-10-24"
  },
  {
    id: "sample5", name: "Digital Electronics Notes",
    category: "Books", type: "Lost",
    location: "Block B",
    description: "Notebook with handwritten class notes. Demo listing.",
    contact: "demo@example.com", date: "2026-10-23"
  },
  {
    id: "sample6", name: "Scientific Calculator",
    category: "Electronics", type: "Found",
    location: "Classroom Corridor",
    description: "Scientific calculator. Example listing.",
    contact: "demo@example.com", date: "2026-10-23"
  }
];

const categoryIcons = {
  "Electronics": "🎧",
  "ID & Cards": "🪪",
  "Bags": "🎒",
  "Keys": "🔑",
  "Books": "📚",
  "Other": "📦"
};

let items = loadData(STORAGE.items, sampleItems);

if (!Array.isArray(items)) items = [...sampleItems];

let itemStatus = "All";

function renderItems() {
  const query = $("itemSearch").value.trim().toLowerCase();
  const category = $("itemCategory").value;

  const filtered = items.filter(item => {
    const text = `${item.name} ${item.category} ${item.location} ${item.description}`.toLowerCase();
    return text.includes(query) &&
      (category === "All" || item.category === category) &&
      (itemStatus === "All" || item.type === itemStatus);
  });

  $("itemResultCount").textContent = `${filtered.length} matching report${filtered.length === 1 ? "" : "s"}`;
  $("itemEmpty").hidden = filtered.length !== 0;
  $("itemGrid").hidden = filtered.length === 0;

  $("itemGrid").innerHTML = filtered.map((item, index) => `
    <article class="item-card">
      <div class="item-visual v${index % 5}">
        ${esc(categoryIcons[item.category] || "📦")}
        <span class="item-status ${item.type.toLowerCase()}">${esc(item.type.toUpperCase())}</span>
      </div>
      <div class="item-body">
        <div class="item-category">${esc(item.category)}</div>
        <h3>${esc(item.name)}</h3>
        <p>${esc(item.description || "No additional description.")}</p>
        <div class="item-location">⌖ ${esc(item.location)} · ${esc(prettyDate(item.date))}</div>
        <div class="item-actions">
          <button class="small-btn" data-item-action="contact" data-id="${esc(item.id)}">Contact</button>
          ${item.type !== "Returned"
            ? `<button class="small-btn done" data-item-action="returned" data-id="${esc(item.id)}">✓ Returned</button>`
            : `<span class="small-btn done">✓ Completed</span>`}
        </div>
      </div>
    </article>
  `).join("");

  updateDashboard();
}

$("itemSearch").addEventListener("input", renderItems);
$("itemCategory").addEventListener("change", renderItems);

$("itemTabs").addEventListener("click", event => {
  const button = event.target.closest("[data-status]");
  if (!button) return;

  itemStatus = button.dataset.status;

  document.querySelectorAll("#itemTabs .tab").forEach(tab => {
    tab.classList.toggle("active", tab === button);
  });

  renderItems();
});

function openModal(id) {
  $(id).hidden = false;
  const firstInput = $(id).querySelector("input:not([type=checkbox]), select");
  if (firstInput) setTimeout(() => firstInput.focus(), 50);
}

function closeModal(id) {
  $(id).hidden = true;
}

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => closeModal(button.dataset.close));
});

document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
  backdrop.addEventListener("click", event => {
    if (event.target === backdrop) closeModal(backdrop.id);
  });
});

$("openReport").addEventListener("click", () => openModal("reportModal"));

$("reportForm").addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);

  const item = {
    id: "item-" + Date.now(),
    type: String(data.get("type")),
    name: String(data.get("name")).trim(),
    category: String(data.get("category")),
    location: String(data.get("location")).trim(),
    description: String(data.get("description") || "").trim(),
    contact: String(data.get("contact")).trim(),
    date: todayISO()
  };

  if (!item.name || !item.location || !item.contact) {
    toast("Please complete the required fields.");
    return;
  }

  items.unshift(item);
  saveData(STORAGE.items, items);
  event.currentTarget.reset();
  closeModal("reportModal");
  $("itemSearch").value = "";
  $("itemCategory").value = "All";
  itemStatus = "All";

  document.querySelectorAll("#itemTabs .tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.status === "All");
  });

  renderItems();
  toast("Your report has been added!");
});

$("itemGrid").addEventListener("click", event => {
  const button = event.target.closest("[data-item-action]");
  if (!button) return;

  const item = items.find(entry => entry.id === button.dataset.id);
  if (!item) return;

  if (button.dataset.itemAction === "contact") {
    // The contact details are entered by the report author.
    toast(`Contact method: ${item.contact}`);
  }

  if (button.dataset.itemAction === "returned") {
    if (!confirm(`Mark "${item.name}" as returned?`)) return;
    item.type = "Returned";
    saveData(STORAGE.items, items);
    renderItems();
    toast("Item marked as returned.");
  }
});

// ---------------- ATTENDANCE CALCULATOR ----------------

const savedAttendance = loadData(STORAGE.attendance, {
  subject: "",
  attended: 18,
  total: 24,
  target: 85
});

$("attendanceSubject").value = savedAttendance.subject;
$("attended").value = savedAttendance.attended;
$("totalClasses").value = savedAttendance.total;
$("targetAttendance").value = savedAttendance.target;

function calculateAttendance() {
  const subject = $("attendanceSubject").value.trim();
  const attended = Number($("attended").value);
  const total = Number($("totalClasses").value);
  const target = Number($("targetAttendance").value);

  if (!subject || !Number.isInteger(attended) || !Number.isInteger(total) ||
      attended < 0 || total < 1 || attended > total ||
      !Number.isFinite(target) || target <= 0 || target > 100) {
    toast("Enter a valid subject, class count and target.");
    return;
  }

  const percent = attended / total * 100;
  const needed = Math.max(0, Math.ceil((target * total - 100 * attended) / (100 - target)));
  const canMiss = target === 100
    ? (percent === 100 ? "No" : "0")
    : Math.max(0, Math.floor((100 * attended / target) - total));

  $("attendancePercent").textContent = `${percent.toFixed(1)}%`;
  $("attendanceRing").style.background =
    `conic-gradient(var(--blue) ${Math.min(percent, 100) * 3.6}deg, #edf0f7 0deg)`;

  $("attendanceVerdict").textContent =
    percent >= target ? "Target reached!" : "Target not reached yet";

  $("attendanceMessage").textContent = percent >= target
    ? `Your ${subject} attendance is currently above your target. You may be able to miss up to ${canMiss} consecutive classes and remain at or above the target, based on this calculation.`
    : `Attend the next ${needed} consecutive classes without missing any to reach at least ${target}% (assuming no other classes are added or missed).`;

  $("resultAttended").textContent = attended;
  $("resultTotal").textContent = total;
  $("resultTarget").textContent = `${target}%`;

  saveData(STORAGE.attendance, { subject, attended, total, target });
  $("dashAttendance").textContent = `${percent.toFixed(1)}%`;
}

$("attendanceForm").addEventListener("submit", event => {
  event.preventDefault();
  calculateAttendance();
});

// ---------------- ASSIGNMENT MANAGER ----------------

let tasks = loadData(STORAGE.tasks, []);
if (!Array.isArray(tasks)) tasks = [];

$("openAssignment").addEventListener("click", () => {
  $("assignmentForm").elements.due.min = todayISO();
  openModal("assignmentModal");
});

$("emptyAddAssignment").addEventListener("click", () => {
  $("assignmentForm").elements.due.min = todayISO();
  openModal("assignmentModal");
});

$("assignmentForm").addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);

  const task = {
    id: "task-" + Date.now(),
    title: String(data.get("title")).trim(),
    subject: String(data.get("subject")).trim(),
    due: String(data.get("due")),
    priority: String(data.get("priority")),
    notes: String(data.get("notes") || "").trim(),
    completed: false
  };

  if (!task.title || !task.subject || !task.due) {
    toast("Complete all required assignment fields.");
    return;
  }

  tasks.unshift(task);
  saveData(STORAGE.tasks, tasks);
  event.currentTarget.reset();
  closeModal("assignmentModal");
  renderTasks();
  toast("Assignment added!");
});

$("taskFilter").addEventListener("change", renderTasks);

function renderTasks() {
  const filter = $("taskFilter").value;
  const filtered = tasks.filter(task =>
    filter === "All" ||
    (filter === "Completed" ? task.completed : !task.completed)
  );

  $("taskTotal").textContent = tasks.length;
  $("taskPending").textContent = tasks.filter(task => !task.completed).length;
  $("taskComplete").textContent = tasks.filter(task => task.completed).length;
  $("dashTasks").textContent = tasks.filter(task => !task.completed).length;

  $("taskEmpty").hidden = filtered.length > 0;

  $("taskList").innerHTML = filtered.map(task => {
    const overdue = !task.completed && task.due < todayISO();
    return `
      <div class="task-row">
        <input class="task-check" type="checkbox" data-task-toggle="${esc(task.id)}"
          ${task.completed ? "checked" : ""} aria-label="Mark ${esc(task.title)} completed">
        <div class="task-info ${task.completed ? "completed" : ""}">
          <b>${esc(task.title)}</b>
          <p>${esc(task.subject)}${task.notes ? " · " + esc(task.notes) : ""}</p>
        </div>
        <div class="task-meta">
          <span>${overdue ? "Overdue · " : "Due · "}${esc(prettyDate(task.due))}</span>
          <span class="priority ${task.priority === "High" ? "high" : ""}">${esc(task.priority)} priority</span>
        </div>
        <button class="delete-btn" data-task-delete="${esc(task.id)}" aria-label="Delete ${esc(task.title)}">×</button>
      </div>
    `;
  }).join("");

  updateDashboard();
}

$("taskList").addEventListener("change", event => {
  const id = event.target.dataset.taskToggle;
  if (!id) return;

  const task = tasks.find(entry => entry.id === id);
  if (!task) return;

  task.completed = event.target.checked;
  saveData(STORAGE.tasks, tasks);
  renderTasks();
  toast(task.completed ? "Assignment completed!" : "Assignment reopened.");
});

$("taskList").addEventListener("click", event => {
  const button = event.target.closest("[data-task-delete]");
  if (!button) return;

  const task = tasks.find(entry => entry.id === button.dataset.taskDelete);
  if (!task) return;

  if (!confirm(`Delete "${task.title}"?`)) return;

  tasks = tasks.filter(entry => entry.id !== task.id);
  saveData(STORAGE.tasks, tasks);
  renderTasks();
  toast("Assignment deleted.");
});

// ---------------- DASHBOARD ----------------

function updateDashboard() {
  $("dashNotices").textContent = notices.length;
  $("dashLost").textContent = items.length;

  const saved = loadData(STORAGE.attendance, null);
  if (saved && saved.total > 0 && saved.attended >= 0 && saved.attended <= saved.total) {
    $("dashAttendance").textContent =
      `${(saved.attended / saved.total * 100).toFixed(1)}%`;
  } else {
    $("dashAttendance").textContent = "—";
  }

  $("dashTasks").textContent = tasks.filter(task => !task.completed).length;
}

// ---------------- INITIALIZE ----------------

renderNotices();
renderItems();
renderTasks();

if (savedAttendance.subject) {
  calculateAttendance();
} else {
  updateDashboard();
}

