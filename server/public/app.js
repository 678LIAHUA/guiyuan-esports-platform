const state = {
  token: localStorage.getItem("cs_token") || "",
  user: null,
  sessions: [],
  messages: [],
  staff: [],
  quickReplies: [],
  serviceCards: [],
  settings: {},
  catalog: {},
  orders: [],
  activeCustomer: null,
  activeCustomerBills: [],
  activeModule: "chat",
  inboxFilter: "all",
  activeSessionId: "",
  selectedCardId: "",
  accountAvatarDraft: ""
};

const $ = (id) => document.getElementById(id);

function authHeaders() {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "请求失败");
  const method = String(options.method || "GET").toUpperCase();
  if (method !== "GET" && !path.includes("/login")) {
    const label = apiActionLabel(path, method);
    if (label) window.setTimeout(() => showToast(label), 0);
  }
  return data;
}

function apiActionLabel(path, method = "GET") {
  const upper = String(method || "GET").toUpperCase();
  if (upper === "GET") return "";
  if (path.includes("/messages")) return "消息已发送";
  if (path.includes("/quick-replies")) return "快捷话术已更新";
  if (path.includes("/orders")) return "订单已更新";
  if (path.includes("/customer-wallet") || path.includes("/balance")) return "余额已更新";
  if (path.includes("/sessions")) return "会话已更新";
  if (path.includes("/me/password")) return "密码已修改";
  if (path.includes("/me")) return "账号已保存";
  return "操作成功";
}

function formatTime(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(String(value))) {
    return String(value).slice(5, 16);
  }
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date).reduce((map, part) => {
    map[part.type] = part.value;
    return map;
  }, {});
  const month = parts.month || "01";
  const day = parts.day || "01";
  const hour = parts.hour || "00";
  const minute = parts.minute || "00";
  return `${month}-${day} ${hour}:${minute}`;
}

function formatDateTime(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(String(value))) {
    return String(value).slice(0, 16);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date).reduce((map, part) => {
    map[part.type] = part.value;
    return map;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

function statusLabel(value) {
  return {
    open: "接待中",
    pending: "待跟进",
    closed: "已关闭",
    processing: "处理中",
    resolved: "已解决",
    cancelled: "已取消",
    confirmed: "已确认",
    completed: "已完成"
  }[value] || value;
}

function orderStatusClass(status) {
  return {
    "待确认": "pending",
    "已确认": "confirmed",
    "已完成": "completed",
    "已取消": "cancelled"
  }[status] || "pending";
}

function money(value) {
  const amount = Number((Number(value || 0) / 10).toFixed(2));
  return `￥${Number.isInteger(amount) ? amount.toFixed(0) : amount.toString()}`;
}

function rmbToToken(value) {
  return Number((Number(value || 0) * 10).toFixed(2));
}

function signedMoney(value) {
  const amount = Number(value || 0);
  return `${amount >= 0 ? "+" : "-"}${money(Math.abs(amount))}`;
}

function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

let toastTimer = null;

function showToast(text) {
  const toast = $("toast");
  if (!toast) return;
  toast.textContent = text;
  toast.classList.remove("hidden");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.add("hidden"), 1800);
}

function accountInitial(name) {
  return String(name || "客服").trim().slice(0, 1) || "客";
}

function paintAvatar(element, avatar, name) {
  if (!element) return;
  element.style.backgroundImage = "";
  element.classList.toggle("has-image", Boolean(avatar));
  if (avatar) {
    element.textContent = "";
    element.style.backgroundImage = `url("${avatar}")`;
  } else {
    element.textContent = accountInitial(name);
  }
}

function renderAccount() {
  const user = state.user || {};
  if ($("accountName")) $("accountName").textContent = user.name || "客服";
  if ($("accountUsername")) $("accountUsername").textContent = user.username || "";
  if ($("onlineToggleBtn")) {
    const online = user.isOnline !== false;
    $("onlineToggleBtn").classList.toggle("offline", !online);
    $("onlineToggleText").textContent = online ? "在线" : "离线";
  }
  paintAvatar($("accountAvatar"), user.avatar, user.name);
  paintAvatar($("accountModalAvatar"), state.accountAvatarDraft || user.avatar, user.name);
}

async function toggleOnline() {
  const current = state.user ? state.user.isOnline !== false : true;
  const data = await api("/api/me/online", {
    method: "PATCH",
    body: JSON.stringify({ isOnline: !current })
  });
  state.user = data.user;
  renderAccount();
  showToast((state.user.isOnline !== false) ? "已切换为在线" : "已切换为离线");
}

function openAccountModal() {
  const user = state.user || {};
  state.accountAvatarDraft = user.avatar || "";
  $("accountDisplayName").value = user.name || "";
  $("accountLoginName").value = user.username || "";
  $("oldPasswordInput").value = "";
  $("newPasswordInput").value = "";
  $("confirmPasswordInput").value = "";
  renderAccount();
  $("accountModal").showModal();
}

function closeAccountModal() {
  $("accountModal").close();
}

function readAvatarFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve("");
    if (file.size > 800 * 1024) return reject(new Error("头像文件不能超过 800KB"));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("头像读取失败"));
    reader.readAsDataURL(file);
  });
}

async function saveAccountProfile() {
  const name = $("accountDisplayName").value.trim();
  if (!name) {
    showToast("客服名称不能为空");
    return;
  }
  try {
    const data = await api("/api/me", {
      method: "PATCH",
      body: JSON.stringify({
        name,
        avatar: state.accountAvatarDraft || ""
      })
    });
    state.user = data.user;
    renderAccount();
    showToast("账号资料已保存");
  } catch (error) {
    showToast(error.message);
  }
}

async function savePassword() {
  const oldPassword = $("oldPasswordInput").value;
  const newPassword = $("newPasswordInput").value;
  const confirmPassword = $("confirmPasswordInput").value;
  if (newPassword.length < 6) {
    showToast("新密码至少 6 位");
    return;
  }
  if (newPassword !== confirmPassword) {
    showToast("两次新密码不一致");
    return;
  }
  try {
    await api("/api/me/password", {
      method: "PATCH",
      body: JSON.stringify({ oldPassword, newPassword })
    });
    $("oldPasswordInput").value = "";
    $("newPasswordInput").value = "";
    $("confirmPasswordInput").value = "";
    showToast("密码已修改");
  } catch (error) {
    showToast(error.message);
  }
}

function showApp() {
  $("loginView").classList.add("hidden");
  $("appView").classList.remove("hidden");
}

function showLogin() {
  $("appView").classList.add("hidden");
  $("loginView").classList.remove("hidden");
}

async function login(event) {
  event.preventDefault();
  $("loginError").textContent = "";
  try {
    const data = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({
        username: $("username").value.trim(),
        password: $("password").value
      })
    });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem("cs_token", state.token);
    showApp();
    await boot();
  } catch (error) {
    $("loginError").textContent = error.message;
  }
}

async function boot() {
  const dashboard = await api("/api/dashboard");
  state.staff = dashboard.staff;
  state.quickReplies = dashboard.quickReplies;
  state.serviceCards = dashboard.serviceCards;
  state.settings = dashboard.settings || {};
  state.catalog = dashboard.catalog || {};
  mountStaffOrderPanel();
  renderAccount();
  renderStats(dashboard.stats);
  renderQuickReplies();
  renderQuickReplyManager();
  renderServiceCards();
  renderStaffOrderForm();
  renderWorkbenchAside(dashboard.stats);
  await Promise.all([loadSessions(), loadOrders()]);
  if (state.activeModule === "chat" && !state.activeSessionId && state.sessions[0]) {
    await selectSession(state.sessions[0].id);
  } else {
    switchModule(state.activeModule);
  }
}

function renderStats(stats) {
  $("stats").innerHTML = [
    ["群聊中", stats.openSessions],
    ["未读消息", stats.unread],
    ["等待回复", stats.waiting],
    ["超时提醒", stats.overdue],
    ["待确认订单", stats.pendingOrders],
    ["今日订单", stats.todayOrders]
  ].map(([label, value]) => `
    <article class="stat-card">
      <strong>${value}</strong>
      <span>${label}</span>
    </article>
  `).join("");
}

function switchModule(moduleName) {
  state.activeModule = moduleName;
  const showChatDetail = moduleName === "chat" && Boolean(state.activeSessionId);
  document.body.classList.toggle("has-active-chat", showChatDetail);
  $("chatModule").classList.toggle("hidden", moduleName !== "chat");
  $("chatDetailModule").classList.toggle("hidden", !showChatDetail);
  $("ordersModule").classList.toggle("hidden", moduleName !== "orders");
  $("staffOrderModule").classList.toggle("hidden", moduleName !== "staffOrder");
  $("chatModuleBtn").classList.toggle("active", moduleName === "chat");
  $("ordersModuleBtn").classList.toggle("active", moduleName === "orders");
  $("staffOrderModuleBtn").classList.toggle("active", moduleName === "staffOrder");
  $("railChatBtn").classList.toggle("active", moduleName === "chat");
  $("railOrdersBtn").classList.toggle("active", moduleName === "orders");
  $("railStaffOrderBtn").classList.toggle("active", moduleName === "staffOrder");
  document.querySelectorAll(".support-sub-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.module === moduleName);
  });
  if (moduleName === "orders") renderOrderTable();
  if (moduleName === "staffOrder") {
    syncStaffOrderCustomerFields(activeSession());
    renderStaffOrderForm();
  }
}

