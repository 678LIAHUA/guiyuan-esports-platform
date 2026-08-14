const modules = [
  { id: "stats", name: "统计", icon: "▥", subs: ["综合面板", "订单统计"] },
  { id: "users", name: "用户", icon: "♙", subs: ["用户列表", "用户标签", "余额流水", "会员等级"] },
  { id: "distribution", name: "分销", icon: "↗", subs: ["分销员", "佣金记录", "邀请关系", "结算设置"] },
  { id: "aftersale", name: "售后", icon: "☊", subs: ["售后订单", "投诉管理", "退款记录", "评价申诉"] },
  { id: "orders", name: "订单", icon: "▤", subs: ["订单列表", "接单大厅", "订单群聊", "转单记录"] },
  { id: "merchant", name: "商家", icon: "▱", subs: ["商家列表", "入驻申请", "商家配置", "商家流水"] },
  { id: "thugs", name: "打手", icon: "⚔", subs: ["打手列表", "打手等级", "钱包流水", "提现管理", "罚款记录"] },
  { id: "goods", name: "商品", icon: "□", subs: ["商品列表", "商品分类", "规格价格", "游戏管理", "套餐管理"] },
  { id: "finance", name: "财务", icon: "▣", subs: ["充值记录", "支付流水", "平台分账", "对账明细"] },
  { id: "marketing", name: "营销", icon: "◇", subs: ["优惠券", "活动管理", "公告管理", "播报轮播", "广告位"] },
  { id: "feedback", name: "反馈", icon: "▦", subs: ["意见反馈", "举报记录", "评价管理"] },
  { id: "apps", name: "应用", icon: "⌘", subs: ["微信小程序", "客服网站", "开放接口"] },
  { id: "decorate", name: "装修", icon: "▩", subs: ["首页装修", "导航配置", "一键匹配背景", "会员卡样式"] },
  { id: "auth", name: "权限", icon: "▧", subs: ["管理员", "角色权限", "登录日志"] },
  { id: "settings", name: "设置", icon: "⚙", subs: ["基础设置", "支付设置", "客服设置", "风控告警"] }
]

const state = {
  module: "stats",
  sub: "综合面板",
  tabs: ["综合面板", "用户列表", "风控告警", "基础设置"],
  chat: 0
}

const metricCards = [
  ["营收（GMV）", "¥0.00", "较上期 ¥0.00", "◎", ""],
  ["订单数", "0", "较上期 0", "▤", ""],
  ["客单价", "¥0.00", "较上期 ¥0.00", "▣", ""],
  ["毛利", "¥0.00", "差价 ¥0.00 · 抽佣 ¥0.00 · override ¥0.00", "☘", ""],
  ["退款金额", "¥0.00", "较上期 ¥0.00", "▤", ""],
  ["退款订单数", "0", "较上期 0", "▧", ""],
  ["订单完成率", "0.00%", "较上期 0.00%", "◎", ""],
  ["退款率", "0.00%", "较上期 0.00%", "☉", ""],
  ["活跃用户", "0", "较上期 1", "♙", "down"],
  ["新增打手", "0", "较上期 0", "⚔", ""],
  ["访问量", "0", "较上期 0", "☉", ""]
]

const orders = [
  { id: "GY20260706001", user: "老板_273841", item: "三角洲航天小时陪", amount: "280 猫粮", status: "进行中", staff: "客服小艾", thug: "星河", time: "2026-07-06 14:20" },
  { id: "GY20260706002", user: "老板_839204", item: "无畏契约绝密双陪", amount: "520 猫粮", status: "待接单", staff: "客服阿念", thug: "接单大厅", time: "2026-07-06 14:11" },
  { id: "GY20260706003", user: "老板_608129", item: "永劫无间技术物资单", amount: "360 猫粮", status: "已完成", staff: "客服小艾", thug: "小桃", time: "2026-07-06 13:46" },
  { id: "GY20260706004", user: "老板_991326", item: "和平精英趣味单", amount: "180 猫粮", status: "售后中", staff: "客服洛洛", thug: "墨白", time: "2026-07-06 13:05" }
]

const users = [
  { id: "273841", name: "老板_273841", balance: "920 猫粮", spent: "4860 猫粮", level: "黑金会员", tag: "高复购" },
  { id: "839204", name: "南风", balance: "120 猫粮", spent: "860 猫粮", level: "白银会员", tag: "新客" },
  { id: "608129", name: "云里", balance: "2340 猫粮", spent: "12860 猫粮", level: "至尊会员", tag: "大额充值" },
  { id: "991326", name: "橘子", balance: "60 猫粮", spent: "420 猫粮", level: "普通会员", tag: "需回访" }
]

