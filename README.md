報修登記系統
用於登記報修需求並查看報修清單。
雲端任務測試
[報修欄位表（Excel）](文件/報修欄位表.xlsx)

## 網頁前端
- 檔案：`index.html`、`style.css`、`app.js`、`config.js`（純 HTML/CSS/JavaScript，透過 CDN 載入 supabase-js v2）。
- 使用前先在 Supabase SQL Editor 執行 `supabase/schema.sql`。
- 本機預覽：在儲存庫根目錄執行 `python3 -m http.server 8000`，開啟 http://localhost:8000/ 。
- 發佈：GitHub Pages 選擇 `main` 分支的根目錄（/），首頁為 `index.html`。
- `config.js` 只能放 publishable key，不要放 secret 或 service_role 金鑰。

## 安裝成 App（PWA）
- Android（Chrome）：開啟網頁後按「安裝到主畫面」按鈕，或瀏覽器選單的「安裝應用程式」。
- iPhone（Safari）：按「分享」→「加入主畫面」。
- 離線時可以開啟畫面，但不能送出或更新清單；報修資料不會被快取。
- 修改 `index.html`、`style.css`、`app.js`、`pwa.js`、`config.js` 或圖示後，請把 `sw.js` 裡的 `CACHE_VERSION` 加 1，使用者才會拿到新版。

## 相關專案
- 開發部圖面資料申請表已移到獨立的儲存庫：https://github.com/ming32409-boop/drawing-request