function renderQuickReplies() {
  $("quickReplies").innerHTML = state.quickReplies.map((text) => (
    `<button type="button" data-text="${escapeHtml(text)}">${escapeHtml(text)}</button>`
  )).join("");
}

function renderServiceCards() {
  $("serviceCards").innerHTML = state.serviceCards.map((card) => `
    <article class="service-card">
      <div class="item-title">${escapeHtml(card.title)}</div>
      <div class="item-meta">${escapeHtml(card.desc)}<br />${escapeHtml(card.price)}</div>
      <button class="soft-btn" data-card="${card.id}">选中并发送</button>
    </article>
  `).join("");
}

function mountStaffOrderPanel() {
  const mount = $("staffOrderMount");
  const panel = document.querySelector(".staff-order-card");
  if (mount && panel && panel.parentElement !== mount) mount.appendChild(panel);
}

function renderWorkbenchAside(stats = {}) {
  if (!$("todayTodoList")) return;
  const unread = state.sessions.reduce((sum, item) => sum + Number(item.unreadStaff || 0), 0);
  const waiting = state.sessions.filter((item) => item.slaStatus === "waiting" || item.slaStatus === "overdue").length;
  $("todayTodoList").innerHTML = [
    ["未读会话", unread, unread ? "需要尽快回复" : "当前清爽"],
    ["待回复", waiting, waiting ? "注意超时队列" : "无等待用户"],
    ["超时提醒", stats.overdue ?? state.sessions.filter((item) => item.slaStatus === "overdue").length, "超过 SLA 的群消息"]
  ].map(([label, value, desc]) => `
    <div class="todo-item">
      <strong>${value}</strong>
      <span>${label}</span>
      <small>${desc}</small>
    </div>
  `).join("");

  const pendingOrders = state.orders.filter((order) => order.status === "待确认").length;
  const confirmedOrders = state.orders.filter((order) => order.status === "已确认").length;
  const totalRevenue = state.orders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
  $("orderTodoList").innerHTML = [
    ["待确认", pendingOrders, "需要跟用户确认档期"],
    ["已确认", confirmedOrders, "等待服务完成"],
    ["订单收入", money(totalRevenue), "当前筛选前总额"]
  ].map(([label, value, desc]) => `
    <div class="todo-item">
      <strong>${escapeHtml(value)}</strong>
      <span>${label}</span>
      <small>${desc}</small>
    </div>
  `).join("");
}

function renderQuickReplyManager() {
  $("quickReplyManager").innerHTML = state.quickReplies.map((text, index) => `
    <article class="quick-manager-item">
      <textarea data-quick-edit="${index}">${escapeHtml(text)}</textarea>
      <div class="inline-actions">
        <button class="mini-btn" data-quick-save="${index}">保存</button>
        <button class="mini-btn danger" data-quick-delete="${index}">删除</button>
      </div>
    </article>
  `).join("") || `<div class="item-meta">暂无快捷话术</div>`;
}

async function loadSessions() {
  const data = await api("/api/sessions");
  state.sessions = data.sessions;
  renderSessions();
  renderWorkbenchAside();
  if (state.activeSessionId && !activeSession()) state.activeSessionId = "";
  renderChatShell();
}

function filteredSessions() {
  const keyword = $("sessionSearch").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  return state.sessions.filter((session) => {
    const text = `${session.title}${session.userName}${session.channel}${(session.tags || []).join("")}`.toLowerCase();
    const matchKeyword = !keyword || text.includes(keyword);
    const matchStatus = status === "all" || session.status === status;
    const matchInbox = state.inboxFilter === "all"
      || (state.inboxFilter === "unread" && Number(session.unreadStaff || 0) > 0)
      || (state.inboxFilter === "waiting" && session.slaStatus === "waiting")
      || (state.inboxFilter === "overdue" && session.slaStatus === "overdue");
    return matchKeyword && matchStatus && matchInbox;
  });
}

function renderSessions() {
  const sessions = filteredSessions();
  $("sessionList").innerHTML = sessions.map((session) => `
    <button class="session-item ${session.id === state.activeSessionId ? "active" : ""}" data-session="${session.id}">
      <div class="session-row">
        <div class="session-title">${escapeHtml(session.title)}</div>
        ${session.slaStatus === "overdue" ? `<span class="sla-pill overdue">${session.waitingMinutes}m</span>` : ""}
        ${session.slaStatus === "waiting" ? `<span class="sla-pill">${session.waitingMinutes}m</span>` : ""}
        ${session.unreadStaff ? `<span class="badge">${session.unreadStaff}</span>` : ""}
      </div>
      <div class="session-meta">
        ${escapeHtml(session.userName)} · ${escapeHtml(session.channel)} · ${formatTime(session.lastMessageAt)}
      </div>
      <div class="session-tags">
        <span>${statusLabel(session.status)}</span>
        ${(session.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <div class="session-foot">
        <span>最近消息 ${formatTime(session.lastMessageAt)}</span>
        <span>进入沟通</span>
      </div>
    </button>
  `).join("") || `<div class="empty-state">没有匹配会话</div>`;
}

function activeSession() {
  return state.sessions.find((item) => item.id === state.activeSessionId);
}

async function selectSession(id) {
  state.activeSessionId = id;
  state.activeModule = "chat";
  const session = activeSession();
  if (!session) return;
  $("chatModule").classList.remove("hidden");
  $("chatDetailModule").classList.remove("hidden");
  $("ordersModule").classList.add("hidden");
  $("staffOrderModule").classList.add("hidden");
  renderChatShell();
  $("chatChannel").textContent = session.channel;
  $("chatTitle").textContent = session.title;
  $("chatMeta").textContent = `${session.userName} · ${session.tags.join(" / ")} · ${statusLabel(session.status)}`;
  $("statusSelect").value = session.status || "open";
  renderCustomerProfile(session);
  renderRelatedOrders(session);
  renderSessions();
  await loadMessages();
}

function renderChatShell() {
  const hasSession = state.activeModule === "chat" && !!activeSession();
  document.body.classList.toggle("has-active-chat", hasSession);
  ["replyInput", "sendBtn", "sendCardBtn", "statusSelect"].forEach((id) => {
    const element = $(id);
    if (element) element.disabled = !hasSession;
  });
  if (hasSession) return;
  $("chatDetailModule").classList.add("hidden");
  if (state.activeModule === "chat") $("chatModule").classList.remove("hidden");
  $("chatChannel").textContent = "小程序群聊";
  $("chatTitle").textContent = "请选择会话";
  $("chatMeta").textContent = "先从左侧选择一个群聊，再进入沟通。";
  $("messageList").innerHTML = `
    <div class="empty-state chat-empty">
      <strong>请选择群聊</strong>
      <span>左侧是全部小程序群聊和咨询会话，点进来后再沟通。</span>
    </div>
  `;
  $("profileUserId").value = "";
  $("profileName").value = "";
  $("profileContact").value = "";
  $("profileTags").value = "";
  $("profileRemark").value = "";
  state.activeCustomer = null;
  state.activeCustomerBills = [];
  renderCustomerWallet();
  $("slaBox").innerHTML = `<div class="sla"><strong>未选择群聊</strong><span>选择左侧群聊后显示客户资料和接待信息。</span></div>`;
  $("orderList").innerHTML = `<div class="item-meta">选择群聊后显示关联订单</div>`;
}

function backToChatList() {
  state.activeSessionId = "";
  state.messages = [];
  $("chatDetailModule").classList.add("hidden");
  $("chatModule").classList.remove("hidden");
  renderSessions();
  renderChatShell();
}

function renderCustomerProfile(session) {
  $("profileUserId").value = session.userId || "";
  $("profileName").value = session.userName || "";
  $("profileContact").value = session.contact || "";
  $("profileTags").value = (session.tags || []).join("，");
  $("profileRemark").value = session.remark || "";
  state.activeCustomer = null;
  state.activeCustomerBills = [];
  renderCustomerWallet();
  syncStaffOrderCustomerFields(session);
  loadCustomerWallet(session.userId || "");
  const slaClass = session.slaStatus === "overdue" ? "overdue" : session.slaStatus === "waiting" ? "waiting" : "ok";
  const slaText = session.slaStatus === "overdue"
    ? `已等待 ${session.waitingMinutes} 分钟，建议优先回复`
    : session.slaStatus === "waiting"
      ? `用户等待 ${session.waitingMinutes} 分钟`
      : "当前无等待用户消息";
  $("slaBox").innerHTML = `
    <div class="sla ${slaClass}">
      <strong>${slaText}</strong>
      <span>首次进入 ${formatTime(session.firstSeenAt)} · 最近消息 ${formatTime(session.lastMessageAt)}</span>
    </div>
  `;
}

function renderCustomerWallet() {
  if (!$("customerBalanceText") || !$("customerBillMiniList")) return;
  const customer = state.activeCustomer || {};
  const bills = state.activeCustomerBills || [];
  $("customerBalanceText").textContent = money(customer.balanceCatFood || 0);
  updateStaffOrderBalanceInfo();
  $("customerBillMiniList").innerHTML = bills.slice(0, 4).map((bill) => `
    <div class="customer-bill-mini">
      <span>${escapeHtml(bill.title || "余额变动")}</span>
      <strong>${signedMoney(bill.amount || 0)}</strong>
      <small>${escapeHtml(bill.note || "")}</small>
    </div>
  `).join("") || `<div class="item-meta">暂无账单流水</div>`;
}

