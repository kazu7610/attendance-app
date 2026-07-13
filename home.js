/* =========================================
   Supabase接続設定
========================================= */

const SUPABASE_URL =
  "https://fgmvmbjnoyagnpygcbky.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_pePa2xjccUZB6xpneNhCRQ_pJJ5fn6h";


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
   HTML要素
========================================= */

const welcomeMessage =
  document.getElementById(
    "welcomeMessage"
  );

const logoutButton =
  document.getElementById(
    "logoutButton"
  );

const adminMenu =
  document.getElementById(
    "adminMenu"
  );
  
const todayScheduleList =
  document.getElementById(
    "todayScheduleList"
  );


/* =========================================
   ログイン情報取得
========================================= */

function getLoginUser() {
  const savedUser =
    localStorage.getItem(
      "portalLoginUser"
    );

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);

  } catch (error) {
    console.error(error);

    return null;
  }
}


/* =========================================
   ホーム画面表示
========================================= */

function showHomeScreen() {
  const loginUser =
    getLoginUser();

  /*
    ログイン情報がない場合は
    ログイン画面へ戻す
  */

  if (!loginUser) {
    window.location.href =
      "login.html";

    return;
  }

  welcomeMessage.textContent =
    `${loginUser.name}さん、お疲れさまです`;

  /*
    ひとまず工事部を管理者として表示
    あとで管理者専用項目を社員マスタへ追加する
  */

  if (
  loginUser.adminScope &&
  loginUser.adminScope !== "none"
) {
  adminMenu.classList.remove(
    "hidden"
  );
}

/*
  本日の予定を読み込む
*/

loadTodaySchedules(loginUser)
  .catch(error => {
    console.error(error);

    todayScheduleList.innerHTML =
      '<p class="schedule-empty-message">' +
      `${escapeHtml(error.message)}` +
      '</p>';
  });
  
}

/* =========================================
   今日の日付取得
========================================= */

function todayDateValue() {
  const date = new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/* =========================================
   時刻表示
========================================= */

function formatScheduleTime(timeText) {
  if (!timeText) {
    return "";
  }

  return timeText.slice(0, 5);
}


/* =========================================
   HTML用文字変換
========================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================
   本日の予定読込
========================================= */

async function loadTodaySchedules(
  loginUser
) {
  if (!todayScheduleList) {
    return;
  }

  todayScheduleList.innerHTML =
    '<p class="schedule-empty-message">' +
    '予定を読み込み中...' +
    '</p>';

  const today =
    todayDateValue();

  const url =
    `${SUPABASE_URL}/rest/v1/schedules` +
    `?select=*` +
    `&schedule_date=eq.${today}` +
    `&order=start_time.asc`;

  const response =
    await fetch(url, {
      headers: supabaseHeaders()
    });

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(errorText);

    throw new Error(
      "本日の予定を読み込めませんでした"
    );
  }

  const schedules =
    await response.json();

  const userDepartment =
    loginUser.department || "";

  /*
    全員向け、または
    ログインした人の部署向けだけ表示
  */

  const visibleSchedules =
    schedules.filter(item => {
      return (
        item.target_scope === "all" ||
        item.target_scope === userDepartment
      );
    });

  renderTodaySchedules(
    visibleSchedules
  );
}


/* =========================================
   本日の予定表示
========================================= */

function renderTodaySchedules(
  schedules
) {
  todayScheduleList.innerHTML = "";

  if (schedules.length === 0) {
    todayScheduleList.innerHTML =
      '<p class="schedule-empty-message">' +
      '本日の予定はありません。' +
      '</p>';

    return;
  }

  schedules.forEach(item => {
    const scheduleRow =
      document.createElement("div");

    scheduleRow.className =
      "today-schedule-row";

    const timeText =
      formatScheduleTime(
        item.start_time
      );

    scheduleRow.innerHTML = `
      ${
        timeText
          ? `
            <span class="today-schedule-time">
              ${escapeHtml(timeText)}
            </span>
          `
          : `
            <span class="today-schedule-time">
              終日
            </span>
          `
      }

      <span class="today-schedule-title">
        ${escapeHtml(item.title)}
      </span>
    `;

    todayScheduleList.appendChild(
      scheduleRow
    );
  });
}

/* =========================================
   ログアウト
========================================= */

function logout() {
  const confirmed =
    window.confirm(
      "ログアウトしますか？"
    );

  if (!confirmed) {
    return;
  }

  localStorage.removeItem(
    "portalLoginUser"
  );

  window.location.href =
    "login.html";
}


/* =========================================
   イベント設定
========================================= */

logoutButton.addEventListener(
  "click",
  logout
);


/* =========================================
   初期表示
========================================= */

showHomeScreen();

// 本日の予定カードに今日の日付を表示
function displayTodayDate() {
  const today = new Date();

  const monthElement = document.getElementById("todayDateMonth");
  const dayElement = document.getElementById("todayDateDay");

  if (!monthElement || !dayElement) return;

  monthElement.textContent = `${today.getMonth() + 1}月`;
  dayElement.textContent = today.getDate();
}

displayTodayDate();