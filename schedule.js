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

const scheduleMonth =
  document.getElementById(
    "scheduleMonth"
  );

const monthlyScheduleList =
  document.getElementById(
    "monthlyScheduleList"
  );


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
   現在月取得
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
   翌月1日取得
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
   日付表示
========================================= */

function formatScheduleDate(dateText) {
  const date =
    new Date(
      `${dateText}T00:00:00`
    );

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
   対象月の予定読込
========================================= */

async function loadMonthlySchedules() {
  const loginUser =
    getLoginUser();

  if (!loginUser) {
    window.location.href =
      "login.html";

    return;
  }

  if (!scheduleMonth.value) {
    return;
  }

  monthlyScheduleList.innerHTML =
    '<p class="schedule-empty-message">' +
    '予定を読み込み中...' +
    '</p>';

  const firstDay =
    `${scheduleMonth.value}-01`;

  const nextFirstDay =
    nextMonthFirstDay(
      scheduleMonth.value
    );

  const userDepartment =
  loginUser.department || "";

const url =
  `${SUPABASE_URL}/rest/v1/schedules` +
  `?select=*` +
  `&schedule_date=gte.${firstDay}` +
  `&schedule_date=lt.${nextFirstDay}` +
  `&order=schedule_date.asc,start_time.asc`;

  const response =
    await fetch(url, {
      headers: supabaseHeaders()
    });

  if (!response.ok) {
    const errorText =
      await response.text();

    console.error(errorText);

    throw new Error(
      "予定表の読込に失敗しました"
    );
  }

const schedules =
  await response.json();

  console.log("取得した予定データ：", schedules);

/*
  全員向け、または
  ログインした人の部署向けだけ表示する
*/

const visibleSchedules =
  schedules.filter(item => {
    return (
      item.target_scope === "all" ||
      item.target_scope === userDepartment
    );
  });

renderMonthlySchedules(
  visibleSchedules
);
}


/* =========================================
   月間予定表示
========================================= */

function renderMonthlySchedules(
  schedules
) {
  monthlyScheduleList.innerHTML = "";

  if (schedules.length === 0) {
    monthlyScheduleList.innerHTML =
      '<p class="schedule-empty-message">' +
      'この月の予定はありません。' +
      '</p>';

    return;
  }

  schedules.forEach(item => {
    const scheduleItem =
      document.createElement("article");

    scheduleItem.className =
      "monthly-schedule-item";

    const timeText =
      formatScheduleTime(
        item.start_time
      );

    scheduleItem.innerHTML = `
      <div class="monthly-schedule-date">
        ${escapeHtml(
          formatScheduleDate(
            item.schedule_date
          )
        )}
      </div>

      <div class="monthly-schedule-content">

        ${
          timeText
            ? `
              <div class="monthly-schedule-time">
                ${escapeHtml(timeText)}
              </div>
            `
            : ""
        }

        <h3>
          ${escapeHtml(item.title)}
        </h3>

        ${
          item.details
            ? `
              <p>
                ${escapeHtml(item.details)}
              </p>
            `
            : ""
        }

      </div>
    `;

    monthlyScheduleList.appendChild(
      scheduleItem
    );
  });
}


/* =========================================
   イベント設定
========================================= */

scheduleMonth.addEventListener(
  "change",
  () => {
    loadMonthlySchedules()
      .catch(error => {
        console.error(error);

        monthlyScheduleList.innerHTML =
          `<p class="schedule-empty-message">` +
          `${escapeHtml(error.message)}` +
          `</p>`;
      });
  }
);


/* =========================================
   初期表示
========================================= */

scheduleMonth.value =
  currentMonth();

loadMonthlySchedules()
  .catch(error => {
    console.error(error);

    monthlyScheduleList.innerHTML =
      `<p class="schedule-empty-message">` +
      `${escapeHtml(error.message)}` +
      `</p>`;
  });

  /* =========================================
   今日の日付をカレンダーアイコンへ表示
========================================= */

function displayTodayCalendarIcon() {
  const calendarIcon =
    document.getElementById(
      "todayCalendarIcon"
    );

  if (!calendarIcon) {
    return;
  }

  const today =
    new Date();

  const month =
    today.getMonth() + 1;

  const day =
    today.getDate();

  calendarIcon.innerHTML = `
    <span class="today-calendar-month">
      ${month}月
    </span>

    <span class="today-calendar-day">
      ${day}
    </span>
  `;
}


displayTodayCalendarIcon();