async function loadCustomerWallet(userId = $("profileUserId")?.value.trim()) {
  const id = String(userId || "").trim();
  if (!id) {
    state.activeCustomer = null;
    state.activeCustomerBills = [];
    renderCustomerWallet();
    return;
  }
  try {
    const data = await api(`/api/customers/${encodeURIComponent(id)}`);
    state.activeCustomer = data.customer;
    state.activeCustomerBills = data.bills || [];
    renderCustomerWallet();
  } catch (error) {
    showToast(error.message);
  }
}

async function adjustCustomerBalance() {
  const userId = $("profileUserId").value.trim();
  const amount = rmbToToken($("customerBalanceAmount").value || 0);
  const note = $("customerBalanceNote").value.trim();
  if (!userId) return showToast("请输入客户ID");
  if (!Number.isFinite(amount) || amount <= 0) return showToast("请输入要充值的人民币金额");
  try {
    const data = await api("/api/customers/balance", {
      method: "POST",
      body: JSON.stringify({
        userId,
        userName: $("profileName").value.trim() || "小程序用户",
        contact: $("profileContact").value.trim(),
        amount,
        note: note || `${state.user?.name || "客服"}后台充值`
      })
    });
    state.activeCustomer = data.customer;
    state.activeCustomerBills = data.bills || [];
    $("customerBalanceAmount").value = "";
    $("customerBalanceNote").value = "";
    renderCustomerWallet();
    showToast("客户余额已添加");
  } catch (error) {
    showToast(error.message);
  }
}

function staffOrderMode() {
  return document.querySelector('input[name="staffOrderMode"]:checked')?.value || "customer_balance";
}

function catalogOrderItems() {
  return (state.catalog && Array.isArray(state.catalog.orderItems)) ? state.catalog.orderItems : [];
}

function visibleSorted(list = []) {
  return (Array.isArray(list) ? list : [])
    .filter((item) => item && item.visible !== false)
    .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
}

function catalogSkills() {
  const quick = state.catalog?.quickMatchConfig || {};
  const skills = visibleSorted(quick.skills || []);
  if (skills.length) return skills;
  return visibleSorted(state.catalog?.games || []).filter((game) => game.id !== "all");
}

function selectedStaffOrderSkill() {
  const id = $("staffOrderSkillSelect")?.value || "";
  return catalogSkills().find((item) => item.id === id) || catalogSkills()[0] || null;
}

function staffOrderPlaysForSkill(skill = selectedStaffOrderSkill()) {
  return visibleSorted(skill?.plays || []);
}

function selectedStaffOrderPlay() {
  const plays = staffOrderPlaysForSkill();
  const id = $("staffOrderPlaySelect")?.value || "";
  return plays.find((item) => item.id === id) || plays[0] || null;
}

function staffOrderItemsForSkill(skill = selectedStaffOrderSkill()) {
  const skillId = skill?.id || "";
  const items = catalogOrderItems().filter((item) => item.visible !== false);
  if (!skillId) return items;
  const linked = items.filter((item) => item.gameId === skillId || item.skillId === skillId || item.game === skillId);
  return linked.length ? linked : items;
}

function selectedStaffOrderItem() {
  const id = $("staffOrderItemSelect")?.value || "";
  return staffOrderItemsForSkill().find((item) => item.id === id) || null;
}

function selectedStaffOrderTier() {
  const item = selectedStaffOrderItem();
  const play = selectedStaffOrderPlay();
  if (!item && play) return { id: play.id, name: play.name, price: 0, desc: "" };
  if (!item) return null;
  const tiers = Array.isArray(item.priceTiers) && item.priceTiers.length
    ? item.priceTiers
    : [{ id: "default", name: "默认价位", price: item.price || 0, desc: "" }];
  return tiers.find((tier) => tier.id === $("staffOrderTierSelect")?.value) || tiers[0] || null;
}

function syncStaffOrderCustomerFields(session = activeSession()) {
  if (!$("staffOrderCustomerId")) return;
  $("staffOrderCustomerId").value = session?.userId || $("profileUserId")?.value.trim() || $("staffOrderCustomerId").value;
  $("staffOrderContact").value = session?.contact || $("profileContact")?.value.trim() || $("staffOrderContact").value;
  updateStaffOrderBalanceInfo();
}

function renderStaffOrderForm() {
  if (!$("staffOrderItemSelect")) return;
  const skills = catalogSkills();
  if ($("staffOrderSkillSelect")) {
    $("staffOrderSkillSelect").innerHTML = skills.map((skill) => `
      <option value="${escapeHtml(skill.id)}">${escapeHtml(skill.name || skill.id)}</option>
    `).join("") || `<option value="">暂无技能</option>`;
  }
  const items = staffOrderItemsForSkill();
  $("staffOrderItemSelect").innerHTML = items.map((item) => `
    <option value="${escapeHtml(item.id)}">${escapeHtml(item.title || item.name || item.id)}</option>
  `).join("") || `<option value="">暂无小程序订单</option>`;
  updateStaffOrderPlayOptions();
  updateStaffOrderBalanceInfo();
}

function updateStaffOrderPlayOptions() {
  if ($("staffOrderPlaySelect")) {
    const plays = staffOrderPlaysForSkill();
    $("staffOrderPlaySelect").innerHTML = plays.map((play) => `
      <option value="${escapeHtml(play.id)}">${escapeHtml(play.name || play.id)}</option>
    `).join("") || `<option value="">暂无玩法</option>`;
  }
  updateStaffOrderItemOptions();
}

function updateStaffOrderItemOptions() {
  if (!$("staffOrderItemSelect")) return;
  const items = staffOrderItemsForSkill();
  $("staffOrderItemSelect").innerHTML = items.map((item) => `
    <option value="${escapeHtml(item.id)}">${escapeHtml(item.title || item.name || item.id)}</option>
  `).join("") || `<option value="">无商品项，按玩法开单</option>`;
  updateStaffOrderTierOptions();
}

function updateStaffOrderTierOptions() {
  if (!$("staffOrderTierSelect")) return;
  const item = selectedStaffOrderItem();
  const play = selectedStaffOrderPlay();
  const tiers = item && Array.isArray(item.priceTiers) && item.priceTiers.length
    ? item.priceTiers
    : item ? [{ id: "default", name: "默认价位", price: item.price || 0, desc: "" }] : [];
  $("staffOrderTierSelect").innerHTML = tiers.map((tier) => `
    <option value="${escapeHtml(tier.id)}">${escapeHtml(tier.name || tier.id)} · ${money(tier.price || 0)}</option>
  `).join("") || `<option value="">先选择订单</option>`;
  updateStaffOrderSummary();
}

function updateStaffOrderBalanceInfo() {
  if (!$("staffOrderBalanceInfo")) return;
  const id = $("staffOrderCustomerId")?.value.trim() || "";
  const customer = state.activeCustomer;
  if (id && customer && customer.id === id) {
    $("staffOrderBalanceInfo").textContent = `余额 ${money(customer.balanceCatFood || 0)} · ${customer.memberLevelName || "会员"}`;
  } else {
    $("staffOrderBalanceInfo").textContent = id ? "点击查余额确认老板余额" : "先输入老板ID查询余额";
  }
  updateStaffOrderSummary();
}

function updateStaffOrderSummary() {
  if (!$("staffOrderSummary")) return;
  const item = selectedStaffOrderItem();
  const tier = selectedStaffOrderTier();
  if (!item || !tier) {
    $("staffOrderSummary").textContent = "选择订单后显示金额";
    return;
  }
  const duration = Math.max(1, Number($("staffOrderDuration")?.value || 1));
  const unitPrice = Number(tier.price || item.price || 0);
  const originalAmount = Number((unitPrice * (item.orderMode === "random_hour" ? duration : 1)).toFixed(2));
  const modeText = staffOrderMode() === "customer_balance" ? "老板余额扣款" : "私下收钱派单";
  const customer = state.activeCustomer;
  const discount = staffOrderMode() === "customer_balance" && customer ? Number(customer.memberDiscount || 100) : 100;
  const payable = Number((originalAmount * discount / 100).toFixed(2));
  $("staffOrderSummary").textContent = `${modeText} · 原价 ${money(originalAmount)} · 实扣/记录 ${money(payable)}`;
}

function staffOrderTierOptions() {
  const item = selectedStaffOrderItem();
  const play = selectedStaffOrderPlay();
  if (item && Array.isArray(item.priceTiers) && item.priceTiers.length) return item.priceTiers;
  if (item) return [{ id: "default", name: "默认价位", price: item.price || 0, desc: "" }];
  if (play) return [{ id: play.id, name: play.name || "玩法", price: 0, desc: "" }];
  return [];
}

function updateStaffOrderTierOptions() {
  if (!$("staffOrderTierSelect")) return;
  const tiers = staffOrderTierOptions();
  $("staffOrderTierSelect").innerHTML = tiers.map((tier) => `
    <option value="${escapeHtml(tier.id)}">${escapeHtml(tier.name || tier.id)} · ${money(tier.price || 0)}</option>
  `).join("") || `<option value="">先选择玩法或商品项</option>`;
  updateStaffOrderSummary();
}

