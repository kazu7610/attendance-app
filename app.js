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

const rows =
  document.getElementById("rows");

const template =
  document.getElementById("dayTemplate");

const department =
  document.getElementById("department");

const employee =
  document.getElementById("employee");

const month =
  document.getElementById("month");

const summary =
  document.getElementById("summary");

const saveButton =
  document.getElementById("saveAttendance");

const submitButton =
  document.getElementById("submitAttendance");


/* =========================================
   読み込んだデータ
========================================= */

let employees = [];
let sites = [];
let holidays = {};

/*
  現在表示している出勤簿の状態

  draft     = 一時保存・編集可能
  submitted = 提出済・編集不可
  locked    = 締切済・完全編集不可
*/

let currentStatus = "draft";


/* =========================================
   時刻・曜日
========================================= */

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

const weeks = [
  "日",
  "月",
  "火",
  "水",
  "木",
  "金",
  "土"
];


/* =========================================
   Supabase共通ヘッダー
========================================= */

function supabaseHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json"
  };
}


/* =========================================
   社員マスタ読込
========================================= */

async function loadEmployees() {
  const url =
    `${SUPABASE_URL}/rest/v1/employees` +
    `?select=id,department,name,active` +
    `&order=department.asc,id.asc`;

  const response = await fetch(url, {
    headers: supabaseHeaders()
  });

  if (!response.ok) {
    throw new Error(
      "社員マスタの読込に失敗しました"
    );
  }

  employees = await response.json();

  employees = employees.filter(
    item => item.active !== false
  );

  makeDepartmentOptions();
}


/* =========================================
   現場マスタ読込
========================================= */

async function loadSites() {
  const url =
    `${SUPABASE_URL}/rest/v1/sites` +
    `?select=` +
    `id,display_order,display_name,input_code,` +
    `construction_no,client_code,client_name,` +
    `official_name,visible,site_type` +
    `&visible=eq.true` +
    `&order=display_order.asc`;

  const response = await fetch(url, {
    headers: supabaseHeaders()
  });

  if (!response.ok) {
    throw new Error(
      "現場マスタの読込に失敗しました"
    );
  }

  sites = await response.json();
}


/* =========================================
   休日カレンダー読込
========================================= */

async function loadHolidays() {
  const url =
    `${SUPABASE_URL}/rest/v1/holidays` +
    `?select=date,day_type,note` +
    `&order=date.asc`;

  const response = await fetch(url, {
    headers: supabaseHeaders()
  });

  if (!response.ok) {
    throw new Error(
      "休日カレンダーの読込に失敗しました"
    );
  }

  const data = await response.json();

  holidays = {};

  data.forEach(item => {
    holidays[item.date] = item;
  });
}


/* =========================================
   部プルダウン作成
========================================= */

function makeDepartmentOptions() {
  department.innerHTML =
    '<option value="">' +
    '部を選択してください' +
    '</option>';

  const departments = [
    ...new Set(
      employees
        .map(item => item.department)
        .filter(Boolean)
    )
  ];

  departments.forEach(departmentName => {
    const option =
      document.createElement("option");

    option.value = departmentName;
    option.textContent = departmentName;

    department.appendChild(option);
  });

  employee.innerHTML =
    '<option value="">' +
    '先に部を選択してください' +
    '</option>';

  employee.disabled = true;
}


/* =========================================
   氏名プルダウン作成
========================================= */

function makeEmployeeOptions(
  selectedDepartment
) {
  employee.innerHTML = "";

  if (!selectedDepartment) {
    employee.innerHTML =
      '<option value="">' +
      '先に部を選択してください' +
      '</option>';

    employee.disabled = true;

    return;
  }

  const filteredEmployees =
    employees.filter(
      item =>
        item.department ===
        selectedDepartment
    );

  employee.innerHTML =
    '<option value="">' +
    '氏名を選択してください' +
    '</option>';

  filteredEmployees.forEach(item => {
    const option =
      document.createElement("option");

    option.value =
      String(item.id);

    option.textContent =
      item.name;

    option.dataset.name =
      item.name;

    employee.appendChild(option);
  });

  employee.disabled = false;
}


