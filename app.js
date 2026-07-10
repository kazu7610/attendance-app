const SUPABASE_URL = "https://fgmvmbjnoyagnpygcbky.supabase.co";
const SUPABASE_KEY = "sb_publishable_pePa2xjccUZB6xpneNhCRQ_pJJ5fn6h";

const rows = document.getElementById("rows");
const template = document.getElementById("dayTemplate");
const department = document.getElementById("department");
const employee = document.getElementById("employee");
const month = document.getElementById("month");
const summary = document.getElementById("summary");

let employees = [];
let holidays = {};

const times = [
  "",
  "休み",
  "8:00",
  "8:30",
  "9:00",
  "12:00",
  "13:00",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "20:00",
  "21:00"
];

const weeks = ["日", "月", "火", "水", "木", "金", "土"];

/* ==============================
   社員マスタ読込
============================== */
async function loadEmployees() {
  const url =
    `${SUPABASE_URL}/rest/v1/employees` +
    `?select=id,department,name,active` +
    `&order=department.asc,id.asc`;

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!res.ok) {
    throw new Error("社員マスタの読込に失敗しました");
  }

  employees = await res.json();

  employees = employees.filter(e => e.active !== false);

  makeDepartmentOptions();
}

/* ==============================
   休日カレンダー読込
============================== */
async function loadHolidays() {
  const url =
    `${SUPABASE_URL}/rest/v1/holidays` +
    `?select=date,day_type,note` +
    `&order=date.asc`;

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!res.ok) {
    throw new Error("休日カレンダーの読込に失敗しました");
  }

  const data = await res.json();

  holidays = {};

  data.forEach(item => {
    holidays[item.date] = item;
  });
}

/* ==============================
   部プルダウン作成
============================== */
function makeDepartmentOptions() {
  department.innerHTML =
    '<option value="">部を選択してください</option>';

  const departments = [
    ...new Set(
      employees
        .map(e => e.department)
        .filter(Boolean)
    )
  ];

  departments.forEach(dep => {
    const option = document.createElement("option");

    option.value = dep;
    option.textContent = dep;

    department.appendChild(option);
  });

  employee.innerHTML =
    '<option value="">先に部を選択してください</option>';

  employee.disabled = true;
}

/* ==============================
   氏名プルダウン作成
============================== */
function makeEmployeeOptions(selectedDepartment) {
  employee.innerHTML = "";

  if (!selectedDepartment) {
    employee.innerHTML =
      '<option value="">先に部を選択してください</option>';

    employee.disabled = true;
    return;
  }

  const filteredEmployees = employees.filter(
    e => e.department === selectedDepartment
  );

  employee.innerHTML =
    '<option value="">氏名を選択してください</option>';

  filteredEmployees.forEach(e => {
    const option = document.createElement("option");

    option.value = e.name;
    option.textContent = e.name;

    employee.appendChild(option);
  });

  employee.disabled = false;
}

/* ==============================
   現在月
============================== */
function currentMonth() {
  const d = new Date();

  const year = d.getFullYear();
  const monthValue = String(d.getMonth() + 1).padStart(2, "0");

  return `${year}-${monthValue}`;
}

/* ==============================
   月の日数
============================== */
function daysInMonth(ym) {
  const [year, monthValue] = ym.split("-").map(Number);

  return new Date(year, monthValue, 0).getDate();
}

/* ==============================
   曜日取得
============================== */
function dateInfo(ym, day) {
  const [year, monthValue] = ym.split("-").map(Number);

  const date = new Date(year, monthValue - 1, day);

  return {
    weekNo: date.getDay(),
    weekText: weeks[date.getDay()]
  };
}

/* ==============================
   時刻プルダウン作成
============================== */
function setTimeOptions(selectElement) {
  selectElement.innerHTML = "";

  times.forEach(time => {
    const option = document.createElement("option");

    option.value = time;
    option.textContent = time;

    selectElement.appendChild(option);
  });
}

/* ==============================
   ローカル保存用キー
============================== */
function storageKey() {
  return (
    `koujibu-attendance:` +
    `${department.value}:` +
    `${employee.value}:` +
    `${month.value}`
  );
}

