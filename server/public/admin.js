const state = {
  token: localStorage.getItem("owner_token") || "",
  user: null,
  stats: {},
  staff: [],
  catalog: { games: [], packages: [], players: [], notices: [], orderCategories: [], orderItems: [] },
  settings: {},
  orders: [],
  rechargeOrders: [],
  playerWithdrawals: [],
  referrals: [],
  referralCommissions: [],
  sessions: [],
  complaints: [],
  users: [],
  customerBills: [],
  activeView: "overview",
  activeModule: "overview",
  openTabs: ["overview"],
  activePlayerIndex: null,
  activeGameId: "",
  activeOrderCategoryId: "",
  userFilter: "",
  playerFilter: { keyword: "", level: "all" },
  financeFilter: { start: "", end: "", keyword: "" }
};
state.quickLevelOpen = {};

const DEFAULT_PLAYER_LEVEL_GROUPS = [
  {
    id: "confidential",
    name: "机密",
    levels: [
      { id: "huashen", name: "化神期", price: 0 },
      { id: "yuanying", name: "元婴期", price: 0 },
      { id: "jindan", name: "金丹期", price: 0 },
      { id: "zhuji", name: "筑基期", price: 0 }
    ]
  },
  {
    id: "top_secret",
    name: "绝密",
    levels: [
      { id: "huashen", name: "化神期", price: 0 },
      { id: "yuanying", name: "元婴期", price: 0 },
      { id: "jindan", name: "金丹期", price: 0 },
      { id: "zhuji", name: "筑基期", price: 0 }
    ]
  }
];

const demoNavGroups = {
  overview: { title: "统计", items: [["overview", "综合面板"]] },
  users: { title: "用户", items: [["users", "用户列表"]] },
  invites: { title: "分销", items: [["invites", "分销关系"]] },
  orders: { title: "订单", items: [["orders", "订单列表"], ["dispatch", "派单管理"], ["accepts", "接单审核"], ["chats", "聊天监控"]] },
  games: { title: "商品", items: [["games", "商品总览"], ["gameStructure", "分类订单"], ["gameCreate", "新增游戏"]] },
  players: { title: "打手", items: [["players", "查找修改"], ["playerCreate", "新增打手"], ["playerConfig", "等级/收入配置"]] },
  finance: { title: "财务", items: [["finance", "财务流水"], ["recharge", "支付记录"], ["withdrawals", "提现审核"]] },
  staff: { title: "客服", items: [["staff", "客服账号"], ["messages", "待回复消息"], ["complaints", "投诉信息"], ["help", "帮助中心"]] },
  home: { title: "装修", items: [["home", "首页装修"]] },
  settings: { title: "设置", items: [["settings", "基础设置"], ["system", "系统状态"]] }
};

const viewTitles = {
  overview: "综合面板",
  users: "用户列表",
  finance: "财务流水",
  staff: "客服账号",
  home: "首页装修",
  messages: "待回复消息",
  complaints: "投诉信息",
  games: "商品总览",
  gameStructure: "分类订单",
  gameCreate: "新增游戏",
  players: "查找修改打手",
  playerCreate: "新增打手",
  playerConfig: "等级/收入配置",
  orders: "订单列表",
  dispatch: "派单管理",
  accepts: "接单审核",
  help: "帮助中心",
  invites: "分销关系",
  recharge: "支付记录",
  withdrawals: "提现审核",
  chats: "聊天会话",
  settings: "基础设置",
  system: "系统状态"
};

const viewModule = {
  overview: "overview",
  users: "users",
  invites: "invites",
  orders: "orders",
  dispatch: "orders",
  accepts: "orders",
  chats: "orders",
  games: "games",
  gameStructure: "games",
  gameCreate: "games",
  players: "players",
  playerCreate: "players",
  playerConfig: "players",
  staff: "staff",
  messages: "staff",
  complaints: "staff",
  help: "staff",
  finance: "finance",
  recharge: "finance",
  withdrawals: "finance",
  home: "home",
  system: "settings",
  settings: "settings"
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
  if (method !== "GET" && path.startsWith("/api/admin/") && !path.includes("/login") && !path.includes("/uploads")) {
    window.setTimeout(() => showToast("保存成功"), 0);
  }
  return data;
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
  $("toast").textContent = text;
  $("toast").classList.remove("hidden");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => $("toast").classList.add("hidden"), 1800);
}

function showApp() {
  $("loginView").classList.add("hidden");
  $("adminApp").classList.remove("hidden");
}

function showLogin() {
  $("adminApp").classList.add("hidden");
  $("loginView").classList.remove("hidden");
}

async function login(event) {
  event.preventDefault();
  $("loginError").textContent = "";
  try {
    const data = await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({
        username: $("username").value.trim(),
        password: $("password").value
      })
    });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem("owner_token", state.token);
    showApp();
    await loadDashboard();
  } catch (error) {
    $("loginError").textContent = error.message;
  }
}

async function loadDashboard() {
  const data = await api("/api/admin/dashboard");
  state.stats = data.stats || {};
  state.staff = data.staff || [];
  state.catalog = data.catalog || state.catalog;
  state.settings = data.settings || {};
  state.orders = data.orders || [];
  state.rechargeOrders = data.rechargeOrders || [];
  state.playerWithdrawals = data.playerWithdrawals || [];
  state.referrals = data.referrals || [];
  state.referralCommissions = data.referralCommissions || [];
  state.sessions = data.sessions || [];
  state.complaints = data.complaints || [];
  state.users = data.users || [];
  state.customerBills = data.customerBills || [];
  renderAll();
}

function switchView(view, options = {}) {
  if (view === "fighters") view = "players";
  if (!$(`${view}View`)) view = "overview";
  state.activeView = view;
  if (!state.openTabs.includes(view)) state.openTabs.push(view);
  const moduleKey = options.module || viewModule[view] || view;
  state.activeModule = moduleKey;
  const moduleTitle = (demoNavGroups[moduleKey] || demoNavGroups.overview).title;
  $("pageTitle").textContent = `${moduleTitle} / ${viewTitles[view] || "综合面板"}`;
  document.querySelectorAll(".view").forEach((item) => item.classList.add("hidden"));
  $(`${view}View`).classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach((item) => {
    const itemModule = viewModule[item.dataset.view] || item.dataset.view;
    item.classList.toggle("active", itemModule === state.activeModule);
  });
  renderAdminSubNav(state.activeModule, view);
  renderAdminTabs();
}

function renderAdminSubNav(moduleKey, activeView = state.activeView) {
  const mount = $("adminSubNav");
  if (!mount) return;
  const group = demoNavGroups[moduleKey] || demoNavGroups.overview;
  mount.innerHTML = `
    <div class="sub-title">${escapeHtml(group.title)}</div>
    <div class="sub-menu">
      ${group.items.map(([target, label]) => `
        <button class="sub-menu-item ${target === activeView ? "active" : ""}" data-view="${escapeHtml(target)}">
          <span>${escapeHtml(label)}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function renderAdminTabs() {
  const mount = $("adminTabs");
  if (!mount) return;
  mount.innerHTML = state.openTabs.map((view) => {
    const moduleKey = viewModule[view] || view;
    const group = demoNavGroups[moduleKey] || demoNavGroups.overview;
    return `
      <button class="admin-tab ${view === state.activeView ? "active" : ""}" data-tab-view="${escapeHtml(view)}">
        ${escapeHtml(group.title)} / ${escapeHtml(viewTitles[view] || view)}
        ${view === "overview" ? "" : `<span data-close-tab="${escapeHtml(view)}">×</span>`}
      </button>
    `;
  }).join("");
}

function renderAll() {
  ensureCommercialAdminViews();
  renderStats();
  renderUsers();
  renderFinance();
  renderStaff();
  renderHomeConfig();
  renderMessages();
  renderComplaints();
  renderGames();
  renderRevenueConfigs();
  renderPlayers();
  renderPlayerCreate();
  renderOrders();
  renderDispatch();
  renderAccepts();
  renderHelp();
  renderInvites();
  renderRecharge();
  renderWithdrawals();
  renderSessions();
  renderSystem();
  renderSettings();
  renderAdminModuleInsights();
  switchView(state.activeView);
}

function ensureCommercialAdminViews() {
  const app = $("adminApp");
  if (!app) return;

  if (!$("gameOverviewMount")) {
    const gamesPanel = $("gamesView")?.querySelector(".panel");
    const oldLayout = $("gamesView")?.querySelector(".admin-edit-preview-layout");
    if (gamesPanel && oldLayout) {
      const overview = document.createElement("section");
      overview.id = "gameOverviewMount";
      overview.className = "commerce-overview";
      gamesPanel.appendChild(overview);

      const structureView = document.createElement("section");
      structureView.id = "gameStructureView";
      structureView.className = "view hidden";
      structureView.innerHTML = `
        <section class="panel commerce-structure-panel">
          <div class="panel-head">
            <div>
              <strong>分类订单配置</strong>
              <span>选择一个游戏后，再维护左侧分类、右侧订单卡和详情价位。</span>
            </div>
            <div class="commerce-head-actions">
              <button id="backGameOverviewBtn" class="soft-btn" type="button">返回商品总览</button>
              <button id="saveGamesStructureBtn" class="primary-btn" type="button">保存当前配置</button>
            </div>
          </div>
        </section>
      `;
      structureView.querySelector(".commerce-structure-panel").appendChild(oldLayout);
      app.appendChild(structureView);
    }
  }

  if (!$("gameCreateView")) {
    const createView = document.createElement("section");
    createView.id = "gameCreateView";
    createView.className = "view hidden";
    createView.innerHTML = `
      <section class="panel narrow-panel">
        <div class="panel-head">
          <div>
            <strong>新增游戏</strong>
            <span>创建游戏入口后，再去分类订单页配置该游戏的下单分类和订单卡。</span>
          </div>
        </div>
        <form id="gameCreateForm" class="form-grid player-create-form">
          <label><span>游戏ID</span><input id="createGameId" placeholder="例如 delta / lolm / voice" /></label>
          <label><span>游戏名称</span><input id="createGameName" placeholder="小程序展示名称" /></label>
          <label><span>图标地址</span><input id="createGameIcon" value="/assets/game/other.png" /></label>
          <label><span>排序</span><input id="createGameSort" type="number" min="1" value="1" /></label>
          <label class="switch-field"><input id="createGameHome" type="checkbox" /><span>首页显示</span></label>
          <label class="switch-field"><input id="createGameVisible" type="checkbox" checked /><span>其他游戏显示</span></label>
          <button class="primary-btn" type="submit">创建并进入配置</button>
        </form>
      </section>
    `;
    app.appendChild(createView);
  }

  if (!$("playerConfigView")) {
    const configView = document.createElement("section");
    configView.id = "playerConfigView";
    configView.className = "view hidden";
    configView.innerHTML = `
      <section class="panel">
        <div class="panel-head">
          <div>
            <strong>等级/收入配置</strong>
            <span>集中维护打手等级价格和收入分账模板，不和查找列表挤在一起。</span>
          </div>
          <button id="backPlayerListBtn" class="soft-btn" type="button">返回打手列表</button>
        </div>
        <div id="playerConfigMount" class="player-config-mount"></div>
      </section>
    `;
    app.appendChild(configView);
  }

  const configMount = $("playerConfigMount");
  const revenuePanel = document.querySelector("#playersView .revenue-config-panel");
  const levelPanel = document.querySelector("#playersView #playerListPanel");
  if (configMount && revenuePanel && revenuePanel.parentElement !== configMount) {
    configMount.appendChild(revenuePanel);
  }
  if (configMount && levelPanel && !$("playerLevelConfigShell")) {
    const levelShell = document.createElement("section");
    levelShell.id = "playerLevelConfigShell";
    levelShell.className = "player-level-config-shell";
    levelShell.innerHTML = `
      <div class="sub-head">打手等级价格</div>
      <div class="level-config-tip">先在技能配置里维护每个技能自己的一级等级和二级等级；新增/编辑打手时会按所选技能自动切换。</div>
    `;
    levelShell.appendChild($("playerLevelList"));
    levelShell.appendChild(document.querySelector(".player-level-actions"));
    configMount.appendChild(levelShell);
  }
  if (levelPanel) {
    levelPanel.classList.add("player-roster-panel");
    const head = levelPanel.querySelector(".sub-head");
    const tip = levelPanel.querySelector(".level-config-tip");
    if (head) head.textContent = "打手资料列表";
    if (tip) tip.textContent = "按昵称、ID、技能等级快速筛选；点击查看/编辑进入资料详情。";
  }
}

function renderStats() {
  const items = [
    ["总用户数", state.stats.users || 0],
    ["今日订单", state.stats.todayOrders || 0],
    ["订单总数", state.stats.orders || 0],
    ["在线客服", state.stats.onlineStaff || 0],
    ["总充值", food(state.stats.rechargeAmount || state.stats.amount || 0)],
    ["待处理提现", food(state.stats.pendingWithdrawalAmount || 0)],
    ["今日收入", food(todayAmount())],
    ["总收入", food(state.stats.amount || 0)],
    ["客服总数", state.staff.length || 0]
  ];
  $("statsGrid").innerHTML = items.map(([label, value]) => `
    <article class="stat-card">
      <strong>${escapeHtml(value)}</strong>
      <span>${label}</span>
    </article>
  `).join("");
}

function todayAmount() {
  const today = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date()).replace(/\//g, "-");
  return state.orders
    .filter((order) => formatAdminDateTime(order.createdAt).startsWith(today))
    .reduce((sum, order) => sum + Number(order.amount || 0), 0);
}

function formatAdminDateTime(value) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(String(value))) return String(value).slice(0, 16);
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

const RMB_RATE = 10;

function tokenToRmb(value) {
  return Number(value || 0) / RMB_RATE;
}

function rmbToToken(value) {
  return Number((Number(value || 0) * RMB_RATE).toFixed(2));
}

function rmbNumber(value) {
  const amount = Number(tokenToRmb(value).toFixed(2));
  return Number.isInteger(amount) ? amount.toFixed(0) : amount.toString();
}

function rmbInput(value) {
  return rmbNumber(value);
}

function rmb(value) {
  return `￥${rmbNumber(value)}`;
}

function signedRmb(value) {
  const amount = Number(value || 0);
  return `${amount >= 0 ? "+" : "-"}${rmb(Math.abs(amount))}`;
}

function food(value) {
  return rmb(value);
}

function orderCount(status) {
  return state.orders.filter((order) => order.status === status).length;
}

function insightMetric(label, value, desc = "", tone = "") {
  return `
    <article class="insight-metric ${tone}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(desc)}</small>
    </article>
  `;
}

function insightAction(label, view) {
  return `<button class="soft-btn" data-view-jump="${escapeHtml(view)}" type="button">${escapeHtml(label)}</button>`;
}

function upsertModuleInsight(viewId, html) {
  const panel = document.querySelector(`#${viewId}View .panel`);
  const head = panel?.querySelector(".panel-head");
  if (!panel || !head) return;
  let box = panel.querySelector(`.module-insight[data-module-insight="${viewId}"]`);
  if (!box) {
    box = document.createElement("section");
    box.className = "module-insight";
    box.dataset.moduleInsight = viewId;
    head.insertAdjacentElement("afterend", box);
  }
  box.innerHTML = html;
}

function renderAdminModuleInsights() {
  const totalAmount = state.orders.reduce((sum, order) => sum + Number(order.originalAmount || order.amount || 0), 0);
  const platformProfit = state.orders.reduce((sum, order) => sum + Number(order.platformCommission || 0), 0);
  const playerIncome = state.orders.reduce((sum, order) => sum + Number(order.playerIncome || 0), 0);
  const completionRate = state.orders.length ? Math.round((orderCount("已完成") / state.orders.length) * 100) : 0;
  upsertModuleInsight("orders", `
    <div class="insight-title">
      <div><strong>订单经营看板</strong><span>先看处理压力、收入拆分和异常订单，再进入明细修改。</span></div>
      <div class="insight-actions">${insightAction("派单处理", "dispatch")}${insightAction("财务流水", "finance")}</div>
    </div>
    <div class="insight-grid">
      ${insightMetric("待确认", orderCount("待确认"), "需要客服确认档期", "warn")}
      ${insightMetric("服务中", orderCount("已确认"), "已确认待完成")}
      ${insightMetric("完成率", `${completionRate}%`, `${orderCount("已完成")} / ${state.orders.length} 单`, completionRate < 50 ? "warn" : "good")}
      ${insightMetric("订单原价", food(totalAmount), "客户侧实付口径")}
      ${insightMetric("平台毛利", food(platformProfit), "抽成和差价合计", "good")}
      ${insightMetric("打手收入", food(playerIncome), "可结算收入口径")}
    </div>
  `);

  const totalBalance = state.users.reduce((sum, user) => sum + Number(user.balanceCatFood || 0), 0);
  const totalSpent = state.users.reduce((sum, user) => sum + Number(user.spentCatFood || 0), 0);
  const memberUsers = state.users.filter((user) => String(user.memberLevelName || "").trim()).length;
  const latestBill = [...(state.customerBills || [])].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))[0];
  upsertModuleInsight("users", `
    <div class="insight-title">
      <div><strong>客户资产中心</strong><span>围绕余额、消费、会员和账单流水管理客户，不再只是一排散列表单。</span></div>
      <div class="insight-actions">${insightAction("会员等级", "users")}${insightAction("充值记录", "recharge")}</div>
    </div>
    <div class="insight-grid">
      ${insightMetric("客户数量", state.users.length, "小程序沉淀客户")}
      ${insightMetric("客户余额", food(totalBalance), "后台预存和充值余额")}
      ${insightMetric("累计消费", food(totalSpent), "会员等级判断口径", "good")}
      ${insightMetric("会员客户", memberUsers, "已匹配会员等级")}
      ${insightMetric("账单流水", state.customerBills.length, latestBill ? String(latestBill.createdAt || "").replace("T", " ").slice(0, 16) : "暂无最新流水")}
      ${insightMetric("搜索定位", state.userFilter || "未筛选", "支持 ID / 昵称 / 会员等级")}
    </div>
  `);

  const players = state.catalog.players || [];
  const linkedPlayers = players.filter((player) => player.workbenchOpenid || player.bindCustomerId).length;
  const revenueConfigs = state.settings.revenueConfigs || state.catalog.revenueConfigs || [];
  const totalPlayerEarned = players.reduce((sum, player) => sum + Number(player.earnedBalance || 0), 0);
  const totalPlayerRecharge = players.reduce((sum, player) => sum + Number(player.rechargeBalance || 0), 0);
  const levelGroups = state.catalog.playerLevelGroups || DEFAULT_PLAYER_LEVEL_GROUPS;
  upsertModuleInsight("players", `
    <div class="insight-title">
      <div><strong>达人管理驾驶舱</strong><span>先看人员资产、等级价格、收入配置和绑定状态，再进入单个资料维护。</span></div>
      <div class="insight-actions">${insightAction("新增达人", "playerCreate")}${insightAction("提现审核", "withdrawals")}</div>
    </div>
    <div class="insight-grid">
      ${insightMetric("达人数量", players.length, "已录入资料")}
      ${insightMetric("已绑定微信", linkedPlayers, "可进入工作台")}
      ${insightMetric("等级组", levelGroups.length, "技能下的一级/二级等级")}
      ${insightMetric("收入配置", revenueConfigs.length, "平台与达人分账模板")}
      ${insightMetric("可提现收入", food(totalPlayerEarned), "订单收入余额", "good")}
      ${insightMetric("充值余额", food(totalPlayerRecharge), "不可提现金额")}
    </div>
  `);

  const visibleGames = (state.catalog.games || []).filter((game) => game.visible !== false);
  const homeGames = visibleGames.filter((game) => game.showOnHome);
  const categories = state.catalog.orderCategories || [];
  const items = state.catalog.orderItems || [];
  const visibleItems = items.filter((item) => item.visible !== false);
  upsertModuleInsight("games", `
    <div class="insight-title">
      <div><strong>商品与下单结构</strong><span>按小程序前端路径管理：首页入口、游戏分类、左侧子类、右侧下单卡和详情价位。</span></div>
      <div class="insight-actions">${insightAction("首页装修", "home")}${insightAction("基础设置", "settings")}</div>
    </div>
    <div class="insight-grid">
      ${insightMetric("上架游戏", visibleGames.length, "可在小程序访问")}
      ${insightMetric("首页入口", homeGames.length, "首屏露出的游戏")}
      ${insightMetric("左侧分类", categories.length, "游戏内子分类")}
      ${insightMetric("下单卡片", visibleItems.length, `${items.length} 个总配置`)}
      ${insightMetric("均价", food(visibleItems.reduce((sum, item) => sum + Number(item.price || item.priceTiers?.[0]?.price || 0), 0) / Math.max(visibleItems.length, 1)), "可见下单项平均价")}
      ${insightMetric("当前游戏", state.activeGameId || "未选中", "编辑区联动对象")}
    </div>
  `);

  const notices = state.catalog.notices || [];
  const settings = state.settings || {};
  upsertModuleInsight("home", `
    <div class="insight-title">
      <div><strong>前端装修发布台</strong><span>这里管理小程序首屏公告、视觉资源和客服入口，保存后前端即时读取。</span></div>
      <div class="insight-actions">${insightAction("商品结构", "games")}${insightAction("系统设置", "settings")}</div>
    </div>
    <div class="insight-grid">
      ${insightMetric("公告数量", notices.length, "首页滚动提示")}
      ${insightMetric("一键匹配背景", settings.quickMatchBackgroundUrl ? "已配置" : "未配置", "影响快捷下单首屏", settings.quickMatchBackgroundUrl ? "good" : "warn")}
      ${insightMetric("客服二维码", settings.customerServiceQrUrl ? "已配置" : "未配置", "用户加客服入口", settings.customerServiceQrUrl ? "good" : "warn")}
      ${insightMetric("审核模式", settings.auditMode === false ? "关闭" : "开启", "控制前端敏感文案")}
      ${insightMetric("支付模式", settings.paymentMode || "未配置", "充值页支付通道")}
      ${insightMetric("营业时间", settings.businessHours || "未填写", "首页展示口径")}
    </div>
  `);
}

