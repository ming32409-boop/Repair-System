-- =====================================================================
-- 報修登記系統：Supabase 建表 SQL
-- 資料表：public.repair_requests
--
-- 安全設計分三層：
--   1. GRANT：決定 anon 角色「能碰哪些資料表、哪些欄位、做哪些動作」
--   2. RLS  ：決定 anon 角色「能讀寫哪幾列資料」
--   3. CHECK：不管是誰寫入，資料本身都必須符合欄位值與長度限制
--
-- 使用方式：在 Supabase Dashboard → SQL Editor 貼上整份檔案後執行。
-- 本檔可重複執行（資料表已存在時不會重建，政策會先刪除再建立）。
-- =====================================================================


-- ---------------------------------------------------------------------
-- 建立資料表與 CHECK 限制（第 3 層）
-- ---------------------------------------------------------------------
create table if not exists public.repair_requests (
  -- 主鍵：由資料庫自動產生 UUID，前端不能指定
  id            uuid        primary key default gen_random_uuid(),

  -- 建立時間：由資料庫自動產生，前端不能指定
  created_at    timestamptz not null default now(),

  -- 報修人姓名：必填，去除前後空白後不可為空，最多 50 字
  reporter_name text        not null
    constraint repair_requests_reporter_name_check
    check (char_length(btrim(reporter_name)) between 1 and 50),

  -- 地點或部門：必填，去除前後空白後不可為空，最多 100 字
  location      text        not null
    constraint repair_requests_location_check
    check (char_length(btrim(location)) between 1 and 100),

  -- 類別：必填，只能是 設備／網路／環境／其他
  category      text        not null
    constraint repair_requests_category_check
    check (category in ('設備', '網路', '環境', '其他')),

  -- 問題說明：必填，去除前後空白後不可為空，最多 1000 字
  description   text        not null
    constraint repair_requests_description_check
    check (char_length(btrim(description)) between 1 and 1000),

  -- 緊急程度：只能是 低／中／高，未填時預設「中」
  urgency       text        not null default '中'
    constraint repair_requests_urgency_check
    check (urgency in ('低', '中', '高')),

  -- 處理狀態：只能是 待處理／處理中／已完成，預設「待處理」
  status        text        not null default '待處理'
    constraint repair_requests_status_check
    check (status in ('待處理', '處理中', '已完成'))
);

comment on table  public.repair_requests               is '報修登記（示範資料，全為虛構）';
comment on column public.repair_requests.id            is '主鍵，自動產生';
comment on column public.repair_requests.created_at    is '登記時間，自動產生';
comment on column public.repair_requests.reporter_name is '報修人姓名（示範請用虛構姓名）';
comment on column public.repair_requests.location      is '地點或部門（示範請用虛構地點）';
comment on column public.repair_requests.category      is '類別：設備／網路／環境／其他';
comment on column public.repair_requests.description   is '問題說明';
comment on column public.repair_requests.urgency       is '緊急程度：低／中／高，預設中';
comment on column public.repair_requests.status        is '處理狀態：待處理／處理中／已完成，預設待處理';

-- 清單依建立時間由新到舊排序時使用的索引
create index if not exists repair_requests_created_at_idx
  on public.repair_requests (created_at desc);


-- ---------------------------------------------------------------------
-- 第 1 層：GRANT 權限
-- 先收回所有權限，再只開放需要的部分。
-- ---------------------------------------------------------------------

-- 收回 anon（未登入的訪客）與 authenticated（已登入使用者）的所有權限，
-- 避免任何預設權限讓他們能修改或刪除資料。
revoke all on table public.repair_requests from anon, authenticated;

-- anon 需要能使用 public schema 才能存取裡面的資料表
grant usage on schema public to anon;

-- anon 可以讀取整張表（清單頁需要顯示所有欄位）
grant select on table public.repair_requests to anon;

-- anon 只能在新增時填寫這五個欄位。
-- id、created_at、status 不開放：一律使用資料庫預設值，
-- 前端若嘗試指定這三個欄位，會直接被拒絕（permission denied）。
grant insert (reporter_name, location, category, description, urgency)
  on table public.repair_requests to anon;

-- 刻意不授予 update、delete、truncate：anon 無法修改或刪除任何資料。


-- ---------------------------------------------------------------------
-- 第 2 層：RLS 資料列安全
-- 啟用後，沒有政策允許的動作一律拒絕。
-- ---------------------------------------------------------------------
alter table public.repair_requests enable row level security;

-- 讀取政策：任何人都可以讀取全部清單
drop policy if exists "anon_can_read_all" on public.repair_requests;
create policy "anon_can_read_all"
  on public.repair_requests
  for select
  to anon
  using (true);

-- 新增政策：任何人都可以新增，但處理狀態必須是「待處理」。
-- （GRANT 已經不讓 anon 填寫 status，這裡再加一道防線，
--   就算日後有人誤開 status 的寫入權限，也只能寫入「待處理」。）
drop policy if exists "anon_can_insert_pending" on public.repair_requests;
create policy "anon_can_insert_pending"
  on public.repair_requests
  for insert
  to anon
  with check (status = '待處理');

-- 刻意不建立 update、delete 政策：即使有權限，RLS 也會拒絕修改與刪除。