const thugs = [
  { id: "510238", name: "星河", level: "化神期", online: "在线", balance: "8240 猫粮", orders: "152", rate: "80%" },
  { id: "629014", name: "小桃", level: "元婴期", online: "在线", balance: "3920 猫粮", orders: "96", rate: "75%" },
  { id: "702186", name: "墨白", level: "金丹期", online: "离线", balance: "1860 猫粮", orders: "48", rate: "70%" },
  { id: "448209", name: "椰奶", level: "筑基期", online: "在线", balance: "920 猫粮", orders: "23", rate: "70%" }
]

const goods = [
  ["三角洲小时陪", "小时陪", "45-160 猫粮/小时", "筑基期/金丹期/元婴期/化神期"],
  ["无畏契约绝密单", "趣味单", "200/400 猫粮", "机密/绝密"],
  ["永劫无间技术物资", "趣味单", "90/180 猫粮", "单陪/双陪"],
  ["和平精英上分", "趣味单", "120/240 猫粮", "随机/指定打手"],
  ["语音聊天陪伴", "休闲单", "60 猫粮/小时", "随机/指定"],
  ["娱乐开黑搭子", "休闲单", "80 猫粮/小时", "单陪/双陪"],
  ["王者荣耀上分", "趣味单", "100/220 猫粮", "随机/指定"],
  ["英雄联盟手游", "趣味单", "80/180 猫粮", "机密/绝密"]
]

const chats = [
  ["GY20260706001 · 三角洲航天", "老板_273841", "进行中", "打手已进群，预计 14:40 开始。"],
  ["GY20260706002 · 无畏契约", "南风", "待接单", "订单已发接单大厅。"],
  ["GY20260706004 · 售后沟通", "橘子", "售后中", "客户申请退半小时猫粮。"]
]

const referrals = [
  { userId: "839204", userName: "南风", inviterId: "273841", inviterName: "老板_273841", rate: "5%", months: "1个月", status: "生效中", time: "2026-07-06 13:52" },
  { userId: "991326", userName: "橘子", inviterId: "608129", inviterName: "云里", rate: "5%", months: "1个月", status: "生效中", time: "2026-07-06 12:18" }
]

const referralCommissions = [
  { id: "YQ20260706001", order: "GY20260706002", inviter: "老板_273841", user: "南风", amount: "26 猫粮", rate: "5%", time: "2026-07-06 14:11" },
  { id: "YQ20260706002", order: "GY20260706004", inviter: "云里", user: "橘子", amount: "9 猫粮", rate: "5%", time: "2026-07-06 13:05" }
]

function $(id) {
  return document.getElementById(id)
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s]))
}

function activeModule() {
  return modules.find((item) => item.id === state.module) || modules[0]
}

function renderShell() {
  $("moduleRail").innerHTML = modules.map((item) => `
    <button class="module-item ${state.module === item.id ? "active" : ""}" data-module="${item.id}">
      <i>${item.icon}</i><span>${item.name}</span>
    </button>
  `).join("")

  const mod = activeModule()
  $("moduleTitle").textContent = mod.name
  $("subNav").innerHTML = mod.subs.map((sub) => `
    <button class="sub-item ${state.sub === sub ? "active" : ""}" data-sub="${esc(sub)}">
      <i>${subIcon(sub)}</i><span>${sub}</span>
    </button>
  `).join("")

  $("breadcrumbText").textContent = `${mod.name} / ${state.sub}`
  $("tabBar").innerHTML = state.tabs.map((tab) => `
    <button class="tab-item ${tab === state.sub ? "active" : ""}" data-tab="${esc(tab)}">
      <i>${tabIcon(tab)}</i><span>${tab}</span><b data-tab-close="${esc(tab)}">×</b>
    </button>
  `).join("")
}

function subIcon(text) {
  if (text.includes("面板")) return "▦"
  if (text.includes("列表")) return "♙"
  if (text.includes("告警")) return "♧"
  if (text.includes("设置")) return "⚙"
  if (text.includes("订单")) return "▤"
  if (text.includes("分类")) return "▩"
  return "□"
}

function tabIcon(text) {
  return subIcon(text)
}

function tag(text) {
  let cls = ""
  if (/在线|完成|启用|正常|通过/.test(text)) cls = "green"
  if (/待|处理中|售后/.test(text)) cls = "orange"
  if (/投诉|拒绝|离线|封禁/.test(text)) cls = "red"
  if (/普通|关闭/.test(text)) cls = "gray"
  return `<span class="tag ${cls}">${esc(text)}</span>`
}

function render() {
  renderShell()
  const key = `${state.module}:${state.sub}`
  if (key === "stats:综合面板") return $("content").innerHTML = dashboard()
  if (state.module === "orders") return $("content").innerHTML = orderPage()
  if (state.module === "users") return $("content").innerHTML = userPage()
  if (state.module === "distribution") return $("content").innerHTML = distributionPage()
  if (state.module === "thugs") return $("content").innerHTML = thugPage()
  if (state.module === "goods") return $("content").innerHTML = goodsPage()
  if (state.sub.includes("群聊")) return $("content").innerHTML = chatPage()
  if (state.module === "decorate") return $("content").innerHTML = decoratePage()
  if (state.module === "finance") return $("content").innerHTML = financePage()
  if (state.module === "marketing") return $("content").innerHTML = marketingPage()
  $("content").innerHTML = genericPage()
  bindContentEvents()
}

