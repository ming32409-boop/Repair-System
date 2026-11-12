// PWA：註冊 Service Worker、顯示離線提示、提供「安裝到主畫面」按鈕
(function () {
  "use strict";

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function (err) {
        console.warn("Service Worker 註冊失敗：", err);
      });
    });
  }

  var banner = document.getElementById("offline-banner");
  function updateOnline() {
    banner.hidden = navigator.onLine;
  }
  window.addEventListener("online", updateOnline);
  window.addEventListener("offline", updateOnline);
  updateOnline();

  // Android／電腦版 Chrome、Edge 會觸發 beforeinstallprompt；iPhone 需用 Safari「分享 → 加入主畫面」
  var installBtn = document.getElementById("install-btn");
  var deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredPrompt = event;
    installBtn.hidden = false;
  });
  installBtn.addEventListener("click", async function () {
    if (!deferredPrompt) return;
    installBtn.hidden = true;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
  });
  window.addEventListener("appinstalled", function () {
    installBtn.hidden = true;
  });
})();
