// 報修登記 PWA 的 Service Worker
// - 只快取報修網頁本身的檔案（app shell），讓網頁離線也能開啟。
// - 報修資料（Supabase API）一律直接連線，不快取，避免看到過期資料。
// - 只處理下方清單內的檔案；同網站其他資料夾不受影響。
// 修改網頁檔案後，請把 CACHE_VERSION 加 1，讓使用者拿到新版。
const CACHE_VERSION = 1;
const CACHE_NAME = `repair-app-v${CACHE_VERSION}`;

const SCOPE = self.registration.scope; // 例如 https://example.github.io/Repair-System/
const SHELL_FILES = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "pwa.js",
  "config.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
].map((path) => new URL(path, SCOPE).href);

const SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(SHELL_FILES);
      // CDN 載入失敗不影響安裝，之後線上使用時會再補快取
      try {
        await cache.add(new Request(SUPABASE_JS, { mode: "cors" }));
      } catch (err) {
        // 忽略
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("repair-app-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// 網路優先：連得上就拿最新版並更新快取，離線時才用快取
async function networkFirst(request, cacheKey) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(cacheKey, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  url.hash = "";
  const plain = url.origin + url.pathname; // 去掉查詢字串

  // 首頁（/Repair-System/ 或 /Repair-System/index.html）
  if (plain === SCOPE || plain === SCOPE + "index.html") {
    event.respondWith(networkFirst(request, SCOPE + "index.html"));
    return;
  }
  // 其他 app shell 檔案
  if (SHELL_FILES.includes(plain)) {
    event.respondWith(networkFirst(request, plain));
    return;
  }
  // supabase-js 函式庫
  if (url.href === SUPABASE_JS) {
    event.respondWith(networkFirst(request, SUPABASE_JS));
    return;
  }
  // 其餘請求（包含 Supabase API）不處理，照常連線
});