function dashboard() {
  setTimeout(bindContentEvents)
  return `
    <section class="hero-panel">
      <div class="hero-main">
        <div>
          <div class="hello">
            <div class="hello-avatar">演</div>
            <div>
              <h1>晚上好，演示管理员 <span>👋</span></h1>
              <p>日 7 月 6 日 · 星期一 · 桂圆电竞系统 今日经营数据已就绪</p>
            </div>
          </div>
          <p class="update-line">⊙ 数据更新于 刚刚</p>
        </div>
        <div class="hero-side">
          <div class="mini-total"><div class="mini-icon">¥</div><div><label>今日营收</label><strong>¥0.00</strong><small>环比 0%</small></div></div>
          <div class="mini-total"><div class="mini-icon">▣</div><div><label>今日订单</label><strong>0 单</strong><small>环比 0%</small></div></div>
        </div>
      </div>
      <div class="hero-actions">
        <div>
          <button class="outline-btn" data-action="数据口径">数据口径</button>
          <button class="outline-btn" data-action="刷新">刷新</button>
          <button class="outline-btn" data-action="导出">导出</button>
        </div>
        <span class="date-range">2026-07-06 ~ 2026-07-06</span>
      </div>
      <div class="hero-actions">
        <div class="time-tabs">
          ${["今日", "昨日", "近 7 天", "近 30 天", "本月", "上月", "自定义"].map((t, i) => `<button class="${i === 0 ? "active" : ""}">${t}</button>`).join("")}
          <select class="select-lite"><option>对比：环比</option><option>对比：同比</option></select>
        </div>
        <span class="date-range">2026-07-06 ~ 2026-07-06</span>
      </div>
    </section>

    <div class="section-title"><strong>核心指标</strong><span>· 2026-07-06 ~ 2026-07-06</span></div>
    <section class="metric-grid">
      ${metricCards.map((m) => `
        <article class="metric-card">
          <label>${m[0]}</label>
          <div class="metric-value">${m[1]}</div>
          <div class="trend ${m[4]}"><b>${m[4] ? "↓ 100%" : "− 0%"}</b><span>${m[2]}</span></div>
          <div class="metric-icon">${m[3]}</div>
        </article>
      `).join("")}
    </section>

    <div class="section-title"><strong>实时运营</strong><span>· 待办 30 秒自动刷新 · 趋势 5 分钟缓存</span></div>
    <section class="ops-grid">
      <article class="panel">
        <div class="panel-head"><div><strong>订单趋势</strong><span>按小时统计订单与猫粮收入</span></div><button class="outline-btn" data-action="查看明细">查看明细</button></div>
        <div class="bar-list">
          ${["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"].map((t, i) => `<div class="bar-row"><span>${t}</span><div class="bar-track"><div class="bar-fill" style="width:${22 + i * 13}%"></div></div><b>${i * 8}</b></div>`).join("")}
        </div>
      </article>
      <article class="panel">
        <div class="panel-head"><div><strong>待办中心</strong><span>订单、提现、投诉、风控</span></div></div>
        <table class="data-table">
          <tbody>
            <tr><td><strong>待处理售后</strong><span>少玩退款/服务投诉</span></td><td>${tag("待处理")}</td></tr>
            <tr><td><strong>待审核提现</strong><span>打手提现申请</span></td><td>${tag("待处理")}</td></tr>
            <tr><td><strong>商品配置缺失</strong><span>规格价格/图片未完善</span></td><td>${tag("处理中")}</td></tr>
            <tr><td><strong>客服在线</strong><span>7 人在线，平均响应 42 秒</span></td><td>${tag("正常")}</td></tr>
          </tbody>
        </table>
      </article>
    </section>
  `
}

function tableLayout(title, desc, toolbar, head, rows) {
  setTimeout(bindContentEvents)
  return `
    <section class="panel" style="margin-top:16px">
      <div class="panel-head"><div><strong>${title}</strong><span>${desc}</span></div><button class="primary-btn" data-action="新增">新增</button></div>
      <div class="table-toolbar">${toolbar}</div>
      <table class="data-table">
        <thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `
}