function customerBillsForUser(userId) {
  return (state.customerBills || [])
    .filter((bill) => bill.userId === userId)
    .slice(0, 3);
}

function renderUsers() {
  const keyword = String(state.userFilter || "").trim().toLowerCase();
  const users = (state.users || []).filter((user) => {
    if (!keyword) return true;
    return [user.id, user.name, user.contact, user.memberLevelName]
      .some((value) => String(value || "").toLowerCase().includes(keyword));
  });
  $("adminUserList").innerHTML = users.map((user) => {
    const bills = customerBillsForUser(user.id);
    const located = keyword && String(user.id || "").toLowerCase() === keyword;
    const billHtml = bills.length
      ? bills.map((bill) => `
        <span>
          <b>${escapeHtml(bill.title || "余额变动")}</b>
          <em>${signedRmb(bill.amount)}</em>
          <small>${escapeHtml(String(bill.createdAt || "").replace("T", " ").slice(0, 16))}</small>
        </span>
      `).join("")
      : `<span><b>暂无流水</b><em>${rmb(0)}</em><small>后台预存后会同步到小程序账单</small></span>`;
    return `
      <article class="record-row user-row ${located ? "located" : ""}" data-customer="${escapeHtml(user.id)}">
        <div><strong>${escapeHtml(user.name || "小程序用户")}</strong><span>${escapeHtml(user.id || "")}</span></div>
        <div><strong>${food(user.balanceCatFood || 0)}</strong><span>客户余额</span></div>
        <div><strong>${food(user.spentCatFood || 0)}</strong><span>累计消费</span></div>
        <div><strong>${escapeHtml(user.memberLevelName || "会员")}</strong><span>${Number(user.memberDiscount || 100)}% 支付扣款</span></div>
        <input data-customer-amount type="number" step="0.01" placeholder="增加人民币金额，如 10" />
        <input data-customer-note placeholder="备注来源，例如 微信转账 / 活动补偿" />
        <button class="soft-btn" data-add-customer-balance>添加余额</button>
        <div class="user-bills">${billHtml}</div>
      </article>
    `;
  }).join("") || `<div class="record-row">没有找到匹配的客户</div>`;
  renderMemberLevels();
}

function memberLevels() {
  return state.settings.memberLevels || [];
}

function renderMemberLevels() {
  const levels = memberLevels();
  $("memberLevelList").innerHTML = levels.map((level, index) => `
    <article class="record-row member-level-row" data-member-level-index="${index}">
      <input data-member-level-field="id" value="${escapeHtml(level.id)}" />
      <input data-member-level-field="name" value="${escapeHtml(level.name)}" />
      <input data-member-level-field="threshold" type="number" min="0" step="0.01" value="${rmbInput(level.threshold || 0)}" />
      <input data-member-level-field="discount" type="number" min="1" max="100" step="1" value="${Number(level.discount || 100)}" />
      <input data-member-level-field="imageUrl" value="${escapeHtml(level.imageUrl || "")}" placeholder="会员卡图片 URL" />
      <button class="danger-btn" data-delete-member-level="${index}" ${levels.length <= 1 ? "disabled" : ""}>删除</button>
    </article>
  `).join("") || `<div class="record-row">暂无会员等级</div>`;
}

function renderFinance() {
  const filtered = financeRows();
  const total = filtered.reduce((sum, order) => sum + Number(order.amount || 0), 0);
  const playerIncome = filtered.reduce((sum, order) => sum + Number(order.playerIncome || 0), 0);
  const platformProfit = filtered.reduce((sum, order) => sum + Number(order.platformCommission || 0), 0);
  const done = filtered.filter((order) => order.status === "已完成").reduce((sum, order) => sum + Number(order.amount || 0), 0);
  const pending = filtered.filter((order) => order.status === "待确认").reduce((sum, order) => sum + Number(order.amount || 0), 0);
  if ($("financeStartDate")) $("financeStartDate").value = state.financeFilter.start;
  if ($("financeEndDate")) $("financeEndDate").value = state.financeFilter.end;
  if ($("financeKeyword")) $("financeKeyword").value = state.financeFilter.keyword;
  $("financeStats").innerHTML = [
    ["老板实付", total],
    ["打手收入", playerIncome],
    ["平台盈利", platformProfit],
    ["已完成收入", done],
    ["待确认金额", pending],
    ["筛选订单", filtered.length]
  ].map(([label, value]) => `
    <article class="stat-card">
      <strong>${typeof value === "number" && (label.includes("充值") || label.includes("金额") || label.includes("收入") || label.includes("实付") || label.includes("盈利")) ? food(value) : escapeHtml(value)}</strong>
      <span>${label}</span>
    </article>
  `).join("");
  if ($("financeFlowTable")) {
    $("financeFlowTable").innerHTML = filtered.map((order) => `
      <tr>
        <td><strong>${escapeHtml(order.id || "")}</strong><span>${escapeHtml(String(order.createdAt || "").replace("T", " ").slice(0, 16))}</span></td>
        <td><strong>${escapeHtml(order.userName || "小程序用户")}</strong><span>ID ${escapeHtml(order.userId || "")}</span></td>
        <td><strong>${escapeHtml(order.playerName || "待分配")}</strong><span>${escapeHtml(order.serviceName || order.gameName || "")}</span></td>
        <td class="money-cell">${food(order.amount || 0)}</td>
        <td class="money-cell player-income-cell">${food(order.playerIncome || 0)}<span>${Number(order.playerRate || 0).toFixed(0)}%</span></td>
        <td class="money-cell commission-cell">${food(order.platformCommission || 0)}<span>${Number(order.platformRate || 0).toFixed(0)}%</span></td>
        <td><span class="status-tag ${escapeHtml(order.status || "pending")}">${escapeHtml(order.status || "待确认")}</span></td>
      </tr>
    `).join("") || `<tr><td colspan="7" class="empty-cell">当前筛选没有流水</td></tr>`;
  }
}

function financeRows() {
  const start = state.financeFilter.start ? `${state.financeFilter.start}T00:00:00` : "";
  const end = state.financeFilter.end ? `${state.financeFilter.end}T23:59:59` : "";
  const keyword = String(state.financeFilter.keyword || "").trim().toLowerCase();
  return (state.orders || []).filter((order) => {
    const created = String(order.createdAt || "");
    if (start && created < start) return false;
    if (end && created > end) return false;
    if (!keyword) return true;
    return [order.id, order.userId, order.userName, order.playerId, order.playerName, order.serviceName, order.gameName]
      .some((value) => String(value || "").toLowerCase().includes(keyword));
  });
}

function renderStaff() {
  $("staffList").innerHTML = state.staff.map((account) => `
    <article class="record-row staff-row" data-staff="${escapeHtml(account.id)}">
      <div class="staff-status-cell">
        <strong>${escapeHtml(account.name || "客服")}</strong>
        <span class="status-pill ${account.isOnline === false ? "offline" : "online"}">
          <i></i>${account.isOnline === false ? "离线" : "在线"}
        </span>
      </div>
      <label class="inline-field"><span>名称</span><input data-field="name" value="${escapeHtml(account.name)}" /></label>
      <label class="inline-field"><span>账号</span><input data-field="username" value="${escapeHtml(account.username)}" /></label>
      <label class="inline-field"><span>密码</span><input data-field="password" placeholder="留空不改密码" /></label>
      <label class="inline-field"><span>头像</span><input data-field="avatar" value="${escapeHtml(account.avatar || "")}" placeholder="头像 URL / base64" /></label>
      <label class="switch-field">
        <input data-field="isOnline" type="checkbox" ${account.isOnline === false ? "" : "checked"} />
        <span>在线接单</span>
      </label>
      <div class="staff-metrics">
        <span><strong>${Number(account.servedOrders || 0)}</strong>服务订单</span>
        <span><strong>${Number(account.completedOrders || 0)}</strong>已完成</span>
        <span><strong>${Number(account.pendingOrders || 0)}</strong>处理中</span>
        <span><strong>${food(account.amount || 0)}</strong>收入</span>
      </div>
      <div class="inline-actions">
        <button class="soft-btn" data-save-staff="${escapeHtml(account.id)}">保存</button>
        <button class="danger-btn" data-delete-staff="${escapeHtml(account.id)}">删除</button>
      </div>
    </article>
  `).join("") || `<div class="record-row">暂无客服账号</div>`;
}

function renderHomeConfig() {
  $("noticeList").innerHTML = (state.catalog.notices || []).map((text, index) => `
    <article class="record-row notice-row" data-notice-index="${index}">
      <input data-notice-field value="${escapeHtml(text)}" />
      <button class="danger-btn" data-delete-notice="${index}">删除</button>
    </article>
  `).join("");
  renderHomeMiniPreview();
}

function miniImage(value, fallback = "./assets/guiyuan-logo.jpg") {
  const url = String(value || "").trim();
  if (!url) return fallback;
  if (url.startsWith("/")) return `.${url}`;
  return url;
}

function miniImgAttrs(value, fallback = "./assets/guiyuan-logo.jpg") {
  const safeFallback = escapeHtml(fallback);
  return `src="${escapeHtml(miniImage(value, fallback))}" onerror="this.onerror=null;this.src='${safeFallback}'"`;
}

function previewCatalog() {
  return {
    ...state.catalog,
    notices: document.querySelectorAll("[data-notice-field]").length ? collectNotices() : (state.catalog.notices || []),
    games: document.querySelectorAll("[data-game-index]").length ? collectGames() : (state.catalog.games || []),
    orderCategories: document.querySelectorAll("[data-order-category-index]").length ? collectOrderCategories() : (state.catalog.orderCategories || []),
    orderItems: document.querySelectorAll("[data-order-item-index]").length ? collectOrderItems() : (state.catalog.orderItems || [])
  };
}

function renderHomeMiniPreview() {
  const mount = $("homeMiniPreview");
  if (!mount) return;
  const catalog = previewCatalog();
  const notices = (catalog.notices || []).filter(Boolean);
  const games = (catalog.games || []).filter((item) => item.id !== "all" && item.visible !== false).slice(0, 8);
  const players = (catalog.players || []).slice(0, 3);
  mount.innerHTML = `
    <div class="mini-screen">
      <div class="mini-status"><span>20:58</span><span>5G · 51%</span></div>
      <div class="mini-hero">
        <img ${miniImgAttrs(catalog.brand?.logo || "/assets/guiyuan-logo.jpg")} alt="" />
        <div><strong>${escapeHtml(catalog.brand?.name || "桂圆电竞")}</strong><span>电竞陪玩 · 快速下单</span></div>
      </div>
      <div class="mini-search">搜索游戏 / 打手 / 服务</div>
      <div class="mini-notice">${escapeHtml(notices[0] || "欢迎来到桂圆电竞")}</div>
      <div class="mini-section-title">热门游戏</div>
      <div class="mini-game-grid">
        ${games.map((game) => `
          <div class="mini-game">
            <img ${miniImgAttrs(game.iconUrl, "./assets/guiyuan-logo.jpg")} alt="" />
            <span>${escapeHtml(game.name)}</span>
          </div>
        `).join("") || `<div class="mini-empty">暂无游戏分类</div>`}
      </div>
      <div class="mini-section-title">热门打手</div>
      <div class="mini-player-list">
        ${players.map((player) => `
          <div class="mini-player">
            <img ${miniImgAttrs(player.avatar, "./assets/guiyuan-logo.jpg")} alt="" />
            <div><strong>${escapeHtml(player.name || "未命名")}</strong><span>${escapeHtml(player.level || "在线接单")} · ${food(player.price || 0)}</span></div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function gameOptions(selected) {
  return state.catalog.games
    .filter((game) => game.id !== "all")
    .map((game) => `<option value="${escapeHtml(game.id)}" ${game.id === selected ? "selected" : ""}>${escapeHtml(game.name)}</option>`)
    .join("");
}

function revenueConfigs() {
  return state.settings.revenueConfigs || [
    { id: "config_1", name: "配置一", platformRate: 30, playerRate: 70 }
  ];
}

function configPlayerRate(config) {
  return Math.max(0, Math.min(100, Number(config.playerRate ?? (100 - Number(config.platformRate ?? 30)))));
}

function revenueSummaryText(playerRate) {
  const safePlayerRate = Math.max(0, Math.min(100, Number(playerRate || 0)));
  return `打手 ${safePlayerRate.toFixed(0)}% / 平台 ${(100 - safePlayerRate).toFixed(0)}%`;
}

function revenueConfigOptions(selected) {
  return revenueConfigs().map((config) => (
    `<option value="${escapeHtml(config.id)}" ${config.id === selected ? "selected" : ""}>${escapeHtml(config.name)}｜打手 ${configPlayerRate(config).toFixed(0)}%</option>`
  )).join("");
}

function renderRevenueConfigs() {
  const configs = revenueConfigs();
  $("revenueConfigList").innerHTML = configs.map((config, index) => `
    <article class="record-row revenue-config-row" data-revenue-config-index="${index}">
      <input data-revenue-field="name" value="${escapeHtml(config.name)}" />
      <input data-revenue-field="playerRate" type="number" min="0" max="100" step="1" value="${configPlayerRate(config).toFixed(0)}" />
      <div class="revenue-config-summary"><strong>打手收入占比</strong><span data-revenue-summary>${revenueSummaryText(configPlayerRate(config))}</span></div>
      <button class="danger-btn" data-delete-revenue-config="${index}" ${configs.length <= 1 ? "disabled" : ""}>删除</button>
    </article>
  `).join("");
  $("bulkRevenueConfig").innerHTML = revenueConfigOptions(state.settings.defaultRevenueConfigId);
}

function orderCategories() {
  return state.catalog.orderCategories || [];
}

function orderItems() {
  return state.catalog.orderItems || [];
}

function editableGames() {
  return (state.catalog.games || []).filter((game) => game.id !== "all");
}

function activeGameId() {
  const games = editableGames();
  if (!games.length) return "";
  if (!state.activeGameId || !games.some((item) => item.id === state.activeGameId)) {
    state.activeGameId = games[0].id;
  }
  return state.activeGameId;
}

function orderCategoryOptions(selected) {
  const gameId = activeGameId();
  return orderCategories().filter((item) => !item.gameId || item.gameId === gameId).map((item) => (
    `<option value="${escapeHtml(item.id)}" ${item.id === selected ? "selected" : ""}>${escapeHtml(item.name)}</option>`
  )).join("");
}

function activeOrderCategoryId() {
  const gameId = activeGameId();
  const categories = orderCategories().filter((item) => !item.gameId || item.gameId === gameId);
  if (!categories.length) return "";
  if (!state.activeOrderCategoryId || !categories.some((item) => item.id === state.activeOrderCategoryId)) {
    state.activeOrderCategoryId = categories[0].id;
  }
  return state.activeOrderCategoryId;
}

function formatPriceTiers(tiers = []) {
  return tiers.map((tier) => `${tier.name || ""}|${rmbInput(tier.price || 0)}|${tier.desc || ""}`).join("\n");
}

function renderGames() {
  const activeGame = activeGameId();
  $("gameList").innerHTML = state.catalog.games.map((game, index) => `
    <article class="game-admin-card product-game-row ${game.id === activeGame ? "active" : ""}" data-game-index="${index}" data-game-id="${escapeHtml(game.id)}">
      <button class="product-game-selector" data-select-game="${escapeHtml(game.id)}" type="button">
        <img ${miniImgAttrs(game.iconUrl, "./assets/guiyuan-logo.jpg")} alt="" />
        <span><strong>${escapeHtml(game.name || "未命名游戏")}</strong><em>${escapeHtml(game.id || "")}</em></span>
        <b>${game.id === activeGame ? "当前" : "选择"}</b>
      </button>
      <div class="product-game-fields ${game.id === activeGame ? "" : "collapsed"}">
        <label><span>游戏ID</span><input data-game-field="id" value="${escapeHtml(game.id)}" ${game.id === "all" ? "disabled" : ""} /></label>
        <label><span>游戏名称</span><input data-game-field="name" value="${escapeHtml(game.name)}" /></label>
        <label><span>图标</span><input data-game-field="iconUrl" value="${escapeHtml(game.iconUrl || "")}" placeholder="/assets/game/xxx.png" /></label>
        <label><span>排序</span><input data-game-field="sort" type="number" value="${Number(game.sort || index + 1)}" /></label>
        <label class="switch-field"><input data-game-field="showOnHome" type="checkbox" ${game.showOnHome === false || game.id === "all" ? "" : "checked"} ${game.id === "all" ? "disabled" : ""} /><span>首页显示</span></label>
        <label class="switch-field"><input data-game-field="visible" type="checkbox" ${game.visible === false ? "" : "checked"} /><span>其他游戏显示</span></label>
        <button class="danger-btn" data-delete-game="${index}" ${game.id === "all" ? "disabled" : ""}>删除游戏</button>
      </div>
    </article>
  `).join("");
  const currentCategoryId = activeOrderCategoryId();
  const categoriesForGame = orderCategories()
    .map((category, index) => ({ category, index }))
    .filter(({ category }) => !category.gameId || category.gameId === activeGame);
  $("orderCategoryList").innerHTML = categoriesForGame.map(({ category, index }) => `
    <article class="record-row order-category-row ${category.id === currentCategoryId ? "active" : ""}" data-order-category-index="${index}" data-order-category-id="${escapeHtml(category.id)}">
      <button class="category-select-btn" data-select-order-category="${escapeHtml(category.id)}" type="button">${category.id === currentCategoryId ? "当前" : "选择"}</button>
      <input data-order-category-field="id" value="${escapeHtml(category.id)}" placeholder="分类ID" />
      <label class="category-name-field">
        <span>分类名称</span>
        <input data-order-category-field="name" value="${escapeHtml(category.name)}" placeholder="例如 趣味单 / 排位陪练" />
        <em>ID：${escapeHtml(category.id)}</em>
      </label>
      <input data-order-category-field="gameId" value="${escapeHtml(category.gameId || activeGame)}" hidden />
      <label class="category-sort-field">
        <span>排序</span>
        <input data-order-category-field="sort" type="number" value="${Number(category.sort || index + 1)}" placeholder="排序" />
      </label>
      <label class="switch-field"><input data-order-category-field="visible" type="checkbox" ${category.visible === false ? "" : "checked"} /><span>显示</span></label>
      <button class="danger-btn" data-delete-order-category="${index}">删除</button>
    </article>
  `).join("") || `<div class="record-row">当前游戏暂无左侧分类</div>`;
  const filteredItems = orderItems()
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.gameId === activeGame && (!currentCategoryId || item.categoryId === currentCategoryId));
  $("orderItemList").innerHTML = filteredItems.map(({ item, index }) => `
    <article class="record-row order-item-row" data-order-item-index="${index}">
      <div class="order-item-head">
        <input data-order-item-field="id" value="${escapeHtml(item.id)}" placeholder="订单ID" />
        <label class="order-title-field">
          <span>订单标题</span>
          <input data-order-item-field="title" value="${escapeHtml(item.title)}" placeholder="订单卡标题" />
        </label>
        <input data-order-item-field="gameId" value="${escapeHtml(activeGame)}" hidden />
        <label>
          <span>所属分类</span>
          <select data-order-item-field="categoryId">${orderCategoryOptions(item.categoryId)}</select>
        </label>
        <label>
          <span>下单方式</span>
          <select data-order-item-field="orderMode">
            <option value="random_hour" ${item.orderMode === "random_hour" ? "selected" : ""}>随机小时陪：进入筛选页</option>
            <option value="fixed_tier" ${item.orderMode === "fixed_tier" ? "selected" : ""}>普通单：选择价位后建群</option>
          </select>
        </label>
        <label>
          <span>角标</span>
          <input data-order-item-field="tag" value="${escapeHtml(item.tag || "")}" placeholder="热门 / 新品" />
        </label>
        <label>
          <span>排序</span>
          <input data-order-item-field="sort" type="number" value="${Number(item.sort || index + 1)}" placeholder="排序" />
        </label>
        <label class="switch-field"><input data-order-item-field="visible" type="checkbox" ${item.visible === false ? "" : "checked"} /><span>上架</span></label>
      </div>
      <div class="order-item-copy">
        <input data-order-item-field="desc" value="${escapeHtml(item.desc || "")}" placeholder="订单卡说明，对应小程序列表副标题" />
        <input data-order-item-field="note" value="${escapeHtml(item.note || "")}" placeholder="小标签说明，如 适合随机匹配打手" />
      </div>
      <div class="image-config-row">
        <input data-order-item-field="imageUrl" value="${escapeHtml(item.mainImageUrl || item.detailImageUrl || item.imageUrl || "")}" placeholder="订单卡图/详情顶部图 URL" />
        <label class="image-drop-zone" data-image-drop="imageUrl">
          <input type="file" accept="image/*" data-image-upload="imageUrl" />
          <span>拖拽主图/选择文件</span>
        </label>
      </div>
      <textarea data-order-item-field="detailDesc" placeholder="订单详情里的订单说明">${escapeHtml(item.detailDesc || "")}</textarea>
      <textarea data-order-item-field="priceTiers" placeholder="规格价位：一行一个人民币金额，如 1小时|138|按筛选条件随机派单">${escapeHtml(formatPriceTiers(item.priceTiers || []))}</textarea>
      <input data-order-item-field="tags" value="${escapeHtml((item.tags || []).join("，"))}" placeholder="详情标签，逗号分隔，如 小时陪，随机，可筛选" />
      <div class="order-item-actions">
        <span>订单ID：${escapeHtml(item.id)}</span>
        <button class="danger-btn" data-delete-order-item="${index}">删除订单类型</button>
      </div>
    </article>
  `).join("") || `<div class="record-row">当前子分类暂无订单类型</div>`;
  renderGamesMiniPreview();
  renderGameOverview();
}

