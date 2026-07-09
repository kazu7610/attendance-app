const SUPABASE_URL = "https://fgmvmbjnoyagnpygcbky.supabase.co";
const SUPABASE_KEY = "sb_publishable_pePa2xjccUZB6xpneNhCRQ_pJJ5fn6h";

const rows = document.getElementById("rows");
const template = document.getElementById("dayTemplate");
const employee = document.getElementById("employee");
const month = document.getElementById("month");
const summary = document.getElementById("summary");

let employees = [];

async function loadEmployees() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=id,department,name&order=department.asc,name.asc`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  employees = await res.json();

  employee.innerHTML = '<option value="">選択してください</option>';
  employees.forEach(e => {
    const opt = document.createElement("option");
    opt.value = e.name;
    opt.textContent = `${e.department}：${e.name}`;
    employee.appendChild(opt);
  });
}

const times = ["", "休み", "8:00", "8:30", "9:00", "12:00", "13:00", "17:00", "17:30", "18:00", "18:30", "19:00", "20:00", "21:00"];
const weeks = ["日", "月", "火", "水", "木", "金", "土"];

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function daysInMonth(ym) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

function dateInfo(ym, day) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  return { weekNo: d.getDay(), weekText: weeks[d.getDay()] };
}

function setTimeOptions(sel) {
  sel.innerHTML = "";
  times.forEach(t => {
    const o = document.createElement("option");
    o.value = t;
    o.textContent = t;
    sel.appendChild(o);
  });
}

function storageKey() {
  return `koujibu-attendance:${employee.value}:${month.value}`;
}

function renderRows() {
  rows.innerHTML = "";
  const ym = month.value || currentMonth();
  const count = daysInMonth(ym);

  for (let day = 1; day <= count; day++) {
    const node = template.content.cloneNode(true);
    const row = node.querySelector(".day-row");
    const info = dateInfo(ym, day);

    row.dataset.day = day;
    if (info.weekNo === 0) row.classList.add("sunday");
    if (info.weekNo === 6) row.classList.add("saturday");

    row.querySelector(".day").textContent = `${day}日`;
    row.querySelector(".week").textContent = `(${info.weekText})`;

    setTimeOptions(row.querySelector(".start"));
    setTimeOptions(row.querySelector(".end"));

    row.querySelectorAll("select,input").forEach(el => {
      el.addEventListener("change", updateSummary);
      el.addEventListener("input", updateSummary);
    });

    rows.appendChild(node);
  }

  loadLocal();
  updateSummary();
}

function collectData() {
  const data = [];
  document.querySelectorAll(".day-row").forEach(row => {
    data.push({
      day: row.dataset.day,
      start: row.querySelector(".start").value,
      end: row.querySelector(".end").value,
      note: row.querySelector(".note").value
    });
  });
  return data;
}

function saveLocal() {
  if (!employee.value) {
    alert("氏名を選択してください");
    return;
  }
  localStorage.setItem(storageKey(), JSON.stringify(collectData()));
  alert("この端末に保存しました");
}

function loadLocal() {
  if (!employee.value) return;
  const raw = localStorage.getItem(storageKey());
  if (!raw) return;

  const data = JSON.parse(raw);
  document.querySelectorAll(".day-row").forEach((row, index) => {
    const item = data[index];
    if (!item) return;
    row.querySelector(".start").value = item.start || "";
    row.querySelector(".end").value = item.end || "";
    row.querySelector(".note").value = item.note || "";
  });
}

function updateSummary() {
  const count = collectData().filter(d => d.start || d.end || d.note).length;
  summary.textContent = `${count}件入力`;
}

function exportCsv() {
  if (!employee.value) {
    alert("氏名を選択してください");
    return;
  }

  const header = ["氏名", "対象月", "日", "開始", "終了", "備考"];
  const lines = [header];

  collectData().forEach(d => {
    if (!d.start && !d.end && !d.note) return;
    lines.push([employee.value, month.value, d.day, d.start, d.end, d.note]);
  });

  const csv = lines.map(row =>
    row.map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")
  ).join("\n");

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `出勤簿_${employee.value}_${month.value}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

month.value = currentMonth();

document.getElementById("makeRows").addEventListener("click", renderRows);
document.getElementById("saveLocal").addEventListener("click", saveLocal);
document.getElementById("exportCsv").addEventListener("click", exportCsv);
employee.addEventListener("change", renderRows);
month.addEventListener("change", renderRows);

loadEmployees().then(renderRows);