function orderPage() {
  return tableLayout("订单管理", "订单列表、接单大厅、完成退款、群聊关联", `
    <input placeholder="订单号/用户ID/打手ID" />
    <select><option>全部状态</option><option>待接单</option><option>进行中</option><option>已完成</option><option>售后中</option></select>
    <select><option>全部客服</option><option>客服小艾</option><option>客服阿念</option></select>
    <button class="outline-btn" data-action="查询">查询</button><button class="outline-btn" data-action="导出">导出</button>
  `, ["订单信息", "用户", "商品", "金额", "状态", "客服", "打手", "操作"], orders.map((o, i) => `
    <tr>
      <td><strong>${o.id}</strong><span>${o.time}</span></td>
      <td>${o.user}</td><td>${o.item}</td><td class="money">${o.amount}</td>
      <td>${tag(o.status)}</td><td>${o.staff}</td><td>${o.thug}</td>
      <td><button class="text-btn" data-drawer="order" data-index="${i}">详情</button></td>
    </tr>`).join(""))
}

function userPage() {
  return tableLayout("用户列表", "余额、会员、账单、标签、封禁、订单黑名单", `
    <input placeholder="用户ID/昵称/手机号" /><select><option>全部会员</option><option>普通会员</option><option>黑金会员</option></select><button class="outline-btn" data-action="后台加猫粮">后台加猫粮</button>
  `, ["用户", "余额", "累计消费", "会员等级", "标签", "操作"], users.map((u, i) => `
    <tr><td><strong>${u.name}</strong><span>ID ${u.id}</span></td><td class="money">${u.balance}</td><td>${u.spent}</td><td>${tag(u.level)}</td><td>${u.tag}</td><td><button class="text-btn" data-drawer="user" data-index="${i}">查看</button></td></tr>
  `).join(""))
}

function distributionPage() {
  setTimeout(bindContentEvents)
  return `
    <section class="hero-panel">
      <div class="hero-main">
        <div>
          <div class="hello">
            <div class="hello-avatar">邀</div>
            <div>
              <h1>邀请有礼</h1>
              <p>新用户注册填写老用户 6 位 ID，首月消费按 5% 给邀请人返猫粮。</p>
            </div>
          </div>
          <p class="update-line">规则同步到小程序首页“邀请有礼”卡片</p>
        </div>
        <div class="hero-side">
          <div class="mini-total"><div class="mini-icon">%</div><div><label>提成比例</label><strong>5%</strong><small>按实付猫粮</small></div></div>
          <div class="mini-total"><div class="mini-icon">月</div><div><label>有效期</label><strong>1个月</strong><small>注册后首月</small></div></div>
        </div>
      </div>
      <div class="hero-actions">
        <div>
          <button class="outline-btn" data-action="编辑规则">编辑规则</button>
          <button class="outline-btn" data-action="导出邀请关系">导出</button>
          <button class="outline-btn" data-action="刷新">刷新</button>
        </div>
        <span class="date-range">邀请关系 ${referrals.length} 条 · 提成流水 ${referralCommissions.length} 条</span>
      </div>
    </section>
    ${tableLayout("邀请关系", "新用户填写老用户 ID 后自动生成，禁止重复绑定", `
      <input placeholder="新用户ID/邀请人ID/昵称" />
      <select><option>全部状态</option><option>生效中</option><option>已失效</option></select>
      <button class="outline-btn" data-action="查询">查询</button>
    `, ["新用户", "邀请人", "提成", "有效期", "状态", "绑定时间", "操作"], referrals.map((r, i) => `
      <tr>
        <td><strong>${r.userName}</strong><span>ID ${r.userId}</span></td>
        <td><strong>${r.inviterName}</strong><span>ID ${r.inviterId}</span></td>
        <td>${r.rate}</td><td>${r.months}</td><td>${tag(r.status)}</td><td>${r.time}</td>
        <td><button class="text-btn" data-drawer="referral" data-index="${i}">详情</button></td>
      </tr>
    `).join(""))}
    ${tableLayout("佣金记录", "用户下单扣猫粮后自动给邀请人增加余额", `
      <input placeholder="流水号/订单号/用户ID" />
      <select><option>全部时间</option><option>今日</option><option>近7天</option></select>
      <button class="outline-btn" data-action="导出">导出</button>
    `, ["流水号", "订单", "邀请人", "新用户", "提成猫粮", "比例", "时间"], referralCommissions.map((c) => `
      <tr>
        <td><strong>${c.id}</strong></td><td>${c.order}</td><td>${c.inviter}</td><td>${c.user}</td>
        <td class="money">${c.amount}</td><td>${c.rate}</td><td>${c.time}</td>
      </tr>
    `).join(""))}
    ${configPage("结算设置", "邀请规则、首月有效期、小程序入口文案", [
      ["邀请功能", "开启"], ["提成比例", "5%"], ["有效月份", "1"], ["入口标题", "邀请有礼"], ["入口文案", "新用户填你的ID，首月返5%"]
    ])}
  `
}