function updateStaffOrderSummary() {
  if (!$("staffOrderSummary")) return;
  const item = selectedStaffOrderItem();
  const skill = selectedStaffOrderSkill();
  const play = selectedStaffOrderPlay();
  const tier = selectedStaffOrderTier();
  if (!tier) {
    $("staffOrderSummary").textContent = "选择技能和玩法后显示金额";
    return;
  }
  const duration = Math.max(1, Number($("staffOrderDuration")?.value || 1));
  const unitPrice = Number(tier.price || item?.price || play?.price || 0);
  const orderMode = item?.orderMode || "random_hour";
  const originalAmount = Number((unitPrice * (orderMode === "fixed_tier" ? 1 : duration)).toFixed(2));
  const modeText = staffOrderMode() === "customer_balance" ? "老板余额扣款" : "私下收钱派单";
  const customer = state.activeCustomer;
  const discount = staffOrderMode() === "customer_balance" && customer ? Number(customer.memberDiscount || 100) : 100;
  const payable = Number((originalAmount * discount / 100).toFixed(2));
  const player = selectedStaffOrderPlayer();
  $("staffOrderSummary").textContent = `${modeText} · ${skill?.name || "未选技能"} / ${play?.name || "未选玩法"} · ${player ? `指定 ${player.name || player.id} · ` : ""}原价 ${money(originalAmount)} · 实扣/记录 ${money(payable)}`;
}

function catalogPlayersForStaffOrder() {
  const skill = selectedStaffOrderSkill();
  const skillId = skill?.id || "";
  return visibleSorted(state.catalog?.players || []).filter((player) => !skillId || player.game === skillId || player.skillId === skillId);
}

function selectedStaffOrderPlayer() {
  const id = $("staffOrderPlayerId")?.value || "";
  const keyword = $("staffOrderPlayerSearch")?.value.trim() || $("staffOrderPlayerName")?.value.trim() || "";
  const players = catalogPlayersForStaffOrder();
  return players.find((player) => player.id === id) ||
    players.find((player) => player.id === keyword || player.name === keyword || player.playerNo === keyword) ||
    null;
}

function renderStaffOrderPlayerResults() {
  const box = $("staffOrderPlayerResults");
  if (!box) return;
  const keyword = ($("staffOrderPlayerSearch")?.value || "").trim().toLowerCase();
  if (!keyword) {
    box.innerHTML = "";
    if ($("staffOrderPlayerId")) $("staffOrderPlayerId").value = "";
    updateStaffOrderSummary();
    return;
  }
  const players = catalogPlayersForStaffOrder()
    .filter((player) => `${player.id || ""} ${player.playerNo || ""} ${player.name || ""} ${player.title || ""}`.toLowerCase().includes(keyword))
    .slice(0, 8);
  box.innerHTML = players.map((player) => `
    <button type="button" data-staff-order-player="${escapeHtml(player.id)}">
      <strong>${escapeHtml(player.name || player.id)}</strong>
      <span>${escapeHtml(player.id || "")} · ${escapeHtml(player.title || player.gameName || "")}</span>
    </button>
  `).join("") || `<div class="empty-cell">没有匹配打手</div>`;
  updateStaffOrderSummary();
}

async function lookupStaffOrderCustomer() {
  const id = $("staffOrderCustomerId").value.trim() || $("profileUserId").value.trim();
  if (!id) return showToast("请输入老板ID");
  $("staffOrderCustomerId").value = id;
  await loadCustomerWallet(id);
  showToast("已查询老板余额");
}

async function submitStaffOrder() {
  const item = selectedStaffOrderItem();
  if (!item) return showToast("请选择要代下的订单");
  const mode = staffOrderMode();
  const customerId = $("staffOrderCustomerId").value.trim();
  if (mode === "customer_balance" && !customerId) return showToast("余额扣款必须填写老板ID");
  const tier = selectedStaffOrderTier();
  try {
    const data = await api("/api/staff/orders", {
      method: "POST",
      body: JSON.stringify({
        paymentMode: mode,
        customerId,
        userName: $("profileName").value.trim(),
        contact: $("staffOrderContact").value.trim() || $("profileContact").value.trim(),
        sessionId: state.activeSessionId,
        itemId: item.id,
        tierId: tier?.id || "",
        duration: Number($("staffOrderDuration").value || 1),
        playerName: $("staffOrderPlayerName").value.trim(),
        paymentRemark: $("staffOrderPaymentRemark").value.trim(),
        note: $("staffOrderNote").value.trim()
      })
    });
    state.activeCustomer = data.customer;
    state.activeCustomerBills = data.bills || [];
    renderCustomerWallet();
    await loadOrders();
    showToast(mode === "customer_balance" ? "已扣余额并创建订单" : "已创建私下收款派单");
  } catch (error) {
    showToast(error.message);
  }
}

async function submitStaffOrder() {
  const item = selectedStaffOrderItem();
  const skill = selectedStaffOrderSkill();
  const play = selectedStaffOrderPlay();
  const tier = selectedStaffOrderTier();
  const player = selectedStaffOrderPlayer();
  if (!item && !tier) return showToast("请选择技能和玩法");
  const mode = staffOrderMode();
  const customerId = $("staffOrderCustomerId").value.trim();
  if (mode === "customer_balance" && !customerId) return showToast("余额扣款必须填写老板ID");
  try {
    const data = await api("/api/staff/orders", {
      method: "POST",
      body: JSON.stringify({
        paymentMode: mode,
        customerId,
        userName: $("profileName").value.trim(),
        contact: $("staffOrderContact").value.trim() || $("profileContact").value.trim(),
        sessionId: state.activeSessionId,
        itemId: item?.id || "",
        tierId: tier?.id || "",
        skillId: skill?.id || "",
        skillName: skill?.name || "",
        playId: play?.id || "",
        playName: play?.name || "",
        amount: Number(tier?.price || item?.price || play?.price || 0),
        orderMode: item?.orderMode || "random_hour",
        duration: Number($("staffOrderDuration").value || 1),
        playerId: player?.id || $("staffOrderPlayerId")?.value || "",
        playerName: player?.name || $("staffOrderPlayerSearch")?.value.trim() || $("staffOrderPlayerName")?.value.trim(),
        paymentRemark: $("staffOrderPaymentRemark").value.trim(),
        note: $("staffOrderNote").value.trim()
      })
    });
    state.activeCustomer = data.customer;
    state.activeCustomerBills = data.bills || [];
    renderCustomerWallet();
    await loadOrders();
    showToast(mode === "customer_balance" ? "已扣余额并创建订单" : "已创建私下收款派单");
  } catch (error) {
    showToast(error.message);
  }
}

function staffOrderLevelGroupsForSkill(skill = selectedStaffOrderSkill()) {
  if (Array.isArray(skill?.levelGroups) && skill.levelGroups.length) {
    return visibleSorted(skill.levelGroups).map((group) => ({
      ...group,
      levels: visibleSorted(group.levels || [])
    }));
  }
  const ids = Array.isArray(skill?.levelGroupIds) ? skill.levelGroupIds.map(String).filter(Boolean) : [];
  const groups = visibleSorted(state.catalog?.playerLevelGroups || []);
  const linked = ids.length ? groups.filter((group) => ids.includes(String(group.id))) : groups;
  return linked.length ? linked : groups;
}

function selectedStaffOrderKind() {
  return $("staffOrderKindSelect")?.value || "hourly";
}

function selectedStaffOrderQuantity() {
  return Math.max(1, Number($("staffOrderDuration")?.value || 1));
}

function selectedStaffOrderLevelGroup() {
  const groups = staffOrderLevelGroupsForSkill();
  const id = $("staffOrderDifficultySelect")?.value || "";
  return groups.find((group) => group.id === id) || groups[0] || null;
}

function selectedStaffOrderLevel() {
  const group = selectedStaffOrderLevelGroup();
  const levels = visibleSorted(group?.levels || []);
  const id = $("staffOrderLevelSelect")?.value || "";
  return levels.find((level) => level.id === id) || levels[0] || null;
}

function staffOrderQuickOptions(group) {
  return visibleSorted(state.catalog?.quickMatchConfig?.[group] || []);
}

function selectedStaffOrderQuickOption(group, id) {
  const list = staffOrderQuickOptions(group);
  const value = $(id)?.value || "";
  return list.find((item) => item.id === value) || list[0] || null;
}

function ensureStaffOrderSelect(id, afterId, placeholder) {
  if ($(id)) return $(id);
  const select = document.createElement("select");
  select.id = id;
  select.dataset.placeholder = placeholder || "";
  const anchor = $(afterId);
  if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(select, anchor.nextSibling);
  return select;
}