function renderGameOverview() {
  const mount = $("gameOverviewMount");
  if (!mount) return;
  const games = editableGames().sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  const categories = orderCategories();
  const items = orderItems();
  mount.innerHTML = `
    <div class="commerce-toolbar">
      <div>
        <strong>小程序商品结构</strong>
        <span>像成熟后台一样先按游戏入口管理，再进入单个游戏维护分类和订单卡。</span>
      </div>
      <div class="commerce-head-actions">
        <button class="soft-btn" data-view-jump="gameCreate" type="button">新增游戏</button>
        <button class="primary-btn" data-view-jump="gameStructure" type="button">进入分类订单</button>
      </div>
    </div>
    <div class="commerce-game-grid">
      ${games.map((game) => {
        const gameCategories = categories.filter((item) => !item.gameId || item.gameId === game.id);
        const gameItems = items.filter((item) => item.gameId === game.id);
        const visibleItems = gameItems.filter((item) => item.visible !== false);
        const avgPrice = visibleItems.reduce((sum, item) => sum + Number(item.price || item.priceTiers?.[0]?.price || 0), 0) / Math.max(visibleItems.length, 1);
        return `
          <article class="commerce-game-card ${game.id === state.activeGameId ? "active" : ""}">
            <div class="commerce-game-head">
              <img ${miniImgAttrs(game.iconUrl, "./assets/guiyuan-logo.jpg")} alt="" />
              <div>
                <strong>${escapeHtml(game.name || "未命名游戏")}</strong>
                <span>${escapeHtml(game.id || "")}</span>
              </div>
              <em>${game.visible === false ? "已隐藏" : "上架中"}</em>
            </div>
            <div class="commerce-game-metrics">
              <span><b>${gameCategories.length}</b>分类</span>
              <span><b>${gameItems.length}</b>订单卡</span>
              <span><b>${food(avgPrice)}</b>均价</span>
            </div>
            <div class="commerce-game-flags">
              <span class="${game.showOnHome ? "on" : ""}">首页${game.showOnHome ? "展示" : "隐藏"}</span>
              <span class="${game.visible !== false ? "on" : ""}">列表${game.visible !== false ? "展示" : "隐藏"}</span>
            </div>
            <button class="primary-btn" data-open-game-structure="${escapeHtml(game.id)}" type="button">配置分类与订单</button>
          </article>
        `;
      }).join("") || `<div class="record-row">暂无游戏，先新增一个游戏入口。</div>`}
    </div>
  `;
}

function renderGamesMiniPreview() {
  const mount = $("gamesMiniPreview");
  if (!mount) return;
  const catalog = previewCatalog();
  const games = (catalog.games || []).filter((game) => game.id !== "all" && game.visible !== false);
  const gameId = activeGameId();
  const categories = (catalog.orderCategories || []).filter((item) => item.visible !== false && (!item.gameId || item.gameId === gameId))
    .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  const currentCategoryId = activeOrderCategoryId();
  const activeCategory = categories.find((item) => item.id === currentCategoryId) || categories[0] || null;
  const items = (catalog.orderItems || []).filter((item) => item.visible !== false && item.gameId === gameId && (!activeCategory || item.categoryId === activeCategory.id))
    .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  mount.innerHTML = `
    <div class="mini-screen mini-orders-screen">
      <div class="mini-status"><span>20:58</span><span>5G · 51%</span></div>
      <div class="mini-page-title">游戏下单</div>
      <div class="mini-game-tabs">
        ${games.slice(0, 5).map((game, index) => `
          <span class="${index === 0 ? "active" : ""}">${escapeHtml(game.name)}</span>
        `).join("") || `<span class="active">暂无游戏</span>`}
      </div>
      <div class="mini-order-body">
        <div class="mini-side-cats">
          ${categories.map((category) => `
            <span class="${activeCategory && category.id === activeCategory.id ? "active" : ""}">${escapeHtml(category.name)}</span>
          `).join("") || `<span class="active">暂无分类</span>`}
        </div>
        <div class="mini-order-list">
          ${items.map((item) => {
            const tier = (item.priceTiers || [])[0] || {};
            return `
              <div class="mini-order-card">
                <img ${miniImgAttrs(item.mainImageUrl || item.detailImageUrl || item.imageUrl, "./assets/guiyuan-logo.jpg")} alt="" />
                <div>
                  <strong>${escapeHtml(item.title || "未命名订单")}</strong>
                  <span>${escapeHtml(item.desc || item.note || "后台可配置说明")}</span>
                  <em>${food(tier.price || item.price || 0)}起</em>
                </div>
                ${item.tag ? `<b>${escapeHtml(item.tag)}</b>` : ""}
              </div>
            `;
          }).join("") || `<div class="mini-empty">当前分类暂无订单</div>`}
        </div>
      </div>
    </div>
  `;
}

function cloneLevelGroups(groups) {
  return JSON.parse(JSON.stringify(groups || DEFAULT_PLAYER_LEVEL_GROUPS));
}

function playerLevelGroups() {
  const configured = Array.isArray(state.catalog.playerLevelGroups) && state.catalog.playerLevelGroups.length
    ? state.catalog.playerLevelGroups
    : DEFAULT_PLAYER_LEVEL_GROUPS;
  const configuredMap = new Map(configured.map((group) => [String(group.id || group.name || ""), group]));
  return DEFAULT_PLAYER_LEVEL_GROUPS.map((group) => {
    const saved = configuredMap.get(group.id) || configured.find((item) => item.name === group.name) || {};
    const savedLevels = Array.isArray(saved.levels) ? saved.levels : [];
    return {
      id: group.id,
      name: saved.name || group.name,
      levels: group.levels.map((level) => {
        const savedLevel = savedLevels.find((item) => item.id === level.id || item.name === level.name) || {};
        return {
          id: level.id,
          name: savedLevel.name || level.name,
          price: Math.max(0, Number(savedLevel.price ?? level.price ?? 0))
        };
      })
    };
  });
}

function playerLevelName(dimensionId, levelId) {
  const group = allConfiguredLevelGroups().find((item) => item.id === dimensionId);
  const level = group?.levels.find((item) => item.id === levelId || item.name === levelId);
  return level ? level.name : (levelId || "未配置");
}

function playerLevelPrice(dimensionId, levelId) {
  const group = allConfiguredLevelGroups().find((item) => item.id === dimensionId);
  const level = group?.levels.find((item) => item.id === levelId || item.name === levelId);
  return Number(level?.price || 0);
}

function allConfiguredLevelGroups() {
  const groups = [...playerLevelGroups()];
  (quickMatchConfig().skills || []).forEach((skill) => {
    (Array.isArray(skill.levelGroups) ? skill.levelGroups : []).forEach((group) => {
      if (!groups.some((item) => item.id === group.id)) groups.push(group);
    });
  });
  return groups;
}

function normalizePlayerLevels(player = {}) {
  const firstLevel = playerLevelGroups()[0]?.levels[0]?.id || "";
  const legacy = String(player.level || "").trim();
  const byLegacy = playerLevelGroups()[0]?.levels.find((item) => item.name === legacy || item.id === legacy)?.id || firstLevel;
  return {
    confidential: player.levels?.confidential || player.confidentialLevel || byLegacy,
    top_secret: player.levels?.top_secret || player.topSecretLevel || firstLevel
  };
}

function levelOptions(selected, includeAll = false) {
  const options = includeAll ? [`<option value="all">全部等级</option>`] : [];
  playerLevelGroups().forEach((group) => {
    group.levels.forEach((level) => {
      const value = `${group.id}:${level.id}`;
      options.push(`<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(group.name)} / ${escapeHtml(level.name)}</option>`);
    });
  });
  return options.join("");
}

function dimensionLevelOptions(dimensionId, selected) {
  const group = playerLevelGroups().find((item) => item.id === dimensionId) || playerLevelGroups()[0];
  return (group?.levels || []).map((level) => (
    `<option value="${escapeHtml(level.id)}" ${level.id === selected ? "selected" : ""}>${escapeHtml(level.name)}｜${food(level.price || 0)}</option>`
  )).join("");
}

