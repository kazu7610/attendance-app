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
   社員マスタ読込
========================================= */

async function loadEmployees() {

  const url =
    `${SUPABASE_URL}/rest/v1/employees` +
    `?select=id,department,name,active` +
    `&order=department.asc,id.asc`;

  const response = await fetch(
    url,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    }
  );

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

  const response = await fetch(
    url,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    }
  );

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

  const response = await fetch(
    url,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    }
  );

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

  departments.forEach(
    departmentName => {

      const option =
        document.createElement("option");

      option.value =
        departmentName;

      option.textContent =
        departmentName;

      department.appendChild(option);
    }
  );

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

    /*
      保存値には社員IDを使う。
      表示は社員名にする。
    */

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

  if (!selectedOption) {
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

  const date =
    new Date();

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
    weekText: weeks[date.getDay()]
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

    option.value =
      time;

    option.textContent =
      time;

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

    /*
      valueにはsitesテーブルのIDを保存する。
      表示にはdisplay_nameを使う。
    */

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
   現場を検索するための文字列
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

function findMiscSite(
  company,
  workDepartment
) {

  const miscSites =
    sites.filter(
      item =>
        item.site_type === "雑工事"
    );

  /*
    三機
    三機という文字と担当部の文字が
    入っている現場を探す。
  */

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

  /*
    自社
    「自社＋担当部」または
    「工事部雑」「技術部雑」を探す。
  */

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
          `${workDepartment}雑`.toLowerCase()
        ) ||
        text.includes(
          `${workDepartment}雑工事`.toLowerCase()
        )
      );
    }) || null;
  }

  /*
    STS・三晃・朝日は
    会社名を含む雑工事を探す。
  */

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
    row.querySelector(
      ".site-type"
    ).value;

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

  /*
    いったん全部隠す。
  */

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


  /*
    一般を選択した場合
  */

  if (siteType === "一般") {

    generalSiteWrap
      .classList
      .remove("hidden");

    return;
  }


  /*
    雑工事を選択した場合
  */

  if (siteType === "雑工事") {

    miscCompanyWrap
      .classList
      .remove("hidden");

    changeMiscCompany(row);
  }
}


/* =========================================
   雑工事会社による表示切替
========================================= */

function changeMiscCompany(row) {

  const company =
    row.querySelector(
      ".misc-company"
    ).value;

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


  /*
    会社がまだ選ばれていない。
  */

  if (!company) {
    return;
  }


  /*
    三機・自社は担当部も選択する。
  */

  if (
    company === "三機" ||
    company === "自社"
  ) {

    miscDepartmentWrap
      .classList
      .remove("hidden");
  }


  /*
    雑工事名入力欄は
    会社選択後に表示する。
  */

  miscNameWrap
    .classList
    .remove("hidden");
}


/* =========================================
   1日分の現場情報を取得
========================================= */

function getRowSiteData(row) {

  const siteType =
    row.querySelector(
      ".site-type"
    ).value;

  /*
    一般現場
  */

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


  /*
    雑工事
  */

  if (siteType === "雑工事") {

    const company =
      row.querySelector(
        ".misc-company"
      ).value;

    const workDepartment =
      row.querySelector(
        ".misc-department"
      ).value;

    const miscName =
      row.querySelector(
        ".misc-name"
      ).value.trim();

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


  /*
    未選択
  */

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
   ローカル保存用キー
========================================= */

function storageKey() {

  return (
    "koujibu-attendance:" +
    `${department.value}:` +
    `${employee.value}:` +
    `${month.value}`
  );
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


    /*
      日曜日は赤文字
    */

    if (info.weekNo === 0) {

      row.classList.add(
        "sunday"
      );
    }


    /*
      休日・祝日は休日クラスを付ける
    */

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


    /*
      時刻プルダウン
    */

    setTimeOptions(
      row.querySelector(".start")
    );

    setTimeOptions(
      row.querySelector(".end")
    );


    /*
      一般現場プルダウン
    */

    setGeneralSiteOptions(
      row.querySelector(
        ".general-site"
      )
    );


    /*
      区分変更
    */

    row
      .querySelector(".site-type")
      .addEventListener(
        "change",
        () => {

          changeSiteType(row);

          updateSummary();
        }
      );


    /*
      雑工事会社変更
    */

    row
      .querySelector(".misc-company")
      .addEventListener(
        "change",
        () => {

          changeMiscCompany(row);

          updateSummary();
        }
      );


    /*
      その他の入力変更
    */

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

  loadLocal();

  updateSummary();
}


/* =========================================
   入力データ収集
========================================= */

function collectData() {

  const data = [];

  document
    .querySelectorAll(
      ".day-row"
    )
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
   この端末へ保存
========================================= */

function saveLocal() {

  if (!department.value) {

    alert(
      "部を選択してください"
    );

    return;
  }

  if (!employee.value) {

    alert(
      "氏名を選択してください"
    );

    return;
  }

  localStorage.setItem(
    storageKey(),
    JSON.stringify(
      collectData()
    )
  );

  alert(
    "この端末に保存しました"
  );
}


/* =========================================
   保存データの画面反映
========================================= */

function restoreRowData(
  row,
  item
) {

  if (!item) {
    return;
  }


  /*
    区分
  */

  row
    .querySelector(".site-type")
    .value =
    item.siteType || "";

  changeSiteType(row);


  /*
    一般現場
  */

  if (
    item.siteType === "一般"
  ) {

    row
      .querySelector(".general-site")
      .value =
      item.siteId || "";
  }


  /*
    雑工事
  */

  if (
    item.siteType === "雑工事"
  ) {

    row
      .querySelector(".misc-company")
      .value =
      item.miscCompany || "";

    changeMiscCompany(row);

    row
      .querySelector(".misc-department")
      .value =
      item.miscDepartment || "";

    row
      .querySelector(".misc-name")
      .value =
      item.miscName || "";
  }


  /*
    時刻・備考
  */

  row
    .querySelector(".start")
    .value =
    item.start || "";

  row
    .querySelector(".end")
    .value =
    item.end || "";

  row
    .querySelector(".note")
    .value =
    item.note || "";
}


/* =========================================
   この端末から読込
========================================= */

function loadLocal() {

  if (
    !department.value ||
    !employee.value
  ) {
    return;
  }

  const raw =
    localStorage.getItem(
      storageKey()
    );

  if (!raw) {
    return;
  }

  let data;

  try {

    data =
      JSON.parse(raw);

  } catch (error) {

    console.error(error);

    return;
  }

  document
    .querySelectorAll(
      ".day-row"
    )
    .forEach(
      (row, index) => {

        restoreRowData(
          row,
          data[index]
        );
      }
    );
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

    alert(
      "部を選択してください"
    );

    return;
  }

  if (!employee.value) {

    alert(
      "氏名を選択してください"
    );

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

  const lines = [
    header
  ];

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
              String(
                value ?? ""
              ).replaceAll(
                '"',
                '""'
              );

            return `"${escapedValue}"`;
          })
          .join(",");
      })
      .join("\n");

  const blob =
    new Blob(
      [
        "\ufeff" + csv
      ],
      {
        type:
          "text/csv;charset=utf-8"
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement("a");

  link.href =
    url;

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

month.value =
  currentMonth();


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
  renderRows
);


month.addEventListener(
  "change",
  renderRows
);


document
  .getElementById("makeRows")
  .addEventListener(
    "click",
    renderRows
  );


document
  .getElementById("saveLocal")
  .addEventListener(
    "click",
    saveLocal
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

    alert(
      error.message
    );
  });