/* =========================================
   選択中の社員名
========================================= */

function selectedEmployeeName() {
  const selectedOption =
    employee.options[
      employee.selectedIndex
    ];

  if (
    !selectedOption ||
    !employee.value
  ) {
    return "";
  }

  return (
    selectedOption.dataset.name ||
    selectedOption.textContent ||
    ""
  );
}


/* =========================================
   現在月
========================================= */

function currentMonth() {
  const date = new Date();

  const year =
    date.getFullYear();

  const monthValue =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  return `${year}-${monthValue}`;
}


/* =========================================
   月の日数
========================================= */

function daysInMonth(yearMonth) {
  const [
    year,
    monthValue
  ] =
    yearMonth
      .split("-")
      .map(Number);

  return new Date(
    year,
    monthValue,
    0
  ).getDate();
}


/* =========================================
   翌月1日
========================================= */

function nextMonthFirstDay(yearMonth) {
  const [
    year,
    monthValue
  ] =
    yearMonth
      .split("-")
      .map(Number);

  const nextDate =
    new Date(
      year,
      monthValue,
      1
    );

  const nextYear =
    nextDate.getFullYear();

  const nextMonth =
    String(
      nextDate.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  return `${nextYear}-${nextMonth}-01`;
}


/* =========================================
   曜日情報
========================================= */

function dateInfo(
  yearMonth,
  day
) {
  const [
    year,
    monthValue
  ] =
    yearMonth
      .split("-")
      .map(Number);

  const date =
    new Date(
      year,
      monthValue - 1,
      day
    );

  return {
    weekNo: date.getDay(),
    weekText:
      weeks[date.getDay()]
  };
}


/* =========================================
   時刻プルダウン作成
========================================= */

function setTimeOptions(
  selectElement
) {
  selectElement.innerHTML = "";

  times.forEach(time => {
    const option =
      document.createElement("option");

    option.value = time;
    option.textContent = time;

    selectElement.appendChild(option);
  });
}


/* =========================================
   一般現場プルダウン作成
========================================= */

function setGeneralSiteOptions(
  selectElement
) {
  selectElement.innerHTML =
    '<option value="">' +
    '現場を選択してください' +
    '</option>';

  const generalSites =
    sites.filter(
      item =>
        item.site_type === "一般"
    );

  generalSites.forEach(site => {
    const option =
      document.createElement("option");

    option.value =
      String(site.id);

    option.textContent =
      site.display_name;

    option.dataset.displayName =
      site.display_name || "";

    option.dataset.inputCode =
      site.input_code || "";

    selectElement.appendChild(option);
  });
}


/* =========================================
   現場検索用文字列
========================================= */

function siteSearchText(site) {
  return [
    site.display_name,
    site.input_code,
    site.client_name,
    site.official_name
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}


/* =========================================
   雑工事の現場IDを探す
========================================= */

function findMiscSite(
  company,
  workDepartment
) {
  const miscSites =
    sites.filter(
      item =>
        item.site_type === "雑工事"
    );

  if (company === "三機") {
    return miscSites.find(site => {
      const text =
        siteSearchText(site);

      return (
        text.includes("三機") &&
        text.includes(
          workDepartment.toLowerCase()
        )
      );
    }) || null;
  }

  if (company === "自社") {
    return miscSites.find(site => {
      const text =
        siteSearchText(site);

      return (
        (
          text.includes("自社") &&
          text.includes(
            workDepartment.toLowerCase()
          )
        ) ||
        text.includes(
          `${workDepartment}雑`
            .toLowerCase()
        ) ||
        text.includes(
          `${workDepartment}雑工事`
            .toLowerCase()
        )
      );
    }) || null;
  }

  return miscSites.find(site => {
    const text =
      siteSearchText(site);

    return text.includes(
      company.toLowerCase()
    );
  }) || null;
}


/* =========================================
   一般・雑工事の表示切替
========================================= */

function changeSiteType(row) {
  const siteType =
    row
      .querySelector(".site-type")
      .value;

  const generalSiteWrap =
    row.querySelector(
      ".general-site-wrap"
    );

  const miscCompanyWrap =
    row.querySelector(
      ".misc-company-wrap"
    );

  const miscDepartmentWrap =
    row.querySelector(
      ".misc-department-wrap"
    );

  const miscNameWrap =
    row.querySelector(
      ".misc-name-wrap"
    );

  generalSiteWrap
    .classList
    .add("hidden");

  miscCompanyWrap
    .classList
    .add("hidden");

  miscDepartmentWrap
    .classList
    .add("hidden");

  miscNameWrap
    .classList
    .add("hidden");

  if (siteType === "一般") {
    generalSiteWrap
      .classList
      .remove("hidden");

    return;
  }

  if (siteType === "雑工事") {
    miscCompanyWrap
      .classList
      .remove("hidden");

    changeMiscCompany(row);
  }
}


/* =========================================
   雑工事区分の表示切替
========================================= */

function changeMiscCompany(row) {
  const company =
    row
      .querySelector(".misc-company")
      .value;

  const miscDepartmentWrap =
    row.querySelector(
      ".misc-department-wrap"
    );

  const miscNameWrap =
    row.querySelector(
      ".misc-name-wrap"
    );

  miscDepartmentWrap
    .classList
    .add("hidden");

  miscNameWrap
    .classList
    .add("hidden");

  if (!company) {
    return;
  }

  if (
    company === "三機" ||
    company === "自社"
  ) {
    miscDepartmentWrap
      .classList
      .remove("hidden");
  }

  miscNameWrap
    .classList
    .remove("hidden");
}


/* =========================================
   1日分の現場情報取得
========================================= */

function getRowSiteData(row) {
  const siteType =
    row
      .querySelector(".site-type")
      .value;

  if (siteType === "一般") {
    const selectElement =
      row.querySelector(
        ".general-site"
      );

    const selectedOption =
      selectElement.options[
        selectElement.selectedIndex
      ];

    return {
      siteType: "一般",

      siteId:
        selectElement.value || "",

      siteDisplayName:
        selectedOption
          ?.dataset
          ?.displayName || "",

      siteInputCode:
        selectedOption
          ?.dataset
          ?.inputCode || "",

      miscCompany: "",
      miscDepartment: "",
      miscName: ""
    };
  }

  if (siteType === "雑工事") {
    const company =
      row
        .querySelector(".misc-company")
        .value;

    const workDepartment =
      row
        .querySelector(".misc-department")
        .value;

    const miscName =
      row
        .querySelector(".misc-name")
        .value
        .trim();

    const matchedSite =
      findMiscSite(
        company,
        workDepartment
      );

    return {
      siteType: "雑工事",

      siteId:
        matchedSite
          ? String(matchedSite.id)
          : "",

      siteDisplayName:
        matchedSite
          ? matchedSite.display_name
          : company,

      siteInputCode:
        matchedSite
          ? matchedSite.input_code || ""
          : "",

      miscCompany:
        company,

      miscDepartment:
        workDepartment,

      miscName:
        miscName
    };
  }

  return {
    siteType: "",
    siteId: "",
    siteDisplayName: "",
    siteInputCode: "",
    miscCompany: "",
    miscDepartment: "",
    miscName: ""
  };
}


/* =========================================
   日別入力欄作成
========================================= */

function renderRows() {
  rows.innerHTML = "";

  const yearMonth =
    month.value ||
    currentMonth();

  const count =
    daysInMonth(yearMonth);

  for (
    let day = 1;
    day <= count;
    day++
  ) {
    const node =
      template
        .content
        .cloneNode(true);

    const row =
      node.querySelector(
        ".day-row"
      );

    const info =
      dateInfo(
        yearMonth,
        day
      );

    const dateText =
      `${yearMonth}-` +
      `${String(day).padStart(2, "0")}`;

    const holiday =
      holidays[dateText];

    row.dataset.day =
      String(day);

    row.dataset.date =
      dateText;

    if (info.weekNo === 0) {
      row.classList.add(
        "sunday"
      );
    }

    if (
      holiday &&
      (
        holiday.day_type === "休日" ||
        holiday.day_type === "祝日"
      )
    ) {
      row.classList.add(
        "company-holiday"
      );
    }

    row
      .querySelector(".day")
      .textContent =
      `${day}日`;

    row
      .querySelector(".week")
      .textContent =
      `(${info.weekText})`;

    setTimeOptions(
      row.querySelector(".start")
    );

    setTimeOptions(
      row.querySelector(".end")
    );

    setGeneralSiteOptions(
      row.querySelector(
        ".general-site"
      )
    );

    row
      .querySelector(".site-type")
      .addEventListener(
        "change",
        () => {
          changeSiteType(row);
          updateSummary();
        }
      );

    row
      .querySelector(".misc-company")
      .addEventListener(
        "change",
        () => {
          changeMiscCompany(row);
          updateSummary();
        }
      );

    row
      .querySelectorAll(
        "select,input"
      )
      .forEach(element => {
        element.addEventListener(
          "change",
          updateSummary
        );

        element.addEventListener(
          "input",
          updateSummary
        );
      });

    rows.appendChild(node);
  }

  applyStatusToScreen();
  updateSummary();
}


/* =========================================
   入力データ収集
========================================= */

function collectData() {
  const data = [];

  document
    .querySelectorAll(".day-row")
    .forEach(row => {
      const siteData =
        getRowSiteData(row);

      data.push({
        day:
          row.dataset.day,

        date:
          row.dataset.date,

        siteType:
          siteData.siteType,

        siteId:
          siteData.siteId,

        siteDisplayName:
          siteData.siteDisplayName,

        siteInputCode:
          siteData.siteInputCode,

        miscCompany:
          siteData.miscCompany,

        miscDepartment:
          siteData.miscDepartment,

        miscName:
          siteData.miscName,

        start:
          row
            .querySelector(".start")
            .value,

        end:
          row
            .querySelector(".end")
            .value,

        note:
          row
            .querySelector(".note")
            .value
      });
    });

  return data;
}


/* =========================================
   attendance保存用データ作成
========================================= */

function makeAttendanceRecords(status) {
  const employeeId =
    Number(employee.value);

  return collectData().map(item => {
    return {
      employee_id:
        employeeId,

      work_date:
        item.date,

      site_type:
        item.siteType || "",

      site_id:
        item.siteId
          ? Number(item.siteId)
          : null,

      misc_company:
        item.miscCompany || "",

      misc_department:
        item.miscDepartment || "",

      misc_name:
        item.miscName || "",

      start_time:
        item.start || "",

      end_time:
        item.end || "",

      note:
        item.note || "",

      status:
        status
    };
  });
}


/* =========================================
   対象月の既存データ削除
========================================= */

async function deleteExistingAttendance() {
  const firstDay =
    `${month.value}-01`;

  const nextFirstDay =
    nextMonthFirstDay(
      month.value
    );

  const url =
    `${SUPABASE_URL}/rest/v1/attendance` +
    `?employee_id=eq.${employee.value}` +
    `&work_date=gte.${firstDay}` +
    `&work_date=lt.${nextFirstDay}`;

  const response =
    await fetch(url, {
      method: "DELETE",

      headers: {
        ...supabaseHeaders(),
        Prefer: "return=minimal"
      }
    });

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(errorText);

    throw new Error(
      "既存データの削除に失敗しました"
    );
  }
}


/* =========================================
   Supabaseへ保存
========================================= */

async function saveAttendanceWithStatus(
  status,
  successMessage
) {
  if (!department.value) {
    alert(
      "部を選択してください"
    );

    return false;
  }

  if (!employee.value) {
    alert(
      "氏名を選択してください"
    );

    return false;
  }

  if (!month.value) {
    alert(
      "対象月を選択してください"
    );

    return false;
  }

  const records =
    makeAttendanceRecords(status);

  saveButton.disabled = true;
  submitButton.disabled = true;

  try {
    await deleteExistingAttendance();

    const url =
      `${SUPABASE_URL}/rest/v1/attendance`;

    const response =
      await fetch(url, {
        method: "POST",

        headers: {
          ...supabaseHeaders(),
          Prefer: "return=minimal"
        },

        body:
          JSON.stringify(records)
      });

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(errorText);

      throw new Error(
        "出勤簿の保存に失敗しました"
      );
    }

    currentStatus = status;

    applyStatusToScreen();

    alert(successMessage);

    return true;

  } catch (error) {
    console.error(error);

    alert(error.message);

    return false;

  } finally {
    applyStatusToScreen();
  }
}