function renderPlayerLevels() {
  $("playerLevelList").innerHTML = playerLevelGroups().map((group) => `
    <section class="level-group-card" data-player-level-group="${escapeHtml(group.id)}">
      <div class="level-group-head">
        <strong>${escapeHtml(group.name)}</strong>
        <span>可按业务修改名称、价格和二级等级</span>
      </div>
      <div class="level-price-grid">
        ${group.levels.map((level) => `
          <label class="level-price-cell" data-player-level-id="${escapeHtml(level.id)}">
            <span>${escapeHtml(level.name)}</span>
            <input data-player-level-price type="number" min="0" step="0.01" value="${rmbInput(level.price || 0)}" />
          </label>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function revenueConfigName(id) {
  const config = revenueConfigs().find((item) => item.id === id) || revenueConfigs()[0] || {};
  return config.name ? `${config.name}｜打手 ${configPlayerRate(config).toFixed(0)}%` : "未配置";
}

function filteredPlayerEntries() {
  const keyword = state.playerFilter.keyword.trim().toLowerCase();
  const level = state.playerFilter.level;
  return state.catalog.players
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => {
      const levels = normalizePlayerLevels(player);
      const confidentialName = playerLevelName("confidential", levels.confidential);
      const topSecretName = playerLevelName("top_secret", levels.top_secret);
      const text = `${player.name || ""} ${player.id || ""} ${confidentialName} ${topSecretName}`.toLowerCase();
      const matchKeyword = !keyword || text.includes(keyword);
      const matchLevel = level === "all" || level === `confidential:${levels.confidential}` || level === `top_secret:${levels.top_secret}`;
      return matchKeyword && matchLevel;
    });
}

function showPlayerList() {
  state.activePlayerIndex = null;
  $("playerDetailPanel").classList.add("hidden");
  $("playerListPanel").classList.remove("hidden");
}

function openPlayerDetail(index) {
  state.activePlayerIndex = Number(index);
  $("playerListPanel").classList.add("hidden");
  $("playerDetailPanel").classList.remove("hidden");
  renderPlayerDetail();
}

function renderPlayerDetail() {
  const player = state.catalog.players[state.activePlayerIndex];
  if (!player) {
    showPlayerList();
    return;
  }
  $("playerDetailMeta").textContent = `${player.name || "未命名"} · ${player.id || "未设置 ID"}`;
  $("detailPlayerId").value = player.id || "";
  $("detailPlayerName").value = player.name || "";
  $("detailPlayerTitle").value = player.title || "";
  $("detailPlayerGame").innerHTML = gameOptions(player.game);
  const levels = normalizePlayerLevels(player);
  $("detailPlayerConfidentialLevel").innerHTML = dimensionLevelOptions("confidential", levels.confidential);
  $("detailPlayerTopSecretLevel").innerHTML = dimensionLevelOptions("top_secret", levels.top_secret);
  $("detailPlayerRevenueConfig").innerHTML = revenueConfigOptions(player.revenueConfigId || state.settings.defaultRevenueConfigId);
  $("detailPlayerSecret").value = player.workbenchSecret || "";
  $("detailPlayerWorkbenchOpenid").value = player.workbenchOpenid || "";
  $("detailPlayerBindCustomerId").value = player.workbenchBoundCustomerId || "";
  $("detailPlayerHomeSort").value = Number(player.homeSort ?? player.sort ?? state.activePlayerIndex + 1);
  $("detailPlayerShowOnHome").checked = player.showOnHome !== false;
  $("detailPlayerBindMeta").textContent = player.workbenchBoundCustomerId
    ? `已绑定用户 ${player.workbenchBoundCustomerId}${player.workbenchBoundCustomerName ? ` · ${player.workbenchBoundCustomerName}` : ""}`
    : "未绑定用户ID";
  $("detailPlayerPrice").value = rmbInput(playerLevelPrice("confidential", levels.confidential));
  $("detailPlayerSold").value = Number(player.sold || 0);
  $("detailPlayerEarnedBalance").value = rmbInput(player.earnedCatFood ?? player.balanceCatFood ?? 0);
  $("detailPlayerRechargeBalance").value = rmbInput(player.rechargeCatFood || 0);
  $("detailPlayerPendingWithdraw").value = rmbInput(player.pendingWithdrawCatFood || 0);
  $("detailPlayerTags").value = (player.tags || []).join("，");
  $("detailPlayerSchedule").value = (player.schedule || []).join("，");
  $("detailPlayerIntro").value = player.intro || "";
}

function renderPlayerCreate() {
  if (!$("createPlayerGame")) return;
  const firstGroup = linkedLevelGroupsForSkill(game)[0];
  const secondGroup = playerLevelGroups()[1] || firstGroup;
  $("createPlayerGame").innerHTML = gameOptions($("createPlayerGame").value);
  $("createPlayerConfidentialLevel").innerHTML = dimensionLevelOptions("confidential", $("createPlayerConfidentialLevel").value || firstGroup?.levels?.[0]?.id || "");
  $("createPlayerTopSecretLevel").innerHTML = dimensionLevelOptions("top_secret", $("createPlayerTopSecretLevel").value || secondGroup?.levels?.[0]?.id || "");
  $("createPlayerRevenueConfig").innerHTML = revenueConfigOptions($("createPlayerRevenueConfig").value || state.settings.defaultRevenueConfigId);
}

function renderPlayers() {
  renderPlayerLevels();
  $("playerSearchInput").value = state.playerFilter.keyword;
  $("playerLevelFilter").innerHTML = levelOptions(state.playerFilter.level, true);
  $("playerList").innerHTML = filteredPlayerEntries().map(({ player, index }) => `
    <tr data-player-index="${index}">
      <td><input data-player-select type="checkbox" /></td>
      <td><strong>${escapeHtml(player.name || "未命名")}</strong><span>${escapeHtml(player.title || "")}</span></td>
      <td><code>${escapeHtml(player.id || "")}</code></td>
      <td><strong>${escapeHtml(playerLevelName("confidential", normalizePlayerLevels(player).confidential))}</strong><span>${food(playerLevelPrice("confidential", normalizePlayerLevels(player).confidential))}</span></td>
      <td><strong>${escapeHtml(playerLevelName("top_secret", normalizePlayerLevels(player).top_secret))}</strong><span>${food(playerLevelPrice("top_secret", normalizePlayerLevels(player).top_secret))}</span></td>
      <td class="player-home-cell">
        <input data-player-home-sort="${index}" type="number" min="0" value="${Number(player.homeSort ?? player.sort ?? index + 1)}" title="首页热门达人排序，数字越小越靠前" />
        <label><input data-player-show-home="${index}" type="checkbox" ${player.showOnHome === false ? "" : "checked"} /> 首页</label>
      </td>
      <td>${escapeHtml(revenueConfigName(player.revenueConfigId || state.settings.defaultRevenueConfigId))}</td>
      <td class="money-cell">
        ${food(player.earnedCatFood ?? player.balanceCatFood ?? 0)} 可提
        <span>${food(player.rechargeCatFood || 0)} 充值</span>
      </td>
      <td class="inline-actions">
        <button class="soft-btn" data-open-player="${index}" type="button">查看/编辑</button>
        <button class="danger-btn" data-delete-player="${index}" type="button">删除</button>
      </td>
    </tr>
  `).join("") || `<tr><td colspan="9" class="empty-cell">没有匹配的打手</td></tr>`;
  if (state.activePlayerIndex !== null) renderPlayerDetail();
}

function renderSettings() {
  $("shopName").value = state.settings.shopName || "";
  $("businessHours").value = state.settings.businessHours || "";
  $("quickMatchBackgroundUrl").value = state.settings.quickMatchBackgroundUrl || "";
  $("customerServiceQrUrl").value = state.settings.customerServiceQrUrl || "";
  $("slaMinutes").value = state.settings.slaMinutes || 5;
  $("referralEnabled").value = state.settings.referralEnabled === false ? "false" : "true";
  $("auditMode").value = state.settings.auditMode === false ? "false" : "true";
  $("paymentMode").value = state.settings.paymentMode || "official_virtual";
  $("virtualPaymentOfferId").value = state.settings.virtualPaymentOfferId || "";
  $("virtualPaymentAppKey").value = state.settings.virtualPaymentAppKey || "";
  $("virtualPaymentMode").value = state.settings.virtualPaymentMode || "short_series_coin";
  $("virtualPaymentEnv").value = state.settings.virtualPaymentEnv || "release";
  $("virtualPaymentCurrencyType").value = state.settings.virtualPaymentCurrencyType || "CNY";
  $("virtualPaymentPlatform").value = state.settings.virtualPaymentPlatform || "android";
  $("referralCommissionRate").value = state.settings.referralCommissionRate ?? 5;
  $("referralCommissionMonths").value = state.settings.referralCommissionMonths ?? 1;
  $("autoGreeting").value = state.settings.autoGreeting || "";
  $("offlineMessage").value = state.settings.offlineMessage || "";
  renderGiftPrices();
}

function renderGiftPrices() {
  const gifts = state.settings.giftCatalog || [];
  $("giftPriceList").innerHTML = gifts.map((gift, index) => `
    <article class="gift-price-item" data-gift-index="${index}">
      <img src="${escapeHtml(gift.imageUrl || "/assets/cat-food.jpg")}" alt="" />
      <label>
        <span>${escapeHtml(gift.name || "礼物")}</span>
        <input data-gift-price type="number" min="0.01" step="0.01" value="${rmbInput(gift.price || 1)}" />
      </label>
    </article>
  `).join("") || `<div class="record-row">暂无礼物配置</div>`;
}

function collectGiftCatalog() {
  const gifts = state.settings.giftCatalog || [];
  return [...document.querySelectorAll("[data-gift-index]")].map((row) => {
    const index = Number(row.dataset.giftIndex);
    const gift = gifts[index] || {};
    return {
      ...gift,
      price: Math.max(1, rmbToToken(row.querySelector("[data-gift-price]")?.value || rmbInput(gift.price || 1)))
    };
  });
}

function renderOrders() {
  $("adminOrderTable").innerHTML = state.orders.map((order) => `
    <tr data-admin-order="${escapeHtml(order.id)}">
      <td><strong>${escapeHtml(order.id)}</strong><span>${escapeHtml(order.createdAt || "")}</span></td>
      <td><strong>${escapeHtml(order.userName)}</strong><span>${escapeHtml(order.contact || order.userPhone || "")}</span></td>
      <td><strong>${escapeHtml(order.playerName || "")}</strong><span>${escapeHtml(order.gameName || order.serviceName || "")}</span></td>
      <td class="money-cell">${food(order.originalAmount || order.amount || 0)}</td>
      <td class="money-cell commission-cell">${food(order.platformCommission || 0)}<span>${Number(order.platformRate || 0).toFixed(0)}%</span></td>
      <td class="money-cell player-income-cell">${food(order.playerIncome || 0)}<span>${Number(order.playerRate || 0).toFixed(0)}%</span></td>
      <td><strong>${escapeHtml(order.revenueConfigName || "默认配置")}</strong><span>${escapeHtml(order.revenueConfigId || "")}</span></td>
      <td>
        <select data-order-field="status">
          ${["待确认", "已确认", "已完成", "已取消"].map((status) => `<option value="${status}" ${order.status === status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </td>
      <td><input data-order-field="assignee" value="${escapeHtml(order.assignee || "")}" /></td>
      <td><input data-order-field="note" value="${escapeHtml(order.note || "")}" /></td>
    </tr>
  `).join("") || `<tr><td colspan="10" class="empty-cell">暂无订单</td></tr>`;
}

function renderMessages() {
  const waiting = state.sessions.filter((session) => Number(session.unreadStaff || 0) > 0 || session.slaStatus === "waiting" || session.slaStatus === "overdue");
  $("messageList").innerHTML = waiting.map((session) => `
    <article class="record-row session-row">
      <div><strong>${escapeHtml(session.title)}</strong><span>${escapeHtml(session.channel || "小程序群聊")}</span></div>
      <div><strong>${Number(session.unreadStaff || 0)} 条未读</strong><span>${escapeHtml(session.slaStatus || "ok")}</span></div>
      <div><strong>${escapeHtml(session.userName)}</strong><span>${escapeHtml(session.contact || "")}</span></div>
      <div><strong>${escapeHtml(session.assignedName || "未接待")}</strong><span>${escapeHtml(session.lastMessageAt || "")}</span></div>
      <a class="soft-link" href="./index.html">处理</a>
    </article>
  `).join("") || `<div class="record-row">暂无待处理消息</div>`;
}

function renderComplaints() {
  const rows = state.complaints || [];
  $("complaintList").innerHTML = rows.map((item) => `
    <article class="record-row complaint-row">
      <div><strong>${escapeHtml(item.userName || "小程序用户")}</strong><span>投诉人ID ${escapeHtml(item.userId || "")}</span></div>
      <div><strong>${escapeHtml(item.playerName || "未命名打手")}</strong><span>打手ID ${escapeHtml(item.playerId || "")}</span></div>
      <div><strong>${escapeHtml(item.reason || "其他问题")}</strong><span>${escapeHtml(String(item.createdAt || "").replace("T", " ").slice(0, 16))}</span></div>
      <div class="complaint-content"><strong>${escapeHtml(item.content || "")}</strong><span>${escapeHtml(item.status || "pending")}</span></div>
    </article>
  `).join("") || `<div class="record-row">暂无投诉信息</div>`;
}

function orderRecord(order) {
  return `
    <article class="record-row order-record">
      <div><strong>${escapeHtml(order.id)}</strong><span>${escapeHtml(order.createdAt || "")}</span></div>
      <div><strong>${escapeHtml(order.userName)}</strong><span>${escapeHtml(order.contact || order.userPhone || "")}</span></div>
      <div><strong>${escapeHtml(order.playerName || order.serviceName || "")}</strong><span>${escapeHtml(order.gameName || "")}</span></div>
      <div><strong>${food(order.amount || 0)}</strong><span>${escapeHtml(order.status || "")}</span></div>
      <div><strong>${escapeHtml(order.assignee || "未分配")}</strong><span>处理人</span></div>
    </article>
  `;
}

function renderDispatch() {
  const list = state.orders.filter((order) => !order.assignee || order.assignee === "未分配" || order.status === "待确认");
  $("dispatchList").innerHTML = list.map(orderRecord).join("") || `<div class="record-row">暂无待派单订单</div>`;
}

function renderAccepts() {
  const list = state.orders.filter((order) => ["已确认", "已完成"].includes(order.status));
  $("acceptList").innerHTML = list.map(orderRecord).join("") || `<div class="record-row">暂无接单记录</div>`;
}

function renderHelp() {
  $("helpList").innerHTML = (state.catalog.notices || []).map((notice, index) => `
    <article class="record-row help-row">
      <div><strong>公告 ${index + 1}</strong><span>${escapeHtml(notice)}</span></div>
      <button class="soft-btn" data-view-jump="home">编辑</button>
    </article>
  `).join("") || `<div class="record-row">暂无帮助公告</div>`;
}

function renderInvites() {
  const referrals = state.referrals || [];
  const commissions = state.referralCommissions || [];
  const rate = Number(state.settings.referralCommissionRate ?? 5);
  const months = Number(state.settings.referralCommissionMonths ?? 1);
  const enabled = state.settings.referralEnabled !== false;
  const totalCommission = commissions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  $("inviteStats").innerHTML = [
    ["邀请功能", enabled ? "已开启" : "已关闭"],
    ["提成比例", `${rate}%`],
    ["有效期", `${months} 个月`],
    ["邀请关系", referrals.length],
    ["已发提成", food(totalCommission)]
  ].map(([label, value]) => `
    <article class="stat-card">
      <strong>${escapeHtml(value)}</strong>
      <span>${label}</span>
    </article>
  `).join("");
  $("inviteRuleList").innerHTML = `
    <article class="record-row">
      <div><strong>小程序首页邀请有礼</strong><span>展示我的 6 位 ID，可复制给新用户填写。</span></div>
      <div><strong>首月 ${rate}%</strong><span>按新用户实付人民币金额计算，自动进入邀请人余额。</span></div>
      <button class="soft-btn" data-view-jump="settings" type="button">去配置</button>
    </article>
  `;
  $("referralList").innerHTML = referrals.map((item) => `
    <article class="record-row">
      <div><strong>${escapeHtml(item.userName || "新用户")}</strong><span>ID ${escapeHtml(item.userId || "")}</span></div>
      <div><strong>${escapeHtml(item.inviterName || "邀请人")}</strong><span>ID ${escapeHtml(item.inviterId || "")}</span></div>
      <div><strong>${Number(item.rate || rate)}%</strong><span>${Number(item.months || months)}个月内有效</span></div>
      <div><strong>${escapeHtml(item.status || "active")}</strong><span>${escapeHtml(item.createdAt || "")}</span></div>
    </article>
  `).join("") || `<div class="record-row">暂无邀请关系</div>`;
  $("referralCommissionList").innerHTML = commissions.map((item) => `
    <article class="record-row">
      <div><strong>${escapeHtml(item.orderId || "")}</strong><span>订单提成</span></div>
      <div><strong>${escapeHtml(item.inviterName || "邀请人")}</strong><span>ID ${escapeHtml(item.inviterId || "")}</span></div>
      <div><strong>${escapeHtml(item.userName || "新用户")}</strong><span>ID ${escapeHtml(item.userId || "")}</span></div>
      <div><strong>${food(item.amount || 0)}</strong><span>${Number(item.rate || rate)}%</span></div>
      <div><strong>${escapeHtml(item.status || "settled")}</strong><span>${escapeHtml(item.createdAt || "")}</span></div>
    </article>
  `).join("") || `<div class="record-row">暂无提成流水</div>`;
}

function renderRecharge() {
  const rechargeOrders = state.rechargeOrders || [];
  const paidRechargeOrders = rechargeOrders.filter((order) => order.status === "paid");
  const rechargeTotal = paidRechargeOrders.reduce((sum, order) => sum + Number(order.tokenAmount || 0), 0);
  const rechargeYuanTotal = paidRechargeOrders.reduce((sum, order) => sum + Number(order.amountYuan || 0), 0);
  const orderTotal = state.orders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
  $("rechargeStats").innerHTML = [
    ["人民币充值", rechargeTotal],
    ["实收金额", `￥${Number(rechargeYuanTotal || 0).toFixed(2)}`],
    ["今日订单收入", todayAmount()],
    ["订单收入", orderTotal],
    ["充值订单", rechargeOrders.length],
    ["待支付", rechargeOrders.filter((order) => order.status === "pending").length],
    ["换算比例", "原100点 = ￥10"]
  ].map(([label, value]) => `
    <article class="stat-card">
      <strong>${typeof value === "number" && (label.includes("充值") || label.includes("收入")) ? food(value) : escapeHtml(value)}</strong>
      <span>${label}</span>
    </article>
  `).join("");
  const tiers = state.settings.rechargeTiers || [10, 30, 50, 100, 200];
  document.querySelectorAll("[data-recharge-tier]").forEach((input) => {
    input.value = tiers[Number(input.dataset.rechargeTier)] || "";
  });
  $("rechargeOrderList").innerHTML = rechargeOrders.map((order) => {
    const statusText = order.status === "paid" ? "已支付" : order.status === "cancelled" ? "已取消" : "待支付";
    const timeText = String(order.paidAt || order.createdAt || "").replace("T", " ").slice(0, 16);
    return `
    <article class="record-row recharge-order-row">
      <div><strong>${escapeHtml(order.id || order.orderNo)}</strong><span>${escapeHtml(order.userName || "小程序用户")} · ID ${escapeHtml(order.userId || "")}</span></div>
      <div><strong>￥${Number(order.amountYuan || 0).toFixed(2)}</strong><span>到账等值 ${food(order.tokenAmount || 0)}</span></div>
      <div><strong><span class="status-tag ${escapeHtml(order.status || "pending")}">${statusText}</span></strong><span>${escapeHtml(timeText)}</span></div>
      <div><strong>${escapeHtml(order.transactionId || "--")}</strong><span>微信支付流水</span></div>
      <button class="soft-btn" data-copy-pay-url="${escapeHtml(order.payUrl || "")}" ${order.payUrl ? "" : "disabled"}>复制链接</button>
    </article>
  `;
  }).join("") || `<div class="record-row">暂无充值订单</div>`;
}

function withdrawalStatusText(status) {
  if (status === "success") return "提现成功";
  if (status === "rejected") return "已拒绝";
  return "审核中";
}

function renderWithdrawals() {
  const list = state.playerWithdrawals || [];
  const pending = list.filter((item) => item.status === "pending");
  const success = list.filter((item) => item.status === "success");
  const rejected = list.filter((item) => item.status === "rejected");
  $("withdrawalStats").innerHTML = [
    ["待处理", pending.length],
    ["审核中金额", pending.reduce((sum, item) => sum + Number(item.amount || 0), 0)],
    ["提现成功", success.reduce((sum, item) => sum + Number(item.amount || 0), 0)],
    ["已拒绝", rejected.length]
  ].map(([label, value]) => `
    <article class="stat-card">
      <strong>${typeof value === "number" && (label.includes("金额") || label.includes("成功")) ? food(value) : escapeHtml(value)}</strong>
      <span>${label}</span>
    </article>
  `).join("");
  $("withdrawalTable").innerHTML = list.map((item) => `
    <tr data-withdrawal="${escapeHtml(item.id)}">
      <td><strong>${escapeHtml(item.id)}</strong><span>${escapeHtml(item.processedAt || "")}</span></td>
      <td><strong>${escapeHtml(item.playerName || "打手")}</strong><span>${escapeHtml(item.playerNo || item.playerId || "")}</span></td>
      <td class="money-cell">${food(item.amount || 0)}</td>
      <td><span class="status-tag ${escapeHtml(item.status || "pending")}">${withdrawalStatusText(item.status)}</span></td>
      <td>${escapeHtml(item.createdAt || "")}</td>
      <td><input data-withdrawal-remark value="${escapeHtml(item.remark || "")}" placeholder="处理备注" ${item.status === "pending" ? "" : "disabled"} /></td>
      <td class="inline-actions">
        ${item.status === "pending" ? `
          <button class="soft-btn" data-withdrawal-action="success" type="button">确认成功</button>
          <button class="danger-btn" data-withdrawal-action="rejected" type="button">拒绝退回</button>
        ` : `<span>${withdrawalStatusText(item.status)}</span>`}
      </td>
    </tr>
  `).join("") || `<tr><td colspan="7" class="empty-cell">暂无提现申请</td></tr>`;
}

function renderSessions() {
  $("adminSessionList").innerHTML = state.sessions.map((session) => `
    <article class="record-row session-row">
      <div><strong>${escapeHtml(session.title)}</strong><span>${escapeHtml(session.channel || "小程序群聊")}</span></div>
      <div><strong>${escapeHtml(session.userName)}</strong><span>${escapeHtml(session.contact || "")}</span></div>
      <div><strong>${escapeHtml(session.assignedName || "未接待")}</strong><span>${escapeHtml((session.tags || []).join(" / "))}</span></div>
      <div><strong>${escapeHtml(session.status)}</strong><span>未读 ${Number(session.unreadStaff || 0)}</span></div>
      <a class="soft-link" href="./index.html">处理</a>
    </article>
  `).join("") || `<div class="record-row">暂无群聊</div>`;
}

function renderSystem() {
  $("systemList").innerHTML = [
    ["小程序接口", "/api/public/catalog、/api/public/orders"],
    ["客服后台", "群聊接待、订单处理、客服资料"],
    ["总后台权限", "root 最高权限"],
    ["数据文件", "customer-service/data/store.json"],
    ["目录同步", "游戏分类、服务/打手、套餐、公告"]
  ].map(([title, desc]) => `
    <article class="record-row system-row">
      <div><strong>${title}</strong><span>${desc}</span></div>
    </article>
  `).join("");
}

function collectGames() {
  return [...document.querySelectorAll("[data-game-index]")].map((row, index) => ({
    id: row.querySelector('[data-game-field="id"]').value.trim(),
    name: row.querySelector('[data-game-field="name"]').value.trim(),
    iconUrl: row.querySelector('[data-game-field="iconUrl"]')?.value.trim() || "",
    sort: Number(row.querySelector('[data-game-field="sort"]')?.value || index + 1),
    showOnHome: row.querySelector('[data-game-field="showOnHome"]')?.checked || false,
    visible: row.querySelector('[data-game-field="visible"]')?.checked !== false
  })).filter((item) => item.id && item.name)
    .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
}

function collectOrderCategories() {
  const updated = new Map();
  [...document.querySelectorAll("[data-order-category-index]")].forEach((row, visibleIndex) => {
    const item = {
      id: row.querySelector('[data-order-category-field="id"]').value.trim(),
      name: row.querySelector('[data-order-category-field="name"]').value.trim(),
      gameId: row.querySelector('[data-order-category-field="gameId"]')?.value.trim() || activeGameId(),
      sort: Number(row.querySelector('[data-order-category-field="sort"]').value || visibleIndex + 1),
      visible: row.querySelector('[data-order-category-field="visible"]').checked
    };
    if (item.id && item.name) updated.set(Number(row.dataset.orderCategoryIndex), item);
  });
  return (state.catalog.orderCategories || [])
    .map((item, index) => updated.get(index) || item)
    .filter((item) => item.id && item.name);
}

function parsePriceTiers(text) {
  return String(text || "")
    .split(/\n+/)
    .map((line, index) => {
      const [name, price, desc] = line.split("|").map((item) => item.trim());
      return {
        id: `tier_${index + 1}`,
        name: name || `价位${index + 1}`,
        price: rmbToToken(price || 0),
        desc: desc || ""
      };
    })
    .filter((item) => item.name && Number.isFinite(item.price) && item.price > 0);
}

function collectOrderItems() {
  const updated = new Map();
  [...document.querySelectorAll("[data-order-item-index]")].forEach((row, visibleIndex) => {
    const get = (field) => row.querySelector(`[data-order-item-field="${field}"]`);
    const priceTiers = parsePriceTiers(get("priceTiers").value);
    const item = {
      id: get("id").value.trim() || `order_${Date.now()}_${visibleIndex}`,
      title: get("title").value.trim(),
      gameId: get("gameId").value,
      categoryId: get("categoryId").value,
      orderMode: get("orderMode").value,
      tag: get("tag").value.trim(),
      sort: Number(get("sort").value || visibleIndex + 1),
      visible: get("visible").checked,
      desc: get("desc").value.trim(),
      note: get("note").value.trim(),
      mainImageUrl: get("imageUrl").value.trim(),
      imageUrl: get("imageUrl").value.trim(),
      detailImageUrl: get("imageUrl").value.trim(),
      detailImageWidth: "100%",
      detailDesc: get("detailDesc").value.trim(),
      tags: get("tags").value.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
      price: priceTiers[0] ? Number(priceTiers[0].price || 0) : 0,
      priceTiers
    };
    if (item.id && item.title) updated.set(Number(row.dataset.orderItemIndex), item);
  });
  return (state.catalog.orderItems || [])
    .map((item, index) => updated.get(index) || item)
    .filter((item) => item.id && item.title);
}

function collectPlayers() {
  return state.catalog.players;
}

function collectPlayerLevelGroups() {
  return [...document.querySelectorAll("[data-player-level-group]")].map((groupRow) => {
    const template = playerLevelGroups().find((item) => item.id === groupRow.dataset.playerLevelGroup) || {};
    return {
      id: template.id || groupRow.dataset.playerLevelGroup,
      name: template.name || "",
      levels: [...groupRow.querySelectorAll("[data-player-level-id]")].map((levelRow) => {
        const templateLevel = (template.levels || []).find((item) => item.id === levelRow.dataset.playerLevelId) || {};
        return {
          id: templateLevel.id || levelRow.dataset.playerLevelId,
          name: templateLevel.name || "",
          price: Math.max(0, rmbToToken(levelRow.querySelector("[data-player-level-price]")?.value || 0))
        };
      })
    };
  });
}

function collectPlayerDetail() {
  const existing = state.catalog.players[state.activePlayerIndex] || {};
  const game = $("detailPlayerGame").value;
  const gameName = adminSkillList().find((item) => item.id === game)?.name || "";
  const name = $("detailPlayerName").value.trim();
  const id = $("detailPlayerId").value.trim() || existing.id || `player_${Date.now()}`;
  const confidentialLevel = $("detailPlayerConfidentialLevel").value;
  const topSecretLevel = $("detailPlayerTopSecretLevel").value;
  return {
    ...existing,
    id,
    name,
    title: $("detailPlayerTitle").value.trim(),
    game,
    gameName,
    level: playerLevelName("confidential", confidentialLevel),
    levels: {
      ...(existing.levels || {}),
      confidential: confidentialLevel,
      top_secret: topSecretLevel
    },
    confidentialLevel,
    confidentialLevelName: playerLevelName("confidential", confidentialLevel),
    confidentialPrice: playerLevelPrice("confidential", confidentialLevel),
    topSecretLevel,
    topSecretLevelName: playerLevelName("top_secret", topSecretLevel),
    topSecretPrice: playerLevelPrice("top_secret", topSecretLevel),
    homeSort: Math.max(0, Number($("detailPlayerHomeSort").value || 0)),
    showOnHome: $("detailPlayerShowOnHome").checked,
    revenueConfigId: $("detailPlayerRevenueConfig").value || state.settings.defaultRevenueConfigId,
    workbenchSecret: $("detailPlayerSecret").value.trim() || existing.workbenchSecret || id.replace(/\D/g, "").padStart(6, "0").slice(-6),
    workbenchOpenid: $("detailPlayerWorkbenchOpenid").value.trim(),
    workbenchBoundAt: $("detailPlayerWorkbenchOpenid").value.trim() === String(existing.workbenchOpenid || "").trim() ? (existing.workbenchBoundAt || "") : "",
    workbenchBoundCustomerId: $("detailPlayerWorkbenchOpenid").value.trim() ? (existing.workbenchBoundCustomerId || $("detailPlayerBindCustomerId").value.trim()) : "",
    workbenchBoundCustomerName: $("detailPlayerWorkbenchOpenid").value.trim() ? (existing.workbenchBoundCustomerName || "") : "",
    price: playerLevelPrice("confidential", confidentialLevel),
    sold: Number($("detailPlayerSold").value || 0),
    earnedCatFood: rmbToToken($("detailPlayerEarnedBalance").value || 0),
    rechargeCatFood: rmbToToken($("detailPlayerRechargeBalance").value || 0),
    balanceCatFood: rmbToToken($("detailPlayerEarnedBalance").value || 0),
    pendingWithdrawCatFood: Number(existing.pendingWithdrawCatFood || 0),
    withdrawnCatFood: Number(existing.withdrawnCatFood || 0),
    settledIncome: Number(existing.settledIncome || 0),
    rating: existing.rating || "5.0",
    style: existing.style || id,
    tags: $("detailPlayerTags").value.split(/[,，]/).map((item) => item.trim()).filter(Boolean),
    schedule: $("detailPlayerSchedule").value.split(/[,，]/).map((item) => item.trim()).filter(Boolean),
    intro: $("detailPlayerIntro").value.trim()
  };
}

function playerFromCreateForm() {
  const game = $("createPlayerGame").value;
  const gameName = adminSkillList().find((item) => item.id === game)?.name || "";
  const name = $("createPlayerName").value.trim();
  const id = $("createPlayerId").value.trim() || `player_${Date.now()}`;
  const confidentialLevel = $("createPlayerConfidentialLevel").value;
  const topSecretLevel = $("createPlayerTopSecretLevel").value;
  return {
    id,
    name,
    title: $("createPlayerTitle").value.trim() || "陪玩服务",
    game,
    gameName,
    level: playerLevelName("confidential", confidentialLevel),
    levels: { confidential: confidentialLevel, top_secret: topSecretLevel },
    confidentialLevel,
    confidentialLevelName: playerLevelName("confidential", confidentialLevel),
    confidentialPrice: playerLevelPrice("confidential", confidentialLevel),
    topSecretLevel,
    topSecretLevelName: playerLevelName("top_secret", topSecretLevel),
    topSecretPrice: playerLevelPrice("top_secret", topSecretLevel),
    homeSort: Math.max(0, Number($("createPlayerHomeSort").value || state.catalog.players.length + 1)),
    showOnHome: $("createPlayerShowOnHome").checked,
    revenueConfigId: $("createPlayerRevenueConfig").value || state.settings.defaultRevenueConfigId,
    workbenchSecret: $("createPlayerSecret").value.trim() || id.replace(/\D/g, "").padStart(6, "0").slice(-6),
    price: playerLevelPrice("confidential", confidentialLevel),
    rating: "5.0",
    sold: 0,
    style: id,
    earnedCatFood: rmbToToken($("createPlayerEarnedBalance").value || 0),
    rechargeCatFood: rmbToToken($("createPlayerRechargeBalance").value || 0),
    balanceCatFood: rmbToToken($("createPlayerEarnedBalance").value || 0),
    pendingWithdrawCatFood: 0,
    withdrawnCatFood: 0,
    settledIncome: 0,
    tags: $("createPlayerTags").value.split(/[,，]/).map((item) => item.trim()).filter(Boolean),
    intro: "",
    schedule: ["今天 20:00"]
  };
}

async function bindDetailPlayerCustomer() {
  const existing = state.catalog.players[state.activePlayerIndex] || {};
  const playerId = $("detailPlayerId").value.trim() || existing.id || "";
  const customerId = $("detailPlayerBindCustomerId").value.trim();
  if (!playerId) return showToast("请先保存打手ID");
  if (!customerId) return showToast("请输入小程序用户ID");
  const data = await api(`/api/admin/players/${encodeURIComponent(playerId)}/bind-customer`, {
    method: "POST",
    body: JSON.stringify({ customerId })
  });
  const player = data.player || null;
  if (player && state.activePlayerIndex !== null) {
    state.catalog.players[state.activePlayerIndex] = player;
    renderPlayerDetail();
    renderPlayers();
  }
  showToast(data.message || "已绑定打手微信身份");
}

function collectNotices() {
  return [...document.querySelectorAll("[data-notice-field]")]
    .map((input) => input.value.trim())
    .filter(Boolean);
}

function collectPackages() {
  return [...document.querySelectorAll("[data-package-index]")].map((row) => ({
    id: row.querySelector('[data-package-field="id"]').value.trim(),
    name: row.querySelector('[data-package-field="name"]').value.trim(),
    hours: Number(row.querySelector('[data-package-field="hours"]').value || 1)
  })).filter((item) => item.id && item.name);
}

function collectRevenueConfigs() {
  return [...document.querySelectorAll("[data-revenue-config-index]")].map((row, index) => {
    const get = (field) => row.querySelector(`[data-revenue-field="${field}"]`).value.trim();
    const existing = revenueConfigs()[Number(row.dataset.revenueConfigIndex)] || {};
    const playerRate = Math.max(0, Math.min(100, Number(get("playerRate") || 0)));
    return {
      id: existing.id || `config_${Date.now()}_${index}`,
      name: get("name") || `配置${index + 1}`,
      playerRate,
      platformRate: Number((100 - playerRate).toFixed(2))
    };
  });
}

function collectMemberLevels() {
  return [...document.querySelectorAll("[data-member-level-index]")].map((row, index) => {
    const get = (field) => row.querySelector(`[data-member-level-field="${field}"]`).value.trim();
    return {
      id: get("id") || `member_${index + 1}`,
      name: get("name") || `会员${index + 1}`,
      threshold: rmbToToken(get("threshold") || 0),
      discount: Math.max(1, Math.min(100, Number(get("discount") || 100))),
      imageUrl: get("imageUrl") || "/assets/guiyuan-logo.jpg"
    };
  }).filter((item) => item.id && item.name);
}

async function saveRevenueConfigs(nextConfigs = collectRevenueConfigs(), defaultRevenueConfigId = state.settings.defaultRevenueConfigId) {
  const configs = nextConfigs.length ? nextConfigs : revenueConfigs();
  const data = await api("/api/admin/settings", {
    method: "PATCH",
    body: JSON.stringify({
      revenueConfigs: configs,
      defaultRevenueConfigId: defaultRevenueConfigId || configs[0]?.id
    })
  });
  state.settings = data.settings;
  renderRevenueConfigs();
  renderPlayers();
  showToast("收入配置已保存");
}

async function saveMemberLevels(nextLevels = collectMemberLevels()) {
  const data = await api("/api/admin/settings", {
    method: "PATCH",
    body: JSON.stringify({ memberLevels: nextLevels })
  });
  state.settings = data.settings;
  await loadDashboard();
  showToast("会员等级已保存");
}

async function saveCatalog(patch = {}) {
  const catalog = {
    ...state.catalog,
    ...patch
  };
  if (catalog.quickMatchConfig && Array.isArray(catalog.quickMatchConfig.skills)) {
    const existingGames = Array.isArray(catalog.games) ? catalog.games : [];
    catalog.games = [
      ...(existingGames.some((game) => game.id === "all") ? [existingGames.find((game) => game.id === "all")] : [{ id: "all", name: "全部" }]),
      ...catalog.quickMatchConfig.skills.map((skill, index) => {
        const old = existingGames.find((game) => game.id === skill.id) || {};
        return {
          ...old,
          id: skill.id,
          name: skill.name,
          iconUrl: old.iconUrl || "/assets/game/other.png",
          sort: Number(old.sort || skill.sort || index + 1),
          visible: skill.visible !== false,
          showOnHome: old.showOnHome !== undefined ? old.showOnHome : index < 4
        };
      })
    ];
  }
  const data = await api("/api/admin/catalog", {
    method: "PATCH",
    body: JSON.stringify({ catalog })
  });
  state.catalog = data.catalog;
  renderHomeConfig();
  renderGames();
  renderRevenueConfigs();
  renderPlayers();
  showToast("目录已同步");
}

async function uploadImageFile(file, input) {
  if (!file || !input) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = await api("/api/admin/uploads", {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          dataUrl: reader.result
        })
      });
      input.value = data.url;
      renderGamesMiniPreview();
      showToast("图片已上传，记得保存分类和订单");
    } catch (error) {
      showToast(error.message);
    }
  };
  reader.readAsDataURL(file);
}

function bindEvents() {
  $("loginForm").addEventListener("submit", login);
  $("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("owner_token");
    state.token = "";
    showLogin();
  });
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => switchView(item.dataset.view, { module: item.dataset.view }));
  });
  document.addEventListener("click", (event) => {
    const closeTab = event.target.closest("[data-close-tab]");
    if (closeTab) {
      event.stopPropagation();
      const view = closeTab.dataset.closeTab;
      state.openTabs = state.openTabs.filter((item) => item !== view);
      if (state.activeView === view) switchView(state.openTabs[state.openTabs.length - 1] || "overview");
      else renderAdminTabs();
      return;
    }
    const tab = event.target.closest("[data-tab-view]");
    if (tab) {
      switchView(tab.dataset.tabView);
      return;
    }
    const openGame = event.target.closest("[data-open-game-structure]");
    if (openGame) {
      state.activeGameId = openGame.dataset.openGameStructure;
      state.activeOrderCategoryId = "";
      renderGames();
      switchView("gameStructure", { module: "games" });
      return;
    }
    if (event.target.closest("#backGameOverviewBtn")) {
      switchView("games", { module: "games" });
      return;
    }
    if (event.target.closest("#saveGamesStructureBtn")) {
      saveCatalog({
        games: collectGames(),
        orderCategories: collectOrderCategories(),
        orderItems: collectOrderItems()
      }).catch((error) => showToast(error.message));
      return;
    }
    if (event.target.closest("#backPlayerListBtn")) {
      switchView("players", { module: "players" });
      return;
    }
    const subMenu = event.target.closest(".sub-menu-item");
    if (subMenu) {
      switchView(subMenu.dataset.view, { module: state.activeModule });
      return;
    }
    const jump = event.target.closest("[data-view-jump]");
    if (jump) switchView(jump.dataset.viewJump);
  });
  document.addEventListener("submit", async (event) => {
    if (!event.target.matches("#gameCreateForm")) return;
    event.preventDefault();
    const id = $("createGameId").value.trim();
    const name = $("createGameName").value.trim();
    if (!id || !name) return showToast("请填写游戏ID和游戏名称");
    if ((state.catalog.games || []).some((item) => item.id === id)) return showToast("游戏ID已存在");
    state.catalog.games.push({
      id,
      name,
      iconUrl: $("createGameIcon").value.trim() || "/assets/game/other.png",
      sort: Number($("createGameSort").value || state.catalog.games.length + 1),
      showOnHome: $("createGameHome").checked,
      visible: $("createGameVisible").checked
    });
    state.activeGameId = id;
    state.activeOrderCategoryId = "";
    await saveCatalog({ games: state.catalog.games, orderCategories: collectOrderCategories(), orderItems: collectOrderItems() });
    event.target.reset();
    $("createGameIcon").value = "/assets/game/other.png";
    $("createGameVisible").checked = true;
    renderGames();
    switchView("gameStructure", { module: "games" });
    showToast("游戏已创建");
  });
  $("staffForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const password = $("staffPassword").value;
      if (password.length < 8) throw new Error("密码至少需要 8 位");
      const data = await api("/api/admin/staff", {
        method: "POST",
        body: JSON.stringify({
          name: $("staffName").value,
          username: $("staffUsername").value,
          password
        })
      });
      state.staff = data.staff;
      $("staffName").value = "";
      $("staffUsername").value = "";
      $("staffPassword").value = "";
      renderStaff();
      showToast("客服已新增");
    } catch (error) {
      showToast(error.message);
    }
  });
  $("staffList").addEventListener("click", async (event) => {
    const save = event.target.closest("[data-save-staff]");
    const remove = event.target.closest("[data-delete-staff]");
    const id = save?.dataset.saveStaff || remove?.dataset.deleteStaff;
    if (!id) return;
    try {
      if (save) {
        const row = event.target.closest("[data-staff]");
        const payload = {};
        row.querySelectorAll("[data-field]").forEach((input) => {
          if (input.dataset.field === "password" && !input.value.trim()) return;
          payload[input.dataset.field] = input.type === "checkbox" ? input.checked : input.value;
        });
        const data = await api(`/api/admin/staff/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
        state.staff = data.staff;
        renderStaff();
        showToast("客服已保存");
      }
      if (remove) {
        const data = await api(`/api/admin/staff/${encodeURIComponent(id)}`, { method: "DELETE" });
        state.staff = data.staff;
        renderStaff();
        showToast("客服已删除");
      }
    } catch (error) {
      showToast(error.message);
    }
  });
  $("adminUserList").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-add-customer-balance]");
    const row = event.target.closest("[data-customer]");
    if (!button || !row) return;
    const amount = rmbToToken(row.querySelector("[data-customer-amount]").value || 0);
    const note = row.querySelector("[data-customer-note]")?.value.trim() || "后台预存";
    if (!Number.isFinite(amount) || amount === 0) return showToast("请输入人民币金额");
    try {
      const user = state.users.find((item) => item.id === row.dataset.customer) || {};
      const data = await api(`/api/admin/customers/${encodeURIComponent(row.dataset.customer)}/balance`, {
        method: "POST",
        body: JSON.stringify({
          amount,
          userName: user.name,
          contact: user.contact,
          note
        })
      });
      state.users = data.customers || state.users;
      state.customerBills = data.customerBills || state.customerBills;
      renderUsers();
      showToast("客户余额已更新");
    } catch (error) {
      showToast(error.message);
    }
  });
  $("customerSearchInput").addEventListener("input", () => {
    state.userFilter = $("customerSearchInput").value;
    renderUsers();
  });
  $("clearCustomerSearchBtn").addEventListener("click", () => {
    state.userFilter = "";
    $("customerSearchInput").value = "";
    renderUsers();
  });
  $("memberLevelForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const levels = collectMemberLevels();
    const name = $("memberLevelName").value.trim();
    if (!name) return showToast("请输入会员等级名称");
    levels.push({
      id: `member_${Date.now()}`,
      name,
      threshold: rmbToToken($("memberLevelThreshold").value || 0),
      discount: Math.max(1, Math.min(100, Number($("memberLevelDiscount").value || 100))),
      imageUrl: $("memberLevelImage").value.trim() || "/assets/guiyuan-logo.jpg"
    });
    $("memberLevelName").value = "";
    $("memberLevelThreshold").value = "";
    $("memberLevelDiscount").value = "";
    $("memberLevelImage").value = "";
    await saveMemberLevels(levels);
  });
  $("saveMemberLevelsBtn").addEventListener("click", () => {
    saveMemberLevels().catch((error) => showToast(error.message));
  });
  $("memberLevelList").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete-member-level]");
    if (!button) return;
    const levels = collectMemberLevels();
    levels.splice(Number(button.dataset.deleteMemberLevel), 1);
    await saveMemberLevels(levels);
  });
  $("addNoticeBtn").addEventListener("click", () => {
    state.catalog.notices.push("新公告");
    renderHomeConfig();
  });
  $("noticeList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-notice]");
    if (!button) return;
    state.catalog.notices.splice(Number(button.dataset.deleteNotice), 1);
    renderHomeConfig();
  });
  $("noticeList").addEventListener("input", renderHomeMiniPreview);
  $("saveHomeBtn").addEventListener("click", () => saveCatalog({
    notices: collectNotices()
  }));
  $("addGameBtn").addEventListener("click", () => {
    const next = { id: `game_${Date.now()}`, name: "新游戏", iconUrl: "/assets/game/other.png", sort: state.catalog.games.length + 1, showOnHome: false, visible: true };
    state.catalog.games.push(next);
    state.activeGameId = next.id;
    state.activeOrderCategoryId = "";
    renderGames();
  });
  $("gameList").addEventListener("input", () => {
    state.catalog.games = collectGames();
    renderGamesMiniPreview();
  });
  $("gameList").addEventListener("change", () => {
    state.catalog.games = collectGames();
    renderGamesMiniPreview();
  });
  $("gameList").addEventListener("dragover", (event) => {
    const input = event.target.closest('[data-game-field="iconUrl"]');
    if (!input) return;
    event.preventDefault();
    input.classList.add("dragging");
  });
  $("gameList").addEventListener("dragleave", (event) => {
    const input = event.target.closest('[data-game-field="iconUrl"]');
    if (input) input.classList.remove("dragging");
  });
  $("gameList").addEventListener("drop", (event) => {
    const input = event.target.closest('[data-game-field="iconUrl"]');
    if (!input) return;
    event.preventDefault();
    input.classList.remove("dragging");
    const file = event.dataTransfer.files && event.dataTransfer.files[0];
    uploadImageFile(file, input);
  });
  $("gameList").addEventListener("click", (event) => {
    const select = event.target.closest("[data-select-game]");
    if (select) {
      state.catalog.games = collectGames();
      state.activeGameId = select.dataset.selectGame;
      state.activeOrderCategoryId = "";
      renderGames();
      return;
    }
    const button = event.target.closest("[data-delete-game]");
    if (!button) return;
    state.catalog.games.splice(Number(button.dataset.deleteGame), 1);
    state.activeGameId = "";
    state.activeOrderCategoryId = "";
    renderGames();
  });
  $("addOrderCategoryBtn").addEventListener("click", () => {
    state.catalog.orderCategories = collectOrderCategories();
    const category = { id: `cat_${Date.now()}`, name: "新子分类", gameId: activeGameId(), sort: state.catalog.orderCategories.length + 1, visible: true };
    state.catalog.orderCategories.push(category);
    state.activeOrderCategoryId = category.id;
    renderGames();
  });
  $("orderCategoryList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-order-category]");
    const row = event.target.closest("[data-order-category-index]");
    if (!row) return;
    if (button) {
      state.catalog.orderCategories = collectOrderCategories();
      const removed = state.catalog.orderCategories.splice(Number(button.dataset.deleteOrderCategory), 1)[0];
      if (removed && removed.id === state.activeOrderCategoryId) {
        state.activeOrderCategoryId = state.catalog.orderCategories[0]?.id || "";
      }
      renderGames();
      return;
    }
    const select = event.target.closest("[data-select-order-category]");
    if (!select && event.target.closest("input,button,label")) return;
    state.catalog.orderCategories = collectOrderCategories();
    state.activeOrderCategoryId = select ? select.dataset.selectOrderCategory : row.dataset.orderCategoryId;
    renderGames();
  });
  $("orderCategoryList").addEventListener("input", renderGamesMiniPreview);
  $("orderCategoryList").addEventListener("change", renderGamesMiniPreview);
  $("addOrderItemBtn").addEventListener("click", () => {
    state.catalog.orderItems = collectOrderItems();
    const game = collectGames().find((item) => item.id === activeGameId()) || { id: activeGameId() || "delta" };
    const category = collectOrderCategories().find((item) => item.id === activeOrderCategoryId()) || collectOrderCategories()[0] || { id: "fun" };
    state.catalog.orderItems.unshift({
      id: `order_${Date.now()}`,
      gameId: game.id,
      categoryId: category.id,
      title: "新订单类型",
      desc: "",
      note: "",
      price: 100,
      orderMode: "fixed_tier",
      tag: "上架",
      mainImageUrl: "/assets/entry/entry-fun.png",
      imageUrl: "/assets/entry/entry-fun.png",
      detailImageUrl: "/assets/entry/entry-fun.png",
      detailDesc: "",
      tags: [],
      priceTiers: [{ id: "tier_1", name: "默认价位", price: 100, desc: "" }],
      sort: state.catalog.orderItems.length + 1,
      visible: true
    });
    renderGames();
  });
  $("orderItemList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-order-item]");
    if (!button) return;
    state.catalog.orderItems = collectOrderItems();
    state.catalog.orderItems.splice(Number(button.dataset.deleteOrderItem), 1);
    renderGames();
  });
  $("orderItemList").addEventListener("input", renderGamesMiniPreview);
  $("orderItemList").addEventListener("change", (event) => {
    if (event.target.closest("[data-image-upload]")) return;
    renderGamesMiniPreview();
  });
  $("orderItemList").addEventListener("change", (event) => {
    const upload = event.target.closest("[data-image-upload]");
    if (!upload || !upload.files || !upload.files[0]) return;
    const row = upload.closest("[data-order-item-index]");
    const input = row.querySelector(`[data-order-item-field="${upload.dataset.imageUpload}"]`);
    uploadImageFile(upload.files[0], input);
  });
  $("orderItemList").addEventListener("dragover", (event) => {
    const drop = event.target.closest("[data-image-drop]");
    if (!drop) return;
    event.preventDefault();
    drop.classList.add("dragging");
  });
  $("orderItemList").addEventListener("dragleave", (event) => {
    const drop = event.target.closest("[data-image-drop]");
    if (drop) drop.classList.remove("dragging");
  });
  $("orderItemList").addEventListener("drop", (event) => {
    const drop = event.target.closest("[data-image-drop]");
    if (!drop) return;
    event.preventDefault();
    drop.classList.remove("dragging");
    const row = drop.closest("[data-order-item-index]");
    const input = row.querySelector(`[data-order-item-field="${drop.dataset.imageDrop}"]`);
    const file = event.dataTransfer.files && event.dataTransfer.files[0];
    uploadImageFile(file, input);
  });
  $("saveGamesBtn").addEventListener("click", () => saveCatalog({
    games: collectGames(),
    orderCategories: collectOrderCategories(),
    orderItems: collectOrderItems()
  }));
  $("revenueConfigForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = $("revenueConfigName").value.trim();
    const playerRate = Math.max(0, Math.min(100, Number($("revenueConfigPlayerRate").value || 0)));
    if (!name) return showToast("请输入配置名称");
    const configs = collectRevenueConfigs();
    configs.push({
      id: `config_${Date.now()}`,
      name,
      playerRate,
      platformRate: Number((100 - playerRate).toFixed(2))
    });
    $("revenueConfigName").value = "";
    $("revenueConfigPlayerRate").value = "";
    await saveRevenueConfigs(configs);
  });
  $("revenueConfigList").addEventListener("input", (event) => {
    const input = event.target.closest('[data-revenue-field="playerRate"]');
    if (!input) return;
    const row = input.closest("[data-revenue-config-index]");
    const summary = row?.querySelector("[data-revenue-summary]");
    if (summary) summary.textContent = revenueSummaryText(input.value);
  });
  $("saveRevenueConfigsBtn").addEventListener("click", () => saveRevenueConfigs().catch((error) => showToast(error.message)));
  $("revenueConfigList").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete-revenue-config]");
    if (!button) return;
    const index = Number(button.dataset.deleteRevenueConfig);
    const configs = collectRevenueConfigs();
    configs.splice(index, 1);
    await saveRevenueConfigs(configs);
  });
  $("applyBulkRevenueBtn").addEventListener("click", () => {
    const configId = $("bulkRevenueConfig").value;
    let count = 0;
    document.querySelectorAll("#playerList [data-player-index]").forEach((row) => {
      if (!row.querySelector("[data-player-select]")?.checked) return;
      const player = state.catalog.players[Number(row.dataset.playerIndex)];
      if (!player) return;
      player.revenueConfigId = configId;
      count += 1;
    });
    if (!count) return showToast("请先勾选打手");
    saveCatalog({ games: collectGames(), players: collectPlayers(), playerLevelGroups: collectPlayerLevelGroups() })
      .then(() => showToast(`已应用到 ${count} 个打手`))
      .catch((error) => showToast(error.message));
  });
  $("playerSearchInput").addEventListener("input", () => {
    state.playerFilter.keyword = $("playerSearchInput").value;
    renderPlayers();
  });
  $("playerLevelFilter").addEventListener("change", () => {
    state.playerFilter.level = $("playerLevelFilter").value;
    renderPlayers();
  });
  $("resetPlayerFilterBtn").addEventListener("click", () => {
    state.playerFilter = { keyword: "", level: "all" };
    renderPlayers();
  });
  ["financeStartDate", "financeEndDate", "financeKeyword"].forEach((id) => {
    const input = $(id);
    if (!input) return;
    input.addEventListener("input", () => {
      state.financeFilter = {
        start: $("financeStartDate")?.value || "",
        end: $("financeEndDate")?.value || "",
        keyword: $("financeKeyword")?.value || ""
      };
      renderFinance();
    });
  });
  $("clearFinanceFilterBtn")?.addEventListener("click", () => {
    state.financeFilter = { start: "", end: "", keyword: "" };
    renderFinance();
  });
  $("savePlayerLevelsBtn").addEventListener("click", () => {
    saveCatalog({ games: collectGames(), players: collectPlayers(), playerLevelGroups: collectPlayerLevelGroups() })
      .then(() => showToast("等级价格已保存"))
      .catch((error) => showToast(error.message));
  });
  $("playerCreateForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const player = playerFromCreateForm();
    if (!player.name) return showToast("请输入打手昵称");
    if (state.catalog.players.some((item) => item.id === player.id)) return showToast("打手ID已存在");
    state.catalog.players.unshift(player);
    await saveCatalog({ games: collectGames(), players: collectPlayers(), playerLevelGroups: collectPlayerLevelGroups() });
    event.target.reset();
    renderPlayerCreate();
    switchView("players");
    openPlayerDetail(0);
    showToast("打手已新增");
  });
  $("playerList").addEventListener("click", (event) => {
    const open = event.target.closest("[data-open-player]");
    const remove = event.target.closest("[data-delete-player]");
    if (open) return openPlayerDetail(open.dataset.openPlayer);
    if (!remove) return;
    state.catalog.players.splice(Number(remove.dataset.deletePlayer), 1);
    saveCatalog({ games: collectGames(), players: collectPlayers(), playerLevelGroups: collectPlayerLevelGroups() })
      .then(() => showToast("打手已删除"))
      .catch((error) => showToast(error.message));
  });
  $("playerList").addEventListener("change", (event) => {
    const sortInput = event.target.closest("[data-player-home-sort]");
    const showInput = event.target.closest("[data-player-show-home]");
    if (!sortInput && !showInput) return;
    const index = Number((sortInput || showInput).dataset.playerHomeSort ?? (sortInput || showInput).dataset.playerShowHome);
    const player = state.catalog.players[index];
    if (!player) return;
    if (sortInput) player.homeSort = Math.max(0, Number(sortInput.value || 0));
    if (showInput) player.showOnHome = showInput.checked;
    saveCatalog({ games: collectGames(), players: collectPlayers(), playerLevelGroups: collectPlayerLevelGroups() })
      .then(() => showToast("首页热门达人排序已保存"))
      .catch((error) => showToast(error.message));
  });
  $("backToPlayerListBtn").addEventListener("click", showPlayerList);
  $("bindPlayerCustomerBtn").addEventListener("click", () => bindDetailPlayerCustomer().catch((error) => showToast(error.message)));
  $("playerDetailForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const detail = collectPlayerDetail();
    if (!detail.name || !detail.title) return showToast("请填写昵称和标题");
    state.catalog.players[state.activePlayerIndex] = detail;
    await saveCatalog({ games: collectGames(), players: collectPlayers(), playerLevelGroups: collectPlayerLevelGroups() });
    openPlayerDetail(state.activePlayerIndex);
    showToast("打手信息已保存");
  });
  $("deleteDetailPlayerBtn").addEventListener("click", async () => {
    if (state.activePlayerIndex === null) return;
    state.catalog.players.splice(state.activePlayerIndex, 1);
    await saveCatalog({ games: collectGames(), players: collectPlayers(), playerLevelGroups: collectPlayerLevelGroups() });
    showPlayerList();
    renderPlayers();
    showToast("打手已删除");
  });
  $("adminOrderTable").addEventListener("change", async (event) => {
    const row = event.target.closest("[data-admin-order]");
    if (!row) return;
    try {
      const payload = {};
      row.querySelectorAll("[data-order-field]").forEach((input) => {
        payload[input.dataset.orderField] = input.value;
      });
      const data = await api(`/api/admin/orders/${encodeURIComponent(row.dataset.adminOrder)}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      state.orders = data.orders;
      renderOrders();
      showToast("订单已更新");
    } catch (error) {
      showToast(error.message);
    }
  });
  $("withdrawalTable").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-withdrawal-action]");
    const row = event.target.closest("[data-withdrawal]");
    if (!button || !row) return;
    try {
      const data = await api(`/api/admin/player-withdrawals/${encodeURIComponent(row.dataset.withdrawal)}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: button.dataset.withdrawalAction,
          remark: row.querySelector("[data-withdrawal-remark]")?.value || ""
        })
      });
      state.playerWithdrawals = data.playerWithdrawals || [];
      if (data.catalog) state.catalog = data.catalog;
      state.stats.pendingWithdrawals = state.playerWithdrawals.filter((item) => item.status === "pending").length;
      state.stats.pendingWithdrawalAmount = state.playerWithdrawals
        .filter((item) => item.status === "pending")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
      renderWithdrawals();
      renderPlayers();
      renderStats();
      showToast(button.dataset.withdrawalAction === "success" ? "提现已确认成功" : "已拒绝并退回余额");
    } catch (error) {
      showToast(error.message);
    }
  });
  $("settingsForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const data = await api("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          shopName: $("shopName").value,
          businessHours: $("businessHours").value,
          quickMatchBackgroundUrl: $("quickMatchBackgroundUrl").value,
          customerServiceQrUrl: $("customerServiceQrUrl").value,
          slaMinutes: $("slaMinutes").value,
          referralEnabled: $("referralEnabled").value === "true",
          auditMode: $("auditMode").value === "true",
          paymentMode: $("paymentMode").value,
          virtualPaymentOfferId: $("virtualPaymentOfferId").value,
          virtualPaymentAppKey: $("virtualPaymentAppKey").value,
          virtualPaymentMode: $("virtualPaymentMode").value,
          virtualPaymentEnv: $("virtualPaymentEnv").value,
          virtualPaymentCurrencyType: $("virtualPaymentCurrencyType").value,
          virtualPaymentPlatform: $("virtualPaymentPlatform").value,
          referralCommissionRate: $("referralCommissionRate").value,
          referralCommissionMonths: $("referralCommissionMonths").value,
          autoGreeting: $("autoGreeting").value,
          offlineMessage: $("offlineMessage").value,
          giftCatalog: collectGiftCatalog()
        })
      });
      state.settings = data.settings;
      showToast("设置已保存");
    } catch (error) {
      showToast(error.message);
    }
  });
  $("quickMatchBackgroundUpload").addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    uploadImageFile(file, $("quickMatchBackgroundUrl"));
  });
  $("customerServiceQrUpload").addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    uploadImageFile(file, $("customerServiceQrUrl"));
  });
  document.querySelectorAll("[data-settings-image-drop]").forEach((drop) => {
    drop.addEventListener("dragover", (event) => {
      event.preventDefault();
      drop.classList.add("dragging");
    });
    drop.addEventListener("dragleave", () => {
      drop.classList.remove("dragging");
    });
    drop.addEventListener("drop", (event) => {
      event.preventDefault();
      drop.classList.remove("dragging");
      const input = $(drop.dataset.settingsImageDrop);
      const file = event.dataTransfer.files && event.dataTransfer.files[0];
      uploadImageFile(file, input);
    });
  });
  $("rechargeTierForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const rechargeTiers = [...document.querySelectorAll("[data-recharge-tier]")]
        .map((input) => Number(input.value || 0))
        .filter((value) => Number.isFinite(value) && value > 0)
        .slice(0, 5);
      const data = await api("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ rechargeTiers })
      });
      state.settings = data.settings;
      renderRecharge();
      showToast("充值挡位已保存");
    } catch (error) {
      showToast(error.message);
    }
  });
  $("rechargeOrderList").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-copy-pay-url]");
    if (!button) return;
    const payUrl = button.dataset.copyPayUrl || "";
    if (!payUrl) return showToast("暂无支付链接");
    try {
      await navigator.clipboard.writeText(payUrl);
      showToast("支付链接已复制");
    } catch (error) {
      window.prompt("复制支付链接", payUrl);
    }
  });
}