function thugPage() {
  return tableLayout("打手列表", "打手资料、等级标签、钱包、提现、罚款、订单、评价墙", `
    <input placeholder="打手ID/名字" /><select><option>全部等级</option><option>化神期</option><option>元婴期</option><option>金丹期</option></select><select><option>在线状态</option><option>在线</option><option>离线</option></select><button class="outline-btn" data-action="批量配置">批量配置</button>
  `, ["打手", "等级", "在线", "余额", "订单数", "收入占比", "操作"], thugs.map((t, i) => `
    <tr><td><strong>${t.name}</strong><span>ID ${t.id}</span></td><td>${tag(t.level)}</td><td>${tag(t.online)}</td><td class="money">${t.balance}</td><td>${t.orders}</td><td>${t.rate}</td><td><button class="text-btn" data-drawer="thug" data-index="${i}">资料</button></td></tr>
  `).join(""))
}

function goodsPage() {
  setTimeout(bindContentEvents)
  return `
    <section class="panel" style="margin-top:16px">
      <div class="panel-head"><div><strong>商品列表</strong><span>分类、规格、价格、主图、随机/指定下单配置</span></div><button class="primary-btn" data-action="新增商品">新增商品</button></div>
      <div class="table-toolbar"><input placeholder="商品名称/分类" /><select><option>全部分类</option><option>小时陪</option><option>趣味单</option></select><button class="outline-btn" data-action="查询">查询</button></div>
      <div class="goods-grid">
        ${goods.map((g, i) => `<article class="goods-card"><div class="goods-cover"></div><div class="goods-body"><strong>${g[0]}</strong><span>${g[1]} · ${g[3]}</span><p class="money">${g[2]}</p><button class="text-btn" data-drawer="goods" data-index="${i}">编辑配置</button></div></article>`).join("")}
      </div>
    </section>
  `
}

function chatPage() {
  const chat = chats[state.chat]
  setTimeout(bindContentEvents)
  return `
    <section class="chat-layout">
      <aside class="panel">
        <div class="panel-head"><div><strong>群聊列表</strong><span>客服只处理小程序订单群</span></div></div>
        ${chats.map((c, i) => `<div class="conversation ${i === state.chat ? "active" : ""}" data-chat="${i}"><strong>${c[0]}</strong><span>${c[1]} · ${c[2]}</span><span>${c[3]}</span></div>`).join("")}
      </aside>
      <section class="panel message-panel">
        <div class="panel-head"><div><strong>${chat[0]}</strong><span>${chat[1]} · ${chat[2]}</span></div><button class="outline-btn" data-drawer="order" data-index="0">跳转订单</button></div>
        <div class="messages"><div class="bubble">老板您好，客服已进群。</div><div class="bubble mine">已为您安排在线打手，接单后自动加入群聊。</div><div class="bubble">我想要化神期，玩 2 小时。</div><div class="bubble mine">收到，订单会先扣 2 小时，少玩的部分完成后按分钟退回。</div></div>
        <div class="chat-input"><input placeholder="输入客服回复" /><button class="primary-btn" data-action="发送">发送</button></div>
      </section>
      <aside class="panel">
        <div class="panel-head"><div><strong>订单卡片</strong><span>群聊关联订单信息</span></div></div>
        <div class="drawer-body"><div class="detail-row"><label>订单</label><div>GY20260706001</div></div><div class="detail-row"><label>原价</label><div>280 猫粮</div></div><div class="detail-row"><label>客服</label><div>客服小艾</div></div><div class="detail-row"><label>打手</label><div>星河</div></div></div>
      </aside>
    </section>
  `
}

function decoratePage() {
  return configPage("装修配置", "首页轮播、快捷入口、热门订单、一键匹配背景、会员卡图片", [
    ["首页轮播图", "/uploads/home-banner.png"], ["一键匹配背景图", "/uploads/quick-bg.png"], ["热门订单标题", "热门订单"], ["首页推荐打手", "星河、小桃、墨白"], ["快捷入口", "联系客服、提点建议、点单须知"]
  ], true)
}

function financePage() {
  return tableLayout("财务流水", "充值、后台预存、订单支付、会员折扣、退款、分账", `
    <input placeholder="流水号/用户ID" /><select><option>全部类型</option><option>充值</option><option>支付</option><option>退款</option></select><button class="outline-btn" data-action="导出">导出</button>
  `, ["流水", "对象", "类型", "猫粮", "余额", "备注"], `
    <tr><td><strong>F20260706001</strong><span>14:20</span></td><td>老板_273841</td><td>${tag("订单支付")}</td><td class="money">-280</td><td>920</td><td>三角洲小时陪</td></tr>
    <tr><td><strong>F20260706002</strong><span>13:48</span></td><td>南风</td><td>${tag("后台预存")}</td><td class="money">+500</td><td>620</td><td>客服备注：线下补偿</td></tr>
  `)
}

function marketingPage() {
  return configPage("营销中心", "优惠券、活动、公告、播报轮播、广告位", [
    ["活动名称", "周末开黑券"], ["优惠券门槛", "满 500 减 30 猫粮"], ["公告标题", "桂圆电竞热门打手在线"], ["播报内容", "老板_273841 刚刚下单三角洲小时陪"]
  ], true)
}

