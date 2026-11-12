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