/* =========================================
   一時保存
========================================= */

async function saveDraft() {
  if (
    currentStatus !== "draft"
  ) {
    return;
  }

  await saveAttendanceWithStatus(
    "draft",
    `${selectedEmployeeName()}さんの` +
    `${month.value}分を一時保存しました`
  );
}


/* =========================================
   提出・提出取消
========================================= */

async function toggleSubmit() {
  if (!employee.value) {
    alert(
      "氏名を選択してください"
    );

    return;
  }

  if (
    currentStatus === "locked"
  ) {
    alert(
      "この出勤簿は締切済みです"
    );

    return;
  }

  /*
    未提出の場合は提出する。
  */

  if (
    currentStatus === "draft"
  ) {
    const confirmed =
      window.confirm(
        `${selectedEmployeeName()}さんの` +
        `${month.value}分を提出しますか？\n\n` +
        `提出後は、提出取消をするまで編集できません。`
      );

    if (!confirmed) {
      return;
    }

    await saveAttendanceWithStatus(
      "submitted",
      "出勤簿を提出しました"
    );

    return;
  }

  /*
    提出済の場合は提出取消。
  */

  if (
    currentStatus === "submitted"
  ) {
    const confirmed =
      window.confirm(
        "提出を取り消しますか？\n\n" +
        "取消後は再び編集できます。"
      );

    if (!confirmed) {
      return;
    }

    await saveAttendanceWithStatus(
      "draft",
      "提出を取り消しました"
    );
  }
}