function genericPage() {
  const mod = activeModule()
  return tableLayout(state.sub, `${mod.name}模块配置和数据管理，包含筛选、列表、详情、编辑弹窗`, `
    <input placeholder="关键词/编号/名称" />
    <select><option>全部状态</option><option>启用</option><option>停用</option><option>待审核</option></select>
    <button class="outline-btn" data-action="查询">查询</button>
    <button class="outline-btn" data-action="批量操作">批量操作</button>
  `, ["编号", "名称", "归属模块", "状态", "更新时间", "操作"], [1, 2, 3, 4].map((num) => `
    <tr>
      <td><strong>${mod.id.toUpperCase()}-${String(num).padStart(3, "0")}</strong><span>自动编号</span></td>
      <td>${state.sub}配置 ${num}</td>
      <td>${mod.name}</td>
      <td>${tag(num % 3 === 0 ? "待审核" : "启用")}</td>
      <td>2026-07-06 14:${20 + num}</td>
      <td><button class="text-btn" data-generic-detail="${num}">编辑</button></td>
    </tr>
  `).join(""))
}

function configPage(title, desc, fields, upload) {
  setTimeout(bindContentEvents)
  return `
    <section class="panel" style="margin-top:16px">
      <div class="panel-head"><div><strong>${title}</strong><span>${desc}</span></div><button class="primary-btn" data-action="保存">保存</button></div>
      <form class="form-grid">
        ${fields.map(([label, value]) => `<label class="${label.length > 7 ? "wide" : ""}"><span>${label}</span><input value="${esc(value)}" /></label>`).join("")}
        ${upload ? `<label class="wide"><span>图片上传</span><div class="upload-box">拖拽图片到这里，或点击选择文件</div></label>` : ""}
      </form>
    </section>
  `
}

function bindContentEvents() {
  document.querySelectorAll("[data-drawer]").forEach((el) => el.onclick = () => openDrawer(el.dataset.drawer, Number(el.dataset.index)))
  document.querySelectorAll("[data-generic-detail]").forEach((el) => el.onclick = () => openActionDialog("编辑"))
  document.querySelectorAll("[data-chat]").forEach((el) => el.onclick = () => {
    state.chat = Number(el.dataset.chat)
    $("content").innerHTML = chatPage()
  })
}

function openActionDialog(action) {
  if (action === "深色模式") {
    document.body.classList.toggle("dark-preview")
  }
  const titleMap = {
    新增: `新增${state.sub}`,
    新增商品: "新增商品",
    查询: "高级筛选",
    导出: "导出数据",
    保存: "保存配置",
    刷新: "刷新数据",
    数据口径: "数据口径说明",
    查看明细: "运营明细",
    后台加猫粮: "后台加猫粮",
    批量配置: "批量配置打手",
    批量操作: "批量操作",
    发送: "发送消息",
    编辑: `编辑${state.sub}`,
    全屏: "全屏预览",
    消息通知: "消息通知",
    主题配置: "主题配置",
    深色模式: "深色模式",
    账号菜单: "账号菜单",
    日期筛选: "日期筛选"
  }
  const title = titleMap[action] || action || "操作"
  $("modalSub").textContent = `${activeModule().name} / ${state.sub}`
  $("modalTitle").textContent = title
  $("modalBody").innerHTML = modalContent(action)
  $("modalMask").classList.remove("hidden")
  $("modal").classList.remove("hidden")
}

