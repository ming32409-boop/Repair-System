// 報修登記前端邏輯
(function () {
  "use strict";

  var TABLE = "repair_requests";
  var LIST_LIMIT = 20;
  var CATEGORIES = ["設備", "網路", "環境", "其他"];
  var URGENCIES = ["低", "中", "高"];
  // 與 supabase/schema.sql 的 CHECK 限制一致
  var MAX_LENGTH = { reporter_name: 50, location: 100, description: 1000 };

  var form = document.getElementById("repair-form");
  var submitBtn = document.getElementById("submit-btn");
  var formMessage = document.getElementById("form-message");
  var listEl = document.getElementById("repair-list");
  var listMessage = document.getElementById("list-message");
  var refreshBtn = document.getElementById("refresh-btn");
  var descInput = document.getElementById("description");
  var descCount = document.getElementById("description-count");

  var client = createClient();

  function createClient() {
    var cfg = window.APP_CONFIG || {};
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      return null;
    }
    if (!cfg.supabaseUrl || !cfg.supabaseKey) {
      return null;
    }
    return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  function showMessage(el, type, text) {
    el.className = "message " + type;
    el.textContent = text;
    el.hidden = false;
  }

  function hideMessage(el) {
    el.hidden = true;
    el.textContent = "";
  }

  // 把 Supabase／網路錯誤轉成看得懂的中文
  function describeError(error) {
    if (!error) return "發生未知錯誤，請稍後再試。";
    var code = error.code || "";
    var msg = String(error.message || "");
    if (code === "42501") return "沒有權限執行這個動作，請確認資料庫權限設定。";
    if (code === "23514") return "資料格式不符合規定，請檢查欄位內容。";
    if (code === "42P01" || code === "PGRST205") return "找不到報修資料表，請確認資料庫已建立。";
    if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) {
      return "無法連線到伺服器，請檢查網路後再試。";
    }
    return "操作失敗：" + (msg || code || "未知錯誤");
  }

  function setFieldError(name, text) {
    var input = form.elements[name];
    var errEl = document.getElementById(name + "-error");
    if (errEl) errEl.textContent = text || "";
    if (input) {
      input.classList.toggle("invalid", Boolean(text));
      input.setAttribute("aria-invalid", text ? "true" : "false");
    }
  }

  // 前端驗證：必填、長度、選項值
  function readAndValidate() {
    var data = {
      reporter_name: form.elements.reporter_name.value.trim(),
      location: form.elements.location.value.trim(),
      category: form.elements.category.value,
      description: form.elements.description.value.trim(),
      urgency: form.elements.urgency.value,
    };
    var errors = {};

    if (!data.reporter_name) errors.reporter_name = "請填寫報修人。";
    else if (data.reporter_name.length > MAX_LENGTH.reporter_name)
      errors.reporter_name = "報修人最多 " + MAX_LENGTH.reporter_name + " 字。";

    if (!data.location) errors.location = "請填寫地點或部門。";
    else if (data.location.length > MAX_LENGTH.location)
      errors.location = "地點或部門最多 " + MAX_LENGTH.location + " 字。";

    if (CATEGORIES.indexOf(data.category) === -1) errors.category = "請選擇類別。";

    if (!data.description) errors.description = "請填寫問題說明。";
    else if (data.description.length > MAX_LENGTH.description)
      errors.description = "問題說明最多 " + MAX_LENGTH.description + " 字。";

    if (URGENCIES.indexOf(data.urgency) === -1) errors.urgency = "請選擇緊急程度。";

    ["reporter_name", "location", "category", "description", "urgency"].forEach(function (k) {
      setFieldError(k, errors[k]);
    });

    return { data: data, errors: errors };
  }

  function updateCount() {
    descCount.textContent = String(descInput.value.length);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    hideMessage(formMessage);

    var result = readAndValidate();
    var firstError = Object.keys(result.errors)[0];
    if (firstError) {
      showMessage(formMessage, "error", "請修正標示紅字的欄位。");
      form.elements[firstError].focus();
      return;
    }
    if (!client) {
      showMessage(formMessage, "error", "系統設定錯誤：無法載入 Supabase，請稍後再試。");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "送出中…";
    try {
      // 只送五個欄位；id、created_at、status 由資料庫自動產生
      var res = await client.from(TABLE).insert(result.data);
      if (res.error) {
        showMessage(formMessage, "error", describeError(res.error));
        return;
      }
      form.reset();
      form.elements.urgency.value = "中";
      updateCount();
      showMessage(formMessage, "success", "已送出報修，謝謝！");
      loadList();
    } catch (err) {
      showMessage(formMessage, "error", describeError(err));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "送出報修";
    }
  }

  var timeFormatter = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  function formatTime(value) {
    var d = new Date(value);
    return isNaN(d.getTime()) ? "" : timeFormatter.format(d);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text; // 用 textContent 避免 XSS
    return node;
  }

  function renderList(rows) {
    listEl.replaceChildren();
    if (!rows.length) {
      showMessage(listMessage, "info", "目前還沒有報修資料。");
      return;
    }
    hideMessage(listMessage);
    rows.forEach(function (row) {
      var li = el("li", "repair-item");
      var top = el("div", "item-top");
      top.appendChild(el("span", "badge", row.category));
      top.appendChild(el("span", "badge urgency-" + row.urgency, "緊急：" + row.urgency));
      top.appendChild(el("span", "badge status", row.status));
      li.appendChild(top);
      li.appendChild(el("p", "item-desc", row.description));
      li.appendChild(
        el("p", "item-meta", row.reporter_name + "｜" + row.location + "｜" + formatTime(row.created_at))
      );
      listEl.appendChild(li);
    });
  }

  async function loadList() {
    if (!client) {
      showMessage(listMessage, "error", "系統設定錯誤：無法載入 Supabase，請稍後再試。");
      return;
    }
    refreshBtn.disabled = true;
    if (!listEl.children.length) showMessage(listMessage, "info", "載入中…");
    try {
      var res = await client
        .from(TABLE)
        .select("id, created_at, reporter_name, location, category, description, urgency, status")
        .order("created_at", { ascending: false })
        .limit(LIST_LIMIT);
      if (res.error) {
        showMessage(listMessage, "error", "無法載入清單：" + describeError(res.error));
        return;
      }
      renderList(res.data || []);
    } catch (err) {
      showMessage(listMessage, "error", "無法載入清單：" + describeError(err));
    } finally {
      refreshBtn.disabled = false;
    }
  }

  form.addEventListener("submit", handleSubmit);
  descInput.addEventListener("input", updateCount);
  refreshBtn.addEventListener("click", loadList);
  ["reporter_name", "location", "category", "description", "urgency"].forEach(function (k) {
    form.elements[k].addEventListener("input", function () { setFieldError(k, ""); });
  });

  updateCount();
  loadList();
})();