/* =========================================
   1日分の保存データを画面へ反映
========================================= */

function restoreAttendanceRow(
  row,
  item
) {
  if (!item) {
    return;
  }

  row
    .querySelector(".site-type")
    .value =
    item.site_type || "";

  changeSiteType(row);

  if (
    item.site_type === "一般"
  ) {
    row
      .querySelector(".general-site")
      .value =
      item.site_id
        ? String(item.site_id)
        : "";
  }

  if (
    item.site_type === "雑工事"
  ) {
    row
      .querySelector(".misc-company")
      .value =
      item.misc_company || "";

    changeMiscCompany(row);

    row
      .querySelector(".misc-department")
      .value =
      item.misc_department || "";

    row
      .querySelector(".misc-name")
      .value =
      item.misc_name || "";
  }

  row
    .querySelector(".start")
    .value =
    item.start_time || "";

  row
    .querySelector(".end")
    .value =
    item.end_time || "";

  row
    .querySelector(".note")
    .value =
    item.note || "";
}


/* =========================================
   Supabaseから対象月を読込
========================================= */

async function loadAttendance() {
  currentStatus = "draft";

  if (
    !employee.value ||
    !month.value
  ) {
    applyStatusToScreen();
    updateSummary();

    return;
  }

  const firstDay =
    `${month.value}-01`;

  const nextFirstDay =
    nextMonthFirstDay(
      month.value
    );

  const url =
    `${SUPABASE_URL}/rest/v1/attendance` +
    `?select=*` +
    `&employee_id=eq.${employee.value}` +
    `&work_date=gte.${firstDay}` +
    `&work_date=lt.${nextFirstDay}` +
    `&order=work_date.asc`;

  const response =
    await fetch(url, {
      headers:
        supabaseHeaders()
    });

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(errorText);

    throw new Error(
      "出勤簿の読込に失敗しました"
    );
  }

  const attendanceData =
    await response.json();

  /*
    1件でも保存データがあれば、
    そのstatusを月全体の状態として使う。
  */

  if (
    attendanceData.length > 0
  ) {
    currentStatus =
      attendanceData[0].status ||
      "draft";
  }

  const dataByDate = {};

  attendanceData.forEach(item => {
    dataByDate[item.work_date] =
      item;
  });

  document
    .querySelectorAll(".day-row")
    .forEach(row => {
      const item =
        dataByDate[
          row.dataset.date
        ];

      restoreAttendanceRow(
        row,
        item
      );
    });

  applyStatusToScreen();
  updateSummary();
}