function ensureStaffOrderV2Fields() {
  ensureStaffOrderSelect("staffOrderKindSelect", "staffOrderSkillSelect", "订单类型");
  ensureStaffOrderSelect("staffOrderDifficultySelect", "staffOrderPlaySelect", "一级等级");
  ensureStaffOrderSelect("staffOrderLevelSelect", "staffOrderDifficultySelect", "二级等级");
  ensureStaffOrderSelect("staffOrderServiceSelect", "staffOrderLevelSelect", "服务");
  ensureStaffOrderSelect("staffOrderGenderSelect", "staffOrderServiceSelect", "性别");
  ensureStaffOrderSelect("staffOrderTypeSelect", "staffOrderGenderSelect", "类型");
  if ($("staffOrderCustomerId")) $("staffOrderCustomerId").placeholder = "有小程序账号就填老板ID；没有账号可不填";
  if ($("staffOrderContact")) $("staffOrderContact").placeholder = "联系方式 / 群备注";
  if ($("staffOrderDuration")) $("staffOrderDuration").placeholder = "小时单填写小时数，趣味单填写数量";
  if ($("staffOrderPlayerSearch")) $("staffOrderPlayerSearch").placeholder = "搜索指定打手名字 / ID，可不填";
  if ($("staffOrderPaymentRemark")) $("staffOrderPaymentRemark").placeholder = "收款/扣款备注，例如 微信已收 / 余额扣款";
  if ($("staffOrderNote")) $("staffOrderNote").placeholder = "订单备注，打手接单大厅可见";
  ["staffOrderItemSelect", "staffOrderTierSelect", "staffOrderPlayerName"].forEach((id) => {
    if ($(id)) $(id).classList.add("staff-order-legacy-field");
  });
}

function optionHtml(list, emptyText, labelFn = (item) => item.name || item.id) {
  return visibleSorted(list).map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(labelFn(item))}</option>`).join("") ||
    `<option value="">${escapeHtml(emptyText)}</option>`;
}

function renderStaffOrderForm() {
  if (!$("staffOrderItemSelect")) return;
  ensureStaffOrderV2Fields();
  const skills = catalogSkills();
  $("staffOrderSkillSelect").innerHTML = optionHtml(skills, "先在后台配置游戏/技能");
  $("staffOrderKindSelect").innerHTML = `
    <option value="hourly">小时单</option>
    <option value="fun">趣味单</option>
  `;
  updateStaffOrderPlayOptions();
  updateStaffOrderBalanceInfo();
}

function updateStaffOrderPlayOptions() {
  const skill = selectedStaffOrderSkill();
  if ($("staffOrderPlaySelect")) {
    $("staffOrderPlaySelect").innerHTML = optionHtml(staffOrderPlaysForSkill(skill), "当前游戏暂无玩法", (play) => play.name || play.id);
  }
  updateStaffOrderLevelGroupOptions();
  updateStaffOrderItemOptions();
}

function updateStaffOrderLevelGroupOptions() {
  const groups = staffOrderLevelGroupsForSkill();
  if ($("staffOrderDifficultySelect")) {
    $("staffOrderDifficultySelect").innerHTML = optionHtml(groups, "当前游戏暂无一级等级");
  }
  updateStaffOrderLevelOptions();
}

function updateStaffOrderLevelOptions() {
  const group = selectedStaffOrderLevelGroup();
  const levels = visibleSorted(group?.levels || []);
  if ($("staffOrderLevelSelect")) {
    $("staffOrderLevelSelect").innerHTML = optionHtml(levels, "当前一级等级暂无二级等级", (level) => `${level.name || level.id} · ${money(level.price || 0)}`);
  }
  updateStaffOrderSummary();
}

function updateStaffOrderQuickSelects() {
  if ($("staffOrderServiceSelect")) $("staffOrderServiceSelect").innerHTML = optionHtml(staffOrderQuickOptions("services"), "默认服务", (item) => item.name || item.id);
  if ($("staffOrderGenderSelect")) $("staffOrderGenderSelect").innerHTML = optionHtml(staffOrderQuickOptions("genders"), "不限", (item) => item.name || item.id);
  if ($("staffOrderTypeSelect")) $("staffOrderTypeSelect").innerHTML = optionHtml(staffOrderQuickOptions("types"), "单人", (item) => item.name || item.id);
}

function updateStaffOrderItemOptions() {
  if (!$("staffOrderItemSelect")) return;
  updateStaffOrderQuickSelects();
  const isFun = selectedStaffOrderKind() === "fun";
  $("staffOrderItemSelect").classList.toggle("staff-order-legacy-field", !isFun);
  $("staffOrderTierSelect").classList.toggle("staff-order-legacy-field", !isFun);
  ["staffOrderPlaySelect", "staffOrderDifficultySelect", "staffOrderLevelSelect", "staffOrderServiceSelect", "staffOrderGenderSelect", "staffOrderTypeSelect"].forEach((id) => {
    if ($(id)) $(id).classList.toggle("staff-order-hidden-field", isFun);
  });
  const items = staffOrderItemsForSkill();
  $("staffOrderItemSelect").innerHTML = items.map((item) => `
    <option value="${escapeHtml(item.id)}">${escapeHtml(item.title || item.name || item.id)}</option>
  `).join("") || `<option value="">当前游戏暂无趣味单</option>`;
  updateStaffOrderTierOptions();
}

function staffOrderTierOptions() {
  if (selectedStaffOrderKind() === "fun") {
    const item = selectedStaffOrderItem();
    if (item && Array.isArray(item.priceTiers) && item.priceTiers.length) return item.priceTiers;
    if (item) return [{ id: "default", name: "默认价位", price: item.price || 0, desc: "" }];
    return [];
  }
  const level = selectedStaffOrderLevel();
  const price = Math.max(0, Number(level?.price || 0));
  return [{ id: "hourly", name: "小时单", price, desc: "" }];
}

function selectedStaffOrderTier() {
  const tiers = staffOrderTierOptions();
  const id = $("staffOrderTierSelect")?.value || "";
  return tiers.find((tier) => tier.id === id) || tiers[0] || null;
}

function updateStaffOrderTierOptions() {
  if (!$("staffOrderTierSelect")) return;
  const tiers = staffOrderTierOptions();
  $("staffOrderTierSelect").innerHTML = optionHtml(tiers, "暂无价位", (tier) => `${tier.name || tier.id} · ${money(tier.price || 0)}`);
  updateStaffOrderSummary();
}

function updateStaffOrderSummary() {
  if (!$("staffOrderSummary")) return;
  const skill = selectedStaffOrderSkill();
  const play = selectedStaffOrderPlay();
  const group = selectedStaffOrderLevelGroup();
  const level = selectedStaffOrderLevel();
  const service = selectedStaffOrderQuickOption("services", "staffOrderServiceSelect");
  const gender = selectedStaffOrderQuickOption("genders", "staffOrderGenderSelect");
  const type = selectedStaffOrderQuickOption("types", "staffOrderTypeSelect");
  const item = selectedStaffOrderItem();
  const tier = selectedStaffOrderTier();
  const quantity = selectedStaffOrderQuantity();
  const isFun = selectedStaffOrderKind() === "fun";
  if ((isFun && !item) || (!isFun && !tier)) {
    $("staffOrderSummary").textContent = "选好游戏和订单类型后显示金额";
    return;
  }
  const unitPrice = Number(tier?.price || 0);
  const originalAmount = Number((unitPrice * quantity).toFixed(2));
  const customer = state.activeCustomer;
  const discount = staffOrderMode() === "customer_balance" && customer ? Number(customer.memberDiscount || 100) : 100;
  const payable = Number((originalAmount * discount / 100).toFixed(2));
  const player = selectedStaffOrderPlayer();
  const modeText = staffOrderMode() === "customer_balance" ? "老板余额扣款" : "已谈好，直接派单";
  const spec = isFun
    ? `${skill?.name || "未选游戏"} / ${item?.title || "趣味单"} / ${quantity}份`
    : `${skill?.name || "未选游戏"} / ${play?.name || "玩法"} / ${group?.name || "一级等级"}-${level?.name || "二级等级"} / ${service?.name || "服务"} / ${gender?.name || "不限"} / ${type?.name || "类型"} / ${quantity}小时`;
  $("staffOrderSummary").textContent = `${modeText} · ${spec} · ${player ? `指定 ${player.name || player.id} · ` : ""}原价 ${money(originalAmount)} · 实扣/记录 ${money(payable)}`;
}

async function submitStaffOrder() {
  const mode = staffOrderMode();
  const customerId = $("staffOrderCustomerId").value.trim();
  if (mode === "customer_balance" && !customerId) return showToast("有账号扣余额时必须填写老板ID");
  const skill = selectedStaffOrderSkill();
  const play = selectedStaffOrderPlay();
  const group = selectedStaffOrderLevelGroup();
  const level = selectedStaffOrderLevel();
  const service = selectedStaffOrderQuickOption("services", "staffOrderServiceSelect");
  const gender = selectedStaffOrderQuickOption("genders", "staffOrderGenderSelect");
  const type = selectedStaffOrderQuickOption("types", "staffOrderTypeSelect");
  const item = selectedStaffOrderItem();
  const tier = selectedStaffOrderTier();
  const player = selectedStaffOrderPlayer();
  const isFun = selectedStaffOrderKind() === "fun";
  if (isFun && !item) return showToast("请选择趣味单项目");
  if (!isFun && (!skill || !play || !level || !tier)) return showToast("请选择游戏、玩法和等级");
  const quantity = selectedStaffOrderQuantity();
  const serviceName = isFun
    ? (item.title || item.name || "趣味单")
    : `${skill?.name || ""} / ${play?.name || ""} / ${group?.name || ""}-${level?.name || ""}`;
  try {
    const data = await api("/api/staff/orders", {
      method: "POST",
      body: JSON.stringify({
        paymentMode: mode,
        customerId,
        userName: $("profileName").value.trim(),
        contact: $("staffOrderContact").value.trim() || $("profileContact").value.trim(),
        sessionId: state.activeSessionId,
        itemId: isFun ? item?.id || "" : "",
        tierId: tier?.id || "",
        skillId: skill?.id || "",
        skillName: skill?.name || "",
        playId: play?.id || "",
        playName: play?.name || "",
        serviceName,
        amount: Number(tier?.price || 0),
        orderMode: isFun ? (item?.orderMode || "fixed_tier") : "random_hour",
        duration: quantity,
        quantity,
        playerId: player?.id || $("staffOrderPlayerId")?.value || "",
        playerName: player?.name || $("staffOrderPlayerSearch")?.value.trim() || "",
        filters: {
          orderKind: isFun ? "fun_order" : "quick_hour",
          billingMode: isFun ? "fixed" : "hour_refund",
          orderedHours: isFun ? "" : quantity,
          orderedMinutes: isFun ? "" : quantity * 60,
          durationName: isFun ? `${quantity}份` : `${quantity}小时`,
          quantity: isFun ? quantity : "",
          priceTierId: tier?.id || "",
          priceTierName: tier?.name || "",
          difficulty: group?.id || "",
          difficultyName: group?.name || "",
          level: level?.id || "",
          levelName: level?.name || "",
          service: service?.id || "",
          serviceName: service?.name || "",
          gender: gender?.id || "",
          genderName: gender?.name || "",
          playType: type?.id || "",
          playTypeName: type?.name || "",
          skillName: skill?.name || "",
          playName: play?.name || "",
          remark: $("staffOrderNote").value.trim()
        },
        paymentRemark: $("staffOrderPaymentRemark").value.trim(),
        note: $("staffOrderNote").value.trim()
      })
    });
    state.activeCustomer = data.customer;
    state.activeCustomerBills = data.bills || [];
    renderCustomerWallet();
    await loadOrders();
    showToast(mode === "customer_balance" ? "已扣余额并创建订单" : "已创建已谈好派单");
  } catch (error) {
    showToast(error.message);
  }
}

async function loadMessages() {
  if (!state.activeSessionId) return;
  const data = await api(`/api/sessions/${encodeURIComponent(state.activeSessionId)}/messages`);
  state.messages = data.messages;
  renderMessages();
  await loadSessions();
}

function renderMessages() {
  $("messageList").innerHTML = state.messages.map((message) => `
    <article class="message ${message.senderType} ${message.visibility === "internal" ? "internal" : ""} ${message.card ? "has-card" : ""}">
      <div class="message-name">${escapeHtml(message.senderName)} · ${formatTime(message.createdAt)}</div>
      <div class="bubble">
        ${message.visibility === "internal" ? `<strong class="note-label">内部备注</strong>` : ""}
        ${message.card ? `<div class="card-intro">${escapeHtml(message.content)}</div>` : `<span class="message-text">${escapeHtml(message.content)}</span>`}
        ${message.card ? `
          <div class="card-bubble">
            <strong>${escapeHtml(message.card.title)}</strong>
            <span>${escapeHtml(message.card.desc)}</span>
            <span>${escapeHtml(message.card.price)}</span>
          </div>
        ` : ""}
      </div>
    </article>
  `).join("") || `<div class="empty-state">暂无消息</div>`;
  $("messageList").scrollTop = $("messageList").scrollHeight;
}

async function sendReply() {
  const content = $("replyInput").value.trim();
  if (!state.activeSessionId || !content) return;
  await api(`/api/sessions/${encodeURIComponent(state.activeSessionId)}/messages`, {
    method: "POST",
    body: JSON.stringify({ content })
  });
  $("replyInput").value = "";
  await loadMessages();
}

async function sendCard(cardId = state.selectedCardId || state.serviceCards[0]?.id) {
  if (!state.activeSessionId || !cardId) return;
  const card = state.serviceCards.find((item) => item.id === cardId);
  if (!card) return;
  state.selectedCardId = card.id;
  await api(`/api/sessions/${encodeURIComponent(state.activeSessionId)}/messages`, {
    method: "POST",
    body: JSON.stringify({
      type: "card",
      content: `给您发一张服务详情：${card.title}`,
      card
    })
  });
  await loadMessages();
}

async function patchSession(patch) {
  if (!state.activeSessionId) return;
  await api(`/api/sessions/${encodeURIComponent(state.activeSessionId)}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
  await loadSessions();
  await selectSession(state.activeSessionId);
}

