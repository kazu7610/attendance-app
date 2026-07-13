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