/* =========================================
   提出状態を画面へ反映
========================================= */

function applyStatusToScreen() {
  const inputElements =
    document.querySelectorAll(
      ".day-row select, .day-row input"
    );

  /*
    一時保存中
  */

  if (
    currentStatus === "draft"
  ) {
    inputElements.forEach(element => {
      element.disabled = false;
    });

    saveButton.disabled = false;
    saveButton.textContent = "一時保存";

    submitButton.disabled = false;
    submitButton.textContent = "提出";

    summary.textContent =
      `${getInputCount()}件入力`;

    return;
  }

  /*
    提出済
  */

  if (
    currentStatus === "submitted"
  ) {
    inputElements.forEach(element => {
      element.disabled = true;
    });

    saveButton.disabled = true;
    saveButton.textContent = "提出済";

    submitButton.disabled = false;
    submitButton.textContent = "提出取消";

    summary.textContent =
      `提出済・${getInputCount()}件入力`;

    return;
  }

  /*
    締切済
  */

  if (
    currentStatus === "locked"
  ) {
    inputElements.forEach(element => {
      element.disabled = true;
    });

    saveButton.disabled = true;
    saveButton.textContent = "締切済";

    submitButton.disabled = true;
    submitButton.textContent = "締切済";

    summary.textContent =
      `締切済・${getInputCount()}件入力`;
  }
}