function adminConfigId(value, prefix, index) {
  const safe = String(value || "").trim().replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "");
  return safe || `${prefix}_${Date.now()}_${index}`;
}

function visibleSorted(list = []) {
  return [...(Array.isArray(list) ? list : [])].sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
}

function playerLevelGroups() {
  const configured = Array.isArray(state.catalog.playerLevelGroups) && state.catalog.playerLevelGroups.length
    ? state.catalog.playerLevelGroups
    : DEFAULT_PLAYER_LEVEL_GROUPS;
  return cloneLevelGroups(configured).map((group, index) => ({
    id: adminConfigId(group.id || group.name, "grade", index),
    name: group.name || `一级等级${index + 1}`,
    sort: Number(group.sort || index + 1),
    visible: group.visible !== false,
    levels: (Array.isArray(group.levels) && group.levels.length ? group.levels : [{ id: "default", name: "默认等级", price: 0 }]).map((level, levelIndex) => ({
      id: adminConfigId(level.id || level.name, `${group.id || "grade"}_level`, levelIndex),
      name: level.name || `等级${levelIndex + 1}`,
      price: Math.max(0, Number(level.price || 0)),
      hint: level.hint || "",
      sort: Number(level.sort || levelIndex + 1),
      visible: level.visible !== false
    }))
  }));
}

