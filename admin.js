/* =========================================
   Supabase接続設定
========================================= */

const SUPABASE_URL =
  "https://fgmvmbjnoyagnpygcbky.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_pePa2xjccUZB6xpneNhCRQ_pJJ5fn6h";


/* =========================================
   HTML要素
========================================= */

const month =
  document.getElementById("month");

const attendanceList =
  document.getElementById("attendanceList");

const submissionSummary =
  document.getElementById("submissionSummary");

const statusSection =
  document.getElementById("statusSection");

const detailSection =
  document.getElementById("detailSection");

const detailEmployeeName =
  document.getElementById("detailEmployeeName");

const detailStatus =
  document.getElementById("detailStatus");

const attendanceDetail =
  document.getElementById("attendanceDetail");


/* =========================================
   読込データ
========================================= */

let employees = [];
let sites = [];
let monthlyAttendance = [];


/* =========================================
   Supabase共通ヘッダー
========================================= */

function supabaseHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`
  };
}


/* =========================================
   現在月
========================================= */

function currentMonth() {
  const date = new Date();

  return (
    `${date.getFullYear()}-` +
    `${String(date.getMonth() + 1).padStart(2, "0")}`
  );
}


/* =========================================
   翌月1日
========================================= */

function nextMonthFirstDay(yearMonth) {
  const [year, monthValue] =
    yearMonth
      .split("-")
      .map(Number);

  const nextDate =
    new Date(
      year,
      monthValue,
      1
    );

  return (
    `${nextDate.getFullYear()}-` +
    `${String(nextDate.getMonth() + 1).padStart(2, "0")}-01`
  );
}


/* =========================================
   日付表示
========================================= */

function formatDate(dateText) {
  const date =
    new Date(`${dateText}T00:00:00`);

  const weeks = [
    "日",
    "月",
    "火",
    "水",
    "木",
    "金",
    "土"
  ];

  return (
    `${date.getMonth() + 1}月` +
    `${date.getDate()}日` +
    `（${weeks[date.getDay()]}）`
  );
}


/* =========================================
   社員一覧読込
========================================= */

async function loadEmployees() {
  const url =
    `${SUPABASE_URL}/rest/v1/employees` +
    `?select=id,name,department,active` +
    `&active=eq.true` +
    `&order=department.asc,id.asc`;

  const response =
    await fetch(url, {
      headers: supabaseHeaders()
    });

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(errorText);

    throw new Error(
      "社員一覧の読込に失敗しました"
    );
  }

  employees =
    await response.json();
}


/* =========================================
   現場マスタ読込
========================================= */

async function loadSites() {
  const url =
    `${SUPABASE_URL}/rest/v1/sites` +
    `?select=id,display_name,input_code`;

  const response =
    await fetch(url, {
      headers: supabaseHeaders()
    });

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(errorText);

    throw new Error(
      "現場マスタの読込に失敗しました"
    );
  }

  sites =
    await response.json();
}


/* =========================================
   対象月の出勤簿読込
========================================= */

async function loadMonthlyAttendance() {
  const firstDay =
    `${month.value}-01`;

  const nextFirstDay =
    nextMonthFirstDay(month.value);

  const url =
    `${SUPABASE_URL}/rest/v1/attendance` +
    `?select=*` +
    `&work_date=gte.${firstDay}` +
    `&work_date=lt.${nextFirstDay}` +
    `&order=employee_id.asc,work_date.asc`;

  const response =
    await fetch(url, {
      headers: supabaseHeaders()
    });

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(errorText);

    throw new Error(
      "出勤簿の読込に失敗しました"
    );
  }

  monthlyAttendance =
    await response.json();
}


/* =========================================
   社員の月間データ取得
========================================= */

function getEmployeeAttendance(employeeId) {
  return monthlyAttendance.filter(
    item =>
      Number(item.employee_id) ===
      Number(employeeId)
  );
}


/* =========================================
   社員の提出状態取得
========================================= */

function getEmployeeStatus(employeeId) {
  const employeeAttendance =
    getEmployeeAttendance(employeeId);

  if (employeeAttendance.length === 0) {
    return "not_saved";
  }

  const hasLocked =
    employeeAttendance.some(
      item => item.status === "locked"
    );

  if (hasLocked) {
    return "locked";
  }

  const hasSubmitted =
    employeeAttendance.some(
      item => item.status === "submitted"
    );

  if (hasSubmitted) {
    return "submitted";
  }

  return "draft";
}


/* =========================================
   状態表示
========================================= */

function statusInfo(status) {
  if (status === "locked") {
    return {
      icon: "🔒",
      text: "締切済",
      className: "status-locked"
    };
  }

  if (status === "submitted") {
    return {
      icon: "🟢",
      text: "提出済",
      className: "status-submitted"
    };
  }

  if (status === "draft") {
    return {
      icon: "🟡",
      text: "一時保存",
      className: "status-draft"
    };
  }

  return {
    icon: "⚪",
    text: "未保存",
    className: "status-not-saved"
  };
}


/* =========================================
   提出状況一覧表示
========================================= */

function renderAttendanceStatus() {
  attendanceList.innerHTML = "";

  let currentDepartment = "";

  let submittedCount = 0;

  employees.forEach(employee => {
    const status =
      getEmployeeStatus(employee.id);

    const info =
      statusInfo(status);

    if (
      status === "submitted" ||
      status === "locked"
    ) {
      submittedCount++;
    }

    if (
      employee.department !==
      currentDepartment
    ) {
      currentDepartment =
        employee.department;

      const departmentTitle =
        document.createElement("h3");

      departmentTitle.className =
        "admin-department-title";

      departmentTitle.textContent =
        currentDepartment;

      attendanceList.appendChild(
        departmentTitle
      );
    }

    const button =
      document.createElement("button");

    button.type = "button";

    button.className =
      `employee-row employee-status-button ${info.className}`;

    button.innerHTML = `
      <span class="employee-status-icon">
        ${info.icon}
      </span>

      <span class="employee-status-name">
        ${employee.name}
      </span>

      <span class="employee-status-text">
        ${info.text}
      </span>
    `;

    button.addEventListener(
      "click",
      () => {
        showEmployeeDetail(employee);
      }
    );

    attendanceList.appendChild(button);
  });

  submissionSummary.textContent =
    `${submittedCount} / ${employees.length}人`;
}


/* =========================================
   現場名取得
========================================= */

function getSiteName(siteId) {
  if (!siteId) {
    return "";
  }

  const site =
    sites.find(
      item =>
        Number(item.id) ===
        Number(siteId)
    );

  if (!site) {
    return "";
  }

  return site.display_name || "";
}


/* =========================================
   表示用現場名作成
========================================= */

function makeDisplaySiteName(item) {
  if (item.site_type === "一般") {
    return (
      getSiteName(item.site_id) ||
      "一般現場未選択"
    );
  }

  if (item.site_type === "雑工事") {
    const parts = [];

    if (item.misc_company) {
      parts.push(item.misc_company);
    }

    if (item.misc_department) {
      parts.push(item.misc_department);
    }

    if (item.misc_name) {
      parts.push(item.misc_name);
    }

    return (
      parts.join("／") ||
      "雑工事詳細未入力"
    );
  }

  return "";
}


/* =========================================
   入力のある日か判定
========================================= */

function hasAttendanceInput(item) {
  return Boolean(
    item.site_type ||
    item.site_id ||
    item.misc_company ||
    item.misc_department ||
    item.misc_name ||
    item.start_time ||
    item.end_time ||
    item.note
  );
}


/* =========================================
   社員詳細表示
========================================= */

function showEmployeeDetail(employee) {
  const employeeAttendance =
    getEmployeeAttendance(employee.id);

  const status =
    getEmployeeStatus(employee.id);

  const info =
    statusInfo(status);

  detailEmployeeName.textContent =
    `${employee.name}　${month.value}`;

  detailStatus.textContent =
    `${info.icon} ${info.text}`;

  detailStatus.className =
    `admin-detail-status ${info.className}`;

  attendanceDetail.innerHTML = "";

  const inputDays =
    employeeAttendance.filter(
      hasAttendanceInput
    );

  if (inputDays.length === 0) {
    attendanceDetail.innerHTML =
      '<p class="empty-message">入力データはありません。</p>';

    detailSection.classList.remove("hidden");

    detailSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

    return;
  }

  inputDays.forEach(item => {
    const siteName =
      makeDisplaySiteName(item);

    const timeText =
      item.start_time || item.end_time
        ? `${item.start_time || "未入力"} ～ ${item.end_time || "未入力"}`
        : "時刻未入力";

    const card =
      document.createElement("div");

    card.className =
      "attendance-detail-row";

    card.innerHTML = `
      <div class="attendance-detail-date">
        ${formatDate(item.work_date)}
      </div>

      <div class="attendance-detail-content">

        <div>
          <strong>現場：</strong>
          ${siteName || "未入力"}
        </div>

        <div>
          <strong>時間：</strong>
          ${timeText}
        </div>

        ${
          item.note
            ? `
              <div>
                <strong>備考：</strong>
                ${item.note}
              </div>
            `
            : ""
        }

      </div>
    `;

    attendanceDetail.appendChild(card);
  });

  detailSection.classList.remove("hidden");

  detailSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


/* =========================================
   詳細を閉じる
========================================= */

function closeEmployeeDetail() {
  detailSection.classList.add("hidden");
  attendanceDetail.innerHTML = "";

  statusSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


/* =========================================
   管理画面全体読込
========================================= */

async function loadAdminScreen() {
  attendanceList.innerHTML =
    "読込中...";

  submissionSummary.textContent =
    "読込中...";

  detailSection.classList.add("hidden");

  try {
    await Promise.all([
      loadEmployees(),
      loadSites(),
      loadMonthlyAttendance()
    ]);

    renderAttendanceStatus();

  } catch (error) {
    console.error(error);

    attendanceList.innerHTML =
      `<p class="error-message">${error.message}</p>`;

    submissionSummary.textContent =
      "読込失敗";
  }
}


/* =========================================
   イベント設定
========================================= */

month.value =
  currentMonth();


document
  .getElementById("reload")
  .addEventListener(
    "click",
    loadAdminScreen
  );


month.addEventListener(
  "change",
  loadAdminScreen
);


document
  .getElementById("closeDetail")
  .addEventListener(
    "click",
    closeEmployeeDetail
  );


/* =========================================
   初期読込
========================================= */

loadAdminScreen();
