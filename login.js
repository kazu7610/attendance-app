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

const loginDepartment =
  document.getElementById(
    "loginDepartment"
  );

const loginEmployee =
  document.getElementById(
    "loginEmployee"
  );

const loginButton =
  document.getElementById(
    "loginButton"
  );

const loginMessage =
  document.getElementById(
    "loginMessage"
  );


/* =========================================
   読み込んだ社員データ
========================================= */

let employees = [];


/* =========================================
   Supabase共通ヘッダー
========================================= */

function supabaseHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization:
      `Bearer ${SUPABASE_KEY}`
  };
}


/* =========================================
   社員マスタ読込
========================================= */

async function loadEmployees() {
  const url =
    `${SUPABASE_URL}/rest/v1/employees` +
    `?select=id,department,name,active,admin_scope` +
    `&active=eq.true` +
    `&order=department.asc,id.asc`;

  const response =
    await fetch(url, {
      headers: supabaseHeaders()
    });

  if (!response.ok) {
    throw new Error(
      "社員マスタの読込に失敗しました"
    );
  }

  employees =
    await response.json();

  makeDepartmentOptions();
}


/* =========================================
   部プルダウン作成
========================================= */

function makeDepartmentOptions() {
  loginDepartment.innerHTML =
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
        document.createElement(
          "option"
        );

      option.value =
        departmentName;

      option.textContent =
        departmentName;

      loginDepartment.appendChild(
        option
      );
    }
  );
}


/* =========================================
   氏名プルダウン作成
========================================= */

function makeEmployeeOptions(
  departmentName
) {
  loginEmployee.innerHTML = "";

  if (!departmentName) {
    loginEmployee.innerHTML =
      '<option value="">' +
      '先に部を選択してください' +
      '</option>';

    loginEmployee.disabled = true;

    return;
  }

  const filteredEmployees =
    employees.filter(
      item =>
        item.department ===
        departmentName
    );

  loginEmployee.innerHTML =
    '<option value="">' +
    '氏名を選択してください' +
    '</option>';

  filteredEmployees.forEach(item => {
    const option =
      document.createElement(
        "option"
      );

    option.value =
      String(item.id);

    option.textContent =
      item.name;

    option.dataset.name =
      item.name;

    option.dataset.department =
      item.department;
    option.dataset.adminScope =
      item.admin_scope || "none";

    loginEmployee.appendChild(
      option
    );
  });

  loginEmployee.disabled = false;
}


/* =========================================
   ログイン処理
========================================= */

function login() {
  loginMessage.textContent = "";

  if (!loginDepartment.value) {
    loginMessage.textContent =
      "部を選択してください";

    return;
  }

  if (!loginEmployee.value) {
    loginMessage.textContent =
      "氏名を選択してください";

    return;
  }

  const selectedOption =
    loginEmployee.options[
      loginEmployee.selectedIndex
    ];

  const loginUser = {
    id:
      Number(loginEmployee.value),

    name:
      selectedOption.dataset.name,

    department:
  selectedOption
    .dataset
    .department,

    adminScope:
      selectedOption
       .dataset
       .adminScope || "none"
  };

  localStorage.setItem(
    "portalLoginUser",
    JSON.stringify(loginUser)
  );

  window.location.href =
    "home.html";
}


/* =========================================
   イベント設定
========================================= */

loginDepartment.addEventListener(
  "change",
  () => {
    makeEmployeeOptions(
      loginDepartment.value
    );
  }
);

loginButton.addEventListener(
  "click",
  login
);


/* =========================================
   初期読込
========================================= */

loadEmployees()
  .catch(error => {
    console.error(error);

    loginMessage.textContent =
      error.message;
  });