/* =========================================
   入力件数取得
========================================= */

function getInputCount() {
  return collectData().filter(item => {
    return (
      item.siteType ||
      item.siteId ||
      item.miscCompany ||
      item.miscDepartment ||
      item.miscName ||
      item.start ||
      item.end ||
      item.note
    );
  }).length;
}


/* =========================================
   入力件数表示
========================================= */

function updateSummary() {
  if (
    currentStatus === "submitted" ||
    currentStatus === "locked"
  ) {
    applyStatusToScreen();

    return;
  }

  summary.textContent =
    `${getInputCount()}件入力`;
}


/* =========================================
   画面更新・クラウド読込
========================================= */

async function refreshAttendanceScreen() {
  currentStatus = "draft";

  renderRows();

  if (!employee.value) {
    applyStatusToScreen();

    return;
  }

  try {
    await loadAttendance();

  } catch (error) {
    console.error(error);

    alert(error.message);
  }
}


/* =========================================
   イベント設定
========================================= */

month.value =
  currentMonth();


department.addEventListener(
  "change",
  () => {
    currentStatus = "draft";

    makeEmployeeOptions(
      department.value
    );

    renderRows();
  }
);


employee.addEventListener(
  "change",
  refreshAttendanceScreen
);


month.addEventListener(
  "change",
  refreshAttendanceScreen
);


document
  .getElementById("makeRows")
  .addEventListener(
    "click",
    refreshAttendanceScreen
  );


saveButton.addEventListener(
  "click",
  saveDraft
);


submitButton.addEventListener(
  "click",
  toggleSubmit
);


/* =========================================
   初期読込
========================================= */

Promise.all([
  loadEmployees(),
  loadSites(),
  loadHolidays()
])
  .then(() => {
    renderRows();
  })
  .catch(error => {
    console.error(error);

    alert(error.message);
  });
