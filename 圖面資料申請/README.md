# 開發部圖面資料申請表

需求見 [需求筆記.txt](需求筆記.txt)，專案規則見 [AGENTS.md](AGENTS.md)。

## 架構
- 網頁：GitHub Pages，在 LINE 裡用 LIFF 開啟（製作中）
- 登入：LINE Login
- 資料庫：Supabase（`supabase/schema.sql`）
- 通知：LINE 官方帳號（Messaging API），由 Supabase Edge Functions 發送（製作中）

## 公開設定值
這些值本來就會出現在網頁裡，可以公開：

| 項目 | 值 |
|---|---|
| Supabase Project URL | `https://xpluguqndjgkzolvixxc.supabase.co` |
| Supabase publishable key | `sb_publishable_jFlA-xp8-tYgpBEQykYY4g_GdYBB8Au` |
| LINE Login Channel ID | `2012594772` |
| LIFF ID | `2012594772-22NJxRHt` |

Supabase secret key、LINE Channel secret、Channel access token **不可以**寫進任何檔案，只能存在 Supabase 後台的機密設定。

## 建立資料庫
1. Supabase Dashboard → **SQL Editor** → **New query**。
2. 貼上 `supabase/schema.sql` 全部內容，按 **Run**。
3. 這份檔案只能在全新專案執行一次。

### 資料庫重點
- 未登入的訪客沒有任何權限。
- 前端只能讀資料；新增、簽核、撤回、發放都要呼叫資料庫函式：
  - `submit_request(...)`：送出申請，回傳單號 `DOC-yyyyMMdd-001`
  - `review_request(申請單id, 核准true/駁回false, 駁回原因)`：自動判斷是第一關或第二關
  - `withdraw_request(申請單id)`：第一關簽核前撤回
  - `deliver_request(申請單id, 發放方式, 其他說明)`：文管發放結案
  - `request_stats()`：統計儀表板
- 每個動作寫入 `request_events`；要發的 LINE 通知寫入 `notifications`，由後端發送。

## 測試
在本機 PostgreSQL 上模擬 Supabase 的角色，測試權限與簽核流程：

```bash
圖面資料申請/tests/run_db_tests.sh
```

預設連 `localhost:5432`、使用者 `postgres`，可用 `PGHOST`、`PGPORT`、`PGUSER` 調整。測試會建立暫時資料庫，結束後自動刪除。