function playerLevelName(dimensionId, levelId) {
  const group = allConfiguredLevelGroups().find((item) => item.id === dimensionId);
  const level = group?.levels.find((item) => item.id === levelId || item.name === levelId);
  return level ? level.name : (levelId || "未配置");
}

function playerLevelPrice(dimensionId, levelId) {
  const group = allConfiguredLevelGroups().find((item) => item.id === dimensionId);
  const level = group?.levels.find((item) => item.id === levelId || item.name === levelId);
  return Number(level?.price || 0);
}

function normalizePlayerLevels(player = {}) {
  const groups = player.game ? linkedLevelGroupsForSkill(player.game) : playerLevelGroups();
  const existing = player.levels || {};
  const existingKeys = Object.keys(existing).filter((key) => existing[key]);
  if (existingKeys.length) {
    return existingKeys.reduce((map, key) => {
      if (groups.some((group) => group.id === key)) map[key] = existing[key];
      return map;
    }, {});
  }
  return groups.reduce((map, group, index) => {
    const legacy = group.id === "confidential" ? player.confidentialLevel : group.id === "top_secret" ? player.topSecretLevel : "";
    if (!legacy && index > 0) return map;
    const first = group.levels[0]?.id || "";
    const byName = group.levels.find((item) => item.name === player.level || item.id === player.level)?.id || "";
    map[group.id] = legacy || (index === 0 ? byName : "") || first;
    return map;
  }, {});
}

