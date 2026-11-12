// Supabase 連線設定
// publishable key 本來就會公開在網頁裡，可以上傳到 GitHub。
// 資料安全靠資料庫的 GRANT 與 RLS（見 supabase/schema.sql）。
// 絕對不要把 secret 金鑰或 service_role 金鑰放在這裡。
window.APP_CONFIG = {
  supabaseUrl: "https://mwqdnmqgfwhbnlxffenh.supabase.co",
  supabaseKey: "sb_publishable_WiTUD4dtF3n2Wy1c-_E2cQ_ihTWhrNL",
};
