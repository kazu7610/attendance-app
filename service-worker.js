/* =========================================
   Staff Portal Service Worker
========================================= */

const CACHE_NAME =
  "staff-portal-v3";

const CACHE_FILES = [
  "./",
  "./login.html",
  "./home.html",
  "./index.html",
  "./improvement.html",
  "./near-miss.html",
  "./schedule.html",
  "./style.css",
  "./login.js",
  "./home.js",
  "./app.js",
  "./improvement.js",
  "./near-miss.js",
  "./schedule.js",
  "./manifest.json"
];


/* =========================================
   インストール
========================================= */

self.addEventListener(
  "install",
  event => {
    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then(cache =>
          cache.addAll(
            CACHE_FILES
          )
        )
    );

    self.skipWaiting();
  }
);


/* =========================================
   有効化
========================================= */

self.addEventListener(
  "activate",
  event => {
    event.waitUntil(
      caches
        .keys()
        .then(cacheNames =>
          Promise.all(
            cacheNames
              .filter(
                cacheName =>
                  cacheName !==
                  CACHE_NAME
              )
              .map(
                cacheName =>
                  caches.delete(
                    cacheName
                  )
              )
          )
        )
    );

    self.clients.claim();
  }
);


/* =========================================
   通信時の処理
========================================= */

self.addEventListener(
  "fetch",
  event => {
    const request =
      event.request;

    if (
      request.method !== "GET"
    ) {
      return;
    }

    event.respondWith(
      fetch(request)
        .then(response => {
          const responseCopy =
            response.clone();

          caches
            .open(CACHE_NAME)
            .then(cache => {
              cache.put(
                request,
                responseCopy
              );
            });

          return response;
        })
        .catch(() =>
          caches.match(request)
        )
    );
  }
);