function levelOptions(selected, includeAll = false) {
  const options = includeAll ? [`<option value="all">全部等级</option>`] : [];
  allConfiguredLevelGroups().forEach((group) => {
    group.levels.forEach((level) => {
      const value = `${group.id}:${level.id}`;
      options.push(`<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(group.name)} / ${escapeHtml(level.name)}</option>`);
    });
  });
  return options.join("");
}

function selectedLevelSummary(player = {}) {
  const levels = normalizePlayerLevels(player);
  return linkedLevelGroupsForSkill(player.game).map((group) => {
    const level = group.levels.find((item) => item.id === levels[group.id]);
    return level ? `${group.name}/${level.name}` : "";
  }).filter(Boolean).join("，") || "未配置";
}

function primaryPlayerPrice(player = {}) {
  const groups = linkedLevelGroupsForSkill(player.game);
  const levels = normalizePlayerLevels(player);
  const firstGroup = groups.find((group) => levels[group.id]) || groups[0];
  return firstGroup ? playerLevelPrice(firstGroup.id, levels[firstGroup.id]) : Number(player.price || 0);
}

function ensurePlayerLevelFieldMounts() {
  const detailOld = $("detailPlayerConfidentialLevel")?.closest("label");
  const createOld = $("createPlayerConfidentialLevel")?.closest("label");
  const detailTop = $("detailPlayerTopSecretLevel")?.closest("label");
  const createTop = $("createPlayerTopSecretLevel")?.closest("label");
  [detailOld, detailTop, createOld, createTop].forEach((label) => {
    if (label) label.classList.add("legacy-level-field");
  });
  if (detailOld && !$("detailPlayerLevelFields")) {
    detailTop.insertAdjacentHTML("afterend", `<div id="detailPlayerLevelFields" class="dynamic-player-level-fields wide"></div>`);
  }
  if (createOld && !$("createPlayerLevelFields")) {
    createTop.insertAdjacentHTML("afterend", `<div id="createPlayerLevelFields" class="dynamic-player-level-fields wide"></div>`);
  }
}

function renderPlayerLevelSelects(mountId, prefix, values = {}) {
  const mount = $(mountId);
  if (!mount) return;
  const skillId = prefix === "detail" ? $("detailPlayerGame")?.value : $("createPlayerGame")?.value;
  const groups = linkedLevelGroupsForSkill(skillId);
  const hasExplicitLevels = Object.keys(values || {}).length > 0;
  mount.innerHTML = groups.map((group) => `
    <label data-player-level-select-row="${escapeHtml(group.id)}">
      <span><input data-${prefix}-player-level-enabled="${escapeHtml(group.id)}" type="checkbox" ${!hasExplicitLevels || values[group.id] ? "checked" : ""} /> ${escapeHtml(group.name)}</span>
      <select data-${prefix}-player-level-group="${escapeHtml(group.id)}">
        ${group.levels.map((level) => `
          <option value="${escapeHtml(level.id)}" ${values[group.id] === level.id ? "selected" : ""}>
            ${escapeHtml(level.name)} - ${food(level.price || 0)}
          </option>
        `).join("")}
      </select>
    </label>
  `).join("");
}

function renderPlayerLevels() {
  const mount = $("playerLevelList");
  if (!mount) return;
  mount.innerHTML = playerLevelGroups().map((group) => `
    <section class="level-group-card dynamic-level-group-card" data-player-level-group="${escapeHtml(group.id)}">
      <div class="level-group-head">
        <label><span>一级等级名</span><input data-player-level-group-name value="${escapeHtml(group.name)}" /></label>
        <label><span>排序</span><input data-player-level-group-sort type="number" value="${Number(group.sort || 0)}" /></label>
        <label class="switch-field"><input data-player-level-group-visible type="checkbox" ${group.visible === false ? "" : "checked"} /><span>启用</span></label>
        <button class="danger-btn" data-delete-player-level-group type="button">删除一级</button>
      </div>
      <div class="level-price-grid dynamic-level-grid">
        ${group.levels.map((level) => `
          <label class="level-price-cell" data-player-level-id="${escapeHtml(level.id)}">
            <span>二级等级</span>
            <input data-player-level-name value="${escapeHtml(level.name)}" />
            <span>人民币/小时</span>
            <input data-player-level-price type="number" min="0" step="0.01" value="${rmbInput(level.price || 0)}" />
            <span>说明</span>
            <input data-player-level-hint value="${escapeHtml(level.hint || "")}" placeholder="前端提示，可不填" />
            <button class="danger-btn" data-delete-player-level type="button">删除</button>
          </label>
        `).join("")}
      </div>
      <button class="soft-btn" data-add-player-level type="button">新增二级等级</button>
    </section>
  `).join("");
  ensureQuickMatchConfigPanel();
}

function collectPlayerLevelGroups() {
  return [...document.querySelectorAll("[data-player-level-group]")].map((groupRow, index) => ({
    id: groupRow.dataset.playerLevelGroup || `grade_${index + 1}`,
    name: groupRow.querySelector("[data-player-level-group-name]")?.value.trim() || `一级等级${index + 1}`,
    sort: Number(groupRow.querySelector("[data-player-level-group-sort]")?.value || index + 1),
    visible: groupRow.querySelector("[data-player-level-group-visible]")?.checked !== false,
    levels: [...groupRow.querySelectorAll("[data-player-level-id]")].map((levelRow, levelIndex) => ({
      id: levelRow.dataset.playerLevelId || `level_${levelIndex + 1}`,
      name: levelRow.querySelector("[data-player-level-name]")?.value.trim() || `等级${levelIndex + 1}`,
      price: Math.max(0, rmbToToken(levelRow.querySelector("[data-player-level-price]")?.value || 0)),
      hint: levelRow.querySelector("[data-player-level-hint]")?.value.trim() || "",
      sort: levelIndex + 1,
      visible: true
    })).filter((item) => item.id && item.name)
  })).filter((item) => item.id && item.name);
}

function defaultQuickMatchConfig() {
  return {
    skills: [
      { id: "delta", name: "三角洲", price: 0, sort: 1, visible: true, plays: [
        { id: "space", name: "航天", price: 40, sort: 1, visible: true },
        { id: "prison", name: "监狱", price: 30, sort: 2, visible: true }
      ] }
    ],
    services: [{ id: "rush", name: "技术猛攻单", price: 60, sort: 1, visible: true }],
    genders: [{ id: "any", name: "不限", price: 0, sort: 1, visible: true }],
    types: [{ id: "single", name: "单陪", price: 0, multiplier: 1, sort: 1, visible: true }]
  };
}

function quickMatchConfig() {
  const config = state.catalog.quickMatchConfig || {};
  const fallback = defaultQuickMatchConfig();
  return {
    skills: Array.isArray(config.skills) && config.skills.length ? config.skills : fallback.skills,
    services: Array.isArray(config.services) && config.services.length ? config.services : fallback.services,
    genders: Array.isArray(config.genders) && config.genders.length ? config.genders : fallback.genders,
    types: Array.isArray(config.types) && config.types.length ? config.types : fallback.types
  };
}

function adminSkillList() {
  const skills = $("quickMatchConfigShell") && document.querySelector("[data-quick-skill]")
    ? (collectQuickMatchConfig().skills || [])
    : (quickMatchConfig().skills || []);
  return skills.length ? skills : (state.catalog.games || []).filter((game) => game.id !== "all");
}

function gameOptions(selected) {
  return adminSkillList()
    .map((skill) => `<option value="${escapeHtml(skill.id)}" ${skill.id === selected ? "selected" : ""}>${escapeHtml(skill.name)}</option>`)
    .join("");
}

function linkedLevelGroupsForSkill(skillId) {
  const skill = adminSkillList().find((item) => item.id === skillId) || {};
  if (Array.isArray(skill.levelGroups) && skill.levelGroups.length) return cloneLevelGroups(skill.levelGroups);
  const ids = Array.isArray(skill.levelGroupIds) ? skill.levelGroupIds.map(String).filter(Boolean) : [];
  const groups = playerLevelGroups();
  const linked = ids.length ? groups.filter((group) => ids.includes(String(group.id))) : groups;
  if (linked.length && ids.length) return linked;
  return [{
    id: `${skillId || "skill"}_grade_default`,
    name: "默认一级等级",
    sort: 1,
    visible: true,
    levels: [{ id: "default", name: "默认二级等级", price: 0, hint: "", sort: 1, visible: true }]
  }];
}

function editableSkillLevelGroups(skill = {}, skillIndex = 0) {
  if (Array.isArray(skill.levelGroups) && skill.levelGroups.length) return cloneLevelGroups(skill.levelGroups);
  return [{
    id: `skill_${skillIndex + 1}_grade_1`,
    name: "一级等级1",
    sort: 1,
    visible: true,
    levels: [{ id: "level_1", name: "二级等级1", price: 0, hint: "", sort: 1, visible: true }]
  }];
}

function quickSkillLevelEditor(skill = {}, skillIndex = 0) {
  const groups = editableSkillLevelGroups(skill, skillIndex);
  const skillId = skill.id || `skill_${skillIndex + 1}`;
  return `
    <div class="quick-skill-level-editor">
      <div class="quick-skill-level-title">
        <span>这个技能对应的等级</span>
        <button class="soft-btn" data-add-quick-skill-level-group type="button">新增一级等级</button>
      </div>
      <div class="quick-skill-level-list">
        ${groups.map((group, groupIndex) => `
          <section class="quick-skill-level-group ${state.quickLevelOpen?.[`${skillId}:${group.id || `grade_${groupIndex + 1}`}`] ? "open" : ""}" data-quick-skill-level-group-row data-level-group-id="${escapeHtml(group.id || `grade_${groupIndex + 1}`)}">
            <div class="quick-skill-level-group-summary">
              <div>
                <strong>${escapeHtml(group.name || `一级等级${groupIndex + 1}`)}</strong>
                <span>${(Array.isArray(group.levels) ? group.levels : []).length} 个二级等级</span>
              </div>
              <input data-quick-skill-level-group-sort type="number" value="${Number(group.sort || groupIndex + 1)}" title="排序，数字越小越靠前" />
              <button class="soft-btn" data-toggle-quick-skill-level-group type="button">${state.quickLevelOpen?.[`${skillId}:${group.id || `grade_${groupIndex + 1}`}`] ? "收起" : "展开编辑"}</button>
              <button class="danger-btn" data-delete-quick-skill-level-group type="button">删除一级</button>
            </div>
            <div class="quick-skill-level-body">
              <div class="quick-skill-level-group-head">
                <label>
                  <span>一级等级名称</span>
                  <input data-quick-skill-level-group-name value="${escapeHtml(group.name || "")}" placeholder="例如：普通局、巅峰局、娱乐局" />
                </label>
              </div>
              <div class="quick-skill-level-rows">
              ${(Array.isArray(group.levels) ? group.levels : []).map((level, levelIndex) => `
                <div class="quick-skill-level-row" data-quick-skill-level-row data-level-id="${escapeHtml(level.id || `level_${levelIndex + 1}`)}">
                  <input data-quick-skill-level-name value="${escapeHtml(level.name || "")}" placeholder="二级等级名称" />
                  <input data-quick-skill-level-price type="number" min="0" step="0.01" value="${rmbInput(level.price || 0)}" placeholder="每小时人民币" />
                  <input data-quick-skill-level-hint value="${escapeHtml(level.hint || "")}" placeholder="说明，可不填" />
                  <button class="danger-btn" data-delete-quick-skill-level type="button">删除二级</button>
                </div>
              `).join("")}
              </div>
              <button class="soft-btn" data-add-quick-skill-level type="button">新增二级等级</button>
            </div>
          </section>
        `).join("")}
      </div>
    </div>
  `;
}

function quickOptionRow(item, group, index) {
  return `
    <div class="quick-option-row" data-quick-option="${escapeHtml(group)}" data-option-id="${escapeHtml(item.id || `${group}_${index + 1}`)}">
      <input data-quick-field="name" value="${escapeHtml(item.name || "")}" placeholder="名称" />
      <input data-quick-field="price" type="number" min="0" step="0.01" value="${rmbInput(item.price || 0)}" placeholder="加价" />
      ${group === "types" ? `<input data-quick-field="multiplier" type="number" min="1" step="0.1" value="${Number(item.multiplier || 1)}" placeholder="倍数" />` : ""}
      <button class="danger-btn" data-delete-quick-option type="button">删除</button>
    </div>
  `;
}

function quickSkillLevelLinks(skill = {}) {
  const selected = new Set(Array.isArray(skill.levelGroupIds) ? skill.levelGroupIds.map(String) : []);
  return `
    <div class="quick-skill-level-links">
      <span>关联一级等级</span>
      <div>
        ${playerLevelGroups().map((group) => `
          <label>
            <input data-quick-skill-level-group="${escapeHtml(group.id)}" type="checkbox" ${!selected.size || selected.has(String(group.id)) ? "checked" : ""} />
            <em>${escapeHtml(group.name)}</em>
          </label>
        `).join("")}
      </div>
    </div>
  `;
}

function ensureQuickMatchConfigPanel() {
  const mount = $("playerConfigMount");
  if (!mount) return;
  let shell = $("quickMatchConfigShell");
  if (!shell) {
    shell = document.createElement("section");
    shell.id = "quickMatchConfigShell";
    shell.className = "quick-match-config-shell";
    mount.appendChild(shell);
  }
  const config = quickMatchConfig();
  shell.innerHTML = `
    <div class="sub-head">一键匹配筛选配置</div>
    <div class="level-config-tip">每个技能可以单独配置自己的一级等级和二级等级；玩法只挂在当前技能下面。</div>
    <div class="quick-config-block">
      <div class="quick-config-title"><strong>技能与对应玩法</strong><button class="soft-btn" data-add-quick-skill type="button">新增技能</button></div>
      <div id="quickSkillList">
        ${config.skills.map((skill, index) => `
          <section class="quick-skill-card" data-quick-skill="${escapeHtml(skill.id || `skill_${index + 1}`)}">
            <div class="quick-skill-head">
              <input data-quick-skill-name value="${escapeHtml(skill.name || "")}" placeholder="技能名" />
              <input data-quick-skill-price type="number" min="0" step="0.01" value="${rmbInput(skill.price || 0)}" placeholder="技能加价" />
              <button class="danger-btn" data-delete-quick-skill type="button">删除技能</button>
            </div>
            ${quickSkillLevelEditor(skill, index)}
            <div class="quick-play-list">
              ${(Array.isArray(skill.plays) ? skill.plays : []).map((play, playIndex) => quickOptionRow(play, `play:${skill.id || `skill_${index + 1}`}`, playIndex)).join("")}
            </div>
            <button class="soft-btn" data-add-quick-play type="button">新增玩法</button>
          </section>
        `).join("")}
      </div>
    </div>
    ${["services", "genders", "types"].map((group) => `
      <div class="quick-config-block" data-quick-group="${group}">
        <div class="quick-config-title"><strong>${group === "services" ? "服务" : group === "genders" ? "性别" : "类型"}</strong><button class="soft-btn" data-add-quick-option="${group}" type="button">新增</button></div>
        <div class="quick-option-list">
          ${visibleSorted(config[group]).map((item, index) => quickOptionRow(item, group, index)).join("")}
        </div>
      </div>
    `).join("")}
  `;
}

function collectQuickSkillLevelGroups(card, skillId) {
  return [...card.querySelectorAll("[data-quick-skill-level-group-row]")].map((groupRow, groupIndex) => ({
    id: groupRow.dataset.levelGroupId || `${skillId}_grade_${groupIndex + 1}`,
    name: groupRow.querySelector("[data-quick-skill-level-group-name]")?.value.trim() || `一级等级${groupIndex + 1}`,
    sort: Number(groupRow.querySelector("[data-quick-skill-level-group-sort]")?.value || groupIndex + 1),
    visible: true,
    levels: [...groupRow.querySelectorAll("[data-quick-skill-level-row]")].map((levelRow, levelIndex) => ({
      id: levelRow.dataset.levelId || `${skillId}_level_${levelIndex + 1}`,
      name: levelRow.querySelector("[data-quick-skill-level-name]")?.value.trim() || `二级等级${levelIndex + 1}`,
      price: rmbToToken(levelRow.querySelector("[data-quick-skill-level-price]")?.value || 0),
      hint: levelRow.querySelector("[data-quick-skill-level-hint]")?.value.trim() || "",
      sort: levelIndex + 1,
      visible: true
    })).filter((item) => item.id && item.name)
  })).filter((item) => item.id && item.name && item.levels.length);
}