async function saveCustomerProfile() {
  if (!state.activeSessionId) return;
  const tags = $("profileTags").value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
  await patchSession({
    userId: $("profileUserId").value.trim(),
    userName: $("profileName").value,
    contact: $("profileContact").value,
    remark: $("profileRemark").value,
    tags
  });
}

async function addQuickReply() {
  const text = $("quickReplyInput").value.trim();
  if (!text) return;
  const data = await api("/api/quick-replies", {
    method: "POST",
    body: JSON.stringify({ text })
  });
  state.quickReplies = data.quickReplies;
  $("quickReplyInput").value = "";
  renderQuickReplies();
  renderQuickReplyManager();
  showToast("快捷话术已新增");
}

async function updateQuickReply(index, text) {
  const data = await api(`/api/quick-replies/${index}`, {
    method: "PATCH",
    body: JSON.stringify({ text })
  });
  state.quickReplies = data.quickReplies;
  renderQuickReplies();
  renderQuickReplyManager();
  showToast("快捷话术已保存");
}

async function deleteQuickReply(index) {
  const data = await api(`/api/quick-replies/${index}`, { method: "DELETE" });
  state.quickReplies = data.quickReplies;
  renderQuickReplies();
  renderQuickReplyManager();
  showToast("快捷话术已删除");
}

async function loadOrders() {
  const data = await api("/api/orders");
  state.orders = data.orders;
  renderOrderFilterOptions();
  renderRelatedOrders(activeSession());
  renderOrderTable();
  renderWorkbenchAside();
}

function renderRelatedOrders(session) {
  if (!$("orderList")) return;
  const related = relatedOrders(session);
  $("orderList").innerHTML = related.map((order) => `
    <article class="compact-item order-info-card">
      <div class="order-info-head">
        <strong>${escapeHtml(order.serviceName || order.gameName || "订单")}</strong>
        <span class="pill purple">${escapeHtml(order.status || "待确认")}</span>
      </div>
      <div class="order-info-grid">
        <span>老板</span><strong>${escapeHtml(order.userName || order.userId || "")}</strong>
        <span>打手</span><strong>${escapeHtml(order.playerName || "待分配")}</strong>
        <span>金额</span><strong>${money(order.amount)}</strong>
        <span>方式</span><strong>${escapeHtml(order.source || "小程序")}</strong>
      </div>
      <div class="item-title">${escapeHtml(order.playerName)} · ${escapeHtml(order.gameName)}</div>
      <div class="item-meta">
        ${order.id} · ${escapeHtml(order.status)} · ${money(order.amount)}<br />
        ${escapeHtml(order.userName)} · ${escapeHtml(order.time)}
      </div>
      <select class="compact-select" data-order-status="${order.id}">
        <option value="待确认" ${order.status === "待确认" ? "selected" : ""}>待确认</option>
        <option value="已确认" ${order.status === "已确认" ? "selected" : ""}>已确认</option>
        <option value="已完成" ${order.status === "已完成" ? "selected" : ""}>已完成</option>
        <option value="已取消" ${order.status === "已取消" ? "selected" : ""}>已取消</option>
      </select>
    </article>
  `).join("") || `<div class="item-meta">暂无关联订单</div>`;
}

function relatedOrders(session) {
  if (!session) return state.orders.slice(0, 4);
  const tokens = [session.userId, session.userName, ...(session.tags || [])]
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  const matched = state.orders.filter((order) => {
    const text = [order.userName, order.userPhone, order.contact, order.note, order.gameName, order.playerName].join(" ");
    return tokens.some((token) => text.includes(token));
  });
  return (matched.length ? matched : state.orders).slice(0, 4);
}

function findSessionForOrder(order) {
  if (!order) return null;
  if (order.sessionId) {
    const exact = state.sessions.find((session) => session.id === order.sessionId);
    if (exact) return exact;
  }

  const assignee = String(order.assignee || "").trim();
  const assigneeStaff = state.staff.find((item) => item.name === assignee || item.username === assignee || item.id === assignee);
  const genericTokens = new Set(["小程序内联系", "小程序"]);
  const orderTokens = [
    order.userId,
    order.userName,
    order.userPhone,
    order.contact,
    order.playerName,
    order.gameName
  ].map((item) => String(item || "").trim()).filter((item) => item.length >= 2 && !genericTokens.has(item));

  let best = null;
  let bestScore = 0;
  state.sessions.forEach((session) => {
    const sessionText = [
      session.id,
      session.userId,
      session.userName,
      session.contact,
      session.title,
      session.channel,
      session.remark,
      ...(session.tags || [])
    ].join(" ");
    const orderText = [
      order.id,
      order.userName,
      order.userPhone,
      order.contact,
      order.note,
      order.gameName,
      order.playerName
    ].join(" ");
    let score = 0;
    if (assigneeStaff && session.assignedTo === assigneeStaff.id) score += 4;
    if (assignee && session.assignedName === assignee) score += 4;
    orderTokens.forEach((token) => {
      if (sessionText.includes(token)) score += token.length > 3 ? 3 : 1;
    });
    [session.userName, session.contact, ...(session.tags || [])]
      .map((item) => String(item || "").trim())
      .filter((item) => item.length >= 2 && !genericTokens.has(item))
      .forEach((token) => {
        if (orderText.includes(token)) score += token.length > 3 ? 2 : 1;
      });
    if (score > bestScore) {
      bestScore = score;
      best = session;
    }
  });
  if (bestScore > 0) return best;
  const mainGroup = state.sessions.find((session) => session.id === "group-main")
    || state.sessions.find((session) => String(session.channel || session.title || "").includes("群"));
  return mainGroup || state.sessions[0] || null;
}

