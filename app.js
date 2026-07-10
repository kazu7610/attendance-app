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
  document.getElementById("saveLocal");


/* =========================================
   読み込んだデータ
========================================= */

let employees = [];
let sites = [];
let holidays = {};


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
    throw new Error("社員マスタの読込に失敗しました");
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
    throw new Error("現場マスタの読込に失敗しました");
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
    throw new Error("休日カレンダーの読込に失敗しました");
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
    '<option value="">部を選択してください</option>';

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
    '<option value="">先に部を選択してください</option>';

  employee.disabled = true;
}


/* =========================================
   氏名プルダウン作成
========================================= */

function makeEmployeeOptions(selectedDepartment) {
  employee.innerHTML = "";

  if (!selectedDepartment) {
    employee.innerHTML =
      '<option value="">先に部を選択してください</option>';

    employee.disabled = true;
    return;
  }

  const filteredEmployees =
    employees.filter(
      item =>
        item.department === selectedDepartment
    );

  employee.innerHTML =
    '<option value="">氏名を選択してください</option>';

  filteredEmployees.forEach(item => {
    const option =
      document.createElement("option");

    /*
      valueには社員IDを入れる。
      表示は社員名にする。
    */

    option.value = String(item.id);
    option.textContent = item.name;
    option.dataset.name = item.name;

    employee.appendChild(option);
  });

  employee.disabled = false;
}


/* =========================================
   選択中の社員名
========================================= */