function collectQuickMatchConfig() {
  const skills = [...document.querySelectorAll("[data-quick-skill]")].map((card, index) => {
    const skillId = card.dataset.quickSkill || `skill_${index + 1}`;
    return {
      id: skillId,
      name: card.querySelector("[data-quick-skill-name]")?.value.trim() || `技能${index + 1}`,
      price: rmbToToken(card.querySelector("[data-quick-skill-price]")?.value || 0),
      sort: index + 1,
      visible: true,
      levelGroupIds: [...card.querySelectorAll("[data-quick-skill-level-group]:checked")].map((input) => input.dataset.quickSkillLevelGroup).filter(Boolean),
      levelGroups: collectQuickSkillLevelGroups(card, skillId),
      plays: [...card.querySelectorAll('[data-quick-option^="play:"]')].map((row, playIndex) => ({
        id: row.dataset.optionId || `${skillId}_play_${playIndex + 1}`,
        name: row.querySelector('[data-quick-field="name"]')?.value.trim() || `玩法${playIndex + 1}`,
        price: rmbToToken(row.querySelector('[data-quick-field="price"]')?.value || 0),
        sort: playIndex + 1,
        visible: true
      }))
    };
  });
  const collectGroup = (group) => [...document.querySelectorAll(`[data-quick-option="${group}"]`)].map((row, index) => ({
    id: row.dataset.optionId || `${group}_${index + 1}`,
    name: row.querySelector('[data-quick-field="name"]')?.value.trim() || `选项${index + 1}`,
    price: rmbToToken(row.querySelector('[data-quick-field="price"]')?.value || 0),
    multiplier: Number(row.querySelector('[data-quick-field="multiplier"]')?.value || 1),
    sort: index + 1,
    visible: true
  }));
  return { skills, services: collectGroup("services"), genders: collectGroup("genders"), types: collectGroup("types") };
}

function renderPlayerDetail() {
  const player = state.catalog.players[state.activePlayerIndex];
  if (!player) return showPlayerList();
  ensurePlayerLevelFieldMounts();
  $("playerDetailMeta").textContent = `${player.name || "未命名"} / ${player.id || "未设置ID"}`;
  $("detailPlayerId").value = player.id || "";
  $("detailPlayerName").value = player.name || "";
  $("detailPlayerTitle").value = player.title || "";
  $("detailPlayerGame").innerHTML = gameOptions(player.game);
  const levels = normalizePlayerLevels(player);
  renderPlayerLevelSelects("detailPlayerLevelFields", "detail", levels);
  $("detailPlayerRevenueConfig").innerHTML = revenueConfigOptions(player.revenueConfigId || state.settings.defaultRevenueConfigId);
  $("detailPlayerSecret").value = player.workbenchSecret || "";
  $("detailPlayerWorkbenchOpenid").value = player.workbenchOpenid || "";
  $("detailPlayerBindCustomerId").value = player.workbenchBoundCustomerId || "";
  $("detailPlayerHomeSort").value = Number(player.homeSort ?? player.sort ?? state.activePlayerIndex + 1);
  $("detailPlayerShowOnHome").checked = player.showOnHome !== false;
  $("detailPlayerBindMeta").textContent = player.workbenchBoundCustomerId ? `已绑定用户 ${player.workbenchBoundCustomerId}` : "未绑定用户ID";
  $("detailPlayerPrice").value = rmbInput(primaryPlayerPrice(player));
  $("detailPlayerSold").value = Number(player.sold || 0);
  $("detailPlayerEarnedBalance").value = rmbInput(player.earnedCatFood ?? player.balanceCatFood ?? 0);
  $("detailPlayerRechargeBalance").value = rmbInput(player.rechargeCatFood || 0);
  $("detailPlayerPendingWithdraw").value = rmbInput(player.pendingWithdrawCatFood || 0);
  $("detailPlayerTags").value = (player.tags || []).join(",");
  $("detailPlayerSchedule").value = (player.schedule || []).join(",");
  $("detailPlayerIntro").value = player.intro || "";
}

function renderPlayerCreate() {
  if (!$("createPlayerGame")) return;
  ensurePlayerLevelFieldMounts();
  $("createPlayerGame").innerHTML = gameOptions($("createPlayerGame").value);
  const currentLevels = collectDynamicPlayerLevels("create");
  const initial = linkedLevelGroupsForSkill($("createPlayerGame").value).reduce((map, group) => {
    if (currentLevels[group.id]) {
      map[group.id] = currentLevels[group.id];
      return map;
    }
    map[group.id] = group.levels[0]?.id || "";
    return map;
  }, {});
  renderPlayerLevelSelects("createPlayerLevelFields", "create", initial);
  $("createPlayerRevenueConfig").innerHTML = revenueConfigOptions($("createPlayerRevenueConfig").value || state.settings.defaultRevenueConfigId);
}

function collectDynamicPlayerLevels(prefix) {
  return [...document.querySelectorAll(`[data-${prefix}-player-level-group]`)].reduce((map, select) => {
    const enabled = select.closest("[data-player-level-select-row]")?.querySelector(`[data-${prefix}-player-level-enabled]`);
    if (enabled && !enabled.checked) return map;
    map[select.dataset[`${prefix}PlayerLevelGroup`]] = select.value;
    return map;
  }, {});
}

function collectPlayerDetail() {
  const existing = state.catalog.players[state.activePlayerIndex] || {};
  const game = $("detailPlayerGame").value;
  const gameName = state.catalog.games.find((item) => item.id === game)?.name || "";
  const id = $("detailPlayerId").value.trim() || existing.id || `player_${Date.now()}`;
  const levels = collectDynamicPlayerLevels("detail");
  const firstGroup = linkedLevelGroupsForSkill(game)[0];
  const firstLevel = firstGroup ? levels[firstGroup.id] : "";
  return {
    ...existing,
    id,
    name: $("detailPlayerName").value.trim(),
    title: $("detailPlayerTitle").value.trim(),
    game,
    gameName,
    levels,
    level: firstGroup ? playerLevelName(firstGroup.id, firstLevel) : "",
    homeSort: Math.max(0, Number($("detailPlayerHomeSort").value || 0)),
    showOnHome: $("detailPlayerShowOnHome").checked,
    revenueConfigId: $("detailPlayerRevenueConfig").value || state.settings.defaultRevenueConfigId,
    workbenchSecret: $("detailPlayerSecret").value.trim() || existing.workbenchSecret || id.replace(/\D/g, "").padStart(6, "0").slice(-6),
    workbenchOpenid: $("detailPlayerWorkbenchOpenid").value.trim(),
    workbenchBoundAt: $("detailPlayerWorkbenchOpenid").value.trim() === String(existing.workbenchOpenid || "").trim() ? (existing.workbenchBoundAt || "") : "",
    workbenchBoundCustomerId: $("detailPlayerWorkbenchOpenid").value.trim() ? (existing.workbenchBoundCustomerId || $("detailPlayerBindCustomerId").value.trim()) : "",
    workbenchBoundCustomerName: $("detailPlayerWorkbenchOpenid").value.trim() ? (existing.workbenchBoundCustomerName || "") : "",
    price: firstGroup ? playerLevelPrice(firstGroup.id, firstLevel) : 0,
    sold: Number($("detailPlayerSold").value || 0),
    earnedCatFood: rmbToToken($("detailPlayerEarnedBalance").value || 0),
    rechargeCatFood: rmbToToken($("detailPlayerRechargeBalance").value || 0),
    balanceCatFood: rmbToToken($("detailPlayerEarnedBalance").value || 0),
    pendingWithdrawCatFood: Number(existing.pendingWithdrawCatFood || 0),
    withdrawnCatFood: Number(existing.withdrawnCatFood || 0),
    settledIncome: Number(existing.settledIncome || 0),
    rating: existing.rating || "5.0",
    style: existing.style || id,
    tags: $("detailPlayerTags").value.split(/[,，]/).map((item) => item.trim()).filter(Boolean),
    schedule: $("detailPlayerSchedule").value.split(/[,，]/).map((item) => item.trim()).filter(Boolean),
    intro: $("detailPlayerIntro").value.trim()
  };
}

function playerFromCreateForm() {
  const game = $("createPlayerGame").value;
  const gameName = adminSkillList().find((item) => item.id === game)?.name || state.catalog.games.find((item) => item.id === game)?.name || "";
  const id = $("createPlayerId").value.trim() || `player_${Date.now()}`;
  const levels = collectDynamicPlayerLevels("create");
  const firstGroup = linkedLevelGroupsForSkill(game)[0];
  const firstLevel = firstGroup ? levels[firstGroup.id] : "";
  return {
    id,
    name: $("createPlayerName").value.trim(),
    title: $("createPlayerTitle").value.trim() || "陪玩服务",
    game,
    gameName,
    levels,
    level: firstGroup ? playerLevelName(firstGroup.id, firstLevel) : "",
    homeSort: Math.max(0, Number($("createPlayerHomeSort").value || state.catalog.players.length + 1)),
    showOnHome: $("createPlayerShowOnHome").checked,
    revenueConfigId: $("createPlayerRevenueConfig").value || state.settings.defaultRevenueConfigId,
    workbenchSecret: $("createPlayerSecret").value.trim() || id.replace(/\D/g, "").padStart(6, "0").slice(-6),
    price: firstGroup ? playerLevelPrice(firstGroup.id, firstLevel) : 0,
    rating: "5.0",
    sold: 0,
    style: id,
    earnedCatFood: rmbToToken($("createPlayerEarnedBalance").value || 0),
    rechargeCatFood: rmbToToken($("createPlayerRechargeBalance").value || 0),
    balanceCatFood: rmbToToken($("createPlayerEarnedBalance").value || 0),
    pendingWithdrawCatFood: 0,
    withdrawnCatFood: 0,
    settledIncome: 0,
    tags: $("createPlayerTags").value.split(/[,，]/).map((item) => item.trim()).filter(Boolean),
    intro: "",
    schedule: ["今天 20:00"]
  };
}

function renderPlayers() {
  renderPlayerLevels();
  $("playerSearchInput").value = state.playerFilter.keyword;
  $("playerLevelFilter").innerHTML = levelOptions(state.playerFilter.level, true);
  const entries = state.catalog.players
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => {
      const text = `${player.name || ""} ${player.id || ""} ${selectedLevelSummary(player)}`.toLowerCase();
      const keyword = state.playerFilter.keyword.trim().toLowerCase();
      const levels = normalizePlayerLevels(player);
      const matchLevel = state.playerFilter.level === "all" || Object.entries(levels).some(([groupId, levelId]) => `${groupId}:${levelId}` === state.playerFilter.level);
      return (!keyword || text.includes(keyword)) && matchLevel;
    });
  $("playerList").innerHTML = entries.map(({ player, index }) => `
    <tr data-player-index="${index}">
      <td><input data-player-select type="checkbox" /></td>
      <td><strong>${escapeHtml(player.name || "未命名")}</strong><span>${escapeHtml(player.title || "")}</span></td>
      <td><code>${escapeHtml(player.id || "")}</code></td>
      <td colspan="2"><strong>${escapeHtml(selectedLevelSummary(player))}</strong><span>${food(primaryPlayerPrice(player))}/小时</span></td>
      <td class="player-home-cell">
        <input data-player-home-sort="${index}" type="number" min="0" value="${Number(player.homeSort ?? player.sort ?? index + 1)}" title="首页热门达人排序，数字越小越靠前" />
        <label><input data-player-show-home="${index}" type="checkbox" ${player.showOnHome === false ? "" : "checked"} /> 首页</label>
      </td>
      <td>${escapeHtml(revenueConfigName(player.revenueConfigId || state.settings.defaultRevenueConfigId))}</td>
      <td class="money-cell">${food(player.earnedCatFood ?? player.balanceCatFood ?? 0)}<span>${food(player.rechargeCatFood || 0)} 充值</span></td>
      <td class="inline-actions">
        <button class="soft-btn" data-open-player="${index}" type="button">查看/编辑</button>
        <button class="danger-btn" data-delete-player="${index}" type="button">删除</button>
      </td>
    </tr>
  `).join("") || `<tr><td colspan="9" class="empty-cell">没有匹配的打手</td></tr>`;
  if (state.activePlayerIndex !== null) renderPlayerDetail();
}

document.addEventListener("click", (event) => {
  const levelGroup = event.target.closest("[data-add-player-level]");
  const deleteLevel = event.target.closest("[data-delete-player-level]");
  const deleteGroup = event.target.closest("[data-delete-player-level-group]");
  if (levelGroup || deleteLevel || deleteGroup) {
    state.catalog.playerLevelGroups = collectPlayerLevelGroups();
    if (levelGroup) {
      const group = state.catalog.playerLevelGroups.find((item) => item.id === levelGroup.closest("[data-player-level-group]")?.dataset.playerLevelGroup);
      if (group) group.levels.push({ id: `level_${Date.now()}`, name: "新等级", price: 0, hint: "", sort: group.levels.length + 1, visible: true });
    }
    if (deleteLevel) {
      const group = state.catalog.playerLevelGroups.find((item) => item.id === deleteLevel.closest("[data-player-level-group]")?.dataset.playerLevelGroup);
      if (group) group.levels = group.levels.filter((item) => item.id !== deleteLevel.closest("[data-player-level-id]")?.dataset.playerLevelId);
    }
    if (deleteGroup) {
      state.catalog.playerLevelGroups = state.catalog.playerLevelGroups.filter((item) => item.id !== deleteGroup.closest("[data-player-level-group]")?.dataset.playerLevelGroup);
    }
    renderPlayers();
  }
  if (event.target.closest("[data-add-quick-skill]")) {
    state.catalog.quickMatchConfig = collectQuickMatchConfig();
    state.catalog.quickMatchConfig.skills.push({ id: `skill_${Date.now()}`, name: "新技能", price: 0, sort: state.catalog.quickMatchConfig.skills.length + 1, visible: true, plays: [{ id: `play_${Date.now()}`, name: "新玩法", price: 0, sort: 1, visible: true }] });
    ensureQuickMatchConfigPanel();
  }
  const addPlay = event.target.closest("[data-add-quick-play]");
  if (addPlay) {
    state.catalog.quickMatchConfig = collectQuickMatchConfig();
    const skillId = addPlay.closest("[data-quick-skill]")?.dataset.quickSkill;
    const skill = state.catalog.quickMatchConfig.skills.find((item) => item.id === skillId);
    if (skill) skill.plays.push({ id: `play_${Date.now()}`, name: "新玩法", price: 0, sort: skill.plays.length + 1, visible: true });
    ensureQuickMatchConfigPanel();
  }
  const addOption = event.target.closest("[data-add-quick-option]");
  if (addOption) {
    const group = addOption.dataset.addQuickOption;
    state.catalog.quickMatchConfig = collectQuickMatchConfig();
    state.catalog.quickMatchConfig[group].push({ id: `${group}_${Date.now()}`, name: "新选项", price: 0, multiplier: 1, sort: state.catalog.quickMatchConfig[group].length + 1, visible: true });
    ensureQuickMatchConfigPanel();
  }
  const addSkillLevelGroup = event.target.closest("[data-add-quick-skill-level-group]");
  if (addSkillLevelGroup) {
    state.catalog.quickMatchConfig = collectQuickMatchConfig();
    const skillId = addSkillLevelGroup.closest("[data-quick-skill]")?.dataset.quickSkill;
    const skill = state.catalog.quickMatchConfig.skills.find((item) => item.id === skillId);
    if (skill) {
      skill.levelGroups = Array.isArray(skill.levelGroups) ? skill.levelGroups : [];
      const nextIndex = skill.levelGroups.length + 1;
      const groupId = `${skill.id}_grade_${Date.now()}`;
      skill.levelGroups.push({
        id: groupId,
        name: `一级等级${nextIndex}`,
        sort: nextIndex,
        visible: true,
        levels: [{ id: `${skill.id}_level_${Date.now()}`, name: "二级等级1", price: 0, hint: "", sort: 1, visible: true }]
      });
      state.quickLevelOpen[`${skill.id}:${groupId}`] = true;
    }
    ensureQuickMatchConfigPanel();
    return;
  }
  const toggleSkillLevelGroup = event.target.closest("[data-toggle-quick-skill-level-group]");
  if (toggleSkillLevelGroup) {
    const skillId = toggleSkillLevelGroup.closest("[data-quick-skill]")?.dataset.quickSkill || "";
    const groupRow = toggleSkillLevelGroup.closest("[data-quick-skill-level-group-row]");
    const groupId = groupRow?.dataset.levelGroupId || "";
    const key = `${skillId}:${groupId}`;
    const willOpen = !groupRow?.classList.contains("open");
    state.quickLevelOpen[key] = willOpen;
    groupRow?.classList.toggle("open", willOpen);
    toggleSkillLevelGroup.textContent = willOpen ? "收起" : "展开编辑";
    return;
  }
  const addSkillLevel = event.target.closest("[data-add-quick-skill-level]");
  if (addSkillLevel) {
    state.catalog.quickMatchConfig = collectQuickMatchConfig();
    const skillId = addSkillLevel.closest("[data-quick-skill]")?.dataset.quickSkill;
    const groupId = addSkillLevel.closest("[data-quick-skill-level-group-row]")?.dataset.levelGroupId;
    const skill = state.catalog.quickMatchConfig.skills.find((item) => item.id === skillId);
    const group = (skill?.levelGroups || []).find((item) => item.id === groupId);
    if (group) {
      group.levels = Array.isArray(group.levels) ? group.levels : [];
      group.levels.push({ id: `${group.id}_level_${Date.now()}`, name: `二级等级${group.levels.length + 1}`, price: 0, hint: "", sort: group.levels.length + 1, visible: true });
      state.quickLevelOpen[`${skillId}:${groupId}`] = true;
    }
    ensureQuickMatchConfigPanel();
    return;
  }
  const deleteSkillLevel = event.target.closest("[data-delete-quick-skill-level]");
  if (deleteSkillLevel) {
    deleteSkillLevel.closest("[data-quick-skill-level-row]")?.remove();
    return;
  }
  const deleteSkillLevelGroup = event.target.closest("[data-delete-quick-skill-level-group]");
  if (deleteSkillLevelGroup) {
    deleteSkillLevelGroup.closest("[data-quick-skill-level-group-row]")?.remove();
    return;
  }
  if (event.target.closest("[data-delete-quick-skill]") || event.target.closest("[data-delete-quick-option]")) {
    event.target.closest("[data-quick-skill], [data-quick-option]")?.remove();
  }
  if (event.target.closest("#savePlayerLevelsBtn")) {
    window.setTimeout(() => saveCatalog({
      games: collectGames(),
      players: collectPlayers(),
      playerLevelGroups: collectPlayerLevelGroups(),
      quickMatchConfig: collectQuickMatchConfig()
    }).catch((error) => showToast(error.message)), 50);
  }
});

document.addEventListener("change", (event) => {
  if (event.target?.id === "detailPlayerGame") {
    if ($("quickMatchConfigShell") && document.querySelector("[data-quick-skill]")) {
      state.catalog.quickMatchConfig = collectQuickMatchConfig();
    }
    renderPlayerLevelSelects("detailPlayerLevelFields", "detail", collectDynamicPlayerLevels("detail"));
  }
  if (event.target?.id === "createPlayerGame") {
    if ($("quickMatchConfigShell") && document.querySelector("[data-quick-skill]")) {
      state.catalog.quickMatchConfig = collectQuickMatchConfig();
    }
    renderPlayerLevelSelects("createPlayerLevelFields", "create", collectDynamicPlayerLevels("create"));
  }
});

async function init() {
  bindEvents();
  if (!state.token) {
    showLogin();
    return;
  }
  try {
    const data = await api("/api/admin/me");
    state.user = data.user;
    showApp();
    await loadDashboard();
  } catch {
    localStorage.removeItem("owner_token");
    state.token = "";
    showLogin();
  }
}

init();