function modalContent(action) {
  if (action === "数据口径") {
    return `<div class="dialog-note">
      <strong>统计口径</strong><br>
      营收按实际支付猫粮折算展示；订单数按创建时间统计；毛利包含平台抽成、差价和人工调整；退款会在完成售后后冲减对应日期数据。
    </div>`
  }
  if (action === "导出" || action.includes("导出")) {
    return `<div class="modal-form">
      <label><span>导出范围</span><select><option>当前筛选结果</option><option>全部数据</option></select></label>
      <label><span>文件格式</span><select><option>Excel .xlsx</option><option>CSV</option></select></label>
      <label><span>时间范围</span><input value="2026-07-06 ~ 2026-07-06" /></label>
      <label><span>字段模板</span><select><option>标准字段</option><option>财务字段</option><option>客服字段</option></select></label>
      <label class="wide"><span>导出备注</span><textarea placeholder="用于后台操作日志记录"></textarea></label>
    </div>`
  }
  if (action === "查询") {
    return `<div class="modal-form">
      <label><span>关键词</span><input placeholder="编号、名称、用户ID、打手ID" /></label>
      <label><span>状态</span><select><option>全部状态</option><option>启用</option><option>待审核</option><option>已完成</option></select></label>
      <label><span>时间开始</span><input value="2026-07-06" /></label>
      <label><span>时间结束</span><input value="2026-07-06" /></label>
      <label class="wide"><span>高级条件</span><textarea placeholder="等级、游戏、客服、订单类型等条件"></textarea></label>
    </div>`
  }
  if (action === "后台加猫粮") {
    return `<div class="modal-form">
      <label><span>用户ID</span><input placeholder="6位用户ID" /></label>
      <label><span>猫粮数量</span><input type="number" placeholder="例如 500" /></label>
      <label class="wide"><span>来源备注</span><textarea placeholder="客服必须填写来源，比如后台预存、活动补发、售后补偿"></textarea></label>
    </div>`
  }
  if (action === "编辑规则") {
    return `<div class="modal-form">
      <label><span>邀请功能</span><select><option>开启</option><option>关闭</option></select></label>
      <label><span>提成比例</span><input type="number" value="5" /></label>
      <label><span>有效月份</span><input type="number" value="1" /></label>
      <label><span>计算口径</span><select><option>按实付猫粮</option><option>按订单原价</option></select></label>
      <label class="wide"><span>首页文案</span><textarea>新用户填你的ID，首月返 5%</textarea></label>
    </div>`
  }
  if (action === "批量配置") {
    return `<div class="modal-form">
      <label><span>选择等级</span><select><option>全部等级</option><option>化神期</option><option>元婴期</option><option>金丹期</option><option>筑基期</option></select></label>
      <label><span>收入占比</span><input type="number" value="80" /></label>
      <label><span>在线接单</span><select><option>不改变</option><option>开启</option><option>关闭</option></select></label>
      <label><span>应用范围</span><select><option>当前筛选打手</option><option>全部打手</option></select></label>
      <label class="wide"><span>操作备注</span><textarea placeholder="记录本次批量调整原因"></textarea></label>
    </div>`
  }
  if (action === "刷新") {
    return `<div class="dialog-note">系统将重新拉取统计、订单、客服在线、打手在线和财务待办数据。预览版使用模拟数据展示刷新流程。</div>`
  }
  if (action === "消息通知") {
    return `<table class="data-table" style="margin-top:0">
      <tbody>
        <tr><td><strong>新订单提醒</strong><span>GY20260706002 等待接单</span></td><td>${tag("待处理")}</td></tr>
        <tr><td><strong>提现审核</strong><span>星河申请提现 800 猫粮</span></td><td>${tag("待审核")}</td></tr>
        <tr><td><strong>售后工单</strong><span>橘子申请退半小时猫粮</span></td><td>${tag("处理中")}</td></tr>
      </tbody>
    </table>`
  }
  if (action === "主题配置") {
    return `<div class="modal-form">
      <label><span>主题色</span><select><option>演示站蓝</option><option>桂圆紫</option><option>深色电竞</option></select></label>
      <label><span>导航模式</span><select><option>双栏导航</option><option>单栏导航</option><option>顶部导航</option></select></label>
      <label><span>卡片圆角</span><input value="12px" /></label>
      <label><span>表格密度</span><select><option>默认</option><option>紧凑</option><option>宽松</option></select></label>
    </div>`
  }
  if (action === "账号菜单") {
    return `<table class="data-table" style="margin-top:0"><tbody>
      <tr><td><strong>演示管理员</strong><span>owner@example.com</span></td><td>${tag("超级管理员")}</td></tr>
      <tr><td>修改头像</td><td><button class="text-btn">选择图片</button></td></tr>
      <tr><td>修改密码</td><td><button class="text-btn">打开</button></td></tr>
      <tr><td>退出登录</td><td><button class="text-btn">退出</button></td></tr>
    </tbody></table>`
  }
  if (action === "全屏") {
    return `<div class="dialog-note">演示站的全屏按钮会进入浏览器全屏模式。预览版这里展示全屏操作弹窗，真实后台接入时会调用浏览器 Fullscreen API。</div>`
  }
  if (action === "日期筛选") {
    return `<div class="modal-form">
      <label><span>快捷时间</span><select><option>今日</option><option>昨日</option><option>近 7 天</option><option>近 30 天</option><option>本月</option></select></label>
      <label><span>对比方式</span><select><option>环比</option><option>同比</option><option>不对比</option></select></label>
      <label><span>开始日期</span><input value="2026-07-06" /></label>
      <label><span>结束日期</span><input value="2026-07-06" /></label>
    </div>`
  }
  if (action === "发送") {
    return `<div class="modal-form">
      <label class="wide"><span>客服消息</span><textarea>已收到，我这边马上为您处理。</textarea></label>
      <label><span>快捷话术</span><select><option>订单跟进</option><option>售后确认</option><option>退款说明</option></select></label>
      <label><span>同步记录</span><select><option>保存到群聊记录</option><option>仅发送</option></select></label>
    </div>`
  }
  return `<div class="modal-form">
    <label><span>名称</span><input value="${esc(state.sub)}" /></label>
    <label><span>状态</span><select><option>启用</option><option>停用</option><option>待审核</option></select></label>
    <label><span>排序</span><input type="number" value="1" /></label>
    <label><span>归属模块</span><input value="${esc(activeModule().name)}" /></label>
    <label class="wide"><span>配置内容</span><textarea placeholder="这里填写二级页面对应的详细配置"></textarea></label>
    <label class="wide"><span>图片/附件</span><div class="upload-box">拖拽上传或点击选择文件</div></label>
  </div>`
}