/* ==============================
   日別入力欄作成
============================== */
function renderRows() {
  rows.innerHTML = "";

  const ym = month.value || currentMonth();
  const count = daysInMonth(ym);

  for (let day = 1; day <= count; day++) {
    const node = template.content.cloneNode(true);
    const row = node.querySelector(".day-row");
    const info = dateInfo(ym, day);

    const dateText =
      `${ym}-${String(day).padStart(2, "0")}`;

    const holiday = holidays[dateText];

    row.dataset.day = day;

    if (info.weekNo === 0) {
      row.classList.add("sunday");
    }

    if (
      holiday &&
      (
        holiday.day_type === "休日" ||
        holiday.day_type === "祝日"
      )
    ) {
      row.classList.add("company-holiday");
    }

    row.querySelector(".day").textContent = `${day}日`;
    row.querySelector(".week").textContent =
      `(${info.weekText})`;

    setTimeOptions(row.querySelector(".start"));
    setTimeOptions(row.querySelector(".end"));

    row.querySelectorAll("select,input").forEach(element => {
      element.addEventListener("change", updateSummary);
      element.addEventListener("input", updateSummary);
    });

    rows.appendChild(node);
  }

  loadLocal();
  updateSummary();
}

/* ==============================
   入力データ収集
============================== */
function collectData() {
  const data = [];

  document.querySelectorAll(".day-row").forEach(row => {
    data.push({
      day: row.dataset.day,
      site: row.querySelector(".site").value,
      miscName: row.querySelector(".miscName").value,
      start: row.querySelector(".start").value,
      end: row.querySelector(".end").value,
      note: row.querySelector(".note").value
    });
  });

  return data;
}

/* ==============================
   この端末へ保存
============================== */
function saveLocal() {
  if (!department.value) {
    alert("部を選択してください");
    return;
  }

  if (!employee.value) {
    alert("氏名を選択してください");
    return;
  }

  localStorage.setItem(
    storageKey(),
    JSON.stringify(collectData())
  );

  alert("この端末に保存しました");
}

/* ==============================
   この端末から読込
============================== */
function loadLocal() {
  if (!department.value || !employee.value) {
    return;
  }

  const raw = localStorage.getItem(storageKey());

  if (!raw) {
    return;
  }

  const data = JSON.parse(raw);

  document.querySelectorAll(".day-row").forEach(
    (row, index) => {
      const item = data[index];

      if (!item) {
        return;
      }

      row.querySelector(".site").value =
        item.site || "";

      row.querySelector(".miscName").value =
        item.miscName || "";

      row.querySelector(".start").value =
        item.start || "";

      row.querySelector(".end").value =
        item.end || "";

      row.querySelector(".note").value =
        item.note || "";
    }
  );
}

/* ==============================
   入力件数表示
============================== */
function updateSummary() {
  const count = collectData().filter(item =>
    item.site ||
    item.miscName ||
    item.start ||
    item.end ||
    item.note
  ).length;

  summary.textContent = `${count}件入力`;
}

/* ==============================
   CSV出力
============================== */
function exportCsv() {
  if (!department.value) {
    alert("部を選択してください");
    return;
  }

  if (!employee.value) {
    alert("氏名を選択してください");
    return;
  }

  const header = [
    "部",
    "氏名",
    "対象月",
    "日",
    "現場",
    "雑工事名",
    "開始",
    "終了",
    "備考"
  ];

  const lines = [header];

  collectData().forEach(item => {
    if (
      !item.site &&
      !item.miscName &&
      !item.start &&
      !item.end &&
      !item.note
    ) {
      return;
    }

    lines.push([
      department.value,
      employee.value,
      month.value,
      item.day,
      item.site,
      item.miscName,
      item.start,
      item.end,
      item.note
    ]);
  });

  const csv = lines
    .map(row =>
      row
        .map(value =>
          `"${String(value ?? "")
            .replaceAll('"', '""')}"`
        )
        .join(",")
    )
    .join("\n");

  const blob = new Blob(
    ["\ufeff" + csv],
    {
      type: "text/csv;charset=utf-8"
    }
  );

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download =
    `出勤簿_${department.value}_${employee.value}_${month.value}.csv`;

  link.click();

  URL.revokeObjectURL(url);
}

/* ==============================
   イベント設定
============================== */
month.value = currentMonth();

department.addEventListener("change", () => {
  makeEmployeeOptions(department.value);
  renderRows();
});

employee.addEventListener("change", renderRows);
month.addEventListener("change", renderRows);

document
  .getElementById("makeRows")
  .addEventListener("click", renderRows);

document
  .getElementById("saveLocal")
  .addEventListener("click", saveLocal);

document
  .getElementById("exportCsv")
  .addEventListener("click", exportCsv);

/* ==============================
   初期読込
============================== */
Promise.all([
  loadEmployees(),
  loadHolidays()
])
  .then(() => {
    renderRows();
  })
  .catch(error => {
    console.error(error);
    alert(error.message);
  });