function selectedEmployeeName() {
  const selectedOption =
    employee.options[employee.selectedIndex];

  if (!selectedOption || !employee.value) {
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

  const year = date.getFullYear();

  const monthValue =
    String(date.getMonth() + 1)
      .padStart(2, "0");

  return `${year}-${monthValue}`;
}


/* =========================================
   月の日数
========================================= */

function daysInMonth(yearMonth) {
  const [year, monthValue] =
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
   翌月の1日を作成
========================================= */

function nextMonthFirstDay(yearMonth) {
  const [year, monthValue] =
    yearMonth
      .split("-")
      .map(Number);

  const nextDate =
    new Date(year, monthValue, 1);

  const nextYear =
    nextDate.getFullYear();

  const nextMonth =
    String(nextDate.getMonth() + 1)
      .padStart(2, "0");

  return `${nextYear}-${nextMonth}-01`;
}


/* =========================================
   曜日情報
========================================= */

function dateInfo(yearMonth, day) {
  const [year, monthValue] =
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
    weekText: weeks[date.getDay()]
  };
}


/* =========================================
   時刻プルダウン作成
========================================= */

function setTimeOptions(selectElement) {
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

function setGeneralSiteOptions(selectElement) {
  selectElement.innerHTML =
    '<option value="">現場を選択してください</option>';

  const generalSites =
    sites.filter(
      item => item.site_type === "一般"
    );

  generalSites.forEach(site => {
    const option =
      document.createElement("option");

    option.value = String(site.id);
    option.textContent = site.display_name;

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
   雑工事に対応するsitesデータを探す
========================================= */

function findMiscSite(company, workDepartment) {
  const miscSites =
    sites.filter(
      item => item.site_type === "雑工事"
    );

  if (company === "三機") {
    return miscSites.find(site => {
      const text = siteSearchText(site);

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
      const text = siteSearchText(site);

      return (
        (
          text.includes("自社") &&
          text.includes(
            workDepartment.toLowerCase()
          )
        ) ||
        text.includes(
          `${workDepartment}雑`.toLowerCase()
        ) ||
        text.includes(
          `${workDepartment}雑工事`.toLowerCase()
        )
      );
    }) || null;
  }

  return miscSites.find(site => {
    const text = siteSearchText(site);

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
    row.querySelector(".site-type").value;

  const generalSiteWrap =
    row.querySelector(".general-site-wrap");

  const miscCompanyWrap =
    row.querySelector(".misc-company-wrap");

  const miscDepartmentWrap =
    row.querySelector(".misc-department-wrap");

  const miscNameWrap =
    row.querySelector(".misc-name-wrap");

  generalSiteWrap.classList.add("hidden");
  miscCompanyWrap.classList.add("hidden");
  miscDepartmentWrap.classList.add("hidden");
  miscNameWrap.classList.add("hidden");

  if (siteType === "一般") {
    generalSiteWrap.classList.remove("hidden");
    return;
  }

  if (siteType === "雑工事") {
    miscCompanyWrap.classList.remove("hidden");
    changeMiscCompany(row);
  }
}


/* =========================================
   雑工事区分による表示切替
========================================= */

function changeMiscCompany(row) {
  const company =
    row.querySelector(".misc-company").value;

  const miscDepartmentWrap =
    row.querySelector(".misc-department-wrap");

  const miscNameWrap =
    row.querySelector(".misc-name-wrap");

  miscDepartmentWrap.classList.add("hidden");
  miscNameWrap.classList.add("hidden");

  if (!company) {
    return;
  }

  if (
    company === "三機" ||
    company === "自社"
  ) {
    miscDepartmentWrap.classList.remove("hidden");
  }

  miscNameWrap.classList.remove("hidden");
}


/* =========================================
   1日分の現場情報を取得
========================================= */

function getRowSiteData(row) {
  const siteType =
    row.querySelector(".site-type").value;

  if (siteType === "一般") {
    const selectElement =
      row.querySelector(".general-site");

    const selectedOption =
      selectElement.options[
        selectElement.selectedIndex
      ];

    return {
      siteType: "一般",
      siteId: selectElement.value || "",
      siteDisplayName:
        selectedOption?.dataset?.displayName || "",
      siteInputCode:
        selectedOption?.dataset?.inputCode || "",
      miscCompany: "",
      miscDepartment: "",
      miscName: ""
    };
  }

  if (siteType === "雑工事") {
    const company =
      row.querySelector(".misc-company").value;

    const workDepartment =
      row.querySelector(".misc-department").value;

    const miscName =
      row.querySelector(".misc-name")
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

      miscCompany: company,
      miscDepartment: workDepartment,
      miscName: miscName
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
    month.value || currentMonth();

  const count =
    daysInMonth(yearMonth);

  for (
    let day = 1;
    day <= count;
    day++
  ) {
    const node =
      template.content.cloneNode(true);

    const row =
      node.querySelector(".day-row");

    const info =
      dateInfo(yearMonth, day);

    const dateText =
      `${yearMonth}-` +
      `${String(day).padStart(2, "0")}`;

    const holiday =
      holidays[dateText];

    row.dataset.day = String(day);
    row.dataset.date = dateText;

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

    row.querySelector(".day")
      .textContent = `${day}日`;

    row.querySelector(".week")
      .textContent = `(${info.weekText})`;

    setTimeOptions(
      row.querySelector(".start")
    );

    setTimeOptions(
      row.querySelector(".end")
    );

    setGeneralSiteOptions(
      row.querySelector(".general-site")
    );

    row.querySelector(".site-type")
      .addEventListener(
        "change",
        () => {
          changeSiteType(row);
          updateSummary();
        }
      );

    row.querySelector(".misc-company")
      .addEventListener(
        "change",
        () => {
          changeMiscCompany(row);
          updateSummary();
        }
      );

    row.querySelectorAll("select,input")
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

  updateSummary();
}


/* =========================================
   入力データ収集
========================================= */

function collectData() {
  const data = [];

  document.querySelectorAll(".day-row")
    .forEach(row => {
      const siteData =
        getRowSiteData(row);

      data.push({
        day: row.dataset.day,
        date: row.dataset.date,

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
          row.querySelector(".start").value,

        end:
          row.querySelector(".end").value,

        note:
          row.querySelector(".note").value
      });
    });

  return data;
}


/* =========================================
   attendance保存用データ作成
========================================= */

function makeAttendanceRecords() {
  const employeeId =
    Number(employee.value);

  return collectData().map(item => {
    return {
      employee_id: employeeId,
      work_date: item.date,

      /*
        空欄でもテーブルのNOT NULLに対応できるよう、
        空文字として保存する。
      */

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
        item.note || ""
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
    nextMonthFirstDay(month.value);

  const url =
    `${SUPABASE_URL}/rest/v1/attendance` +
    `?employee_id=eq.${employee.value}` +
    `&work_date=gte.${firstDay}` +
    `&work_date=lt.${nextFirstDay}`;

  const response = await fetch(url, {
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

async function saveAttendance() {
  if (!department.value) {
    alert("部を選択してください");
    return;
  }

  if (!employee.value) {
    alert("氏名を選択してください");
    return;
  }

  if (!month.value) {
    alert("対象月を選択してください");
    return;
  }

  const records =
    makeAttendanceRecords();

  const originalText =
    saveButton.textContent;

  saveButton.disabled = true;
  saveButton.textContent = "保存中…";

  try {
    /*
      同じ社員・同じ月の古いデータを削除して、
      今の画面内容を保存する。
    */

    await deleteExistingAttendance();

    const url =
      `${SUPABASE_URL}/rest/v1/attendance`;

    const response = await fetch(url, {
      method: "POST",

      headers: {
        ...supabaseHeaders(),
        Prefer: "return=minimal"
      },

      body: JSON.stringify(records)
    });

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(errorText);

      throw new Error(
        "出勤簿の保存に失敗しました"
      );
    }

    alert(
      `${selectedEmployeeName()}さんの` +
      `${month.value}分を保存しました`
    );

  } catch (error) {
    console.error(error);
    alert(error.message);

  } finally {
    saveButton.disabled = false;
    saveButton.textContent = originalText;
  }
}


/* =========================================
   保存データを1日分の画面へ反映
========================================= */

function restoreAttendanceRow(row, item) {
  if (!item) {
    return;
  }

  row.querySelector(".site-type").value =
    item.site_type || "";

  changeSiteType(row);

  if (item.site_type === "一般") {
    row.querySelector(".general-site").value =
      item.site_id
        ? String(item.site_id)
        : "";
  }

  if (item.site_type === "雑工事") {
    row.querySelector(".misc-company").value =
      item.misc_company || "";

    changeMiscCompany(row);

    row.querySelector(".misc-department").value =
      item.misc_department || "";

    row.querySelector(".misc-name").value =
      item.misc_name || "";
  }

  row.querySelector(".start").value =
    item.start_time || "";

  row.querySelector(".end").value =
    item.end_time || "";

  row.querySelector(".note").value =
    item.note || "";
}


/* =========================================
   Supabaseから対象月を読込
========================================= */

async function loadAttendance() {
  if (!employee.value || !month.value) {
    updateSummary();
    return;
  }

  const firstDay =
    `${month.value}-01`;

  const nextFirstDay =
    nextMonthFirstDay(month.value);

  const url =
    `${SUPABASE_URL}/rest/v1/attendance` +
    `?select=*` +
    `&employee_id=eq.${employee.value}` +
    `&work_date=gte.${firstDay}` +
    `&work_date=lt.${nextFirstDay}` +
    `&order=work_date.asc`;

  const response = await fetch(url, {
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

  const attendanceData =
    await response.json();

  const dataByDate = {};

  attendanceData.forEach(item => {
    dataByDate[item.work_date] = item;
  });

  document.querySelectorAll(".day-row")
    .forEach(row => {
      const item =
        dataByDate[row.dataset.date];

      restoreAttendanceRow(row, item);
    });

  updateSummary();
}


/* =========================================
   画面を作り直してクラウドデータ読込
========================================= */

async function refreshAttendanceScreen() {
  renderRows();

  if (!employee.value) {
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
   入力件数表示
========================================= */

function updateSummary() {
  const count =
    collectData().filter(item => {
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

  summary.textContent =
    `${count}件入力`;
}


/* =========================================
   CSV出力
========================================= */

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
    "日付",
    "区分",
    "現場ID",
    "現場コード",
    "現場表示名",
    "雑工事区分",
    "担当部",
    "雑工事名",
    "開始",
    "終了",
    "備考"
  ];

  const lines = [header];

  collectData().forEach(item => {
    const hasInput =
      item.siteType ||
      item.siteId ||
      item.miscCompany ||
      item.miscDepartment ||
      item.miscName ||
      item.start ||
      item.end ||
      item.note;

    if (!hasInput) {
      return;
    }

    lines.push([
      department.value,
      selectedEmployeeName(),
      month.value,
      item.date,
      item.siteType,
      item.siteId,
      item.siteInputCode,
      item.siteDisplayName,
      item.miscCompany,
      item.miscDepartment,
      item.miscName,
      item.start,
      item.end,
      item.note
    ]);
  });

  const csv =
    lines
      .map(row => {
        return row
          .map(value => {
            const escapedValue =
              String(value ?? "")
                .replaceAll('"', '""');

            return `"${escapedValue}"`;
          })
          .join(",");
      })
      .join("\n");

  const blob =
    new Blob(
      ["\ufeff" + csv],
      {
        type: "text/csv;charset=utf-8"
      }
    );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    `出勤簿_` +
    `${department.value}_` +
    `${selectedEmployeeName()}_` +
    `${month.value}.csv`;

  link.click();

  URL.revokeObjectURL(url);
}


/* =========================================
   イベント設定
========================================= */

month.value = currentMonth();


department.addEventListener(
  "change",
  () => {
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


document
  .getElementById("saveLocal")
  .addEventListener(
    "click",
    saveAttendance
  );


document
  .getElementById("exportCsv")
  .addEventListener(
    "click",
    exportCsv
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
