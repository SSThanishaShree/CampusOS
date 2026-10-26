
"use strict";

const $ = id => document.getElementById(id);
// Each signed-in account gets its own browser storage namespace.
const ACCOUNT_KEY = window.CAMPUSOS_UID || "unavailable-user";
const STORAGE = {
  items: `campusos-items-v1-${ACCOUNT_KEY}`,
  tasks: `campusos-tasks-v1-${ACCOUNT_KEY}`,
  timetable: `campusos-timetable-v1-${ACCOUNT_KEY}`
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
  timetable: "Timetable",
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
  if (name === "timetable") renderTimetable();
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

// ---------------- TIMETABLE MANAGER ----------------

const sampleClasses = [
  {
    id: "tt-sample-1",
    subject: "Data Structures & Algorithms",
    day: "Monday",
    startTime: "09:00",
    endTime: "10:00",
    location: "Mech Block - Room 302",
    faculty: "Dr. Ramesh Kumar",
    notes: "Lecture on Balanced Binary Trees"
  },
  {
    id: "tt-sample-2",
    subject: "Operating Systems",
    day: "Monday",
    startTime: "10:15",
    endTime: "11:15",
    location: "CS Block - Room 201",
    faculty: "Prof. Priya Nair",
    notes: "Process Synchronization and Semaphores"
  },
  {
    id: "tt-sample-3",
    subject: "Database Management Systems Lab",
    day: "Tuesday",
    startTime: "11:30",
    endTime: "13:30",
    location: "Lab Complex - Lab 3",
    faculty: "Dr. Anand K",
    notes: "Bring lab record and pen drive"
  },
  {
    id: "tt-sample-4",
    subject: "Computer Networks",
    day: "Wednesday",
    startTime: "09:00",
    endTime: "10:00",
    location: "Mech Block - Room 302",
    faculty: "Prof. Anita Rao",
    notes: "Subnetting and IP addressing"
  },
  {
    id: "tt-sample-5",
    subject: "Software Engineering",
    day: "Thursday",
    startTime: "14:00",
    endTime: "15:00",
    location: "CS Block - Room 105",
    faculty: "Dr. Sunitha M",
    notes: "Agile sprint planning review"
  },
  {
    id: "tt-sample-6",
    subject: "Design and Analysis of Algorithms",
    day: "Friday",
    startTime: "10:15",
    endTime: "11:15",
    location: "CS Block - Room 201",
    faculty: "Dr. Ramesh Kumar",
    notes: "Dynamic Programming practice"
  }
];

const subjectColorPalette = [
  { bg: "#eaf0ff", color: "#4559db", border: "#c6d3ff" },
  { bg: "#e5f8ee", color: "#14865f", border: "#b8ebd1" },
  { bg: "#fff0e5", color: "#c5763b", border: "#fbd3bb" },
  { bg: "#f0eaff", color: "#7a4dc9", border: "#dfcffc" },
  { bg: "#e6f5fa", color: "#1b839b", border: "#bfe5f0" },
  { bg: "#fcebf2", color: "#b33d74", border: "#f7c7dc" }
];

function getSubjectTheme(subject) {
  let hash = 0;
  const str = (subject || "").trim().toLowerCase();
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % subjectColorPalette.length;
  return subjectColorPalette[index];
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.split(":").map(Number);
  if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return timeStr;
  const [h, m] = parts;
  const ampm = h >= 12 ? "PM" : "AM";
  const hours = h % 12 || 12;
  const minutes = String(m).padStart(2, "0");
  return `${hours}:${minutes} ${ampm}`;
}

function getDurationText(startTime, endTime) {
  const [h1, m1] = startTime.split(":").map(Number);
  const [h2, m2] = endTime.split(":").map(Number);
  const totalMins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (totalMins <= 0) return "";
  if (totalMins < 60) return `${totalMins}m`;
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins ? `${hrs}h ${mins}m` : `${hrs}h`;
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

let timetable = loadData(STORAGE.timetable, sampleClasses);
if (!Array.isArray(timetable)) timetable = [...sampleClasses];

let timetableActiveDay = "All";

function openTimetableModal(editId = null) {
  const form = $("timetableForm");
  form.reset();

  if (editId) {
    const entry = timetable.find(item => item.id === editId);
    if (!entry) return;
    $("timetableModalTitle").textContent = "Edit class";
    $("ttSubmitButton").textContent = "Update class ↗";
    $("ttEntryId").value = entry.id;
    $("ttSubject").value = entry.subject;
    $("ttDay").value = entry.day;
    $("ttLocation").value = entry.location;
    $("ttStartTime").value = entry.startTime;
    $("ttEndTime").value = entry.endTime;
    $("ttFaculty").value = entry.faculty || "";
    $("ttNotes").value = entry.notes || "";
  } else {
    $("timetableModalTitle").textContent = "Add class";
    $("ttSubmitButton").textContent = "Save class ↗";
    $("ttEntryId").value = "";
    if (timetableActiveDay !== "All" && WEEKDAYS.includes(timetableActiveDay)) {
      $("ttDay").value = timetableActiveDay;
    } else {
      $("ttDay").value = "Monday";
    }
    $("ttStartTime").value = "09:00";
    $("ttEndTime").value = "10:00";
  }

  openModal("timetableModal");
}

$("openTimetable").addEventListener("click", () => openTimetableModal());
$("emptyAddTimetable").addEventListener("click", () => openTimetableModal());

$("timetableDayTabs").addEventListener("click", event => {
  const button = event.target.closest("[data-day]");
  if (!button) return;
  timetableActiveDay = button.dataset.day;

  document.querySelectorAll("#timetableDayTabs .tab").forEach(tab => {
    tab.classList.toggle("active", tab === button);
  });

  renderTimetable();
});

$("timetableForm").addEventListener("submit", event => {
  event.preventDefault();
  const form = event.currentTarget;
  const entryId = $("ttEntryId").value;
  const subject = $("ttSubject").value.trim();
  const day = $("ttDay").value;
  const location = $("ttLocation").value.trim();
  const startTime = $("ttStartTime").value;
  const endTime = $("ttEndTime").value;
  const faculty = $("ttFaculty").value.trim();
  const notes = $("ttNotes").value.trim();

  if (!subject || !day || !location || !startTime || !endTime) {
    toast("Please complete all required fields.");
    return;
  }

  if (startTime >= endTime) {
    toast("End time must be later than start time.");
    return;
  }

  const [h1, m1] = startTime.split(":").map(Number);
  const [h2, m2] = endTime.split(":").map(Number);
  const duration = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (duration < 15) {
    toast("Class duration must be at least 15 minutes.");
    return;
  }

  if (entryId) {
    const existing = timetable.find(item => item.id === entryId);
    if (existing) {
      existing.subject = subject;
      existing.day = day;
      existing.location = location;
      existing.startTime = startTime;
      existing.endTime = endTime;
      existing.faculty = faculty;
      existing.notes = notes;
      toast("Class updated successfully!");
    }
  } else {
    const newEntry = {
      id: "tt-" + Date.now(),
      subject,
      day,
      location,
      startTime,
      endTime,
      faculty,
      notes
    };
    timetable.push(newEntry);
    toast("Class added to timetable!");
  }

  saveData(STORAGE.timetable, timetable);
  closeModal("timetableModal");
  form.reset();
  renderTimetable();
});

$("timetableContent").addEventListener("click", event => {
  const editBtn = event.target.closest("[data-tt-edit]");
  if (editBtn) {
    openTimetableModal(editBtn.dataset.ttEdit);
    return;
  }

  const deleteBtn = event.target.closest("[data-tt-delete]");
  if (deleteBtn) {
    const id = deleteBtn.dataset.ttDelete;
    const entry = timetable.find(item => item.id === id);
    if (!entry) return;
    if (!confirm(`Delete "${entry.subject}" on ${entry.day}?`)) return;

    timetable = timetable.filter(item => item.id !== id);
    saveData(STORAGE.timetable, timetable);
    renderTimetable();
    toast("Class deleted from timetable.");
  }
});

function renderClassCard(entry) {
  const theme = getSubjectTheme(entry.subject);
  const duration = getDurationText(entry.startTime, entry.endTime);
  return `
    <article class="class-card" style="border-left: 4px solid ${theme.color};">
      <div class="class-time-col">
        <span class="class-time-start">${esc(formatTime(entry.startTime))}</span>
        <span class="class-time-end">${esc(formatTime(entry.endTime))}</span>
        ${duration ? `<span class="class-duration">${esc(duration)}</span>` : ""}
      </div>
      <div class="class-details">
        <div class="class-header">
          <span class="class-badge" style="background:${theme.bg}; color:${theme.color}; border:1px solid ${theme.border};">
            ${esc(entry.subject)}
          </span>
          <div class="class-actions">
            <button class="small-action-btn edit-btn" data-tt-edit="${esc(entry.id)}" title="Edit class" aria-label="Edit ${esc(entry.subject)}">✎ Edit</button>
            <button class="small-action-btn delete-icon-btn" data-tt-delete="${esc(entry.id)}" title="Delete class" aria-label="Delete ${esc(entry.subject)}">×</button>
          </div>
        </div>
        <div class="class-meta">
          <span class="class-meta-item">
            <i class="meta-icon">⌖</i> ${esc(entry.location)}
          </span>
          ${entry.faculty ? `
            <span class="class-meta-item">
              <i class="meta-icon">👤</i> ${esc(entry.faculty)}
            </span>
          ` : ""}
        </div>
        ${entry.notes ? `<p class="class-notes">${esc(entry.notes)}</p>` : ""}
      </div>
    </article>
  `;
}

function renderTimetable() {
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  // Update stat indicators
  $("ttTotalClasses").textContent = timetable.length;
  $("ttTodayClasses").textContent = timetable.filter(item => item.day === todayName).length;
  const uniqueSubjects = new Set(timetable.map(item => item.subject.trim().toLowerCase()));
  $("ttTotalSubjects").textContent = uniqueSubjects.size;

  if (timetable.length === 0) {
    $("timetableContent").innerHTML = "";
    $("timetableContent").hidden = true;
    $("timetableEmpty").hidden = false;
    updateDashboard();
    return;
  }

  $("timetableEmpty").hidden = true;
  $("timetableContent").hidden = false;

  const compareTime = (a, b) => a.startTime.localeCompare(b.startTime);

  if (timetableActiveDay === "All") {
    const daysHtml = WEEKDAYS.map(day => {
      const dayClasses = timetable.filter(item => item.day === day).sort(compareTime);
      const isToday = day === todayName;

      return `
        <section class="timetable-day-card ${isToday ? 'is-today' : ''}">
          <div class="day-card-header">
            <div class="day-header-title">
              <h3>${esc(day)}</h3>
              ${isToday ? `<span class="today-indicator">TODAY</span>` : ""}
            </div>
            <span class="day-count-badge">${dayClasses.length} ${dayClasses.length === 1 ? 'class' : 'classes'}</span>
          </div>
          <div class="day-classes-list">
            ${dayClasses.length > 0
              ? dayClasses.map(renderClassCard).join("")
              : `<div class="day-empty-note">No classes scheduled for ${esc(day)}.</div>`
            }
          </div>
        </section>
      `;
    }).join("");

    $("timetableContent").innerHTML = `<div class="timetable-grid">${daysHtml}</div>`;
  } else {
    const dayClasses = timetable.filter(item => item.day === timetableActiveDay).sort(compareTime);
    const isToday = timetableActiveDay === todayName;

    $("timetableContent").innerHTML = `
      <section class="timetable-day-card single-day-view ${isToday ? 'is-today' : ''}">
        <div class="day-card-header">
          <div class="day-header-title">
            <h3>${esc(timetableActiveDay)}</h3>
            ${isToday ? `<span class="today-indicator">TODAY</span>` : ""}
          </div>
          <span class="day-count-badge">${dayClasses.length} ${dayClasses.length === 1 ? 'class' : 'classes'}</span>
        </div>
        <div class="day-classes-list">
          ${dayClasses.length > 0
            ? dayClasses.map(renderClassCard).join("")
            : `
              <div class="empty-state day-empty-state">
                <h3>No classes on ${esc(timetableActiveDay)}</h3>
                <p>You have a free day, or you can schedule classes using the button below.</p>
                <button class="btn primary-btn" onclick="document.getElementById('openTimetable').click()">+ Add class for ${esc(timetableActiveDay)}</button>
              </div>
            `
          }
        </div>
      </section>
    `;
  }

  updateDashboard();
}

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

  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayClasses = timetable ? timetable.filter(item => item.day === todayName).length : 0;
  if ($("dashTimetable")) {
    $("dashTimetable").textContent = todayClasses;
  }

  $("dashTasks").textContent = tasks.filter(task => !task.completed).length;
}

// ---------------- INITIALIZE ----------------

renderNotices();
renderItems();
renderTimetable();
renderTasks();
updateDashboard();