async function jumpToOrderChat(orderId) {
  const order = state.orders.find((item) => item.id === orderId);
  const session = findSessionForOrder(order);
  if (!session) {
    showToast("没有找到对应群聊");
    return;
  }
  switchModule("chat");
  await selectSession(session.id);
  showToast("已进入对应群聊");
}

function renderOrderFilterOptions() {
  fillSelect("orderPlatformFilter", "全部平台", [...new Set(state.orders.map((order) => order.platform).filter(Boolean))]);
  fillSelect("orderGameFilter", "全部游戏", [...new Set(state.orders.map((order) => order.gameName).filter(Boolean))]);
}

function fillSelect(id, label, values) {
  const element = $(id);
  if (!element) return;
  const previous = element.value || "all";
  element.innerHTML = `<option value="all">${label}</option>` + values
    .sort((a, b) => String(a).localeCompare(String(b), "zh-Hans-CN"))
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join("");
  element.value = values.includes(previous) ? previous : "all";
}

function orderDateValue(order) {
  const raw = String(order.createdAt || "");
  const match = raw.match(/\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  const idDate = String(order.id || "").match(/P(\d{4})(\d{2})(\d{2})/);
  if (idDate) return `${idDate[1]}-${idDate[2]}-${idDate[3]}`;
  const shortDate = raw.match(/(\d{2})-(\d{2})/);
  return shortDate ? `${new Date().getFullYear()}-${shortDate[1]}-${shortDate[2]}` : "";
}

function orderSortTime(order) {
  const date = orderDateValue(order);
  const time = String(order.createdAt || "").match(/(\d{2}):(\d{2})/);
  return new Date(`${date || "1970-01-01"}T${time ? `${time[1]}:${time[2]}` : "00:00"}`).getTime();
}

function filteredOrders() {
  const keyword = $("orderSearch")?.value.trim().toLowerCase() || "";
  const status = $("orderStatusFilter")?.value || "all";
  const source = $("orderSourceFilter")?.value || "all";
  const platform = $("orderPlatformFilter")?.value || "all";
  const game = $("orderGameFilter")?.value || "all";
  const dateFrom = $("orderDateFrom")?.value || "";
  const dateTo = $("orderDateTo")?.value || "";
  const amountMin = $("orderAmountMin")?.value === "" ? null : rmbToToken($("orderAmountMin").value);
  const amountMax = $("orderAmountMax")?.value === "" ? null : rmbToToken($("orderAmountMax").value);
  const [sortKey, sortDirection] = ($("orderSort")?.value || "createdAt-desc").split("-");
  const list = state.orders.filter((order) => {
    const text = [
      order.id,
      order.userName,
      order.userPhone,
      order.playerName,
      order.gameName,
      order.serviceName,
      order.platform,
      order.assignee,
      order.note
    ].join("").toLowerCase();
    const orderDate = orderDateValue(order);
    const amount = Number(order.amount || 0);
    return (!keyword || text.includes(keyword))
      && (status === "all" || order.status === status)
      && (source === "all" || order.source === source)
      && (platform === "all" || order.platform === platform)
      && (game === "all" || order.gameName === game)
      && (!dateFrom || orderDate >= dateFrom)
      && (!dateTo || orderDate <= dateTo)
      && (amountMin === null || amount >= amountMin)
      && (amountMax === null || amount <= amountMax);
  });
  list.sort((a, b) => {
    const left = sortKey === "amount" ? Number(a.amount || 0) : orderSortTime(a);
    const right = sortKey === "amount" ? Number(b.amount || 0) : orderSortTime(b);
    return sortDirection === "asc" ? left - right : right - left;
  });
  return list;
}

function resetOrderFilters() {
  ["orderSearch", "orderDateFrom", "orderDateTo", "orderAmountMin", "orderAmountMax"].forEach((id) => {
    if ($(id)) $(id).value = "";
  });
  ["orderStatusFilter", "orderSourceFilter", "orderPlatformFilter", "orderGameFilter"].forEach((id) => {
    if ($(id)) $(id).value = "all";
  });
  $("orderSort").value = "createdAt-desc";
  renderOrderTable();
}

function renderOrderTable() {
  if (!$("orderTableBody")) return;
  const orders = filteredOrders();
  const totalAmount = orders.reduce((sum, order) => sum + Number(order.originalAmount || order.amount || 0), 0);
  const totalCommission = orders.reduce((sum, order) => sum + Number(order.platformCommission || 0), 0);
  const totalPlayerIncome = orders.reduce((sum, order) => sum + Number(order.playerIncome || 0), 0);
  const totalDuration = orders.reduce((sum, order) => sum + Number(order.duration || 0), 0);
  const pendingCount = orders.filter((order) => order.status === "待确认").length;
  $("orderStats").innerHTML = [
    ["订单数", orders.length],
    ["待确认", pendingCount],
    ["总时长", `${totalDuration} h`],
    ["订单原价", money(totalAmount)],
    ["平台抽成", money(totalCommission)],
    ["打手收入", money(totalPlayerIncome)]
  ].map(([label, value]) => `
    <article class="order-stat">
      <strong>${escapeHtml(value)}</strong>
      <span>${label}</span>
    </article>
  `).join("");
  $("orderTableBody").innerHTML = orders.map((order) => `
    <tr>
      <td>
        <strong>${escapeHtml(formatDateTime(order.createdAt) || "")}</strong>
      </td>
      <td>
        <button class="order-link" data-order-chat="${escapeHtml(order.id)}" type="button">${escapeHtml(order.id)}</button>
        <span>进入群聊</span>
      </td>
      <td>
        <strong>${escapeHtml(order.userName)}</strong>
      </td>
      <td>
        <strong>${escapeHtml(order.playerName)}</strong>
        <span>${escapeHtml(order.gameName)}</span>
      </td>
      <td>${escapeHtml(order.serviceName || "陪玩服务")}</td>
      <td><span class="pill purple">${escapeHtml(order.platform || "三角洲")}</span></td>
      <td class="numeric">${money(order.unitPrice || 0)}</td>
      <td class="numeric">${Number(order.duration || 0)}</td>
      <td class="numeric income">${money(order.originalAmount || order.amount)}</td>
      <td class="numeric commission-cell">${money(order.platformCommission || 0)}<span>${Number(order.platformRate || 0).toFixed(0)}%</span></td>
      <td class="numeric player-income-cell">${money(order.playerIncome || 0)}<span>${Number(order.playerRate || 0).toFixed(0)}%</span></td>
      <td><strong>${escapeHtml(order.revenueConfigName || "默认配置")}</strong><span>${escapeHtml(order.revenueConfigId || "")}</span></td>
      <td>
        <select class="table-status ${orderStatusClass(order.status)}" data-order-status="${escapeHtml(order.id)}">
          <option value="待确认" ${order.status === "待确认" ? "selected" : ""}>待确认</option>
          <option value="已确认" ${order.status === "已确认" ? "selected" : ""}>已确认</option>
          <option value="已完成" ${order.status === "已完成" ? "selected" : ""}>已完成</option>
          <option value="已取消" ${order.status === "已取消" ? "selected" : ""}>已取消</option>
        </select>
      </td>
      <td>
        <strong>${escapeHtml(order.assignee || "")}</strong>
      </td>
      <td class="note-cell">
        <div>${escapeHtml(order.note || "")}</div>
        <div class="order-inline-actions">
          <button class="soft-btn" data-order-invite-player="${escapeHtml(order.id)}" type="button">拉打手进群</button>
          <button class="danger-btn" data-order-cancel="${escapeHtml(order.id)}" type="button">解散群聊</button>
        </div>
      </td>
    </tr>
  `).join("") || `<tr><td colspan="15" class="table-empty">没有匹配的订单</td></tr>`;
}

function exportOrdersCsv() {
  const headers = ["订单日期", "订单号", "用户", "联系方式", "陪玩账号", "游戏", "服务项目", "平台", "单价", "时长", "订单原价", "平台抽成", "打手收入", "收入配置", "订单状态", "来源", "处理人", "备注"];
  const rows = filteredOrders().map((order) => [
    formatDateTime(order.createdAt),
    order.id,
    order.userName,
    order.userPhone || order.contact,
    order.playerName,
    order.gameName,
    order.serviceName,
    order.platform,
    order.unitPrice,
    order.duration,
    order.originalAmount || order.amount,
    order.platformCommission || 0,
    order.playerIncome || 0,
    order.revenueConfigName || "默认配置",
    order.status,
    order.source,
    order.assignee,
    order.note
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function bindEvents() {
  $("loginForm").addEventListener("submit", login);
  $("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("cs_token");
    state.token = "";
    state.user = null;
    showLogin();
  });
  $("onlineToggleBtn").addEventListener("click", () => toggleOnline().catch((error) => showToast(error.message)));
  $("accountBtn").addEventListener("click", openAccountModal);
  $("closeAccountModalBtn").addEventListener("click", closeAccountModal);
  $("clearAvatarBtn").addEventListener("click", () => {
    state.accountAvatarDraft = "";
    $("avatarInput").value = "";
    renderAccount();
  });
  $("avatarInput").addEventListener("change", async (event) => {
    try {
      state.accountAvatarDraft = await readAvatarFile(event.target.files[0]);
      renderAccount();
    } catch (error) {
      showToast(error.message);
      event.target.value = "";
    }
  });
  $("saveAccountBtn").addEventListener("click", saveAccountProfile);
  $("savePasswordBtn").addEventListener("click", savePassword);
  $("chatModuleBtn").addEventListener("click", () => switchModule("chat"));
  $("ordersModuleBtn").addEventListener("click", () => switchModule("orders"));
  $("staffOrderModuleBtn").addEventListener("click", () => switchModule("staffOrder"));
  $("railChatBtn").addEventListener("click", () => switchModule("chat"));
  $("railOrdersBtn").addEventListener("click", () => switchModule("orders"));
  $("railStaffOrderBtn").addEventListener("click", () => switchModule("staffOrder"));
  document.querySelectorAll(".support-sub-item").forEach((button) => {
    button.addEventListener("click", () => switchModule(button.dataset.module));
  });
  document.querySelectorAll("[data-inbox]").forEach((button) => {
    button.addEventListener("click", () => {
      state.inboxFilter = button.dataset.inbox;
      document.querySelectorAll("[data-inbox]").forEach((item) => item.classList.toggle("active", item === button));
      renderSessions();
    });
  });
  $("backToChatsBtn").addEventListener("click", backToChatList);
  $("sessionSearch").addEventListener("input", renderSessions);
  $("statusFilter").addEventListener("change", renderSessions);
  $("sessionList").addEventListener("click", (event) => {
    const item = event.target.closest("[data-session]");
    if (item) selectSession(item.dataset.session);
  });
  $("quickReplies").addEventListener("click", (event) => {
    const item = event.target.closest("[data-text]");
    if (!item) return;
    $("replyInput").value = item.dataset.text;
    $("replyInput").focus();
  });
  $("serviceCards").addEventListener("click", (event) => {
    const button = event.target.closest("[data-card]");
    if (button) sendCard(button.dataset.card);
  });
  $("quickReplyManager").addEventListener("click", (event) => {
    const saveButton = event.target.closest("[data-quick-save]");
    const deleteButton = event.target.closest("[data-quick-delete]");
    if (saveButton) {
      const index = Number(saveButton.dataset.quickSave);
      const textarea = $(`quickReplyManager`).querySelector(`[data-quick-edit="${index}"]`);
      updateQuickReply(index, textarea.value);
    }
    if (deleteButton) {
      deleteQuickReply(Number(deleteButton.dataset.quickDelete));
    }
  });
  $("sendBtn").addEventListener("click", sendReply);
  $("sendCardBtn").addEventListener("click", () => sendCard());
  $("saveProfileBtn").addEventListener("click", saveCustomerProfile);
  $("refreshCustomerWalletBtn").addEventListener("click", () => loadCustomerWallet());
  $("addCustomerBalanceBtn").addEventListener("click", adjustCustomerBalance);
  $("profileUserId").addEventListener("change", () => loadCustomerWallet());
  $("staffOrderLookupBtn").addEventListener("click", () => lookupStaffOrderCustomer().catch((error) => showToast(error.message)));
  $("staffOrderCustomerId").addEventListener("change", updateStaffOrderBalanceInfo);
  if ($("staffOrderSkillSelect")) $("staffOrderSkillSelect").addEventListener("change", () => {
    if ($("staffOrderPlayerId")) $("staffOrderPlayerId").value = "";
    if ($("staffOrderPlayerSearch")) $("staffOrderPlayerSearch").value = "";
    updateStaffOrderPlayOptions();
    renderStaffOrderPlayerResults();
  });
  if ($("staffOrderPlaySelect")) $("staffOrderPlaySelect").addEventListener("change", updateStaffOrderItemOptions);
  $("staffOrderItemSelect").addEventListener("change", updateStaffOrderTierOptions);
  $("staffOrderTierSelect").addEventListener("change", updateStaffOrderSummary);
  $("staffOrderDuration").addEventListener("input", updateStaffOrderSummary);
  if ($("staffOrderPlayerSearch")) $("staffOrderPlayerSearch").addEventListener("input", renderStaffOrderPlayerResults);
  if ($("staffOrderPlayerResults")) $("staffOrderPlayerResults").addEventListener("click", (event) => {
    const button = event.target.closest("[data-staff-order-player]");
    if (!button) return;
    const player = catalogPlayersForStaffOrder().find((item) => item.id === button.dataset.staffOrderPlayer);
    if (!player) return;
    $("staffOrderPlayerId").value = player.id;
    $("staffOrderPlayerSearch").value = `${player.name || player.id} / ${player.id}`;
    $("staffOrderPlayerResults").innerHTML = "";
    updateStaffOrderSummary();
  });
  document.addEventListener("change", (event) => {
    if (event.target?.id === "staffOrderKindSelect") return updateStaffOrderItemOptions();
    if (event.target?.id === "staffOrderDifficultySelect") return updateStaffOrderLevelOptions();
    if (event.target?.id === "staffOrderLevelSelect") return updateStaffOrderTierOptions();
    if (["staffOrderServiceSelect", "staffOrderGenderSelect", "staffOrderTypeSelect"].includes(event.target?.id)) return updateStaffOrderTierOptions();
  });
  document.querySelectorAll('input[name="staffOrderMode"]').forEach((input) => {
    input.addEventListener("change", updateStaffOrderSummary);
  });
  $("staffOrderSubmitBtn").addEventListener("click", submitStaffOrder);
  $("addQuickReplyBtn").addEventListener("click", addQuickReply);
  $("refreshOrders").addEventListener("click", loadOrders);
  $("refreshOrderTableBtn").addEventListener("click", loadOrders);
  $("exportOrdersBtn").addEventListener("click", exportOrdersCsv);
  $("resetOrderFiltersBtn").addEventListener("click", resetOrderFilters);
  ["orderSearch", "orderStatusFilter", "orderSourceFilter", "orderPlatformFilter", "orderGameFilter", "orderDateFrom", "orderDateTo", "orderAmountMin", "orderAmountMax", "orderSort"].forEach((id) => {
    $(id).addEventListener(id === "orderSearch" ? "input" : "change", renderOrderTable);
  });
  $("orderList").addEventListener("change", async (event) => {
    const target = event.target.closest("[data-order-status]");
    if (!target) return;
    await api(`/api/orders/${encodeURIComponent(target.dataset.orderStatus)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: target.value })
    });
    await loadOrders();
  });
  $("orderTableBody").addEventListener("change", async (event) => {
    const target = event.target.closest("[data-order-status]");
    if (!target) return;
    await api(`/api/orders/${encodeURIComponent(target.dataset.orderStatus)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: target.value })
    });
    await loadOrders();
  });
  $("orderTableBody").addEventListener("click", async (event) => {
    const invite = event.target.closest("[data-order-invite-player]");
    if (invite) {
      const playerId = window.prompt("请输入打手ID、编号或昵称");
      if (!playerId) return;
      try {
        await api(`/api/orders/${encodeURIComponent(invite.dataset.orderInvitePlayer)}/invite-player`, {
          method: "POST",
          body: JSON.stringify({ playerId })
        });
        await Promise.all([loadOrders(), loadSessions()]);
      } catch (error) {
        showToast(error.message);
      }
      return;
    }
    const cancel = event.target.closest("[data-order-cancel]");
    if (cancel) {
      if (!window.confirm("确认取消订单并解散群聊？已扣猫粮会自动退回老板余额。")) return;
      try {
        await api(`/api/orders/${encodeURIComponent(cancel.dataset.orderCancel)}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "已取消" })
        });
        await Promise.all([loadOrders(), loadSessions()]);
      } catch (error) {
        showToast(error.message);
      }
      return;
    }
    const target = event.target.closest("[data-order-chat]");
    if (!target) return;
    jumpToOrderChat(target.dataset.orderChat);
  });
  $("statusSelect").addEventListener("change", () => patchSession({ status: $("statusSelect").value }));
  $("replyInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendReply();
    }
  });
  setInterval(async () => {
    if (!state.token || $("appView").classList.contains("hidden")) return;
    await Promise.all([loadSessions(), loadOrders()]);
    if (state.activeSessionId) await loadMessages();
  }, 5000);
}

async function init() {
  bindEvents();
  if (!state.token) {
    showLogin();
    return;
  }
  try {
    const data = await api("/api/me");
    state.user = data.user;
    showApp();
    await boot();
  } catch {
    localStorage.removeItem("cs_token");
    state.token = "";
    showLogin();
  }
}

init();