function openDrawer(type, index) {
  const source = {
    order: orders,
    user: users,
    thug: thugs,
    referral: referrals,
    goods: goods.map((g, i) => ({ id: `G${i + 1}`, name: g[0], category: g[1], price: g[2], specs: g[3] }))
  }[type] || []
  const item = source[index] || {}
  $("drawerType").textContent = type === "order" ? "订单详情" : type === "user" ? "用户详情" : type === "thug" ? "打手详情" : type === "referral" ? "邀请详情" : "商品详情"
  $("drawerTitle").textContent = item.name || item.id || item.item || "记录详情"
  $("drawerBody").innerHTML = Object.entries(item).map(([k, v]) => `<div class="detail-row"><label>${esc(k)}</label><div>${esc(v)}</div></div>`).join("") + `<div class="timeline"><div>创建记录</div><div>后台审核/配置</div><div>同步到小程序、客服后台</div></div>`
  $("drawer").classList.remove("hidden")
  $("drawerMask").classList.remove("hidden")
}

function toast() {
  $("toast").classList.remove("hidden")
  clearTimeout(window.toastTimer)
  window.toastTimer = setTimeout(() => $("toast").classList.add("hidden"), 1300)
}

$("moduleRail").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-module]")
  if (!btn) return
  state.module = btn.dataset.module
  state.sub = activeModule().subs[0]
  if (!state.tabs.includes(state.sub)) state.tabs.unshift(state.sub)
  render()
})

$("subNav").addEventListener("click", (event) => {
  const btn = event.target.closest("[data-sub]")
  if (!btn) return
  state.sub = btn.dataset.sub
  if (!state.tabs.includes(state.sub)) state.tabs.unshift(state.sub)
  render()
})

$("tabBar").addEventListener("click", (event) => {
  const close = event.target.closest("[data-tab-close]")
  if (close) {
    event.stopPropagation()
    const tab = close.dataset.tabClose
    if (state.tabs.length > 1) {
      state.tabs = state.tabs.filter((item) => item !== tab)
      if (state.sub === tab) {
        state.sub = state.tabs[0]
        const mod = modules.find((item) => item.subs.includes(state.sub))
        if (mod) state.module = mod.id
      }
      render()
    }
    return
  }
  const btn = event.target.closest("[data-tab]")
  if (!btn) return
  state.sub = btn.dataset.tab
  const mod = modules.find((item) => item.subs.includes(state.sub))
  if (mod) state.module = mod.id
  render()
})

$("closeDrawer").onclick = () => {
  $("drawer").classList.add("hidden")
  $("drawerMask").classList.add("hidden")
}
$("drawerMask").onclick = $("closeDrawer").onclick
$("closeModal").onclick = closeModal
$("cancelModal").onclick = closeModal
$("modalMask").onclick = closeModal
$("confirmModal").onclick = () => {
  closeModal()
  toast()
}

document.addEventListener("click", (event) => {
  const collapse = event.target.closest("[data-collapse-nav]")
  if (collapse) {
    document.querySelector(".admin-app").classList.toggle("nav-collapsed")
    return
  }
  const timeButton = event.target.closest(".time-tabs button")
  if (timeButton) {
    timeButton.parentElement.querySelectorAll("button").forEach((btn) => btn.classList.remove("active"))
    timeButton.classList.add("active")
    openActionDialog("日期筛选")
    return
  }
  const button = event.target.closest("button")
  if (!button) return
  if (button.dataset.action) {
    openActionDialog(button.dataset.action || button.textContent.trim())
    return
  }
  if (
    button.id === "closeDrawer"
    || button.id === "closeModal"
    || button.id === "cancelModal"
    || button.id === "confirmModal"
    || button.dataset.module
    || button.dataset.sub
    || button.dataset.tab
    || button.dataset.drawer
    || button.dataset.chat
    || button.dataset.genericDetail
    || button.dataset.collapseNav !== undefined
  ) return
  const label = button.textContent.trim() || button.getAttribute("aria-label") || "操作"
  openActionDialog(label)
})

document.querySelector(".search-box input").addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return
  const value = event.target.value.trim()
  openActionDialog(value ? `搜索：${value}` : "搜索")
})

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault()
    document.querySelector(".search-box input").focus()
  }
  if (event.key === "Escape") {
    closeModal()
    $("closeDrawer").click()
  }
})

function closeModal() {
  $("modal").classList.add("hidden")
  $("modalMask").classList.add("hidden")
}

render()
