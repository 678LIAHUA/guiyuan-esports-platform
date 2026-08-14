const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function loadEnvFile(filePath = path.join(__dirname, ".env")) {
  if (!fs.existsSync(filePath)) return;
  fs.readFileSync(filePath, "utf8").split(/\r?\n/).forEach((line) => {
    const text = line.trim();
    if (!text || text.startsWith("#")) return;
    const separator = text.indexOf("=");
    if (separator < 1) return;
    const key = text.slice(0, separator).trim();
    let value = text.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  });
}

loadEnvFile();

const PORT = Number(process.env.PORT || 8787);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const DATA_DIR = path.join(ROOT, "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");
const miniCatalog = require(path.join(ROOT, "data", "catalog"));
const BRAND_NAME = "桂圆电竞";
const TOKEN_NAME = "猫粮";
const TOKEN_RATE = 10;
const TOKEN_CURRENCY = "cat_food";
const PAY_BASE_URL = String(process.env.PAY_BASE_URL || `http://127.0.0.1:${PORT}`).replace(/\/$/, "");
const DEFAULT_WECHAT_MINI_APPID = String(process.env.WECHAT_MINI_APPID || "").trim();
const GLOBAL_PLAYER_WORKBENCH_SECRET = String(process.env.GLOBAL_PLAYER_WORKBENCH_SECRET || "").trim();
const DEFAULT_RECHARGE_TIERS = [10, 30, 50, 100, 200];
const DEFAULT_PLAYER_LEVELS = ["荣耀王者", "王牌 12 星", "金牌主持", "宗师"];
const REVIEW_DIMENSIONS = [
  { key: "skill", name: "技术水平" },
  { key: "emotion", name: "情绪价值" },
  { key: "voice", name: "声音听感" },
  { key: "pressure", name: "抗压能力" },
  { key: "service", name: "店内表现" }
];
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
const DEFAULT_QUICK_MATCH_CONFIG = {
  skills: [
    {
      id: "delta",
      name: "三角洲",
      price: 0,
      visible: true,
      sort: 1,
      plays: [
        { id: "space", name: "航天", price: 40, visible: true, sort: 1 },
        { id: "prison", name: "监狱", price: 30, visible: true, sort: 2 },
        { id: "dam", name: "大坝", price: 10, visible: true, sort: 3 },
        { id: "bakesh", name: "巴克什", price: 30, visible: true, sort: 4 },
        { id: "longbow", name: "长弓", price: 20, visible: true, sort: 5 },
        { id: "az3", name: "AZ3", price: 0, visible: true, sort: 6 }
      ]
    },
    { id: "honor", name: "王者荣耀", price: 0, visible: true, sort: 2, plays: [{ id: "rank", name: "排位", price: 0, visible: true, sort: 1 }] },
    { id: "voice_chat", name: "唠嗑", price: 0, visible: true, sort: 3, plays: [{ id: "voice", name: "语音陪聊", price: 0, visible: true, sort: 1 }] }
  ],
  services: [
    { id: "rush", name: "技术猛攻单", price: 60, visible: true, sort: 1 },
    { id: "loot", name: "技术物资单", price: 90, visible: true, sort: 2 }
  ],
  genders: [
    { id: "any", name: "不限", price: 0, visible: true, sort: 1 },
    { id: "male", name: "男", price: 0, visible: true, sort: 2 },
    { id: "female", name: "女", price: 30, visible: true, sort: 3 }
  ],
  types: [
    { id: "single", name: "单陪", price: 0, multiplier: 1, visible: true, sort: 1 },
    { id: "double", name: "双陪", price: 0, multiplier: 2, visible: true, sort: 2 }
  ]
};
const DEFAULT_REVENUE_CONFIGS = [
  { id: "config_1", name: "配置一", playerRate: 70 },
  { id: "config_2", name: "配置二", playerRate: 75 }
];
const DEFAULT_MEMBER_LEVELS = [
  { id: "silver", name: "白银会员", threshold: 0, discount: 100, imageUrl: "/assets/member/silver.jpg", benefits: "基础会员身份、专属成长值、活动优先提醒" },
  { id: "gold", name: "黄金会员", threshold: 1000, discount: 98, imageUrl: "/assets/member/gold.jpg", benefits: "98% 支付扣款、客服优先响应、专属会员卡" },
  { id: "platinum", name: "铂金会员", threshold: 5000, discount: 95, imageUrl: "/assets/member/platinum.jpg", benefits: "95% 支付扣款、热门打手优先推荐、专属活动资格" },
  { id: "green_diamond", name: "绿钻会员", threshold: 12000, discount: 93, imageUrl: "/assets/member/green-diamond.jpg", benefits: "93% 支付扣款、订单优先派单、专属客服跟进" },
  { id: "blue_diamond", name: "蓝钻会员", threshold: 30000, discount: 90, imageUrl: "/assets/member/blue-diamond.jpg", benefits: "90% 支付扣款、高阶打手优先匹配、生日福利" },
  { id: "pink_diamond", name: "粉钻会员", threshold: 60000, discount: 88, imageUrl: "/assets/member/pink-diamond.jpg", benefits: "88% 支付扣款、热门档期优先锁定、专属活动资格" },
  { id: "emerald", name: "翡翠会员", threshold: 100000, discount: 85, imageUrl: "/assets/member/emerald.jpg", benefits: "85% 支付扣款、专属客服跟进、活动优先提醒" },
  { id: "black_gold", name: "黑金会员", threshold: 180000, discount: 82, imageUrl: "/assets/member/black-gold.jpg", benefits: "82% 支付扣款、尊享全部权益、专属管家服务" }
];
const DEFAULT_GIFT_CATALOG = [
  { id: "chickenLeg", name: "鸡腿", price: 10, imageUrl: "/assets/gift/chicken-leg.png" },
  { id: "ostrichLeg", name: "鸵鸟腿", price: 20, imageUrl: "/assets/gift/ostrich-leg.png" },
  { id: "cola", name: "可乐", price: 30, imageUrl: "/assets/gift/cola.png" },
  { id: "milkTea", name: "奶茶", price: 50, imageUrl: "/assets/gift/milk-tea.png" },
  { id: "kfc", name: "KFC", price: 88, imageUrl: "/assets/gift/kfc.png" },
  { id: "roseBouquet", name: "玫瑰花束", price: 188, imageUrl: "/assets/gift/rose-bouquet.png" },
  { id: "africaHeart", name: "非洲之心", price: 520, imageUrl: "/assets/gift/africa-heart.png" },
  { id: "oceanTear", name: "海洋之泪", price: 999, imageUrl: "/assets/gift/ocean-tear.png" },
  { id: "sportsCar", name: "跑车", price: 1314, imageUrl: "/assets/gift/sports-car.png" },
  { id: "cheerDuck", name: "加油鸭", price: 66, imageUrl: "/assets/gift/cheer-duck.png" },
  { id: "fireworks", name: "烟花", price: 288, imageUrl: "/assets/gift/fireworks.png" },
  { id: "guiyuanOne", name: "桂圆1号", price: 1888, imageUrl: "/assets/gift/guiyuan-one.png" }
];

const sessions = new Map();

const bootstrapStaffUsername = String(process.env.BOOTSTRAP_STAFF_USERNAME || "").trim();
const bootstrapStaffPassword = String(process.env.BOOTSTRAP_STAFF_PASSWORD || "").trim();
const bootstrapAdminUsername = String(process.env.BOOTSTRAP_ADMIN_USERNAME || "").trim();
const bootstrapAdminPassword = String(process.env.BOOTSTRAP_ADMIN_PASSWORD || "").trim();

const staff = bootstrapStaffUsername && bootstrapStaffPassword ? [
  { id: "support", name: "客服", role: "support", username: bootstrapStaffUsername, password: bootstrapStaffPassword, avatar: "" }
] : [];

const owners = bootstrapAdminUsername && bootstrapAdminPassword ? [
  { id: "owner", name: "总后台", role: "owner", username: bootstrapAdminUsername, password: bootstrapAdminPassword, avatar: "" }
] : [];

function displayRmbFromToken(value) {
  const amount = Number((Number(value || 0) / TOKEN_RATE).toFixed(2));
  return `￥${Number.isInteger(amount) ? amount.toFixed(0) : amount.toString()}`;
}

const seed = {
  sessions: [
    {
      id: "group-main",
      title: "陪玩咨询群",
      channel: "小程序群聊",
      userName: "桂圆电竞用户",
      userId: "user_100001",
      status: "open",
      priority: "high",
      assignedTo: "xiaoyue",
      tags: ["新客", "咨询档期"],
      contact: "小程序内联系",
      remark: "偏好甜音，优先推荐王者可上分陪玩。",
      unreadStaff: 2,
      unreadUser: 0,
      firstSeenAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
      lastUserMessageAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      lastStaffReplyAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      lastMessageAt: new Date().toISOString()
    }
  ],
  messages: [
    {
      id: "m-welcome",
      sessionId: "group-main",
      senderType: "system",
      senderName: "系统",
      type: "text",
      content: "用户进入客服群聊。客服可发送文字、服务详情卡片，并创建工单跟进。",
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
    },
    {
      id: "m-user-1",
      sessionId: "group-main",
      senderType: "user",
      senderName: "用户",
      type: "text",
      content: "想约今晚王者陪玩，有没有甜音一点的？",
      createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString()
    },
    {
      id: "m-card-1",
      sessionId: "group-main",
      senderType: "staff",
      senderName: "小月",
      type: "card",
      content: `推荐 Luna：甜系全能陪玩，擅长中辅联动，今晚 20:00 / 22:00 可约，${displayRmbFromToken(680)}/小时。`,
      card: {
        title: "Luna | 甜系全能陪玩",
        desc: "王者荣耀 · 荣耀王者 · 甜音 / 上分 / 不压力",
        price: `${displayRmbFromToken(680)}/小时`
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
    },
    {
      id: "m-note-1",
      sessionId: "group-main",
      senderType: "staff",
      senderName: "小月",
      type: "note",
      visibility: "internal",
      content: "用户在意声音风格，先不要推刚枪类陪玩。",
      card: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString()
    }
  ],
  tickets: [
    {
      id: "TK1001",
      sessionId: "group-main",
      title: "今晚王者档期确认",
      status: "processing",
      priority: "high",
      owner: "小月",
      createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString()
    }
  ],
  orders: [
    {
      id: "P20260617001",
      userName: "体验用户",
      userPhone: "小程序内联系",
      playerName: "Luna",
      gameName: "王者荣耀",
      serviceName: "甜系全能陪玩",
      platform: "三角洲",
      unitPrice: 68,
      duration: 1,
      time: "今天 22:00",
      amount: 68,
      status: "待确认",
      source: "小程序",
      assignee: "小月",
      note: "偏好甜音，先确认档期。",
      contact: "小程序内联系",
      createdAt: "2026-06-17 22:20"
    },
    {
      id: "P20260617002",
      userName: "小鲸",
      userPhone: "小程序内联系",
      playerName: "Mika",
      gameName: "和平精英",
      serviceName: "高分路人王",
      platform: "三角洲",
      unitPrice: 78,
      duration: 2,
      time: "今天 23:00",
      amount: 156,
      status: "已确认",
      source: "小程序",
      assignee: "宁宁",
      note: "要复盘，语气轻一点。",
      contact: "小程序内联系",
      createdAt: "2026-06-17 21:42"
    },
    {
      id: "P20260617003",
      userName: "阿树",
      userPhone: "小程序内联系",
      playerName: "Nana",
      gameName: "语音聊天",
      serviceName: "治愈聊天搭子",
      platform: "微信语音",
      unitPrice: 48,
      duration: 1.5,
      time: "明天 00:30",
      amount: 72,
      status: "待确认",
      source: "小程序",
      assignee: "小月",
      note: "睡前陪聊，不接敏感内容。",
      contact: "小程序内联系",
      createdAt: "2026-06-17 20:18"
    },
    {
      id: "P20260616004",
      userName: "森森",
      userPhone: "小程序内联系",
      playerName: "Yoyo",
      gameName: "英雄联盟手游",
      serviceName: "峡谷气氛组",
      platform: "三角洲",
      unitPrice: 58,
      duration: 4,
      time: "明天 13:00",
      amount: 232,
      status: "已完成",
      source: "小程序",
      assignee: "宁宁",
      note: "老客，优先安排。",
      contact: "小程序内联系",
      createdAt: "2026-06-16 19:05"
    }
  ],
  quickReplies: [
    "您好，这边客服在线，请问想咨询哪位陪玩或哪个游戏？",
    "可以的，我先帮您确认档期；确认后会在订单里更新状态。",
    "平台内沟通和下单更安全，请不要私下转账或交换敏感信息。",
    "如果您有指定时间、游戏段位、声音风格，可以直接发给我。"
  ],
  serviceCards: [
    {
      id: "luna",
      title: "Luna | 甜系全能陪玩",
      desc: "王者荣耀 · 荣耀王者 · 甜音 / 上分 / 不压力",
      price: `${displayRmbFromToken(680)}/小时`
    },
    {
      id: "mika",
      title: "Mika | 高分路人王",
      desc: "和平精英 · 王牌 12 星 · 刚枪 / 报点 / 复盘",
      price: `${displayRmbFromToken(780)}/小时`
    },
    {
      id: "nana",
      title: "Nana | 治愈聊天搭子",
      desc: "语音聊天 · 温柔 / 哄睡 / 陪聊",
      price: `${displayRmbFromToken(480)}/小时`
    }
  ],
  settings: {
    shopName: "桂圆电竞",
    businessHours: "12:00 - 02:00",
    slaMinutes: 5,
    autoGreeting: "欢迎来到桂圆电竞客服群，请留下游戏、时间和偏好，客服会尽快回复。",
    customerServiceQrUrl: "/assets/guiyuan-logo.jpg",
    offlineMessage: "当前客服可能在接待中，请先留言，稍后会继续跟进。",
    autoAssign: true,
    notifySound: true,
    safetyNotice: true,
    orderLock: false,
    quickMatchBackgroundUrl: "",
    auditMode: true,
    paymentMode: "service_account_wechat",
    virtualPaymentOfferId: "",
    virtualPaymentAppKey: "",
    virtualPaymentMode: "short_series_coin",
    virtualPaymentEnv: "release",
    virtualPaymentCurrencyType: "CNY",
    virtualPaymentPlatform: "android",
    rechargeTiers: DEFAULT_RECHARGE_TIERS,
    defaultRevenueConfigId: "config_1",
    revenueConfigs: DEFAULT_REVENUE_CONFIGS,
    memberLevels: DEFAULT_MEMBER_LEVELS,
    giftCatalog: DEFAULT_GIFT_CATALOG,
    referralEnabled: true,
    referralCommissionRate: 5,
    referralCommissionMonths: 1
  }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeOrderCategories(value = []) {
  const source = Array.isArray(value) && value.length ? value : clone(miniCatalog.orderCategories || []);
  return source.map((item, index) => ({
    id: String(item.id || `cat_${index + 1}`).trim(),
    gameId: String(item.gameId || "").trim(),
    name: String(item.name || "新分类").trim(),
    sort: Number(item.sort || index + 1),
    visible: item.visible !== false
  })).filter((item) => item.id && item.name);
}

function normalizePriceTiers(value = [], fallbackPrice = 0) {
  const source = Array.isArray(value) && value.length ? value : [{ id: "default", name: "默认价位", price: fallbackPrice, desc: "" }];
  return source.map((item, index) => ({
    id: String(item.id || `tier_${index + 1}`).trim(),
    name: String(item.name || `价位${index + 1}`).trim(),
    price: Number(item.price || fallbackPrice || 0),
    desc: String(item.desc || item.note || "").trim()
  })).filter((item) => item.id && item.name && Number.isFinite(item.price));
}

function normalizeOrderItems(value = []) {
  const source = Array.isArray(value) && value.length ? value : clone(miniCatalog.orderItems || []);
  return source.map((item, index) => {
    const basePrice = Number(item.price || item.amount || 0);
    const priceTiers = normalizePriceTiers(item.priceTiers, basePrice);
    const mainImageUrl = String(item.mainImageUrl || item.detailImageUrl || item.imageUrl || "/assets/entry/entry-fun.png").trim();
    return {
      id: String(item.id || `order_${index + 1}`).trim(),
      gameId: String(item.gameId || "delta").trim(),
      categoryId: String(item.categoryId || "fun").trim(),
      title: String(item.title || "新单子").trim(),
      desc: String(item.desc || "").trim(),
      note: String(item.note || "").trim(),
      price: Number(basePrice || priceTiers[0]?.price || 0),
      orderMode: ["random_hour", "fixed_tier"].includes(item.orderMode) ? item.orderMode : "fixed_tier",
      orderCount: Number(item.orderCount || 0),
      tag: String(item.tag || "上架").trim(),
      tags: Array.isArray(item.tags) ? item.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
      mainImageUrl,
      imageUrl: mainImageUrl,
      detailImageUrl: mainImageUrl,
      detailImageWidth: String(item.detailImageWidth || "100%").trim(),
      detailDesc: String(item.detailDesc || "").trim(),
      priceTiers,
      sort: Number(item.sort || index + 1),
      visible: item.visible !== false
    };
  }).filter((item) => item.id && item.title);
}

function stableConfigId(value, prefix, index) {
  const raw = String(value || "").trim();
  const safe = raw.replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "");
  return safe || `${prefix}_${index + 1}`;
}

function normalizeLevelList(levels = [], prefix = "level") {
  return (Array.isArray(levels) ? levels : [])
    .map((level, index) => ({
      id: stableConfigId(level.id || level.name, prefix, index),
      name: String(level.name || `等级${index + 1}`).trim(),
      price: Math.max(0, Number(level.price || 0)),
      hint: String(level.hint || level.desc || "").trim(),
      sort: Number(level.sort || index + 1),
      visible: level.visible !== false
    }))
    .filter((level) => level.id && level.name)
    .sort((left, right) => Number(left.sort || 0) - Number(right.sort || 0));
}

function normalizePlayerLevelGroups(value = []) {
  const source = Array.isArray(value) && value.length ? value : clone(DEFAULT_PLAYER_LEVEL_GROUPS);
  const groups = source.map((group, index) => ({
    id: stableConfigId(group.id || group.name, "grade", index),
    name: String(group.name || `一级等级${index + 1}`).trim(),
    sort: Number(group.sort || index + 1),
    visible: group.visible !== false,
    levels: normalizeLevelList(group.levels, stableConfigId(group.id || group.name, "grade", index))
  })).filter((group) => group.id && group.name);
  return groups.map((group) => ({
    ...group,
    levels: group.levels.length ? group.levels : normalizeLevelList([{ id: "default", name: "默认等级", price: 0 }], group.id)
  })).sort((left, right) => Number(left.sort || 0) - Number(right.sort || 0));
}

function normalizeSkillLevelGroups(value = [], skillId = "skill") {
  if (!Array.isArray(value) || !value.length) return [];
  return value.map((group, index) => {
    const groupId = stableConfigId(group.id || group.name, `${skillId}_grade`, index);
    return {
      id: groupId,
      name: String(group.name || `level group ${index + 1}`).trim(),
      sort: Number(group.sort || index + 1),
      visible: group.visible !== false,
      levels: normalizeLevelList(group.levels, groupId)
    };
  }).filter((group) => group.id && group.name && group.levels.length)
    .sort((left, right) => Number(left.sort || 0) - Number(right.sort || 0));
}

function normalizeQuickOption(item = {}, prefix = "option", index = 0) {
  return {
    id: stableConfigId(item.id || item.name, prefix, index),
    name: String(item.name || `选项${index + 1}`).trim(),
    price: Math.max(0, Number(item.price || 0)),
    multiplier: Math.max(0, Number(item.multiplier || 1)),
    hint: String(item.hint || item.desc || "").trim(),
    sort: Number(item.sort || index + 1),
    visible: item.visible !== false
  };
}

function normalizeQuickMatchConfig(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const defaults = clone(DEFAULT_QUICK_MATCH_CONFIG);
  const savedSkills = Array.isArray(source.skills) && source.skills.length ? source.skills : defaults.skills;
  const quickMatchConfig = {
    skills: savedSkills.map((skill, index) => {
      const normalized = normalizeQuickOption(skill, "skill", index);
      const plays = Array.isArray(skill.plays) && skill.plays.length
        ? skill.plays
        : (Array.isArray(source.plays) && index === 0 ? source.plays : []);
      return {
        ...normalized,
        levelGroupIds: Array.isArray(skill.levelGroupIds)
          ? skill.levelGroupIds.map((item) => String(item || "").trim()).filter(Boolean)
          : [],
        levelGroups: normalizeSkillLevelGroups(skill.levelGroups, normalized.id),
        plays: (plays.length ? plays : [{ id: "default", name: "默认玩法", price: 0 }])
          .map((play, playIndex) => normalizeQuickOption(play, `${normalized.id}_play`, playIndex))
          .filter((play) => play.id && play.name)
      };
    }).filter((skill) => skill.id && skill.name),
    services: (Array.isArray(source.services) && source.services.length ? source.services : defaults.services)
      .map((item, index) => normalizeQuickOption(item, "service", index))
      .filter((item) => item.id && item.name),
    genders: (Array.isArray(source.genders) && source.genders.length ? source.genders : defaults.genders)
      .map((item, index) => normalizeQuickOption(item, "gender", index))
      .filter((item) => item.id && item.name),
    types: (Array.isArray(source.types) && source.types.length ? source.types : defaults.types)
      .map((item, index) => normalizeQuickOption(item, "type", index))
      .filter((item) => item.id && item.name)
  };
  if (!quickMatchConfig.skills.length) quickMatchConfig.skills = normalizeQuickMatchConfig(defaults).skills;
  return quickMatchConfig;
}

function levelGroupsForSkill(playerLevelGroups = [], quickMatchConfig = {}, skillId = "") {
  const skill = (quickMatchConfig.skills || []).find((item) => item.id === skillId) || {};
  if (Array.isArray(skill.levelGroups) && skill.levelGroups.length) return skill.levelGroups;
  const ids = Array.isArray(skill.levelGroupIds) ? skill.levelGroupIds.map(String).filter(Boolean) : [];
  const linked = ids.length ? playerLevelGroups.filter((group) => ids.includes(String(group.id))) : [];
  return linked.length ? linked : playerLevelGroups;
}

function findPlayerLevel(levelGroups, dimensionId, levelIdOrName) {
  const group = (levelGroups || []).find((item) => item.id === dimensionId);
  return (group?.levels || []).find((item) => item.id === levelIdOrName || item.name === levelIdOrName) || null;
}

function normalizePlayerLevelId(levelGroups, dimensionId, value, fallbackName = "") {
  const group = (levelGroups || []).find((item) => item.id === dimensionId);
  if (!group || !Array.isArray(group.levels) || !group.levels.length) return "";
  const found = group.levels.find((item) => item.id === value || item.name === value || item.name === fallbackName);
  return (found || group.levels[0]).id;
}

function normalizeCatalog(catalog = {}) {
  const hasStoredPlayers = Array.isArray(catalog.players) && catalog.players.length;
  const oldCurrency = catalog.currency || catalog.brand?.currency || (hasStoredPlayers ? "" : TOKEN_CURRENCY);
  const defaultBanners = [
    { id: "banner_1", imageUrl: "/assets/banner-1.jpg", title: "首页轮播 1", sort: 1, visible: true },
    { id: "banner_2", imageUrl: "/assets/banner-2.jpg", title: "首页轮播 2", sort: 2, visible: true },
    { id: "banner_3", imageUrl: "/assets/banner-3.jpg", title: "首页轮播 3", sort: 3, visible: true }
  ];
  const banners = Array.isArray(catalog.banners) && catalog.banners.length ? catalog.banners : defaultBanners;
  const games = Array.isArray(catalog.games) && catalog.games.length ? catalog.games : clone(miniCatalog.games);
  const packages = Array.isArray(catalog.packages) && catalog.packages.length ? catalog.packages : clone(miniCatalog.packages);
  const players = Array.isArray(catalog.players) && catalog.players.length ? catalog.players : clone(miniCatalog.players);
  const notices = Array.isArray(catalog.notices) && catalog.notices.length ? catalog.notices : clone(miniCatalog.notices);
  const orderCategories = normalizeOrderCategories(catalog.orderCategories);
  const orderItems = normalizeOrderItems(catalog.orderItems);
  const playerLevelGroups = normalizePlayerLevelGroups(catalog.playerLevelGroups);
  const quickMatchConfig = normalizeQuickMatchConfig(catalog.quickMatchConfig);
  const brand = {
    ...(miniCatalog.brand || {}),
    ...(catalog.brand || {}),
    name: BRAND_NAME,
    logo: "/assets/guiyuan-logo.jpg",
    tokenName: TOKEN_NAME,
    tokenIcon: "/assets/cat-food.jpg",
    tokenRate: TOKEN_RATE,
    currency: TOKEN_CURRENCY
  };
  if (!games.some((item) => item.id === "all")) games.unshift({ id: "all", name: "全部" });
  (miniCatalog.games || []).forEach((game) => {
    if (game.id && !games.some((item) => item.id === game.id)) games.push({ ...game });
  });
  games.forEach((game) => {
    const fallbackGame = (miniCatalog.games || []).find((item) => item.id === game.id) || {};
    game.id = String(game.id || makeId("game_")).trim();
    game.name = String(game.name || "未命名分类").trim();
    game.iconUrl = String(game.iconUrl || fallbackGame.iconUrl || "/assets/game/other.png").trim();
    game.sort = Number(game.sort || fallbackGame.sort || 0);
    game.showOnHome = game.showOnHome !== undefined ? Boolean(game.showOnHome) : Boolean(fallbackGame.showOnHome);
    game.visible = game.visible !== false;
  });
  packages.forEach((item) => {
    item.id = String(item.id || makeId("pack_")).trim();
    item.name = String(item.name || "服务套餐").trim();
    item.hours = Number(item.hours || 1);
  });
  players.forEach((player) => {
    player.id = String(player.id || makeId("player_")).trim();
    player.name = String(player.name || "未命名").trim();
    player.title = String(player.title || "陪玩服务").trim();
    player.game = String(player.game || "voice").trim();
    const game = games.find((item) => item.id === player.game);
    player.gameName = String(player.gameName || game?.name || "未选择").trim();
    player.level = String(player.level || "").trim();
    const existingLevels = player.levels && typeof player.levels === "object" ? player.levels : {};
    const nextLevels = {};
    const levelDetails = [];
    const skillLevelGroups = levelGroupsForSkill(playerLevelGroups, quickMatchConfig, player.game);
    skillLevelGroups.forEach((group, groupIndex) => {
      const legacyValue = group.id === "confidential"
        ? player.confidentialLevel
        : group.id === "top_secret"
          ? player.topSecretLevel
          : "";
      const selectedId = normalizePlayerLevelId(skillLevelGroups, group.id, existingLevels[group.id] || legacyValue, groupIndex === 0 ? player.level : "");
      const selectedLevel = findPlayerLevel(skillLevelGroups, group.id, selectedId);
      if (!selectedLevel) return;
      nextLevels[group.id] = selectedId;
      levelDetails.push({
        groupId: group.id,
        groupName: group.name,
        levelId: selectedLevel.id,
        levelName: selectedLevel.name,
        price: Number(selectedLevel.price || 0)
      });
    });
    const primaryLevel = levelDetails[0] || null;
    const confidential = levelDetails.find((item) => item.groupId === "confidential") || primaryLevel;
    const topSecret = levelDetails.find((item) => item.groupId === "top_secret") || levelDetails[1] || null;
    player.levels = nextLevels;
    player.levelDetails = levelDetails;
    player.confidentialLevel = confidential?.levelId || "";
    player.confidentialLevelName = confidential?.levelName || "";
    player.confidentialPrice = Number(confidential?.price || 0);
    player.topSecretLevel = topSecret?.levelId || "";
    player.topSecretLevelName = topSecret?.levelName || "";
    player.topSecretPrice = Number(topSecret?.price || 0);
    player.level = primaryLevel?.levelName || player.level;
    player.price = Number(primaryLevel?.price || player.price || 0);
    if (oldCurrency !== TOKEN_CURRENCY && player.price > 0) player.price *= TOKEN_RATE;
    const legacyBalance = Number(player.balanceCatFood ?? player.balance ?? 0);
    player.earnedCatFood = Number(player.earnedCatFood ?? player.withdrawableCatFood ?? legacyBalance ?? 0);
    player.rechargeCatFood = Number(player.rechargeCatFood ?? player.rechargedCatFood ?? 0);
    player.pendingWithdrawCatFood = Number(player.pendingWithdrawCatFood || 0);
    player.withdrawnCatFood = Number(player.withdrawnCatFood || 0);
    player.balanceCatFood = player.earnedCatFood;
    player.totalCatFood = Number((Number(player.earnedCatFood || 0) + Number(player.rechargeCatFood || 0)).toFixed(2));
    player.settledIncome = Number(player.settledIncome || player.earnedCatFood || 0);
    player.rating = String(player.rating || "5.0");
    player.sold = Number(player.sold || 0);
    player.homeSort = Math.max(0, Number(player.homeSort ?? player.sort ?? 0));
    player.showOnHome = player.showOnHome !== false;
    player.style = String(player.style || player.id).trim();
    player.workbenchSecret = String(player.workbenchSecret || player.playerSecret || player.secret || player.id.replace(/\D/g, "").padStart(6, "0").slice(-6) || "000000").trim();
    player.workbenchOpenid = String(player.workbenchOpenid || player.boundWechatOpenid || "").trim();
    player.workbenchBoundAt = player.workbenchOpenid ? String(player.workbenchBoundAt || "").trim() : "";
    player.tags = Array.isArray(player.tags) ? player.tags : [];
    player.intro = String(player.intro || "").trim();
    player.schedule = Array.isArray(player.schedule) && player.schedule.length ? player.schedule : ["今天 20:00"];
  });
  const levelSource = Array.isArray(catalog.playerLevels) && catalog.playerLevels.length
    ? catalog.playerLevels
    : [...DEFAULT_PLAYER_LEVELS, ...players.map((player) => player.level)];
  const playerLevels = [...new Set(levelSource.map((item) => String(item || "").trim()).filter(Boolean))];
  return { brand, games, packages, players, notices, orderCategories, orderItems, playerLevelGroups, quickMatchConfig, playerLevels, currency: TOKEN_CURRENCY, tokenRate: TOKEN_RATE };
}

function publicCatalog(catalog, store = null) {
  const safe = clone(catalog);
  safe.players = (safe.players || [])
    .map((player, originalIndex) => ({ player, originalIndex }))
    .sort((left, right) => {
      const leftSort = Number(left.player.homeSort ?? left.player.sort ?? left.originalIndex + 1);
      const rightSort = Number(right.player.homeSort ?? right.player.sort ?? right.originalIndex + 1);
      if (leftSort !== rightSort) return leftSort - rightSort;
      return left.originalIndex - right.originalIndex;
    })
    .map(({ player }) => {
      const { workbenchSecret, playerSecret, secret, workbenchOpenid, boundWechatOpenid, workbenchBoundAt, workbenchBoundCustomerId, workbenchBoundCustomerName, ...rest } = player;
      const reviews = store ? (store.playerReviews || []).filter((review) => review.playerId === player.id && review.status !== "hidden") : [];
      const avgRating = reviews.length
        ? (reviews.reduce((sum, review) => sum + Number(review.rating || averageReviewScore(review.scores || [])), 0) / reviews.length).toFixed(1)
        : (rest.rating || "9.5");
      return {
        ...rest,
        rating: avgRating,
        abilities: reviewAbilityAverages(reviews, rest.abilities || []),
        reviewCount: reviews.length,
        latestReviews: reviews.slice(0, 3)
      };
    });
  return isAuditMode(store) ? auditCatalog(safe) : safe;
}

function catalogToServiceCards(catalog) {
  return catalog.players.map((player) => ({
    id: player.id,
    title: `${player.name} | ${player.title}`,
    desc: [
      player.gameName,
      player.confidentialLevelName ? `机密${player.confidentialLevelName}` : "",
      player.topSecretLevelName ? `绝密${player.topSecretLevelName}` : "",
      ...(player.tags || [])
    ].filter(Boolean).join(" · "),
    price: `${displayRmbFromToken(player.price)}/小时`
  }));
}

function isStaffOnline(account) {
  return account && account.isOnline !== false;
}

function pickOnlineStaff(store) {
  const online = (store.staffAccounts || []).filter(isStaffOnline);
  const pool = online.length ? online : (store.staffAccounts || []);
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function ensureOrderAssignee(store, order) {
  const current = String(order.assignee || "").trim();
  if (order.assigneeId && current && current !== "未分配") return order;
  const assigned = current && current !== "未分配"
    ? (store.staffAccounts || []).find((account) => (
      account.id === current ||
      account.name === current ||
      account.username === current
    ))
    : null;
  const staff = assigned || pickOnlineStaff(store);
  if (staff) {
    order.assigneeId = staff.id;
    order.assignee = staff.name;
  }
  return order;
}

function normalizeStaffAssignment(store, value) {
  const keyword = String(value || "").trim();
  if (!keyword || keyword === "未分配") return { assigneeId: "", assignee: "未分配" };
  const assigned = (store.staffAccounts || []).find((account) => (
    account.id === keyword ||
    account.name === keyword ||
    account.username === keyword
  ));
  return assigned
    ? { assigneeId: assigned.id, assignee: assigned.name }
    : { assigneeId: "", assignee: keyword };
}

function staffOrderStats(store, account) {
  const orders = (store.orders || []).filter((order) => (
    order.assigneeId === account.id ||
    order.assignee === account.id ||
    order.assignee === account.name ||
    order.assignee === account.username
  ));
  return {
    servedOrders: orders.length,
    completedOrders: orders.filter((order) => order.status === "已完成").length,
    pendingOrders: orders.filter((order) => order.status === "待确认").length,
    amount: orders.reduce((sum, order) => sum + Number(order.amount || 0), 0)
  };
}

function safeStaffWithStats(account, store) {
  return {
    ...safeStaff(account),
    ...staffOrderStats(store, account)
  };
}

function normalizeRechargeTiers(value = []) {
  const list = Array.isArray(value) ? value : [];
  const tiers = list
    .map((item) => Number(item?.yuan || item?.amountYuan || item))
    .filter((item) => Number.isFinite(item) && item > 0)
    .slice(0, 5);
  while (tiers.length < 5) tiers.push(DEFAULT_RECHARGE_TIERS[tiers.length] || 10);
  return tiers.map((item) => Number(item.toFixed(2)));
}

function normalizeRevenueConfigs(value = []) {
  const source = Array.isArray(value) && value.length ? value : DEFAULT_REVENUE_CONFIGS;
  const list = source.map((item, index) => {
    const playerRate = Math.max(0, Math.min(100, Number(item.playerRate ?? item.incomeRate ?? (100 - Number(item.platformRate ?? item.commissionRate ?? 30)))));
    const platformRate = Number((100 - playerRate).toFixed(2));
    return {
      id: String(item.id || `config_${index + 1}`).trim(),
      name: String(item.name || `配置${index + 1}`).trim(),
      platformRate,
      playerRate
    };
  }).filter((item) => item.id && item.name);
  return list.length ? list : clone(DEFAULT_REVENUE_CONFIGS);
}

function normalizeMemberLevels(value = []) {
  const saved = Array.isArray(value) ? value : [];
  return DEFAULT_MEMBER_LEVELS.map((level) => {
    const matched = saved.find((item) => item.id === level.id || item.name === level.name) || {};
    return {
      ...level,
      threshold: Math.max(0, Number(matched.threshold ?? level.threshold ?? 0)),
      discount: Math.max(1, Math.min(100, Number(matched.discount ?? level.discount ?? 100))),
      imageUrl: String(matched.imageUrl || level.imageUrl || "").trim(),
      benefits: String(matched.benefits || level.benefits || "").trim()
    };
  }).sort((a, b) => a.threshold - b.threshold);
}

function normalizeGiftCatalog(value = []) {
  const saved = Array.isArray(value) ? value : [];
  return DEFAULT_GIFT_CATALOG.map((gift) => {
    const matched = saved.find((item) => item.id === gift.id || item.name === gift.name) || {};
    const price = Math.max(1, Number(matched.price || gift.price || 1));
    return {
      ...gift,
      name: String(matched.name || gift.name).trim(),
      price: Number(price.toFixed(2)),
      imageUrl: String(matched.imageUrl || gift.imageUrl || "").trim()
    };
  });
}

function isAuditMode(store) {
  return store?.settings?.auditMode !== false && store?.settings?.auditMode !== "false";
}

function auditText(value) {
  return String(value || "")
    .replace(/代练|代打/g, "")
    .replace(/护航/g, "协作")
    .replace(/打手/g, "达人")
    .replace(/陪玩/g, "陪伴");
}

function auditSanitize(value) {
  if (typeof value === "string") return auditText(value);
  if (Array.isArray(value)) return value.map(auditSanitize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, auditSanitize(item)]));
  }
  return value;
}

function auditCatalog(value) {
  const safe = auditSanitize(value);
  (safe.orderItems || []).forEach((item) => {
    item.detailDesc = "";
    item.desc = "";
    item.note = "";
    item.keywords = [];
    item.tags = [];
  });
  (safe.players || []).forEach((player) => {
    player.desc = "";
    player.intro = "";
    player.signature = "";
    player.tags = [];
  });
  return safe;
}

function sha256Hex(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hmacSha256(key, value, encoding) {
  return crypto.createHmac("sha256", key).update(value).digest(encoding);
}

function getMemberLevel(store, spentCatFood = 0) {
  const levels = normalizeMemberLevels(store.settings?.memberLevels);
  return levels.reduce((matched, level) => (
    Number(spentCatFood || 0) >= Number(level.threshold || 0) ? level : matched
  ), levels[0]);
}

function getMemberProgress(store, spentCatFood = 0) {
  const spent = Number(spentCatFood || 0);
  const levels = normalizeMemberLevels(store.settings?.memberLevels);
  const currentIndex = levels.reduce((matchedIndex, level, index) => (
    spent >= Number(level.threshold || 0) ? index : matchedIndex
  ), 0);
  const current = levels[currentIndex] || levels[0] || { threshold: 0 };
  const next = levels[currentIndex + 1];
  if (!next) return 100;
  const start = Number(current.threshold || 0);
  const end = Math.max(start + 1, Number(next.threshold || 0));
  return Math.max(0, Math.min(100, Math.round(((spent - start) / (end - start)) * 100)));
}

function ensureCustomer(store, payload = {}) {
  store.customers = Array.isArray(store.customers) ? store.customers : [];
  const id = String(payload.userId || payload.id || "boss-demo").trim() || "boss-demo";
  let customer = store.customers.find((item) => item.id === id);
  if (!customer) {
    customer = {
      id,
      name: String(payload.userName || payload.name || "小程序用户"),
      avatar: String(payload.avatar || ""),
      contact: String(payload.contact || "小程序内联系"),
      phone: String(payload.phone || ""),
      openid: String(payload.openid || ""),
      balanceCatFood: 0,
      spentCatFood: 0,
      createdAt: new Date().toISOString()
    };
    store.customers.unshift(customer);
  }
  if (payload.userName || payload.name) customer.name = String(payload.userName || payload.name);
  if (payload.avatar !== undefined) customer.avatar = String(payload.avatar || "");
  if (payload.phone) customer.phone = String(payload.phone || "");
  if (payload.openid) customer.openid = String(payload.openid || "");
  if (payload.contact) customer.contact = String(payload.contact);
  customer.balanceCatFood = Math.max(0, Number(customer.balanceCatFood || 0));
  customer.spentCatFood = Number(customer.spentCatFood || 0);
  const level = getMemberLevel(store, customer.spentCatFood);
  customer.memberLevelId = level?.id || "";
  customer.memberLevelName = level?.name || "会员";
  customer.memberDiscount = level?.discount || 100;
  customer.memberImageUrl = level?.imageUrl || "";
  customer.memberProgress = getMemberProgress(store, customer.spentCatFood);
  return customer;
}

function createCustomerPublicId(store) {
  store.customers = Array.isArray(store.customers) ? store.customers : [];
  for (let index = 0; index < 20; index += 1) {
    const id = String(Math.floor(100000 + Math.random() * 900000));
    if (!store.customers.some((customer) => customer.id === id)) return id;
  }
  return String(Date.now()).slice(-6);
}

function addCustomerBill(store, customer, payload = {}) {
  store.customerBills = Array.isArray(store.customerBills) ? store.customerBills : [];
  const amount = Number(payload.amount || 0);
  const bill = {
    id: String(payload.id || makeId("bill_")),
    userId: customer.id,
    userName: customer.name,
    type: String(payload.type || "adjust"),
    title: String(payload.title || "余额变动"),
    amount,
    balanceAfter: Number(customer.balanceCatFood || 0),
    note: String(payload.note || ""),
    createdAt: new Date().toISOString()
  };
  store.customerBills.unshift(bill);
  return bill;
}

function customerFavoritePlayers(store, userId) {
  const favorites = (store.playerFavorites || []).filter((item) => item.userId === userId);
  return favorites.map((favorite) => {
    const player = (store.catalog?.players || []).find((item) => item.id === favorite.playerId) || {};
    return {
      ...favorite,
      player: publicCatalog({ ...(store.catalog || {}), players: [player] }, store).players[0] || null
    };
  });
}

function publicReviewsForPlayer(store, playerId) {
  return (store.playerReviews || [])
    .filter((review) => review.playerId === playerId && review.status !== "hidden")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function publicReviewsForUser(store, userId) {
  return (store.playerReviews || [])
    .filter((review) => review.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function clampReviewScore(value, fallback = 10) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(1, Math.min(10, Number(number.toFixed(1))));
}

function normalizeReviewScores(body = {}) {
  const source = body.scores || body.dimensionScores || {};
  const hasDimensionScores = Boolean(body.scores || body.dimensionScores);
  return REVIEW_DIMENSIONS.map((dimension) => {
    let value = source[dimension.key] ?? source[dimension.name] ?? body[dimension.key] ?? body[`score_${dimension.key}`] ?? body.rating;
    if (!hasDimensionScores && Number(value) > 0 && Number(value) <= 5) value = Number(value) * 2;
    return {
      key: dimension.key,
      name: dimension.name,
      value: clampReviewScore(value, 10)
    };
  });
}

function averageReviewScore(scores = []) {
  const values = scores.map((item) => Number(item.value)).filter((value) => Number.isFinite(value));
  if (!values.length) return 10;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

function reviewAbilityAverages(reviews = [], fallbackAbilities = []) {
  if (!reviews.length) return Array.isArray(fallbackAbilities) ? fallbackAbilities : [];
  return REVIEW_DIMENSIONS.map((dimension) => {
    const values = reviews.map((review) => {
      const scores = Array.isArray(review.scores) ? review.scores : normalizeReviewScores(review);
      const item = scores.find((score) => score.key === dimension.key || score.name === dimension.name);
      return Number(item && item.value);
    }).filter((value) => Number.isFinite(value));
    const fallback = (fallbackAbilities || []).find((item) => item.name === dimension.name);
    const value = values.length
      ? values.reduce((sum, item) => sum + item, 0) / values.length
      : Number(fallback && fallback.value || 9.5);
    return {
      key: dimension.key,
      name: dimension.name,
      value: Number(value.toFixed(1))
    };
  });
}

function publicComplaints(store) {
  return (store.complaints || [])
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function createOrUpdatePlayerReview(store, body = {}) {
  store.playerReviews = Array.isArray(store.playerReviews) ? store.playerReviews : [];
  const orderId = String(body.orderId || "").trim();
  const userId = String(body.userId || "").trim();
  const order = (store.orders || []).find((item) => item.id === orderId);
  if (!order) {
    const error = new Error("订单不存在");
    error.status = 404;
    throw error;
  }
  if (userId && String(order.userId || "") !== userId) {
    const error = new Error("只能评价自己的订单");
    error.status = 403;
    throw error;
  }
  if (order.status !== "已完成" && !(order.bossConfirmedDone && order.playerConfirmedDone)) {
    const error = new Error("订单完成后才能评价打手");
    error.status = 400;
    throw error;
  }
  if (!order.playerId && !order.playerNo && !order.playerName && (body.playerId || body.playerNo || body.playerName)) {
    order.playerId = String(body.playerId || body.playerNo || body.playerName || "").trim();
    order.playerNo = String(body.playerNo || body.playerId || "").trim();
    order.playerName = String(body.playerName || body.playerId || body.playerNo || "").trim();
    order.playerAvatar = String(body.playerAvatar || "").trim();
  }
  const player = findOrderPlayer(store, order);
  if (!player) {
    const error = new Error("该订单没有绑定打手");
    error.status = 400;
    throw error;
  }
  const scores = normalizeReviewScores(body);
  const rating = averageReviewScore(scores);
  const tags = Array.isArray(body.tags)
    ? body.tags.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 6)
    : String(body.tags || "").split(/[,，]/).map((item) => item.trim()).filter(Boolean).slice(0, 6);
  let review = (store.playerReviews || []).find((item) => item.orderId === order.id && item.userId === order.userId);
  if (!review) {
    review = {
      id: makeId("review_"),
      orderId: order.id,
      userId: order.userId,
      userName: order.userName,
      playerId: player.id,
      playerName: player.name,
      gameName: order.gameName || "",
      serviceName: order.serviceName || "",
      status: "visible",
      createdAt: new Date().toISOString()
    };
    store.playerReviews.unshift(review);
  }
  review.rating = rating;
  review.scores = scores;
  review.tags = tags;
  review.content = String(body.content || body.comment || "").trim().slice(0, 300);
  review.updatedAt = new Date().toISOString();
  order.reviewed = true;
  order.reviewId = review.id;
  const reviews = publicReviewsForPlayer(store, player.id);
  player.rating = reviews.length
    ? (reviews.reduce((sum, item) => sum + Number(item.rating || averageReviewScore(item.scores || [])), 0) / reviews.length).toFixed(1)
    : player.rating;
  player.abilities = reviewAbilityAverages(reviews, player.abilities || []);
  player.reviewCount = reviews.length;
  return review;
}

function formatChinaDateTime(value, withSeconds = false) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const chinaTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return chinaTime.toISOString().slice(0, withSeconds ? 19 : 16).replace("T", " ");
}

function todayChinaDate() {
  return formatChinaDateTime(new Date()).slice(0, 10);
}

function startsWithChinaDate(value, day = todayChinaDate()) {
  return formatChinaDateTime(value).startsWith(day);
}

function chinaDayStartMs(day) {
  const date = new Date(`${day}T00:00:00+08:00`);
  return Number.isNaN(date.getTime()) ? Date.now() : date.getTime();
}

function currentChinaDayRange() {
  const day = todayChinaDate();
  const start = chinaDayStartMs(day);
  return {
    key: day,
    start,
    end: start + 24 * 60 * 60 * 1000
  };
}

function currentChinaWeekRange() {
  const today = todayChinaDate();
  const todayStart = chinaDayStartMs(today);
  const chinaNoon = new Date(todayStart + 12 * 60 * 60 * 1000);
  const weekday = chinaNoon.getUTCDay() || 7;
  const start = todayStart - (weekday - 1) * 24 * 60 * 60 * 1000;
  const startKey = formatChinaDateTime(new Date(start)).slice(0, 10);
  return {
    key: startKey,
    start,
    end: start + 7 * 24 * 60 * 60 * 1000
  };
}

function timestampInRange(value, range) {
  const time = new Date(value || Date.now()).getTime();
  if (Number.isNaN(time)) return false;
  return time >= range.start && time < range.end;
}

function rankAmount(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return 0;
  return Number(amount.toFixed(2));
}

function formatRankAmount(value) {
  const amount = rankAmount(value);
  return amount % 1 === 0 ? String(amount.toFixed(0)) : String(amount);
}

function rankEntryList(map) {
  return Array.from(map.values())
    .filter((item) => item.amount > 0 || item.orderCount > 0)
    .sort((left, right) => (
      right.amount - left.amount ||
      right.orderCount - left.orderCount ||
      String(left.name || "").localeCompare(String(right.name || ""), "zh-Hans-CN")
    ))
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      rankText: index === 0 ? "冠" : String(index + 1),
      amount: formatRankAmount(item.amount),
      orderCount: String(item.orderCount || 0)
    }));
}

function podiumEntries(entries) {
  if (entries.length <= 1) return entries;
  return [entries[1], entries[0], entries[2]].filter(Boolean);
}

function buildPlayerRankings(store, range, type) {
  const map = new Map();
  (store.orders || [])
    .filter((order) => order.status !== "已取消" && timestampInRange(order.createdAt || order.updatedAt, range))
    .forEach((order) => {
      const player = findOrderPlayer(store, order);
      if (!player) return;
      const key = String(player.id || player.playerNo || player.name || "").trim();
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: player.name || order.playerName || "达人",
          img: player.avatar || order.playerAvatar || "/assets/avatar-yinyue.jpg",
          amount: 0,
          orderCount: 0,
          desc: type === "today" ? "今日实际订单数据" : "本周实际订单数据"
        });
      }
      const item = map.get(key);
      item.amount = rankAmount(item.amount + Number(order.originalAmount || order.amount || order.payableAmount || 0));
      item.orderCount += 1;
    });
  return rankEntryList(map);
}

function buildWhaleRankings(store, range) {
  const map = new Map();
  (store.customerBills || [])
    .filter((bill) => Number(bill.amount || 0) < 0 && timestampInRange(bill.createdAt, range))
    .forEach((bill) => {
      const userId = String(bill.userId || "").trim();
      if (!userId) return;
      if (!map.has(userId)) {
        const customer = (store.customers || []).find((item) => String(item.id || "") === userId) || {};
        map.set(userId, {
          id: userId,
          name: customer.name || bill.userName || "老板",
          img: customer.avatar || "/assets/avatar-yinyue.jpg",
          amount: 0,
          orderCount: 0,
          desc: "本周实际消费数据"
        });
      }
      const item = map.get(userId);
      item.amount = rankAmount(item.amount + Math.abs(Number(bill.amount || 0)));
      item.orderCount += 1;
    });
  if (!map.size) {
    (store.orders || [])
      .filter((order) => order.status !== "已取消" && timestampInRange(order.createdAt, range))
      .forEach((order) => {
        const userId = String(order.userId || "").trim();
        if (!userId) return;
        if (!map.has(userId)) {
          const customer = (store.customers || []).find((item) => String(item.id || "") === userId) || {};
          map.set(userId, {
            id: userId,
            name: customer.name || order.userName || "老板",
            img: customer.avatar || "/assets/avatar-yinyue.jpg",
            amount: 0,
            orderCount: 0,
            desc: "本周实际消费数据"
          });
        }
        const item = map.get(userId);
        item.amount = rankAmount(item.amount + Number(order.originalAmount || order.amount || order.payableAmount || 0));
        item.orderCount += 1;
      });
  }
  return rankEntryList(map);
}

function buildRankingPayload(store, type = "today", userId = "") {
  const rankType = ["today", "week", "whale"].includes(type) ? type : "today";
  const isDaily = rankType === "today";
  const range = isDaily ? currentChinaDayRange() : currentChinaWeekRange();
  const snapshotKey = `${rankType}_${range.key}`;
  let entries;
  if (isDaily) {
    entries = buildPlayerRankings(store, range, rankType);
  } else {
    store.rankSnapshots = store.rankSnapshots && typeof store.rankSnapshots === "object" ? store.rankSnapshots : {};
    const snapshot = store.rankSnapshots[rankType];
    if (snapshot && snapshot.key === snapshotKey && Array.isArray(snapshot.entries)) {
      entries = snapshot.entries;
    } else {
      entries = rankType === "whale" ? buildWhaleRankings(store, range) : buildPlayerRankings(store, range, rankType);
      store.rankSnapshots[rankType] = {
        key: snapshotKey,
        periodStart: formatChinaDateTime(new Date(range.start)),
        periodEnd: formatChinaDateTime(new Date(range.end - 1)),
        entries,
        generatedAt: new Date().toISOString()
      };
    }
  }
  const labels = {
    today: ["今日榜", "今日实际订单流水", "今日接单", "实时更新"],
    week: ["周榜", "本周实际订单流水", "本周接单", "每周一 00:00 更新"],
    whale: ["神豪榜", "本周老板实际消费", "消费次数", "每周一 00:00 更新"]
  }[rankType];
  const currentRank = userId ? entries.find((item) => item.id === userId) : null;
  return {
    type: rankType,
    title: labels[0],
    summary: labels[1],
    metricLabel: rankType === "whale" ? "本周消费" : (rankType === "today" ? "今日流水" : "本周流水"),
    subMetricLabel: labels[2],
    updateText: labels[3],
    periodText: `${formatChinaDateTime(new Date(range.start)).slice(5, 16)} - ${formatChinaDateTime(new Date(range.end - 1)).slice(5, 16)}`,
    myRank: currentRank ? `我的排名：${currentRank.rank}` : `榜单人数：${entries.length}`,
    myAmount: currentRank ? `${rankType === "whale" ? "本周消费" : "榜单流水"}：${currentRank.amount} 猫粮` : "按实际数据生成",
    top: podiumEntries(entries.slice(0, 3)),
    list: entries.slice(3)
  };
}

function serializeCustomerBill(bill) {
  if (!bill) return bill;
  return {
    ...bill,
    createdAtIso: bill.createdAt || "",
    createdAtText: formatChinaDateTime(bill.createdAt),
    createdAt: formatChinaDateTime(bill.createdAt)
  };
}

function customerBillsForResponse(store, userId, limit = 30) {
  return (store.customerBills || [])
    .filter((item) => item.userId === userId)
    .slice(0, limit)
    .map(serializeCustomerBill);
}

function allCustomerBillsForResponse(store) {
  return (store.customerBills || []).map(serializeCustomerBill);
}

function getWechatPayConfig() {
  const privateKey = process.env.WECHAT_PAY_PRIVATE_KEY
    || (process.env.WECHAT_PAY_PRIVATE_KEY_PATH && fs.existsSync(process.env.WECHAT_PAY_PRIVATE_KEY_PATH)
      ? fs.readFileSync(process.env.WECHAT_PAY_PRIVATE_KEY_PATH, "utf8")
      : "");
  return {
    serviceAppId: process.env.WECHAT_SERVICE_APPID || process.env.WECHAT_PAY_APPID || "",
    serviceSecret: process.env.WECHAT_SERVICE_SECRET || "",
    mchId: process.env.WECHAT_PAY_MCH_ID || "",
    apiV3Key: process.env.WECHAT_PAY_API_V3_KEY || "",
    serialNo: process.env.WECHAT_PAY_CERT_SERIAL_NO || "",
    privateKey,
    notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || `${PAY_BASE_URL}/api/pay/notify`,
    mock: process.env.WECHAT_PAY_MOCK === "1"
  };
}

function isWechatPayConfigured(config = getWechatPayConfig()) {
  return Boolean(config.serviceAppId && config.serviceSecret && config.mchId && config.apiV3Key && config.serialNo && config.privateKey);
}

function isWechatPayMerchantConfigured(config = getWechatPayConfig()) {
  return Boolean(config.mchId && config.apiV3Key && config.serialNo && config.privateKey);
}

function amountToCents(amountYuan) {
  return Math.max(1, Math.round(Number(amountYuan || 0) * 100));
}

function getRechargeOrder(store, orderNo) {
  const id = String(orderNo || "").trim();
  return (store.rechargeOrders || []).find((item) => item.id === id || item.orderNo === id) || null;
}

function createRechargeOrder(store, body = {}, source = "小程序充值") {
  const amountYuan = Number(body.amountYuan || body.amount || 0);
  if (!Number.isFinite(amountYuan) || amountYuan <= 0) {
    throw new Error("充值金额必须大于 0");
  }
  const orderId = String(body.orderNo || body.id || `RC${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`);
  const existing = getRechargeOrder(store, orderId);
  if (existing) return existing;
  const now = Date.now();
  const recharge = {
    id: orderId,
    orderNo: orderId,
    userId: String(body.userId || "guest"),
    userName: String(body.userName || "小程序用户"),
    amountYuan: Number(amountYuan.toFixed(2)),
    tokenAmount: Number(body.tokenAmount || Math.floor(amountYuan * TOKEN_RATE)),
    tokenName: TOKEN_NAME,
    currency: TOKEN_CURRENCY,
    payProvider: store.settings?.paymentMode === "official_virtual" ? "official_virtual_payment" : "service_account_wechat",
    status: "pending",
    source,
    payUrl: `${PAY_BASE_URL}/pay/recharge?orderNo=${encodeURIComponent(orderId)}`,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now).toISOString()
  };
  store.rechargeOrders.unshift(recharge);
  return recharge;
}

function finishRechargeOrder(store, order, payload = {}) {
  if (!order) return null;
  const customer = ensureCustomer(store, {
    id: order.userId || "guest",
    userName: order.userName || "小程序用户",
    contact: "小程序充值"
  });
  const tokenAmount = Math.max(0, Number(order.tokenAmount || 0));
  const billId = `recharge-${order.id}`;
  if (!store.customerBills.some((bill) => bill.id === billId)) {
    customer.balanceCatFood = Number((Number(customer.balanceCatFood || 0) + tokenAmount).toFixed(2));
    customer.updatedAt = new Date().toISOString();
    addCustomerBill(store, customer, {
      id: billId,
      type: "recharge",
      title: "猫粮充值",
      amount: tokenAmount,
      note: `微信支付充值 ${Number(order.amountYuan || 0).toFixed(2)} 元`
    });
  }
  order.status = "paid";
  order.paidAt = order.paidAt || new Date().toISOString();
  order.transactionId = String(payload.transactionId || payload.transaction_id || order.transactionId || "");
  order.tradeState = String(payload.tradeState || payload.trade_state || "SUCCESS");
  order.updatedAt = new Date().toISOString();
  return order;
}

function rsaSign(message, privateKey) {
  return crypto.createSign("RSA-SHA256").update(message).sign(privateKey, "base64");
}

function buildWechatPayAuthorization(method, requestPath, body, config) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex");
  const message = `${method}\n${requestPath}\n${timestamp}\n${nonce}\n${body}\n`;
  const signature = rsaSign(message, config.privateKey);
  return `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchId}",nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}",serial_no="${config.serialNo}"`;
}

async function fetchWechatOpenid(code, config) {
  const api = new URL("https://api.weixin.qq.com/sns/oauth2/access_token");
  api.searchParams.set("appid", config.serviceAppId);
  api.searchParams.set("secret", config.serviceSecret);
  api.searchParams.set("code", code);
  api.searchParams.set("grant_type", "authorization_code");
  const response = await fetch(api);
  const data = await response.json();
  if (!response.ok || !data.openid) {
    throw new Error(data.errmsg || "获取服务号 openid 失败");
  }
  return data.openid;
}

async function createWechatJsapiPayParams(order, openid, config) {
  const requestPath = "/v3/pay/transactions/jsapi";
  const body = JSON.stringify({
    appid: config.serviceAppId,
    mchid: config.mchId,
    description: `${BRAND_NAME}${TOKEN_NAME}充值`,
    out_trade_no: order.id,
    notify_url: config.notifyUrl,
    amount: {
      total: amountToCents(order.amountYuan),
      currency: "CNY"
    },
    payer: { openid }
  });
  const response = await fetch(`https://api.mch.weixin.qq.com${requestPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": buildWechatPayAuthorization("POST", requestPath, body, config)
    },
    body
  });
  const data = await response.json();
  if (!response.ok || !data.prepay_id) {
    throw new Error(data.message || data.detail?.message || "微信支付下单失败");
  }
  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString("hex");
  const packageValue = `prepay_id=${data.prepay_id}`;
  const paySign = rsaSign(`${config.serviceAppId}\n${timeStamp}\n${nonceStr}\n${packageValue}\n`, config.privateKey);
  return {
    appId: config.serviceAppId,
    timeStamp,
    nonceStr,
    package: packageValue,
    signType: "RSA",
    paySign
  };
}

function decryptWechatResource(resource, apiV3Key) {
  const key = Buffer.from(apiV3Key, "utf8");
  const ciphertext = Buffer.from(resource.ciphertext || "", "base64");
  const authTag = ciphertext.subarray(ciphertext.length - 16);
  const data = ciphertext.subarray(0, ciphertext.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, resource.nonce);
  decipher.setAuthTag(authTag);
  if (resource.associated_data) decipher.setAAD(Buffer.from(resource.associated_data));
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8"));
}

async function queryWechatTransaction(order, config = getWechatPayConfig()) {
  if (!order || !isWechatPayMerchantConfigured(config)) return null;
  const orderNo = encodeURIComponent(order.orderNo || order.id);
  const requestPath = `/v3/pay/transactions/out-trade-no/${orderNo}?mchid=${encodeURIComponent(config.mchId)}`;
  const response = await fetch(`https://api.mch.weixin.qq.com${requestPath}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Authorization": buildWechatPayAuthorization("GET", requestPath, "", config)
    }
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 404 || data.code === "ORDER_NOT_EXIST") return null;
  if (!response.ok) {
    throw new Error(data.message || data.detail?.message || `微信查单失败 HTTP ${response.status}`);
  }
  return data;
}

async function syncRechargeOrderPayment(store, order, reason = "query") {
  if (!order || order.status === "paid") return { order, synced: false };
  const config = getWechatPayConfig();
  if (!isWechatPayMerchantConfigured(config)) return { order, synced: false };
  try {
    const transaction = await queryWechatTransaction(order, config);
    order.lastPayQueryAt = new Date().toISOString();
    order.lastPayQueryReason = reason;
    if (!transaction) {
      order.lastPayQueryState = "NOT_FOUND";
      order.updatedAt = new Date().toISOString();
      return { order, synced: false };
    }
    order.lastPayQueryState = transaction.trade_state || "";
    order.tradeState = transaction.trade_state || order.tradeState || "";
    order.transactionId = transaction.transaction_id || order.transactionId || "";
    order.updatedAt = new Date().toISOString();
    if (transaction.trade_state === "SUCCESS") {
      finishRechargeOrder(store, order, {
        transactionId: transaction.transaction_id,
        tradeState: transaction.trade_state
      });
      return { order, synced: true, transaction };
    }
    return { order, synced: false, transaction };
  } catch (error) {
    order.lastPayQueryAt = new Date().toISOString();
    order.lastPayQueryError = error.message || "微信查单失败";
    order.updatedAt = new Date().toISOString();
    return { order, synced: false, error };
  }
}

function getReferralConfig(store) {
  return {
    enabled: store.settings?.referralEnabled !== false,
    rate: Math.max(0, Math.min(100, Number(store.settings?.referralCommissionRate ?? 5))),
    months: Math.max(1, Math.min(12, Number(store.settings?.referralCommissionMonths ?? 1)))
  };
}

function getActiveReferral(store, userId) {
  store.referrals = Array.isArray(store.referrals) ? store.referrals : [];
  return store.referrals.find((item) => item.userId === userId && item.status !== "disabled");
}

function applyReferralCommission(store, order, customer) {
  const config = getReferralConfig(store);
  if (!config.enabled || !customer || !order) return null;
  const referral = getActiveReferral(store, customer.id);
  if (!referral || !referral.inviterId || referral.inviterId === customer.id) return null;
  const invitedAt = new Date(referral.createdAt || customer.invitedAt || customer.createdAt || order.createdAt || Date.now()).getTime();
  const orderAt = new Date(order.createdAt || Date.now()).getTime();
  const validMs = config.months * 31 * 24 * 60 * 60 * 1000;
  if (Number.isFinite(invitedAt) && Number.isFinite(orderAt) && orderAt - invitedAt > validMs) return null;
  store.referralCommissions = Array.isArray(store.referralCommissions) ? store.referralCommissions : [];
  const existing = store.referralCommissions.find((item) => item.orderId === order.id);
  if (existing) return existing;
  const inviter = ensureCustomer(store, {
    id: referral.inviterId,
    userName: referral.inviterName || "邀请人",
    contact: "小程序内联系"
  });
  const baseAmount = Number(order.amount || order.payableAmount || 0);
  const amount = Number((baseAmount * config.rate / 100).toFixed(2));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  inviter.balanceCatFood = Number((Number(inviter.balanceCatFood || 0) + amount).toFixed(2));
  inviter.updatedAt = new Date().toISOString();
  const commission = {
    id: makeId("ref_"),
    orderId: order.id,
    userId: customer.id,
    userName: customer.name || order.userName || "新用户",
    inviterId: inviter.id,
    inviterName: inviter.name || "邀请人",
    amount,
    rate: config.rate,
    months: config.months,
    status: "settled",
    createdAt: new Date().toISOString()
  };
  store.referralCommissions.unshift(commission);
  addCustomerBill(store, inviter, {
    type: "referral_commission",
    title: "邀请提成",
    amount,
    note: `邀请用户 ${commission.userName} 首月消费 ${config.rate}% 提成`
  });
  return commission;
}

function getRevenueConfig(store, configId) {
  const configs = normalizeRevenueConfigs(store.settings?.revenueConfigs);
  return configs.find((item) => item.id === configId)
    || configs.find((item) => item.id === store.settings?.defaultRevenueConfigId)
    || configs[0];
}

function playerRevenueConfig(store, playerName) {
  const player = (store.catalog?.players || []).find((item) => item.name === playerName || item.id === playerName);
  return getRevenueConfig(store, player?.revenueConfigId);
}

function applyRevenueToOrder(store, order) {
  const config = order.revenueConfigId
    ? getRevenueConfig(store, order.revenueConfigId)
    : playerRevenueConfig(store, order.playerName);
  const originalAmount = Number(order.originalAmount ?? order.amount ?? 0);
  const playerRateSource = order.playerSettlementStatus === "settled"
    ? (order.playerRate ?? config?.playerRate ?? 70)
    : (config?.playerRate ?? order.playerRate ?? 70);
  const playerRate = Math.max(0, Math.min(100, Number(playerRateSource)));
  const platformRate = Number((100 - playerRate).toFixed(2));
  const platformCommission = Number((originalAmount * platformRate / 100).toFixed(2));
  const playerIncome = Number((originalAmount * playerRate / 100).toFixed(2));
  order.originalAmount = originalAmount;
  order.amount = Number(order.amount ?? originalAmount);
  order.revenueConfigId = order.revenueConfigId || config?.id || "";
  order.revenueConfigName = config?.name || "默认配置";
  order.platformRate = platformRate;
  order.playerRate = playerRate;
  order.platformCommission = platformCommission;
  order.playerIncome = playerIncome;
  return order;
}

function refreshOrderRevenueConfigFromPlayer(store, order) {
  if (!order || order.playerSettlementStatus === "settled") return order;
  const player = findOrderPlayer(store, order);
  if (player?.revenueConfigId) order.revenueConfigId = player.revenueConfigId;
  return order;
}

function findOrderPlayer(store, order) {
  const keys = [
    order.playerId,
    order.playerNo,
    order.playerName,
    order.specifiedPlayerId,
    order.specifiedPlayerName
  ].map((item) => String(item || "").trim()).filter(Boolean);
  const invalidNames = new Set(["待分配", "未分配", "等待达人抢单"]);
  const player = (store.catalog?.players || []).find((item) => {
    const playerKeys = [item.id, item.playerNo, item.name].map((value) => String(value || "").trim()).filter(Boolean);
    return playerKeys.some((value) => keys.includes(value));
  });
  if (player) return player;
  const fallbackKey = keys.find((key) => !invalidNames.has(key));
  if (!fallbackKey) return null;
  return {
    id: String(order.playerId || order.playerNo || fallbackKey),
    playerNo: String(order.playerNo || order.playerId || fallbackKey),
    name: String(order.playerName || fallbackKey),
    avatar: order.playerAvatar || "",
    abilities: [],
    rating: 0,
    reviewCount: 0
  };
}

function orderHasReviewTarget(store, order) {
  return Boolean(findOrderPlayer(store, order));
}

function findPlayerByKey(store, key) {
  const value = String(key || "").trim();
  if (!value) return null;
  return (store.catalog?.players || []).find((player) => (
    String(player.id || "") === value ||
    String(player.playerNo || "") === value ||
    String(player.name || "") === value
  ));
}

function recordPlayerGiftIncome(store, payload = {}) {
  store.playerTransactions = Array.isArray(store.playerTransactions) ? store.playerTransactions : [];
  const player = findPlayerByKey(store, payload.playerId || payload.playerNo || payload.playerName);
  if (!player) {
    const error = new Error("打手不存在");
    error.status = 404;
    throw error;
  }
  const amount = Math.max(0, Number(payload.amount || 0));
  if (!Number.isFinite(amount) || amount <= 0) {
    const error = new Error("礼物金额必须大于0");
    error.status = 400;
    throw error;
  }
  const txId = String(payload.id || payload.orderId || `gift_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`);
  const existing = store.playerTransactions.find((item) => item.id === txId);
  if (existing) return { player, transaction: existing };
  const giftName = String(payload.giftName || "礼物").trim();
  const userName = String(payload.userName || "老板").trim();
  const currentEarned = Number(player.earnedCatFood ?? player.balanceCatFood ?? 0);
  player.earnedCatFood = Number((currentEarned + amount).toFixed(2));
  player.balanceCatFood = player.earnedCatFood;
  player.totalCatFood = Number((Number(player.earnedCatFood || 0) + Number(player.rechargeCatFood || 0)).toFixed(2));
  player.settledIncome = Number((Number(player.settledIncome || 0) + amount).toFixed(2));
  const transaction = {
    id: txId,
    type: "gift",
    status: "success",
    title: `礼物收入：${giftName}`,
    amount,
    playerId: player.id || "",
    playerNo: player.playerNo || player.id || "",
    playerName: player.name || "",
    giftId: String(payload.giftId || ""),
    giftName,
    userId: String(payload.userId || ""),
    userName,
    orderNo: String(payload.orderNo || payload.orderId || ""),
    desc: `${userName} 赠送「${giftName}」，${amount}猫粮已全额入账`,
    note: String(payload.note || ""),
    createdAt: new Date().toISOString()
  };
  store.playerTransactions.unshift(transaction);
  return { player, transaction };
}

function settleCompletedOrder(store, order) {
  if (!order || order.status !== "已完成" || order.playerSettlementStatus === "settled") return order;
  const player = findOrderPlayer(store, order);
  if (!player) return order;
  order.revenueConfigId = player.revenueConfigId || order.revenueConfigId || store.settings?.defaultRevenueConfigId;
  applyRevenueToOrder(store, order);
  const income = Number(order.playerIncome || 0);
  player.earnedCatFood = Number((Number(player.earnedCatFood ?? player.balanceCatFood ?? 0) + income).toFixed(2));
  player.balanceCatFood = player.earnedCatFood;
  player.totalCatFood = Number((Number(player.earnedCatFood || 0) + Number(player.rechargeCatFood || 0)).toFixed(2));
  player.settledIncome = Number((Number(player.settledIncome || 0) + income).toFixed(2));
  order.playerSettlementStatus = "settled";
  order.playerSettlementAmount = income;
  order.playerSettlementAt = new Date().toISOString();
  order.playerSettlementName = player.name;
  return order;
}

function normalizeWithdrawals(store) {
  store.playerWithdrawals = Array.isArray(store.playerWithdrawals) ? store.playerWithdrawals : [];
  store.playerWithdrawals.forEach((item) => {
    item.id = String(item.id || makeId("W")).trim();
    item.playerId = String(item.playerId || item.playerNo || "").trim();
    item.playerNo = String(item.playerNo || item.playerId || "").trim();
    item.playerName = String(item.playerName || "打手").trim();
    item.amount = Number(item.amount || 0);
    item.tokenName = TOKEN_NAME;
    item.status = item.status || "pending";
    item.statusText = item.status === "success" ? "提现成功" : item.status === "rejected" ? "已拒绝" : "审核中";
    item.createdAt = item.createdAt || new Date().toISOString();
    item.processedAt = item.processedAt || "";
    item.remark = item.remark || "";
    item.balanceDeducted = item.balanceDeducted !== false;
    item.refunded = Boolean(item.refunded);
  });
  return store.playerWithdrawals;
}

function findWithdrawalPlayer(store, withdrawal) {
  return (store.catalog?.players || []).find((player) => (
    player.id === withdrawal.playerId ||
    player.id === withdrawal.playerNo ||
    player.name === withdrawal.playerName
  ));
}

function getRechargeConfig(store) {
  const tiers = normalizeRechargeTiers(store.settings?.rechargeTiers);
  const auditMode = isAuditMode(store);
  const paymentMode = ["official_virtual", "service_account_wechat"].includes(store.settings?.paymentMode)
    ? store.settings.paymentMode
    : "official_virtual";
  return {
    tokenName: auditMode ? "积分" : TOKEN_NAME,
    tokenIcon: "/assets/cat-food.jpg",
    tokenRate: TOKEN_RATE,
    currency: TOKEN_CURRENCY,
    auditMode,
    paymentMode,
    virtualPayment: {
      configured: Boolean(String(store.settings?.virtualPaymentOfferId || "").trim()),
      offerId: String(store.settings?.virtualPaymentOfferId || "").trim(),
      env: String(store.settings?.virtualPaymentEnv || "release").trim(),
      currencyType: String(store.settings?.virtualPaymentCurrencyType || "CNY").trim(),
      platform: String(store.settings?.virtualPaymentPlatform || "android").trim()
    },
    tiers: tiers.map((yuan) => ({
      yuan,
      tokenAmount: Math.floor(yuan * TOKEN_RATE)
    }))
  };
}

function createVirtualPayParams(store, order) {
  const offerId = String(store.settings?.virtualPaymentOfferId || "").trim();
  if (!offerId) return null;
  const appKey = String(process.env.WECHAT_VIRTUAL_PAY_APP_KEY || store.settings?.virtualPaymentAppKey || "").trim();
  const mode = String(store.settings?.virtualPaymentMode || "short_series_coin").trim();
  const envText = String(store.settings?.virtualPaymentEnv || "release").trim();
  const signPayload = {
    offerId,
    buyQuantity: Number(order.tokenAmount || 1),
    env: envText === "sandbox" ? 1 : 0,
    currencyType: String(store.settings?.virtualPaymentCurrencyType || "CNY").trim(),
    outTradeNo: order.orderNo,
    attach: JSON.stringify({
      orderNo: order.orderNo,
      userId: order.userId || "",
      scene: "recharge"
    })
  };
  if (mode !== "short_series_coin") {
    signPayload.productId = order.currency || TOKEN_CURRENCY;
    signPayload.goodsPrice = Math.max(1, Math.round(Number(order.amountYuan || 0) * 100));
  }
  const signData = JSON.stringify(signPayload);
  const sessionKey = String(order.sessionKey || "").trim();
  return {
    mode,
    signData,
    paySig: appKey ? hmacSha256(appKey, `requestVirtualPayment&${signData}`, "hex") : "",
    signature: sessionKey ? hmacSha256(sessionKey, signData, "hex") : ""
  };
}

function isMiniProgramOrder(order) {
  const contact = `${order.contact || ""} ${order.userPhone || ""}`;
  return order.id !== "P20260617002" && !contact.includes("企");
}

function normalizeStore(store) {
  const now = new Date().toISOString();
  store.staffAccounts = Array.isArray(store.staffAccounts) ? store.staffAccounts : [];
  staff.forEach((account) => {
    const existing = store.staffAccounts.find((item) => item.id === account.id || item.username === account.username);
    if (existing) {
      existing.id = existing.id || account.id;
      existing.role = existing.role || account.role;
      existing.username = existing.username || account.username;
      existing.name = existing.name || account.name;
      existing.password = existing.password || account.password;
      existing.avatar = existing.avatar || "";
      existing.isOnline = existing.isOnline !== false;
      existing.lastOnlineAt = existing.lastOnlineAt || now;
      return;
    }
    store.staffAccounts.push({ ...account, isOnline: true, lastOnlineAt: now });
  });
  store.adminAccounts = Array.isArray(store.adminAccounts) ? store.adminAccounts : [];
  owners.forEach((account) => {
    const existing = store.adminAccounts.find((item) => item.id === account.id || item.username === account.username);
    if (existing) {
      existing.id = existing.id || account.id;
      existing.role = "owner";
      existing.username = existing.username || account.username;
      existing.name = existing.name || account.name;
      existing.password = existing.password || account.password;
      existing.avatar = existing.avatar || "";
      return;
    }
    store.adminAccounts.push({ ...account });
  });
  store.catalog = normalizeCatalog(store.catalog);
  store.sessions = Array.isArray(store.sessions) ? store.sessions : [];
  store.messages = Array.isArray(store.messages) ? store.messages : [];
  store.tickets = Array.isArray(store.tickets) ? store.tickets : [];
  store.orders = Array.isArray(store.orders) ? store.orders.filter(isMiniProgramOrder) : [];
  store.rechargeOrders = Array.isArray(store.rechargeOrders) ? store.rechargeOrders : [];
  normalizeWithdrawals(store);
  store.customerBills = Array.isArray(store.customerBills) ? store.customerBills : [];
  store.customers = Array.isArray(store.customers) ? store.customers : [];
  store.playerFavorites = Array.isArray(store.playerFavorites) ? store.playerFavorites : [];
  store.playerReviews = Array.isArray(store.playerReviews) ? store.playerReviews : [];
  store.playerTransactions = Array.isArray(store.playerTransactions) ? store.playerTransactions : [];
  store.rankSnapshots = store.rankSnapshots && typeof store.rankSnapshots === "object" ? store.rankSnapshots : {};
  store.complaints = Array.isArray(store.complaints) ? store.complaints : [];
  store.referrals = Array.isArray(store.referrals) ? store.referrals : [];
  store.referralCommissions = Array.isArray(store.referralCommissions) ? store.referralCommissions : [];
  store.quickReplies = Array.isArray(store.quickReplies) ? store.quickReplies : [...seed.quickReplies];
  store.serviceCards = catalogToServiceCards(store.catalog);
  store.settings = { ...seed.settings, ...(store.settings || {}) };
  store.settings.shopName = BRAND_NAME;
  store.settings.rechargeTiers = normalizeRechargeTiers(store.settings.rechargeTiers);
  store.settings.revenueConfigs = normalizeRevenueConfigs(store.settings.revenueConfigs);
  store.settings.memberLevels = normalizeMemberLevels(store.settings.memberLevels);
  store.settings.giftCatalog = normalizeGiftCatalog(store.settings.giftCatalog);
  store.settings.referralEnabled = store.settings.referralEnabled !== false;
  store.settings.referralCommissionRate = Math.max(0, Math.min(100, Number(store.settings.referralCommissionRate ?? 5)));
  store.settings.referralCommissionMonths = Math.max(1, Math.min(12, Number(store.settings.referralCommissionMonths ?? 1)));
  store.settings.auditMode = store.settings.auditMode !== false && store.settings.auditMode !== "false";
  store.settings.paymentMode = ["official_virtual", "service_account_wechat"].includes(store.settings.paymentMode) ? store.settings.paymentMode : "official_virtual";
  store.settings.virtualPaymentOfferId = String(process.env.WECHAT_VIRTUAL_PAY_OFFER_ID || store.settings.virtualPaymentOfferId || "").trim();
  store.settings.virtualPaymentAppKey = String(process.env.WECHAT_VIRTUAL_PAY_APP_KEY || store.settings.virtualPaymentAppKey || "").trim();
  store.settings.virtualPaymentMode = String(store.settings.virtualPaymentMode || "short_series_coin").trim();
  store.settings.virtualPaymentEnv = String(store.settings.virtualPaymentEnv || "release").trim();
  store.settings.virtualPaymentCurrencyType = String(store.settings.virtualPaymentCurrencyType || "CNY").trim();
  store.settings.virtualPaymentPlatform = String(store.settings.virtualPaymentPlatform || "android").trim();
  store.settings.defaultRevenueConfigId = store.settings.defaultRevenueConfigId || store.settings.revenueConfigs[0]?.id || "config_1";
  store.catalog.players.forEach((player) => {
    player.revenueConfigId = player.revenueConfigId || store.settings.defaultRevenueConfigId;
  });
  if (!store.settings.autoGreeting || /[\u94f6]\u6708|\u966a\u73a9\u5e97/.test(store.settings.autoGreeting)) {
    store.settings.autoGreeting = `欢迎来到${BRAND_NAME}客服群，请留下游戏、时间和偏好，客服会尽快回复。`;
  }
  store.settings.customerServiceQrUrl = store.settings.customerServiceQrUrl || "/assets/guiyuan-logo.jpg";

  store.sessions.forEach((session) => {
    const sessionMessages = store.messages.filter((item) => item.sessionId === session.id);
    const userMessages = sessionMessages.filter((item) => item.senderType === "user");
    const staffMessages = sessionMessages.filter((item) => item.senderType === "staff" && item.visibility !== "internal");
    session.tags = Array.isArray(session.tags) ? session.tags : [];
    session.status = session.status || "open";
    session.priority = session.priority || "normal";
    session.channel = session.channel || "小程序群聊";
    session.userName = session.userName || "小程序用户";
    if (!session.userName || /[\u94f6]\u6708|\u966a\u73a9\u5e97/.test(session.userName)) session.userName = `${BRAND_NAME}用户`;
    session.contact = session.contact || "小程序内联系";
    session.remark = session.remark || "";
    session.unreadStaff = Number(session.unreadStaff || 0);
    session.unreadUser = Number(session.unreadUser || 0);
    session.firstSeenAt = session.firstSeenAt || session.createdAt || session.lastMessageAt || now;
    session.lastMessageAt = session.lastMessageAt || session.firstSeenAt;
    session.lastUserMessageAt = session.lastUserMessageAt || userMessages.at(-1)?.createdAt || session.firstSeenAt;
    session.lastStaffReplyAt = session.lastStaffReplyAt || staffMessages.at(-1)?.createdAt || "";
    if (session.assignedTo && !store.staffAccounts.some((account) => account.id === session.assignedTo)) {
      const assigned = store.staffAccounts.find((account) => account.name === session.assignedTo || account.username === session.assignedTo);
      if (assigned) session.assignedTo = assigned.id;
    }
  });

  store.messages.forEach((message) => {
    message.type = message.type || "text";
    message.visibility = message.visibility || "public";
    message.card = message.card || null;
    if (message.senderName === "主管") message.senderName = "客服";
  });

  store.tickets.forEach((ticket) => {
    ticket.status = ticket.status || "processing";
    ticket.priority = ticket.priority || "normal";
    ticket.owner = ticket.owner || "未分配";
  });

  if (store.orders.length < seed.orders.length) {
    const existingIds = new Set(store.orders.map((order) => order.id));
    seed.orders.forEach((order) => {
      if (!existingIds.has(order.id) && isMiniProgramOrder(order)) store.orders.push({ ...order });
    });
  }

  store.orders.forEach((order) => {
    order.userName = order.userName || "小程序用户";
    if (order.currency !== TOKEN_CURRENCY) {
      order.unitPrice = Number(order.unitPrice || order.amount || 0) * TOKEN_RATE;
      order.amount = Number(order.amount || order.unitPrice * Number(order.duration || 1) || 0) * TOKEN_RATE;
    }
    order.currency = TOKEN_CURRENCY;
    order.tokenName = TOKEN_NAME;
    order.userPhone = order.userPhone || order.contact || "小程序内联系";
    order.playerName = order.playerName || "待分配";
    order.gameName = order.gameName || "未选择";
    order.serviceName = order.serviceName || order.title || "陪玩服务";
    order.platform = order.platform || "三角洲";
    order.unitPrice = Number(order.unitPrice || order.amount || 0);
    order.duration = Number(order.duration || 1);
    order.amount = Number(order.amount || order.unitPrice * order.duration || 0);
    if (!order.originalAmount) order.originalAmount = order.amount;
    if (!order.revenueConfigId) {
      const player = store.catalog.players.find((item) => item.name === order.playerName || item.id === order.playerId);
      order.revenueConfigId = player?.revenueConfigId || store.settings.defaultRevenueConfigId;
    }
    order.status = order.status || "待确认";
    order.source = "小程序";
    order.assignee = order.assignee || "";
    if (!order.assigneeId && order.assignee) {
      const assigned = store.staffAccounts.find((account) => (
        account.id === order.assignee ||
        account.name === order.assignee ||
        account.username === order.assignee
      ));
      if (assigned) {
        order.assigneeId = assigned.id;
        order.assignee = assigned.name;
      }
    }
    ensureOrderAssignee(store, order);
    order.note = order.note || "";
    order.contact = order.contact || order.userPhone || "小程序内联系";
    order.createdAt = order.createdAt || now;
    refreshOrderRevenueConfigFromPlayer(store, order);
    applyRevenueToOrder(store, order);
    settleCompletedOrder(store, order);
    const customer = ensureCustomer(store, {
      id: order.userId || order.userPhone || "boss-demo",
      userName: order.userName,
      contact: order.contact || order.userPhone
    });
    if (order.status === "已完成") {
      customer.spentCatFood = Math.max(Number(customer.spentCatFood || 0), Number(order.originalAmount || order.amount || 0));
    }
  });

  ensureCustomer(store, { id: "boss-demo", userName: "喵喵喵", contact: "小程序内联系" });
  store.customers.forEach((customer) => ensureCustomer(store, customer));

  return store;
}

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, JSON.stringify(seed, null, 2), "utf8");
  }
}

function loadStore() {
  ensureStore();
  const store = normalizeStore(JSON.parse(fs.readFileSync(STORE_FILE, "utf8")));
  saveStore(store);
  return store;
}

function saveStore(store) {
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function send(res, status, data, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    ...headers
  });
  res.end(JSON.stringify(data));
}

function sendText(res, status, text, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS"
  });
  res.end(String(text ?? ""));
}

function htmlEscape(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function sendHtml(res, html) {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(html);
}

async function renderRechargePayPage(url) {
  const store = loadStore();
  const orderNo = String(url.searchParams.get("orderNo") || "").trim();
  const order = getRechargeOrder(store, orderNo);
  const config = getWechatPayConfig();
  const code = String(url.searchParams.get("code") || "");
  if (!order) {
    return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>订单不存在</title><style>body{margin:0;background:#f7f7f7;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.empty{padding:80px 22px;text-align:center}.empty h1{font-size:22px}.empty p{color:#777;line-height:1.7}</style></head><body><div class="empty"><h1>支付订单不存在</h1><p>请回到小程序重新发起充值。</p></div></body></html>`;
  }
  const syncResult = await syncRechargeOrderPayment(store, order, "pay_page");
  if (syncResult.synced || syncResult.transaction || syncResult.error) saveStore(store);
  let authError = "";
  if (isWechatPayConfigured(config) && code && !order.openid && order.status !== "paid") {
    try {
      order.openid = await fetchWechatOpenid(code, config);
      order.updatedAt = new Date().toISOString();
      saveStore(store);
    } catch (error) {
      authError = error.message || "微信授权失败，请重新打开支付链接";
    }
  }
  const amount = Math.max(0, Number(order.amountYuan || 0));
  const tokenAmount = Math.max(0, Number(order.tokenAmount || 0));
  const title = htmlEscape(`${BRAND_NAME}${TOKEN_NAME}充值`);
  const createdAt = new Date(order.createdAt || Date.now()).getTime();
  const expiresAt = new Date(order.expiresAt || createdAt + 60 * 60 * 1000).getTime();
  const leftSeconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  const expired = leftSeconds <= 0 && order.status !== "paid";
  const expireHours = String(Math.floor(leftSeconds / 3600)).padStart(2, "0");
  const expireMinutes = String(Math.floor((leftSeconds % 3600) / 60)).padStart(2, "0");
  const expireSeconds = String(leftSeconds % 60).padStart(2, "0");
  const needOAuth = isWechatPayConfigured(config) && !order.openid && !code && order.status !== "paid" && !expired;
  const currentUrl = `${PAY_BASE_URL}${url.pathname}?orderNo=${encodeURIComponent(order.id)}`;
  const oauthUrl = config.serviceAppId
    ? `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${encodeURIComponent(config.serviceAppId)}&redirect_uri=${encodeURIComponent(currentUrl)}&response_type=code&scope=snsapi_base&state=${encodeURIComponent(order.id)}#wechat_redirect`
    : "";
  let preparedPayParams = null;
  let prepareError = "";
  if (!needOAuth && !expired && !authError && order.status !== "paid" && isWechatPayConfigured(config) && order.openid) {
    try {
      preparedPayParams = await createWechatJsapiPayParams(order, order.openid, config);
      order.prepayPreparedAt = new Date().toISOString();
      saveStore(store);
    } catch (error) {
      prepareError = error.message || "微信支付下单失败";
    }
  }
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>订单支付</title>
  <style>
    *{box-sizing:border-box}body{margin:0;min-height:100vh;background:#f7f7f7;color:#17171d;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.top{height:72px;display:flex;align-items:center;justify-content:center;position:relative;background:#f7f7f7;font-size:22px;font-weight:500}.back{position:absolute;left:18px;top:23px;width:22px;height:22px;border-left:3px solid #1e1e24;border-bottom:3px solid #1e1e24;transform:rotate(45deg)}.wrap{padding:14px 16px 120px}.timer,.order,.pay-method,.notice{background:#fff;border-radius:12px}.timer{height:58px;display:flex;align-items:center;padding:0 20px;margin-bottom:16px;font-size:18px}.timer b{color:#f62c62;font-weight:500}.clock{width:22px;height:22px;margin-right:10px;border:3px solid #f62c62;border-radius:50%;position:relative}.clock:before{content:"";position:absolute;left:8px;top:3px;width:2px;height:7px;background:#f62c62}.clock:after{content:"";position:absolute;left:8px;top:9px;width:7px;height:2px;background:#f62c62}.order{overflow:hidden;margin-bottom:16px}.order-no{padding:20px 18px 10px;color:#8f8f96;font-size:16px}.goods{display:grid;grid-template-columns:94px minmax(0,1fr) 30px;gap:14px;padding:18px}.cover{width:94px;height:94px;border-radius:4px;object-fit:cover;background:#36ec91}.name{font-size:17px;font-weight:700;line-height:24px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.spec{margin-top:11px;color:#8d8d95;font-size:15px}.price{margin-top:13px;color:#f62c62;font-size:22px}.count{align-self:end;color:#999;font-size:16px}.total{height:58px;display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:0 18px;border-top:1px solid #eee;font-size:18px}.total b{color:#f62c62;font-size:20px}.pay-method{padding-top:18px;overflow:hidden}.pay-title{padding:0 18px 14px;color:#808087;font-size:18px}.pay-row{height:66px;display:flex;align-items:center;padding:0 20px;border-top:1px solid #f0f0f0;font-size:18px}.coupon{color:#f2526e;margin-left:auto}.arrow{width:10px;height:10px;margin-left:10px;border-right:2px solid #999;border-top:2px solid #999;transform:rotate(45deg)}.wx{width:26px;height:26px;margin-right:14px;border-radius:50%;background:#13c935;color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900}.ticket{width:24px;height:20px;margin-right:14px;border-radius:5px;background:#ffb64d}.checked{width:28px;height:28px;margin-left:auto;border-radius:50%;background:#f62c62;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900}.notice{margin-top:16px;padding:14px 18px;color:#777;font-size:14px;line-height:1.7}.bottom{position:fixed;left:0;right:0;bottom:0;display:grid;grid-template-columns:1fr 150px;height:76px;padding-bottom:env(safe-area-inset-bottom);background:#fff;box-shadow:0 -8px 24px rgba(0,0,0,.04)}.pay-sum{display:flex;flex-direction:column;align-items:flex-end;justify-content:center;padding-right:18px;font-size:18px}.pay-sum b{color:#f62c62;font-size:22px}.pay-sum span:last-child{color:#f62c62;font-weight:700}.pay-btn{border:0;background:#ff1f55;color:#fff;font-size:22px;font-weight:700}.pay-btn:disabled{background:#bbb}.toast{position:fixed;left:50%;bottom:110px;transform:translateX(-50%);min-width:190px;text-align:center;padding:10px 16px;border-radius:999px;background:rgba(0,0,0,.78);color:#fff;font-size:14px;opacity:0;transition:.2s}.toast.show{opacity:1}
  </style>
</head>
<body>
  <!-- pay-v20260707-2 fixed-expiry-prepared-jsapi -->
  <div class="top"><span class="back" onclick="history.back()"></span>订单支付</div>
  <main class="wrap">
    <section class="timer"><span class="clock"></span><span><b id="h">${expireHours}</b> 时 <b id="m">${expireMinutes}</b> 分 <b id="s">${expireSeconds}</b> 秒 后失效</span></section>
    <section class="order">
      <div class="order-no">订单编号：${htmlEscape(order.id)}</div>
      <div class="goods">
        <img class="cover" src="/assets/cat-food.jpg" alt="" />
        <div>
          <div class="name">${title}</div>
          <div class="spec">规格：${tokenAmount} 猫粮</div>
          <div class="price">${amount.toFixed(2)}</div>
        </div>
        <div class="count">×1</div>
      </div>
      <div class="total">合计：<b>¥${amount.toFixed(2)}</b></div>
    </section>
    <section class="pay-method">
      <div class="pay-title">支付方式</div>
      <div class="pay-row"><span class="ticket"></span><span>优惠券</span><span class="coupon">暂无可用优惠券</span><span class="arrow"></span></div>
      <div class="pay-row"><span class="wx">微</span><span>微信支付</span><span class="checked">✓</span></div>
    </section>
    <section class="notice" id="notice">${authError ? htmlEscape(authError) : prepareError ? htmlEscape(prepareError) : order.status === "paid" ? "该订单已支付成功，猫粮已到账。" : expired ? "该订单已超时，请回到小程序重新发起充值。" : needOAuth ? "正在准备微信支付，请稍候。" : preparedPayParams ? "支付已准备好，点击立即支付会直接拉起微信支付。" : isWechatPayConfigured(config) ? "点击立即支付后会拉起微信支付，支付完成后猫粮自动到账。" : "当前服务器还没有配置小程序和微信支付密钥，配置完成后这里会自动拉起微信支付。"}</section>
  </main>
  <footer class="bottom">
    <div class="pay-sum"><span>实付款：<b>¥${amount.toFixed(2)}</b></span><span>已抵扣：¥0.00</span></div>
    <button class="pay-btn" id="payBtn" ${order.status === "paid" || expired || needOAuth || authError || prepareError ? "disabled" : ""}>${order.status === "paid" ? "已支付" : expired ? "已失效" : authError || prepareError ? "请重新打开" : needOAuth ? "准备中" : "立即支付"}</button>
  </footer>
  <div class="toast" id="toast"></div>
  <script>
    const ORDER_NO = ${JSON.stringify(order.id)};
    const OAUTH_URL = ${JSON.stringify(oauthUrl)};
    const NEED_OAUTH = ${needOAuth ? "true" : "false"};
    const CODE = ${JSON.stringify(code)};
    const AUTO_PAY = false;
    const PREPARED_PAY_PARAMS = ${JSON.stringify(preparedPayParams)};
    const VERSION = "pay-v20260707-2";
    let left = ${leftSeconds};
    setInterval(function(){
      left = Math.max(0, left - 1);
      document.getElementById("h").textContent = String(Math.floor(left / 3600)).padStart(2, "0");
      document.getElementById("m").textContent = String(Math.floor((left % 3600) / 60)).padStart(2, "0");
      document.getElementById("s").textContent = String(left % 60).padStart(2, "0");
      if (left <= 0) {
        const btn = document.getElementById("payBtn");
        btn.disabled = true;
        btn.textContent = "已失效";
        document.getElementById("notice").textContent = "该订单已超时，请回到小程序重新发起充值。";
      }
    }, 1000);
    function showToast(text){
      const toast = document.getElementById("toast");
      toast.textContent = text;
      toast.classList.add("show");
      setTimeout(function(){ toast.classList.remove("show"); }, 2200);
    }
    function callBridge(payParams){
      function onBridgeReady(){
        WeixinJSBridge.invoke("getBrandWCPayRequest", payParams, function(res){
          if (res.err_msg === "get_brand_wcpay_request:ok") {
            showToast("支付成功，猫粮到账中");
            setTimeout(function(){ location.reload(); }, 1200);
          } else {
            const message = res && res.err_msg ? res.err_msg : "unknown";
            const detail = message.replace("get_brand_wcpay_request:", "");
            const text = detail === "cancel" ? "您已取消支付" : "支付未完成：" + detail;
            showToast(text);
            document.getElementById("notice").textContent = text;
          }
        });
      }
      if (typeof WeixinJSBridge === "undefined") {
        showToast("微信支付组件准备中，请稍候");
        document.addEventListener("WeixinJSBridgeReady", onBridgeReady, false);
      } else {
        onBridgeReady();
      }
    }
    async function startPay(button){
      if (NEED_OAUTH && OAUTH_URL) {
        showToast("正在进入微信支付");
        location.replace(OAUTH_URL);
        return;
      }
      button.disabled = true;
      button.textContent = "处理中";
      if (PREPARED_PAY_PARAMS) {
        callBridge(PREPARED_PAY_PARAMS);
        button.disabled = false;
        button.textContent = "立即支付";
        return;
      }
      const response = await fetch("/api/public/service-pay-jsapi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo: ORDER_NO, code: CODE })
      }).catch(function(){ return null; });
      const data = response ? await response.json().catch(function(){ return {}; }) : {};
      if (data.mockPaid || data.order && data.order.status === "paid") {
        showToast("模拟支付成功，猫粮已到账");
        setTimeout(function(){ location.reload(); }, 1000);
        return;
      }
      if (data.payParams) {
        callBridge(data.payParams);
        button.disabled = false;
        button.textContent = "立即支付";
        return;
      }
      const errorText = data.error || "支付暂不可用";
      showToast(errorText);
      document.getElementById("notice").textContent = errorText;
      button.disabled = false;
      button.textContent = "立即支付";
    }
    const payBtn = document.getElementById("payBtn");
    payBtn.onclick = function(){
      startPay(payBtn);
    };
    if (NEED_OAUTH && OAUTH_URL) {
      showToast("正在准备微信支付");
      setTimeout(function(){ location.replace(OAUTH_URL); }, 300);
    }
  </script>
</body>
</html>`;
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif"
  };
  fs.readFile(filePath, (err, body) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
    res.end(body);
  });
}

function saveUploadedImage(dataUrl, fileName = "") {
  const match = String(dataUrl || "").match(/^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/);
  if (!match) return null;
  const extMap = { "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg", "image/webp": "webp", "image/gif": "gif" };
  const ext = extMap[match[1]] || "jpg";
  const safeName = String(fileName || `upload-${Date.now()}.${ext}`)
    .replace(/[^a-zA-Z0-9_.-]/g, "-")
    .replace(/\.(png|jpg|jpeg|webp|gif)$/i, "");
  const dir = path.join(PUBLIC_DIR, "uploads");
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${Date.now()}-${safeName}.${ext}`;
  fs.writeFileSync(path.join(dir, filename), Buffer.from(match[2], "base64"));
  return `/uploads/${filename}`;
}

function imageExtFromMime(mime = "", fallbackName = "") {
  const mimeExt = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif"
  }[String(mime || "").toLowerCase()];
  if (mimeExt) return mimeExt;
  const matched = String(fallbackName || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  const ext = matched ? matched[1] : "jpg";
  return ["png", "jpg", "jpeg", "webp", "gif"].includes(ext) ? (ext === "jpeg" ? "jpg" : ext) : "jpg";
}

function saveUploadedFileBuffer(buffer, fileName = "", mime = "") {
  if (!Buffer.isBuffer(buffer) || !buffer.length) return null;
  const ext = imageExtFromMime(mime, fileName);
  const safeName = String(fileName || `upload-${Date.now()}.${ext}`)
    .replace(/[^a-zA-Z0-9_.-]/g, "-")
    .replace(/\.(png|jpg|jpeg|webp|gif)$/i, "");
  const dir = path.join(PUBLIC_DIR, "uploads");
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${Date.now()}-${safeName}.${ext}`;
  fs.writeFileSync(path.join(dir, filename), buffer);
  return `/uploads/${filename}`;
}

function readBufferBody(req, limit = 20 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        req.destroy();
        reject(new Error("上传文件过大"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parseMultipartImage(buffer, contentType = "") {
  const boundaryMatch = String(contentType || "").match(/boundary=([^;]+)/i);
  if (!boundaryMatch) return null;
  const boundary = Buffer.from(`--${boundaryMatch[1].replace(/^"|"$/g, "")}`);
  let start = buffer.indexOf(boundary);
  while (start >= 0) {
    let partStart = start + boundary.length;
    if (buffer.slice(partStart, partStart + 2).toString() === "--") break;
    if (buffer.slice(partStart, partStart + 2).toString() === "\r\n") partStart += 2;
    const next = buffer.indexOf(boundary, partStart);
    if (next < 0) break;
    let partEnd = next;
    if (buffer.slice(partEnd - 2, partEnd).toString() === "\r\n") partEnd -= 2;
    const headerEnd = buffer.indexOf(Buffer.from("\r\n\r\n"), partStart);
    if (headerEnd > partStart && headerEnd < partEnd) {
      const header = buffer.slice(partStart, headerEnd).toString("latin1");
      const filenameMatch = header.match(/filename="([^"]*)"/i);
      const mimeMatch = header.match(/Content-Type:\s*([^\r\n]+)/i);
      const fileBuffer = buffer.slice(headerEnd + 4, partEnd);
      if (filenameMatch && fileBuffer.length) {
        return {
          fileName: filenameMatch[1] || `upload-${Date.now()}.jpg`,
          mime: mimeMatch ? mimeMatch[1].trim() : "image/jpeg",
          buffer: fileBuffer
        };
      }
    }
    start = next;
  }
  return null;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 20 * 1024 * 1024) req.destroy();
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 5 * 1024 * 1024) req.destroy();
    });
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

function xmlEscape(value) {
  return String(value ?? "").replace(/[<>&'"]/g, (char) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;"
  }[char]));
}

function parseWechatXml(raw = "") {
  const data = {};
  String(raw)
    .replace(/^\s*<xml>/i, "")
    .replace(/<\/xml>\s*$/i, "")
    .replace(/<([A-Za-z0-9_]+)>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/\1>/g, (_, key, cdata, text) => {
    data[key] = cdata !== undefined ? cdata : text;
    return "";
  });
  return data;
}

function normalizeWechatMessage(data = {}) {
  return {
    ...data,
    ToUserName: data.ToUserName || data.toUserName || data.to_user_name || data.ToUser || "",
    FromUserName: data.FromUserName || data.fromUserName || data.from_user_name || data.FromUser || data.openid || "",
    CreateTime: data.CreateTime || data.createTime || data.create_time || "",
    MsgType: data.MsgType || data.msgType || data.msg_type || "",
    Event: data.Event || data.event || "",
    SessionFrom: data.SessionFrom || data.sessionFrom || data.session_from || "",
    Content: data.Content || data.content || "",
    PagePath: data.PagePath || data.pagePath || data.page_path || "",
    Title: data.Title || data.title || "",
    Description: data.Description || data.description || "",
    Url: data.Url || data.url || "",
    EventKey: data.EventKey || data.eventKey || data.event_key || ""
  };
}

function parseWechatMessage(raw = "") {
  const text = String(raw || "").trim();
  if (!text) return {};
  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      return normalizeWechatMessage(JSON.parse(text));
    } catch (error) {
      return {};
    }
  }
  return normalizeWechatMessage(parseWechatXml(text));
}

function buildWechatTextXml(toUser, fromUser, content) {
  return `<xml><ToUserName><![CDATA[${toUser}]]></ToUserName><FromUserName><![CDATA[${fromUser}]]></FromUserName><CreateTime>${Math.floor(Date.now() / 1000)}</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[${content}]]></Content></xml>`;
}

function verifyWechatSignature(query) {
  const token = String(process.env.WECHAT_MESSAGE_TOKEN || process.env.WECHAT_TOKEN || "");
  const timestamp = String(query.get("timestamp") || "");
  const nonce = String(query.get("nonce") || "");
  const signature = String(query.get("signature") || "");
  if (!token || !timestamp || !nonce || !signature) return false;
  const digest = crypto.createHash("sha1").update([token, timestamp, nonce].sort().join("")).digest("hex");
  return digest === signature;
}

function extractRechargeOrderFromMessage(store, message = {}) {
  const text = [
    message.Content,
    message.Title,
    message.Description,
    message.PagePath,
    message.Url,
    message.EventKey,
    message.SessionFrom
  ].filter(Boolean).join(" ");
  const exact = text.match(/RC\d{10,}/i);
  if (exact) return getRechargeOrder(store, exact[0]);
  const short = text.match(/orderNo=([^&\s]+)/i);
  if (short) return getRechargeOrder(store, decodeURIComponent(short[1]));
  return null;
}

function extractPaymentPayloadFromMessage(message = {}) {
  const sessionFrom = String(message.SessionFrom || "");
  if (sessionFrom) {
    try {
      const parsed = JSON.parse(sessionFrom);
      if (parsed && (parsed.orderNo || parsed.payUrl)) return parsed;
    } catch (error) {
      const orderNo = sessionFrom.match(/RC\d{10,}/i)?.[0] || "";
      const payUrl = sessionFrom.match(/https:\/\/[^\s"']+/i)?.[0] || "";
      if (orderNo || payUrl) return { orderNo, payUrl };
    }
  }
  const text = [
    message.Content,
    message.Title,
    message.Description,
    message.PagePath,
    message.Url,
    message.EventKey
  ].filter(Boolean).join(" ");
  const orderNo = text.match(/RC\d{10,}/i)?.[0] || "";
  const payUrl = text.match(/https:\/\/[^\s"']+/i)?.[0] || "";
  return orderNo || payUrl ? { orderNo, payUrl } : null;
}

function buildWechatPayLinkText({ payUrl = "", orderNo = "", amountYuan = "", tokenAmount = "" } = {}) {
  if (!payUrl) {
    return [
      "桂圆电竞微信支付",
      "请回到小程序重新点击付款，系统会自动生成专属支付链接。"
    ].join("\n");
  }
  const lines = [
    "桂圆电竞微信支付",
    `支付链接：${payUrl}`
  ];
  if (orderNo) lines.push(`订单号：${orderNo}`);
  if (amountYuan) lines.push(`金额：${amountYuan}元`);
  if (tokenAmount) lines.push(`到账：${tokenAmount}猫粮`);
  lines.push("请点击上面的链接完成微信支付。");
  return lines.join("\n");
}

let wechatAccessTokenCache = { token: "", expiresAt: 0 };

function wechatTokenCandidates() {
  const miniAppId = String(process.env.WECHAT_MINI_APPID || DEFAULT_WECHAT_MINI_APPID || "").trim();
  const miniSecret = String(process.env.WECHAT_MINI_SECRET || "").trim();
  const candidates = [];
  if (miniAppId && miniSecret) candidates.push({ type: "mini", appId: miniAppId, secret: miniSecret });
  return candidates;
}

async function getWechatAccessToken() {
  if (wechatAccessTokenCache.token && Date.now() < wechatAccessTokenCache.expiresAt - 60 * 1000) {
    return wechatAccessTokenCache.token;
  }
  const candidates = wechatTokenCandidates();
  if (!candidates.length) throw new Error("未配置小程序 WECHAT_MINI_SECRET");
  const errors = [];
  for (const candidate of candidates) {
    const response = await fetch(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(candidate.appId)}&secret=${encodeURIComponent(candidate.secret)}`);
    const data = await response.json().catch(() => ({}));
    if (data.access_token) {
      wechatAccessTokenCache = {
        token: data.access_token,
        appId: candidate.appId,
        type: candidate.type,
        expiresAt: Date.now() + Math.max(60, Number(data.expires_in || 7200)) * 1000
      };
      console.log("[wechat-token-ok]", JSON.stringify({ type: candidate.type, appId: candidate.appId }));
      return wechatAccessTokenCache.token;
    }
    const message = data.errmsg || `HTTP ${response.status}`;
    errors.push(`${candidate.type}:${candidate.appId}:${message}`);
    console.log("[wechat-token-failed]", JSON.stringify({ type: candidate.type, appId: candidate.appId, error: message }));
  }
  throw new Error(errors.join(" | ") || "获取微信 access_token 失败");
}

async function fetchMiniSession(code) {
  const appId = String(process.env.WECHAT_MINI_APPID || DEFAULT_WECHAT_MINI_APPID || "").trim();
  const secret = String(process.env.WECHAT_MINI_SECRET || "").trim();
  if (!appId || !secret) throw new Error("未配置小程序 AppID 或 AppSecret");
  const api = new URL("https://api.weixin.qq.com/sns/jscode2session");
  api.searchParams.set("appid", appId);
  api.searchParams.set("secret", secret);
  api.searchParams.set("js_code", String(code || ""));
  api.searchParams.set("grant_type", "authorization_code");
  const response = await fetch(api);
  const data = await response.json().catch(() => ({}));
  if (!data.openid) throw new Error(data.errmsg || "微信登录凭证无效");
  return data;
}

async function fetchMiniPhoneNumber(phoneCode) {
  const token = await getWechatAccessToken();
  const response = await fetch(`https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: String(phoneCode || "") })
  });
  const data = await response.json().catch(() => ({}));
  if (data.errcode) throw new Error(data.errmsg || "获取手机号失败");
  const phoneInfo = data.phone_info || {};
  if (!phoneInfo.phoneNumber && !phoneInfo.purePhoneNumber) throw new Error("未获取到手机号");
  return phoneInfo.phoneNumber || phoneInfo.purePhoneNumber;
}

async function sendWechatCustomerText(openid, content) {
  const token = await getWechatAccessToken();
  const response = await fetch(`https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      touser: openid,
      msgtype: "text",
      text: { content }
    })
  });
  const data = await response.json().catch(() => ({}));
  if (data.errcode) throw new Error(data.errmsg || "客服消息发送失败");
  return data;
}

function makeId(prefix) {
  return `${prefix}${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
}

function publicSessionId(userId) {
  return `mini-${String(userId || "guest").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || "guest"}`;
}

function authStaff(req) {
  const header = req.headers.authorization || "";
  const token = header.replace(/^Bearer\s+/i, "");
  return sessions.get(token) || null;
}

function requireStaff(req, res) {
  const user = authStaff(req);
  if (!user) send(res, 401, { error: "未登录或登录已过期" });
  return user;
}

function requireOwner(req, res) {
  const user = authStaff(req);
  if (!user) {
    send(res, 401, { error: "未登录或登录已过期" });
    return null;
  }
  if (user.role !== "owner") {
    send(res, 403, { error: "没有总后台权限" });
    return null;
  }
  return user;
}

function safeStaff(account) {
  if (!account) return null;
  const { password, ...safe } = account;
  return safe;
}

function findStaffAccount(store, user) {
  return store.staffAccounts.find((item) => item.id === user.id || item.username === user.username);
}

function isOwnerUser(user) {
  return user && user.role === "owner";
}

function staffMatchesUser(store, user, value) {
  const keyword = String(value || "").trim();
  if (!user || !keyword) return false;
  if ([user.id, user.username, user.name].map((item) => String(item || "")).includes(keyword)) return true;
  const account = findStaffAccount(store, user);
  return Boolean(account && [account.id, account.username, account.name].map((item) => String(item || "")).includes(keyword));
}

function linkedOrderForSession(store, session) {
  if (!session) return null;
  return (store.orders || []).find((order) => order.sessionId === session.id);
}

function canStaffAccessOrder(store, user, order) {
  if (!order) return false;
  if (isOwnerUser(user)) return true;
  if (staffMatchesUser(store, user, order.assigneeId) || staffMatchesUser(store, user, order.assignee)) return true;
  const session = (store.sessions || []).find((item) => item.id === order.sessionId);
  return Boolean(session && staffMatchesUser(store, user, session.assignedTo));
}

function canStaffAccessSession(store, user, session) {
  if (!session) return false;
  if (isOwnerUser(user)) return true;
  if (staffMatchesUser(store, user, session.assignedTo)) return true;
  const order = linkedOrderForSession(store, session);
  return Boolean(order && canStaffAccessOrder(store, user, order));
}

function staffScopedOrders(store, user) {
  return (store.orders || []).filter((order) => canStaffAccessOrder(store, user, order));
}

function staffScopedSessions(store, user) {
  return (store.sessions || []).filter((session) => canStaffAccessSession(store, user, session));
}

function sortByTime(items) {
  return [...items].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function touchSession(store, sessionId, patch = {}) {
  const session = store.sessions.find((item) => item.id === sessionId);
  if (!session) return null;
  Object.assign(session, patch, { lastMessageAt: new Date().toISOString() });
  return session;
}

function createMessage(store, sessionId, payload) {
  const message = {
    id: makeId("msg_"),
    sessionId,
    clientMessageId: payload.clientMessageId || "",
    senderType: payload.senderType || "user",
    senderName: payload.senderName || "用户",
    type: payload.type || "text",
    visibility: payload.visibility || "public",
    content: String(payload.content || "").trim(),
    card: payload.card || null,
    createdAt: new Date().toISOString()
  };
  store.messages.push(message);
  if (message.visibility === "internal") {
    touchSession(store, sessionId, {});
    return message;
  }
  const unreadPatch = message.senderType === "staff"
    ? { unreadUser: 1, lastStaffReplyAt: message.createdAt }
    : { unreadStaff: 1, lastUserMessageAt: message.createdAt };
  touchSession(store, sessionId, unreadPatch);
  return message;
}

function findOrderSession(store, order, createIfMissing = true) {
  if (!order) return null;
  store.sessions = Array.isArray(store.sessions) ? store.sessions : [];
  if (!order.sessionId) order.sessionId = publicSessionId(order.userId || order.id || "guest");
  let session = store.sessions.find((item) => item.id === order.sessionId);
  if (!session && createIfMissing) {
    session = {
      id: order.sessionId,
      title: `${order.serviceName || order.gameName || "订单"}群聊`,
      channel: "小程序订单群",
      userName: order.userName || "小程序用户",
      userId: order.userId || "",
      status: "open",
      priority: "normal",
      assignedTo: order.assigneeId || null,
      tags: ["小程序", "订单"].filter(Boolean),
      contact: order.contact || order.userPhone || "小程序内联系",
      remark: order.note || "",
      unreadStaff: 0,
      unreadUser: 0,
      firstSeenAt: new Date().toISOString(),
      lastUserMessageAt: "",
      lastStaffReplyAt: "",
      lastMessageAt: new Date().toISOString()
    };
    store.sessions.unshift(session);
  }
  return session;
}

function publicOrderSnapshot(store, order) {
  if (!order) return null;
  const finishPending = Boolean(order.playerConfirmedDone && !order.bossConfirmedDone && order.status !== "已完成" && order.status !== "已取消");
  return {
    id: order.id,
    orderNo: order.id,
    sessionId: order.sessionId || "",
    status: order.status || "",
    userId: order.userId || "",
    userName: order.userName || "",
    playerId: order.playerId || "",
    playerNo: order.playerNo || order.playerId || "",
    playerName: order.playerName || "",
    playerAvatar: order.playerAvatar || "",
    gameName: order.gameName || "",
    serviceName: order.serviceName || "",
    note: order.note || "",
    filters: order.filters || {},
    requiresPlayerAccept: Boolean(order.requiresPlayerAccept),
    specifiedPlayerId: order.specifiedPlayerId || "",
    specifiedPlayerName: order.specifiedPlayerName || "",
    refunded: Boolean(order.refunded),
    refundAmount: Number(order.refundAmount || 0),
    canReview: order.status === "已完成" && !order.reviewed && orderHasReviewTarget(store, order),
    reviewed: Boolean(order.reviewed),
    bossConfirmedDone: Boolean(order.bossConfirmedDone),
    playerConfirmedDone: Boolean(order.playerConfirmedDone),
    finishPending,
    finishRequest: finishPending ? {
      id: `finish-${order.id}`,
      playerId: order.playerId || order.playerNo || "",
      playerNo: order.playerNo || order.playerId || "",
      playerName: order.playerName || "达人",
      status: "pending",
      time: order.playerConfirmedAt || order.updatedAt || order.createdAt || "",
      requiredCount: 1,
      confirmedCount: 1
    } : null,
    originalAmount: Number(order.originalAmount || order.amount || 0),
    amount: Number(order.amount || order.originalAmount || 0),
    payableAmount: Number(order.amount || order.originalAmount || 0),
    playerIncome: Number(order.playerIncome || 0),
    playerRate: Number(order.playerRate || 70),
    platformRate: Number(order.platformRate || 30),
    duration: Number(order.duration || 1),
    priceTierName: order.priceTierName || "",
    updatedAt: order.updatedAt || order.createdAt || "",
    createdAt: order.createdAt || ""
  };
}

function appendOrderSessionEvent(store, order, content) {
  const session = findOrderSession(store, order, true);
  if (!session) return null;
  return createMessage(store, session.id, {
    senderType: "system",
    senderName: "系统",
    type: "text",
    visibility: "public",
    content
  });
}

function refundCancelledOrder(store, order, actorName = "客服") {
  if (!order || order.refunded) return 0;
  const amount = Number(order.paidCatFood || 0);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const customer = ensureCustomer(store, {
    id: order.userId || "boss-demo",
    userName: order.userName || "小程序用户",
    contact: order.contact || order.userPhone || "小程序内联系"
  });
  customer.balanceCatFood = Number((Number(customer.balanceCatFood || 0) + amount).toFixed(2));
  customer.spentCatFood = Number(Math.max(0, Number(customer.spentCatFood || 0) - Number(order.originalAmount || order.amount || 0)).toFixed(2));
  customer.updatedAt = new Date().toISOString();
  ensureCustomer(store, customer);
  order.refunded = true;
  order.refundAmount = amount;
  order.refundedAt = new Date().toISOString();
  order.paymentStatus = "refunded_cat_food";
  addCustomerBill(store, customer, {
    type: "order_refund",
    title: "订单取消退款",
    amount,
    note: `${actorName}取消订单 ${order.id || ""}，猫粮已退回余额`
  });
  return amount;
}

function reversePlayerSettlementOnCancel(store, order) {
  if (!order || order.playerSettlementStatus !== "settled" || order.playerSettlementReversedAt) return 0;
  const player = findOrderPlayer(store, order);
  const amount = Number(order.playerSettlementAmount || order.playerIncome || 0);
  if (!player || !Number.isFinite(amount) || amount <= 0) return 0;
  player.earnedCatFood = Number(Math.max(0, Number(player.earnedCatFood ?? player.balanceCatFood ?? 0) - amount).toFixed(2));
  player.balanceCatFood = player.earnedCatFood;
  player.totalCatFood = Number((Number(player.earnedCatFood || 0) + Number(player.rechargeCatFood || 0)).toFixed(2));
  player.settledIncome = Number(Math.max(0, Number(player.settledIncome || 0) - amount).toFixed(2));
  order.playerSettlementStatus = "cancelled_reversed";
  order.playerSettlementReversedAt = new Date().toISOString();
  order.playerSettlementReversedAmount = amount;
  return amount;
}

function updateOrderStatusWithSideEffects(store, order, nextStatus, actorName = "客服") {
  if (!order || !nextStatus) return order;
  const previousStatus = order.status || "";
  const changed = previousStatus !== nextStatus;
  order.status = nextStatus;
  order.updatedAt = new Date().toISOString();
  const session = findOrderSession(store, order, true);
  if (nextStatus === "已取消") {
    const refundAmount = refundCancelledOrder(store, order, actorName);
    const reversedAmount = reversePlayerSettlementOnCancel(store, order);
    order.cancelledAt = order.cancelledAt || new Date().toISOString();
    order.cancelledBy = order.cancelledBy || actorName;
    if (session) session.status = "closed";
    if (changed) {
      appendOrderSessionEvent(
        store,
        order,
        refundAmount > 0
          ? `订单已取消，群聊已解散，已自动退回 ${refundAmount} 猫粮${reversedAmount > 0 ? `，已冲回打手收入 ${reversedAmount} 猫粮` : ""}。`
          : "订单已取消，群聊已解散。"
      );
    }
    return order;
  }
  if (nextStatus === "已完成") {
    order.bossConfirmedDone = true;
    order.playerConfirmedDone = true;
    order.completedAt = order.completedAt || new Date().toISOString();
    settleCompletedOrder(store, order);
    if (session) session.status = "closed";
    if (changed) appendOrderSessionEvent(store, order, "订单状态已更新为已完成，可以评价本次服务。");
    return order;
  }
  if (nextStatus === "已确认") {
    if (session) session.status = "open";
    if (changed) appendOrderSessionEvent(store, order, "订单状态已更新为已确认，服务进行中。");
    return order;
  }
  if (changed) appendOrderSessionEvent(store, order, `订单状态已更新为：${nextStatus}`);
  return order;
}

function attachPlayerToOrder(store, order, playerKey, actorName = "客服") {
  const key = String(playerKey || "").trim();
  if (!order || !key) {
    const error = new Error("请输入打手ID");
    error.status = 400;
    throw error;
  }
  const player = (store.catalog?.players || []).find((item) => (
    String(item.id || "") === key ||
    String(item.playerNo || "") === key ||
    String(item.name || "") === key
  ));
  if (!player) {
    const error = new Error("打手不存在");
    error.status = 404;
    throw error;
  }
  order.playerId = player.id || key;
  order.playerNo = player.playerNo || player.id || key;
  order.playerName = player.name || key;
  order.playerAvatar = player.avatar || "";
  order.requiresPlayerAccept = false;
  order.specifiedPlayerId = "";
  order.specifiedPlayerName = "";
  updateOrderStatusWithSideEffects(store, order, "已确认", actorName);
  appendOrderSessionEvent(store, order, `${actorName}已将打手 ${order.playerName} 拉入本单群聊。`);
  return player;
}

function enrichSession(session, store) {
  const slaMinutes = Number(store.settings.slaMinutes || 5);
  const lastUserAt = session.lastUserMessageAt ? new Date(session.lastUserMessageAt).getTime() : 0;
  const lastStaffAt = session.lastStaffReplyAt ? new Date(session.lastStaffReplyAt).getTime() : 0;
  const waitingMinutes = lastUserAt > lastStaffAt ? Math.floor((Date.now() - lastUserAt) / 60000) : 0;
  const assigned = store.staffAccounts.find((item) => item.id === session.assignedTo);
  return {
    ...session,
    assignedName: assigned ? assigned.name : "未分配",
    waitingMinutes,
    slaStatus: waitingMinutes >= slaMinutes ? "overdue" : waitingMinutes > 0 ? "waiting" : "ok"
  };
}

async function handleApi(req, res, url) {
  const store = loadStore();
  const pathname = url.pathname;

  if (pathname === "/api/wechat/message") {
    if (req.method === "GET") {
      if (!verifyWechatSignature(url.searchParams)) return sendText(res, 403, "invalid signature");
      return sendText(res, 200, url.searchParams.get("echostr") || "");
    }
    if (req.method === "POST") {
      if (!verifyWechatSignature(url.searchParams)) return sendText(res, 403, "invalid signature");
      const raw = await readRawBody(req);
      const message = parseWechatMessage(raw);
      console.log("[wechat-message]", JSON.stringify({
        msgType: message.MsgType || "",
        event: message.Event || "",
        sessionFrom: message.SessionFrom || "",
        content: message.Content || "",
        pagePath: message.PagePath || "",
        title: message.Title || "",
        from: message.FromUserName ? "yes" : "no",
        rawPreview: String(raw || "").slice(0, 500)
      }));
      const order = extractRechargeOrderFromMessage(store, message);
      const payload = extractPaymentPayloadFromMessage(message);
      if (message.Event === "xpay_wxpay_callback_notify") {
        if (order) {
          finishRechargeOrder(store, order, {
            transactionId: message.TransactionId || message.TransactionID || message.OrderId || `xpay_${order.orderNo || order.id}`,
            tradeState: "SUCCESS"
          });
          saveStore(store);
          console.log("[virtual-pay-callback-ok]", JSON.stringify({ orderNo: order.orderNo || order.id }));
        } else {
          console.log("[virtual-pay-callback-no-order]", JSON.stringify({ rawPreview: String(raw || "").slice(0, 800) }));
        }
        return sendText(res, 200, "success");
      }
      const payUrl = order?.payUrl || payload?.payUrl || "";
      const orderNo = order?.orderNo || order?.id || payload?.orderNo || "";
      const amountYuan = order ? Number(order.amountYuan || 0).toFixed(2) : payload?.amountYuan;
      const tokenAmount = order ? Number(order.tokenAmount || 0) : payload?.tokenAmount;
      const isPayMessage = Boolean(order || payUrl || orderNo || payload?.type === "guiyuan_pay");
      if (!isPayMessage) {
        console.log("[wechat-skip]", JSON.stringify({ reason: "non_pay_customer_service", event: message.Event || "", sessionFrom: message.SessionFrom || "" }));
        return sendText(res, 200, "success");
      }
      const replyText = buildWechatPayLinkText({ payUrl, orderNo, amountYuan, tokenAmount });
      if (message.FromUserName) {
        try {
          await sendWechatCustomerText(message.FromUserName, replyText);
          console.log("[wechat-send-ok]", JSON.stringify({
            orderNo,
            hasPayUrl: Boolean(payUrl),
            replyType: "pay",
            to: "openid"
          }));
        } catch (error) {
          console.error("[wechat-send-failed]", error.message);
        }
      }
      if (message.FromUserName && message.ToUserName) {
        return sendText(res, 200, buildWechatTextXml(message.FromUserName, message.ToUserName, replyText), "application/xml; charset=utf-8");
      }
      return sendText(res, 200, "success");
    }
  }

  if (req.method === "POST" && pathname === "/api/login") {
    const body = await readBody(req);
    const user = store.staffAccounts.find((item) => item.username === body.username && item.password === body.password);
    if (!user) return send(res, 403, { error: "账号或密码不正确" });
    const token = makeId("token_");
    const safeUser = safeStaff(user);
    sessions.set(token, safeUser);
    return send(res, 200, { token, user: safeUser });
  }

  if (req.method === "POST" && pathname === "/api/admin/login") {
    const body = await readBody(req);
    const user = store.adminAccounts.find((item) => item.username === body.username && item.password === body.password);
    if (!user) return send(res, 403, { error: "总后台账号或密码不正确" });
    const token = makeId("owner_");
    const safeUser = safeStaff(user);
    sessions.set(token, safeUser);
    return send(res, 200, { token, user: safeUser });
  }

  if (req.method === "GET" && pathname === "/api/public/bootstrap") {
    return send(res, 200, {
      settings: store.settings,
      quickReplies: store.quickReplies.slice(0, 3)
    });
  }

  if (req.method === "GET" && pathname === "/api/public/catalog") {
    return send(res, 200, { catalog: publicCatalog(store.catalog, store) });
  }

  if (req.method === "GET" && pathname === "/api/public/gifts") {
    return send(res, 200, { gifts: normalizeGiftCatalog(store.settings.giftCatalog) });
  }

  if (req.method === "GET" && pathname === "/api/public/rankings") {
    const type = String(url.searchParams.get("type") || "today").trim();
    const userId = String(url.searchParams.get("userId") || "").trim();
    const before = JSON.stringify(store.rankSnapshots || {});
    const ranking = buildRankingPayload(store, type, userId);
    if (before !== JSON.stringify(store.rankSnapshots || {})) saveStore(store);
    return send(res, 200, { ok: true, ranking });
  }

  if (req.method === "POST" && pathname === "/api/public/player-gifts") {
    const body = await readBody(req);
    try {
      const result = recordPlayerGiftIncome(store, body);
      saveStore(store);
      return send(res, 201, {
        ok: true,
        player: result.player,
        transaction: result.transaction
      });
    } catch (error) {
      return send(res, error.status || 400, { ok: false, error: error.message || "礼物入账失败" });
    }
  }

  if (req.method === "POST" && pathname === "/api/public/uploads") {
    const body = await readBody(req);
    const urlPath = saveUploadedImage(body.dataUrl, body.fileName);
    if (!urlPath) return send(res, 400, { ok: false, error: "请上传图片文件" });
    return send(res, 201, { ok: true, url: `${PAY_BASE_URL}${urlPath}`, path: urlPath });
  }

  if (req.method === "POST" && pathname === "/api/public/upload-file") {
    try {
      const buffer = await readBufferBody(req);
      const file = parseMultipartImage(buffer, req.headers["content-type"] || "");
      if (!file) return send(res, 400, { ok: false, error: "请上传图片文件" });
      const urlPath = saveUploadedFileBuffer(file.buffer, file.fileName, file.mime);
      if (!urlPath) return send(res, 400, { ok: false, error: "图片保存失败" });
      return send(res, 201, { ok: true, url: `${PAY_BASE_URL}${urlPath}`, path: urlPath });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message || "图片上传失败" });
    }
  }

  if (req.method === "POST" && pathname === "/api/public/login") {
    const body = await readBody(req);
    let session = {};
    if (!body.code) return send(res, 400, { ok: false, error: "微信登录凭证为空，请重新点击登录" });
    try {
      session = await fetchMiniSession(body.code);
    } catch (error) {
      return send(res, 400, { ok: false, error: `微信登录失败：${error.message || "请检查小程序 AppID/AppSecret"}` });
    }
    const existing = session.openid
      ? (store.customers || []).find((customer) => customer.openid === session.openid)
      : null;
    const customer = ensureCustomer(store, {
      id: body.userId || existing?.id || createCustomerPublicId(store),
      userName: body.userName || "喵喵喵",
      avatar: body.avatar || "",
      openid: session.openid || "",
      contact: "微信登录"
    });
    customer.loginAt = new Date().toISOString();
    customer.miniSessionKey = session.session_key || customer.miniSessionKey || "";
    ensureCustomer(store, customer);
    saveStore(store);
    return send(res, 200, {
      ok: true,
      token: makeId("login_"),
      customer,
      bills: customerBillsForResponse(store, customer.id, 30)
    });
  }

  if (req.method === "POST" && pathname === "/api/public/phone-login") {
    const body = await readBody(req);
    const session = body.code ? await fetchMiniSession(body.code) : {};
    const phone = body.phoneCode ? await fetchMiniPhoneNumber(body.phoneCode) : "";
    const customerId = phone ? phone.slice(-6).padStart(6, "0") : (session.openid || `wx${Date.now().toString().slice(-6)}`);
    const customer = ensureCustomer(store, {
      id: customerId,
      userName: body.userName || "喵喵喵",
      avatar: body.avatar || "",
      phone,
      openid: session.openid || "",
      contact: phone || "微信手机号登录"
    });
    customer.loginAt = new Date().toISOString();
    customer.miniSessionKey = session.session_key || customer.miniSessionKey || "";
    ensureCustomer(store, customer);
    saveStore(store);
    return send(res, 200, {
      ok: true,
      token: makeId("login_"),
      customer,
      bills: customerBillsForResponse(store, customer.id, 30)
    });
  }

  if (req.method === "POST" && pathname === "/api/public/player-auth") {
    const body = await readBody(req);
    const playerId = String(body.playerId || body.playerNo || "").trim();
    const secret = String(body.secret || "").trim();
    let session = {};
    if (!body.code) return send(res, 400, { ok: false, error: "请先使用当前微信完成验证" });
    try {
      session = await fetchMiniSession(body.code);
    } catch (error) {
      return send(res, 400, { ok: false, error: `微信验证失败：${error.message || "请重新进入小程序"}` });
    }
    const isGlobalWorkbenchSecret = Boolean(GLOBAL_PLAYER_WORKBENCH_SECRET && secret === GLOBAL_PLAYER_WORKBENCH_SECRET);
    const normalizedPlayerId = playerId.toLowerCase();
    const globalSecretAsPlayerId = isGlobalWorkbenchSecret && normalizedPlayerId === GLOBAL_PLAYER_WORKBENCH_SECRET.toLowerCase();
    const player = isGlobalWorkbenchSecret && (!normalizedPlayerId || globalSecretAsPlayerId)
      ? (store.catalog.players || [])[0]
      : (store.catalog.players || []).find((item) => {
      const id = String(item.id || "").toLowerCase();
      const playerNo = String(item.playerNo || "").toLowerCase();
      return id === normalizedPlayerId || playerNo === normalizedPlayerId;
    });
    if (!player) return send(res, 404, { ok: false, error: "打手不存在" });
    if (!secret || (!isGlobalWorkbenchSecret && secret !== String(player.workbenchSecret || ""))) {
      return send(res, 403, { ok: false, error: "打手密钥不正确" });
    }
    const openid = String(session.openid || "").trim();
    const boundOpenid = String(player.workbenchOpenid || player.boundWechatOpenid || "").trim();
    if (!openid) return send(res, 400, { ok: false, error: "微信验证失败，请重新进入小程序" });
    if (!isGlobalWorkbenchSecret && boundOpenid && boundOpenid !== openid) {
      return send(res, 403, { ok: false, error: "该打手工作台已绑定其他微信账号，请联系后台解绑" });
    }
    if (!isGlobalWorkbenchSecret && !boundOpenid) {
      player.workbenchOpenid = openid;
      player.workbenchBoundAt = new Date().toISOString();
      saveStore(store);
    }
    const { workbenchSecret, playerSecret, secret: legacySecret, workbenchOpenid, boundWechatOpenid, workbenchBoundAt, ...safePlayer } = player;
    return send(res, 200, {
      ok: true,
      player: safePlayer,
      playerLevelGroups: store.catalog.playerLevelGroups,
      orders: (store.orders || []).filter((order) => order.playerId === player.id || order.playerName === player.name),
      specifiedOrders: (store.orders || []).filter((order) => (
        (order.playerId === player.id || order.playerName === player.name) &&
        order.requiresPlayerAccept &&
        !order.playerAcceptedAt
      )),
      playerTransactions: (store.playerTransactions || []).filter((item) => (
        item.playerId === player.id ||
        item.playerNo === player.playerNo ||
        item.playerName === player.name
      )),
      auth: {
        playerId: player.id,
        playerName: player.name,
        wechatBound: true,
        globalWorkbench: isGlobalWorkbenchSecret,
        authedAt: new Date().toISOString()
      }
    });
  }

  if (req.method === "PATCH" && pathname === "/api/public/player-profile-media") {
    const body = await readBody(req);
    const playerKey = String(body.playerId || body.playerNo || "").trim();
    const player = (store.catalog.players || []).find((item) => (
      String(item.id || "") === playerKey ||
      String(item.playerNo || "") === playerKey ||
      String(item.name || "") === playerKey
    ));
    if (!player) return send(res, 404, { ok: false, error: "打手不存在" });
    const oldName = player.name;
    if (body.name !== undefined) player.name = String(body.name || player.name || "").trim() || player.name;
    if (body.avatar) player.avatar = String(body.avatar || "").trim();
    if (body.cover) player.cover = String(body.cover || "").trim();
    player.updatedAt = new Date().toISOString();
    (store.orders || []).forEach((order) => {
      const matched = [
        order.playerId,
        order.playerNo,
        order.playerName,
        order.specifiedPlayerId,
        order.specifiedPlayerName
      ].map((item) => String(item || "").trim()).some((key) => (
        key &&
        (
          key === String(player.id || "") ||
          key === String(player.playerNo || "") ||
          key === String(oldName || "") ||
          key === String(player.name || "")
        )
      ));
      if (!matched) return;
      if (order.playerId || order.playerName) {
        order.playerId = order.playerId || player.id || player.playerNo || "";
        order.playerNo = order.playerNo || player.playerNo || player.id || "";
        order.playerName = player.name || order.playerName;
        order.playerAvatar = player.avatar || order.playerAvatar || "";
      }
      if (order.specifiedPlayerId || order.specifiedPlayerName) {
        order.specifiedPlayerName = player.name || order.specifiedPlayerName;
      }
      order.updatedAt = new Date().toISOString();
    });
    saveStore(store);
    const { workbenchSecret, playerSecret, secret, workbenchOpenid, boundWechatOpenid, ...safePlayer } = player;
    return send(res, 200, { ok: true, player: safePlayer });
  }

  if (req.method === "GET" && pathname === "/api/public/player-wallet") {
    const playerKey = String(url.searchParams.get("playerId") || url.searchParams.get("playerNo") || "").trim();
    const player = findPlayerByKey(store, playerKey);
    if (!player) return send(res, 404, { ok: false, error: "打手不存在" });
    const transactions = (store.playerTransactions || []).filter((item) => (
      item.playerId === player.id ||
      item.playerNo === player.playerNo ||
      item.playerName === player.name
    ));
    return send(res, 200, {
      ok: true,
      player,
      transactions
    });
  }

  if (req.method === "GET" && pathname === "/api/public/recharge-config") {
    return send(res, 200, { config: getRechargeConfig(store) });
  }

  if (req.method === "GET" && pathname === "/api/public/customer-profile") {
    const customer = ensureCustomer(store, {
      id: url.searchParams.get("userId") || "boss-demo",
      userName: url.searchParams.get("userName") || "喵喵喵",
      contact: "小程序内联系"
    });
    saveStore(store);
    return send(res, 200, {
      customer,
      memberLevels: store.settings.memberLevels,
      referral: getActiveReferral(store, customer.id) || null,
      referralConfig: getReferralConfig(store),
      bills: customerBillsForResponse(store, customer.id, 30)
    });
  }

  if (req.method === "PATCH" && pathname === "/api/public/customer-profile") {
    const body = await readBody(req);
    const customer = ensureCustomer(store, {
      id: body.userId || body.id || "boss-demo",
      userName: body.userName || body.name || "喵喵喵",
      avatar: body.avatar || "",
      contact: "小程序内联系"
    });
    if (body.userName !== undefined || body.name !== undefined) {
      customer.name = String(body.userName || body.name || customer.name || "喵喵喵").trim();
    }
    if (body.avatar !== undefined) customer.avatar = String(body.avatar || "").trim();
    customer.updatedAt = new Date().toISOString();
    ensureCustomer(store, customer);
    saveStore(store);
    return send(res, 200, {
      customer,
      bills: customerBillsForResponse(store, customer.id, 30)
    });
  }

  if (req.method === "GET" && pathname === "/api/public/referral") {
    const userId = String(url.searchParams.get("userId") || "").trim();
    const customer = userId ? ensureCustomer(store, { id: userId, userName: "喵喵喵" }) : null;
    if (customer) saveStore(store);
    return send(res, 200, {
      referral: customer ? (getActiveReferral(store, customer.id) || null) : null,
      referralConfig: getReferralConfig(store)
    });
  }

  if (req.method === "POST" && pathname === "/api/public/referrals") {
    const body = await readBody(req);
    const userId = String(body.userId || "").trim();
    const inviterId = String(body.inviterId || "").trim();
    if (!/^\d{6}$/.test(userId) || !/^\d{6}$/.test(inviterId)) {
      return send(res, 400, { error: "请输入正确的 6 位用户 ID" });
    }
    if (userId === inviterId) return send(res, 400, { error: "不能填写自己的 ID" });
    const customer = ensureCustomer(store, {
      id: userId,
      userName: body.userName || "喵喵喵",
      contact: "小程序内联系"
    });
    const inviter = ensureCustomer(store, {
      id: inviterId,
      userName: body.inviterName || `用户${inviterId}`,
      contact: "小程序内联系"
    });
    store.referrals = Array.isArray(store.referrals) ? store.referrals : [];
    const existing = store.referrals.find((item) => item.userId === customer.id && item.status !== "disabled");
    if (existing) {
      return send(res, 200, {
        referral: existing,
        referralConfig: getReferralConfig(store),
        message: existing.inviterId === inviterId ? "邀请关系已存在" : "该用户已经绑定过邀请人"
      });
    }
    const config = getReferralConfig(store);
    const referral = {
      id: makeId("invite_"),
      userId: customer.id,
      userName: customer.name,
      inviterId: inviter.id,
      inviterName: inviter.name,
      rate: config.rate,
      months: config.months,
      status: "active",
      createdAt: new Date().toISOString()
    };
    customer.inviterId = inviter.id;
    customer.invitedAt = referral.createdAt;
    store.referrals.unshift(referral);
    saveStore(store);
    return send(res, 201, { referral, referralConfig: config });
  }

  if (req.method === "GET" && pathname === "/api/public/customer-bills") {
    const userId = url.searchParams.get("userId") || "boss-demo";
    ensureCustomer(store, { id: userId, userName: "喵喵喵" });
    saveStore(store);
    return send(res, 200, {
      bills: customerBillsForResponse(store, userId, 100)
    });
  }

  if (req.method === "GET" && pathname === "/api/public/player-favorites") {
    const userId = String(url.searchParams.get("userId") || "").trim();
    if (!userId) return send(res, 400, { error: "缺少用户ID" });
    return send(res, 200, { favorites: customerFavoritePlayers(store, userId) });
  }

  if (req.method === "POST" && pathname === "/api/public/player-favorites") {
    const body = await readBody(req);
    const userId = String(body.userId || "").trim();
    const playerId = String(body.playerId || "").trim();
    if (!userId || !playerId) return send(res, 400, { error: "缺少用户ID或打手ID" });
    const player = (store.catalog?.players || []).find((item) => item.id === playerId);
    if (!player) return send(res, 404, { error: "打手不存在" });
    store.playerFavorites = Array.isArray(store.playerFavorites) ? store.playerFavorites : [];
    let favorite = store.playerFavorites.find((item) => item.userId === userId && item.playerId === playerId);
    if (!favorite) {
      favorite = {
        id: makeId("fav_"),
        userId,
        playerId,
        playerName: player.name,
        createdAt: new Date().toISOString()
      };
      store.playerFavorites.unshift(favorite);
    }
    saveStore(store);
    return send(res, 201, { favorite, favorites: customerFavoritePlayers(store, userId) });
  }

  if (req.method === "DELETE" && pathname === "/api/public/player-favorites") {
    const userId = String(url.searchParams.get("userId") || "").trim();
    const playerId = String(url.searchParams.get("playerId") || "").trim();
    store.playerFavorites = (store.playerFavorites || []).filter((item) => !(item.userId === userId && item.playerId === playerId));
    saveStore(store);
    return send(res, 200, { favorites: customerFavoritePlayers(store, userId) });
  }

  if (req.method === "GET" && pathname === "/api/public/player-reviews") {
    const playerId = String(url.searchParams.get("playerId") || "").trim();
    const userId = String(url.searchParams.get("userId") || "").trim();
    if (playerId) return send(res, 200, { reviews: publicReviewsForPlayer(store, playerId) });
    if (userId) return send(res, 200, { reviews: publicReviewsForUser(store, userId) });
    return send(res, 400, { error: "缺少打手ID或用户ID" });
  }

  if (req.method === "POST" && pathname === "/api/public/player-reviews") {
    const body = await readBody(req);
    try {
      const review = createOrUpdatePlayerReview(store, body);
      saveStore(store);
      return send(res, 201, {
        review,
        playerReviews: publicReviewsForPlayer(store, review.playerId),
        userReviews: publicReviewsForUser(store, review.userId)
      });
    } catch (error) {
      return send(res, error.status || 400, { error: error.message || "评价失败" });
    }
  }

  if (req.method === "POST" && pathname === "/api/public/player-complaints") {
    const body = await readBody(req);
    const userId = String(body.userId || "").trim();
    const userName = String(body.userName || "小程序用户").trim();
    const playerId = String(body.playerId || "").trim();
    const playerName = String(body.playerName || "").trim();
    const reason = String(body.reason || "其他问题").trim();
    const content = String(body.content || "").trim();
    if (!userId) return send(res, 400, { error: "缺少投诉人ID" });
    if (!playerId) return send(res, 400, { error: "缺少被投诉打手ID" });
    if (!content) return send(res, 400, { error: "请填写投诉内容" });
    store.complaints = Array.isArray(store.complaints) ? store.complaints : [];
    const complaint = {
      id: makeId("CP"),
      userId,
      userName,
      playerId,
      playerName,
      reason,
      content,
      status: "pending",
      createdAt: new Date().toISOString()
    };
    store.complaints.unshift(complaint);
    saveStore(store);
    return send(res, 201, { complaint });
  }

  if (req.method === "GET" && pathname === "/api/public/orders") {
    const userId = String(url.searchParams.get("userId") || "").trim();
    const playerId = String(url.searchParams.get("playerId") || "").trim();
    const orders = (store.orders || []).filter((order) => {
      if (userId && String(order.userId || "") !== userId) return false;
      if (playerId && String(order.playerId || "") !== playerId) return false;
      return true;
    }).map((order) => ({
      ...order,
      canReview: order.status === "已完成" && !order.reviewed && orderHasReviewTarget(store, order),
      review: (store.playerReviews || []).find((review) => review.orderId === order.id) || null
    }));
    return send(res, 200, { orders });
  }

  const publicOrderConfirmMatch = pathname.match(/^\/api\/public\/orders\/([^/]+)\/confirm-complete$/);
  if (publicOrderConfirmMatch && req.method === "POST") {
    const body = await readBody(req);
    const orderId = decodeURIComponent(publicOrderConfirmMatch[1]);
    const role = String(body.role || "").trim();
    const order = (store.orders || []).find((item) => item.id === orderId);
    if (!order) return send(res, 404, { error: "订单不存在" });
    if (order.status === "已完成") {
      return send(res, 200, {
        order,
        canReview: !order.reviewed && orderHasReviewTarget(store, order)
      });
    }
    if (role === "boss") {
      const userId = String(body.userId || "").trim();
      if (userId && String(order.userId || "") !== userId) return send(res, 403, { error: "只能确认自己的订单" });
      order.bossConfirmedDone = true;
      order.bossConfirmedAt = new Date().toISOString();
    } else if (role === "player") {
      const playerId = String(body.playerId || body.playerNo || "").trim();
      if (playerId && ![order.playerId, order.playerNo, order.playerName].map((item) => String(item || "")).includes(playerId)) {
        return send(res, 403, { error: "只能由接单打手确认" });
      }
      const wasPendingBossConfirm = Boolean(order.playerConfirmedDone && !order.bossConfirmedDone);
      order.playerConfirmedDone = true;
      order.playerConfirmedAt = new Date().toISOString();
      if (!order.bossConfirmedDone && order.status !== "已完成") {
        order.status = "待老板确认结单";
      }
      if (!wasPendingBossConfirm) {
        appendOrderSessionEvent(store, order, `${order.playerName || "打手"}已确认结单，请老板确认是否结单。`);
      }
    } else {
      return send(res, 400, { error: "确认角色不正确" });
    }
    if (order.bossConfirmedDone && order.playerConfirmedDone) {
      updateOrderStatusWithSideEffects(store, order, "已完成", role === "boss" ? "老板" : "打手");
    }
    order.updatedAt = new Date().toISOString();
    saveStore(store);
    return send(res, 200, {
      order,
      canReview: order.status === "已完成" && !order.reviewed && orderHasReviewTarget(store, order)
    });
  }

  if (req.method === "GET" && pathname === "/api/public/player-orders") {
    const playerId = String(url.searchParams.get("playerId") || url.searchParams.get("playerNo") || "").trim();
    if (!playerId) return send(res, 400, { error: "缺少打手ID" });
    const orders = (store.orders || []).filter((order) => (
      String(order.playerId || "") === playerId ||
      String(order.playerNo || "") === playerId ||
      String(order.playerName || "") === playerId
    ));
    return send(res, 200, {
      orders,
      specifiedOrders: orders.filter((order) => order.requiresPlayerAccept && !order.playerAcceptedAt)
    });
  }

  const playerAcceptMatch = pathname.match(/^\/api\/public\/player-orders\/([^/]+)\/accept$/);
  if (playerAcceptMatch && req.method === "POST") {
    const body = await readBody(req);
    const orderId = decodeURIComponent(playerAcceptMatch[1]);
    const playerId = String(body.playerId || body.playerNo || "").trim();
    const order = (store.orders || []).find((item) => item.id === orderId);
    if (!order) return send(res, 404, { error: "订单不存在" });
    if (playerId && ![order.playerId, order.playerNo, order.playerName].map((item) => String(item || "")).includes(playerId)) {
      if (order.requiresPlayerAccept) return send(res, 403, { error: "只能由指定打手接单" });
    }
    const hasAssignedPlayer = Boolean(order.playerId || (order.playerName && !["待分配", "未分配"].includes(String(order.playerName))));
    if (!order.requiresPlayerAccept && hasAssignedPlayer && ![order.playerId, order.playerNo, order.playerName].map((item) => String(item || "")).includes(playerId)) {
      return send(res, 409, { error: "该订单已被其他打手接走" });
    }
    const acceptingPlayer = (store.catalog?.players || []).find((item) => (
      String(item.id || "") === playerId ||
      String(item.playerNo || "") === playerId ||
      String(item.name || "") === playerId
    ));
    if (acceptingPlayer) {
      order.playerId = acceptingPlayer.id || playerId;
      order.playerNo = acceptingPlayer.playerNo || acceptingPlayer.id || playerId;
      order.playerName = acceptingPlayer.name || playerId;
      order.playerAvatar = acceptingPlayer.avatar || "";
    } else if (playerId) {
      order.playerId = playerId;
      order.playerNo = String(body.playerNo || playerId);
      order.playerName = String(body.playerName || playerId);
      order.playerAvatar = String(body.playerAvatar || "");
    }
    if (!order.sessionId) order.sessionId = publicSessionId(order.userId || "boss-demo");
    let session = store.sessions.find((item) => item.id === order.sessionId);
    const assignedStaff = session?.assignedTo
      ? (store.staffAccounts || []).find((item) => item.id === session.assignedTo || item.name === session.assignedTo || item.username === session.assignedTo)
      : pickOnlineStaff(store);
    order.playerAcceptedAt = new Date().toISOString();
    order.requiresPlayerAccept = false;
    updateOrderStatusWithSideEffects(store, order, "已确认", order.playerName || "打手");
    if (assignedStaff) {
      order.assigneeId = assignedStaff.id;
      order.assignee = assignedStaff.name;
    }
    if (!session) {
      session = {
        id: order.sessionId,
        title: "指定陪玩订单群聊",
        channel: "小程序群聊",
        userName: order.userName || "小程序用户",
        userId: order.userId || "",
        status: "open",
        priority: "normal",
        assignedTo: assignedStaff ? assignedStaff.id : null,
        tags: ["指定陪玩", order.gameName || ""].filter(Boolean),
        contact: order.contact || order.userPhone || "小程序内联系",
        remark: `指定打手：${order.playerName || order.playerId || ""}`,
        unreadStaff: 1,
        unreadUser: 0,
        firstSeenAt: new Date().toISOString(),
        lastMessageAt: new Date().toISOString()
      };
      store.sessions.unshift(session);
    } else if (assignedStaff && !session.assignedTo) {
      session.assignedTo = assignedStaff.id;
      session.lastMessageAt = new Date().toISOString();
    }
    appendOrderSessionEvent(store, order, `${order.playerName || "指定打手"}已接单并进入本单群聊。`);
    saveStore(store);
    return send(res, 200, { order, session: enrichSession(session, store) });
  }

  if (req.method === "POST" && pathname === "/api/public/customer-pay") {
    const body = await readBody(req);
    const amount = Number(body.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return send(res, 400, { ok: false, error: "支付金额必须大于0" });
    }
    const customer = ensureCustomer(store, {
      id: body.userId || "boss-demo",
      userName: body.userName || "喵喵喵",
      contact: body.contact || "小程序内联系"
    });
    const balance = Math.max(0, Number(customer.balanceCatFood || 0));
    if (balance < amount) {
      return send(res, 400, {
        ok: false,
        error: "猫粮不足",
        balance,
        shortage: Number((amount - balance).toFixed(2))
      });
    }
    customer.balanceCatFood = Number(Math.max(0, balance - amount).toFixed(2));
    customer.updatedAt = new Date().toISOString();
    ensureCustomer(store, customer);
    const bill = addCustomerBill(store, customer, {
      id: body.orderId ? `pay-${body.orderId}` : undefined,
      type: body.type || "order",
      title: body.title || "订单消费",
      amount: -amount,
      note: body.note || "小程序猫粮支付"
    });
    let playerGiftTransaction = null;
    if (String(body.type || "") === "gift") {
      try {
        const giftResult = recordPlayerGiftIncome(store, {
          id: body.orderId ? `gift-income-${body.orderId}` : "",
          orderId: body.orderId || "",
          userId: customer.id,
          userName: customer.name || body.userName || "老板",
          playerId: body.playerId || body.playerNo || body.playerName || "",
          playerNo: body.playerNo || body.playerId || "",
          playerName: body.playerName || "",
          playerAvatar: body.playerAvatar || "",
          giftId: body.giftId || "",
          giftName: body.giftName || body.title || "礼物",
          amount,
          note: body.note || ""
        });
        playerGiftTransaction = giftResult.transaction;
      } catch (error) {
        customer.balanceCatFood = Number((Number(customer.balanceCatFood || 0) + amount).toFixed(2));
        store.customerBills = (store.customerBills || []).filter((item) => item.id !== bill.id);
        return send(res, error.status || 400, { ok: false, error: error.message || "礼物入账失败，未扣款" });
      }
    }
    saveStore(store);
    return send(res, 200, {
      ok: true,
      customer,
      bill: serializeCustomerBill(bill),
      bills: customerBillsForResponse(store, customer.id, 30),
      playerGiftTransaction
    });
  }

  if (req.method === "POST" && pathname === "/api/public/recharge-orders") {
    const body = await readBody(req);
    let recharge;
    let miniSession = {};
    let virtualWarning = "";
    try {
      if (body.code) {
        try {
          miniSession = await fetchMiniSession(body.code);
        } catch (error) {
          virtualWarning = `code2session失败：${error.message || "unknown"}`;
          console.error("[virtual-pay-session-warning]", virtualWarning);
        }
      }
      recharge = createRechargeOrder(store, body, "小程序充值");
      const customer = ensureCustomer(store, {
        id: body.userId || "boss-demo",
        userName: body.userName || "喵喵喵",
        openid: miniSession.openid || ""
      });
      if (miniSession.session_key) customer.miniSessionKey = miniSession.session_key;
      if (miniSession.openid) recharge.openid = miniSession.openid;
      recharge.sessionKey = customer.miniSessionKey || miniSession.session_key || "";
    } catch (error) {
      return send(res, 400, { error: error.message || "充值金额必须大于 0" });
    }
    saveStore(store);
    const paymentMode = ["official_virtual", "service_account_wechat"].includes(store.settings?.paymentMode)
      ? store.settings.paymentMode
      : "official_virtual";
    let virtualPayParams = null;
    try {
      virtualPayParams = paymentMode === "official_virtual" ? createVirtualPayParams(store, recharge) : null;
    } catch (error) {
      virtualWarning = `虚拟支付参数生成失败：${error.message || "unknown"}`;
      console.error("[virtual-pay-param-error]", error);
      virtualPayParams = null;
    }
    return send(res, 201, {
      recharge,
      payUrl: paymentMode === "service_account_wechat" ? recharge.payUrl : null,
      payParams: null,
      virtualPayParams,
      paymentMode,
      warning: virtualWarning
    });
  }

  if (req.method === "POST" && pathname === "/api/public/recharge-orders/complete") {
    const body = await readBody(req);
    const orderNo = String(body.orderNo || body.id || "").trim();
    const order = getRechargeOrder(store, orderNo);
    if (!order) return send(res, 404, { error: "充值订单不存在" });
    if (order.payProvider !== "official_virtual_payment") {
      return send(res, 400, { error: "该订单不是官方虚拟支付订单" });
    }
    finishRechargeOrder(store, order, {
      transactionId: body.transactionId || `virtual_${order.orderNo || order.id}`,
      tradeState: "SUCCESS"
    });
    saveStore(store);
    const customer = ensureCustomer(store, { id: order.userId, userName: order.userName });
    return send(res, 200, {
      ok: true,
      order,
      customer,
      bills: customerBillsForResponse(store, customer.id, 30)
    });
  }

  if (req.method === "POST" && pathname === "/api/public/service-pay-orders") {
    const body = await readBody(req);
    let payOrder;
    try {
      payOrder = createRechargeOrder(store, body, "客服会话支付链接");
    } catch (error) {
      return send(res, 400, { error: error.message || "支付金额必须大于 0" });
    }
    saveStore(store);
    return send(res, 201, {
      payOrder,
      payUrl: payOrder.payUrl,
      payParams: null
    });
  }

  if (req.method === "GET" && pathname === "/api/public/recharge-order") {
    const order = getRechargeOrder(store, url.searchParams.get("orderNo"));
    if (!order) return send(res, 404, { error: "充值订单不存在" });
    const syncResult = await syncRechargeOrderPayment(store, order, "public_query");
    if (syncResult.synced || syncResult.transaction || syncResult.error) saveStore(store);
    return send(res, 200, { order });
  }

  if (req.method === "POST" && pathname === "/api/public/service-pay-jsapi") {
    const body = await readBody(req);
    const order = getRechargeOrder(store, body.orderNo);
    if (!order) return send(res, 404, { error: "充值订单不存在" });
    const syncResult = await syncRechargeOrderPayment(store, order, "before_jsapi");
    if (syncResult.synced || syncResult.transaction || syncResult.error) saveStore(store);
    if (order.status === "paid") return send(res, 200, { order });
    const config = getWechatPayConfig();
    if (!isWechatPayConfigured(config)) {
      if (config.mock) {
        finishRechargeOrder(store, order, { transactionId: `mock_${Date.now()}`, tradeState: "MOCK_SUCCESS" });
        saveStore(store);
        return send(res, 200, { mockPaid: true, order });
      }
      return send(res, 503, { error: "微信支付参数未配置，请先配置小程序和商户号密钥" });
    }
    const code = String(body.code || "").trim();
    if (!order.openid && !code) return send(res, 400, { error: "缺少服务号网页授权 code" });
    try {
      if (!order.openid) {
        order.openid = await fetchWechatOpenid(code, config);
        order.updatedAt = new Date().toISOString();
        saveStore(store);
      }
      const payParams = await createWechatJsapiPayParams(order, order.openid, config);
      saveStore(store);
      return send(res, 200, { order, payParams });
    } catch (error) {
      return send(res, 500, { error: error.message || "创建微信支付失败" });
    }
  }

  if (req.method === "POST" && pathname === "/api/pay/notify") {
    const body = await readBody(req);
    const config = getWechatPayConfig();
    try {
      const resource = body.resource ? decryptWechatResource(body.resource, config.apiV3Key) : body;
      const order = getRechargeOrder(store, resource.out_trade_no);
      if (!order) return send(res, 200, { code: "SUCCESS", message: "订单不存在，已忽略" });
      if (resource.trade_state === "SUCCESS") {
        finishRechargeOrder(store, order, {
          transactionId: resource.transaction_id,
          tradeState: resource.trade_state
        });
        saveStore(store);
      }
      return send(res, 200, { code: "SUCCESS", message: "成功" });
    } catch (error) {
      return send(res, 500, { code: "FAIL", message: error.message || "回调处理失败" });
    }
  }

  if (req.method === "POST" && pathname === "/api/public/player-withdrawals") {
    const body = await readBody(req);
    const amount = Number(body.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return send(res, 400, { error: "提现金额必须大于 0" });
    }
    const withdrawal = {
      id: String(body.id || `W${Date.now()}`),
      playerId: String(body.playerId || body.playerNo || ""),
      playerNo: String(body.playerNo || body.playerId || ""),
      playerName: String(body.playerName || "打手"),
      avatar: String(body.avatar || ""),
      amount: Number(amount.toFixed(2)),
      tokenName: TOKEN_NAME,
      status: "pending",
      statusText: "审核中",
      remark: String(body.remark || ""),
      balanceDeducted: true,
      refunded: false,
      createdAt: body.createdAt || new Date().toISOString(),
      processedAt: ""
    };
    if (!store.playerWithdrawals.some((item) => item.id === withdrawal.id)) {
      const player = findWithdrawalPlayer(store, withdrawal);
      if (player) {
        const earnedBalance = Number(player.earnedCatFood ?? player.balanceCatFood ?? 0);
        if (earnedBalance < withdrawal.amount) {
          return send(res, 400, {
            error: "可提现猫粮不足，打手只能提现订单收入猫粮",
            earnedCatFood: earnedBalance,
            rechargeCatFood: Number(player.rechargeCatFood || 0)
          });
        }
        player.earnedCatFood = Number(Math.max(0, earnedBalance - withdrawal.amount).toFixed(2));
        player.balanceCatFood = player.earnedCatFood;
        player.pendingWithdrawCatFood = Number((Number(player.pendingWithdrawCatFood || 0) + withdrawal.amount).toFixed(2));
        player.totalCatFood = Number((Number(player.earnedCatFood || 0) + Number(player.rechargeCatFood || 0)).toFixed(2));
      }
      store.playerWithdrawals.unshift(withdrawal);
    }
    saveStore(store);
    return send(res, 201, { withdrawal });
  }

  if (req.method === "POST" && pathname === "/api/public/orders") {
    const body = await readBody(req);
    const specifiedPlayerId = String(body.playerId || body.specifiedPlayerId || "").trim();
    const specifiedPlayer = specifiedPlayerId
      ? (store.catalog?.players || []).find((item) => item.id === specifiedPlayerId || item.playerNo === specifiedPlayerId || item.name === specifiedPlayerId)
      : null;
    if (specifiedPlayerId && !specifiedPlayer) return send(res, 404, { error: "指定打手不存在" });
    const isSpecifiedPlayerOrder = Boolean(specifiedPlayerId && specifiedPlayer);
    const customer = ensureCustomer(store, {
      id: body.userId || "boss-demo",
      userName: body.userName || "喵喵喵",
      contact: body.contact || "小程序内联系"
    });
    const sessionId = body.sessionId || publicSessionId(customer.id);
    const existingSession = store.sessions.find((item) => item.id === sessionId);
    const assignedStaff = isSpecifiedPlayerOrder
      ? null
      : (existingSession?.assignedTo
        ? (store.staffAccounts || []).find((item) => item.id === existingSession.assignedTo || item.name === existingSession.assignedTo || item.username === existingSession.assignedTo)
        : pickOnlineStaff(store));
    const originalAmount = Number(body.originalAmount || body.price || body.amount || 0);
    const discount = Math.max(1, Math.min(100, Number(customer.memberDiscount || 100)));
    const payableAmount = Number((originalAmount * discount / 100).toFixed(2));
    const order = {
      id: String(body.id || `P${Date.now()}`),
      sessionId,
      userId: customer.id,
      userName: String(body.userName || customer.name || "小程序用户"),
      userPhone: String(body.contact || body.userPhone || "小程序内联系"),
      playerId: isSpecifiedPlayerOrder ? specifiedPlayer.id : String(body.playerId || ""),
      playerName: String(body.playerName || specifiedPlayer?.name || ""),
      gameName: String(body.gameName || ""),
      serviceName: String(body.title || body.serviceName || "陪玩服务"),
      platform: String(body.platform || "小程序"),
      unitPrice: payableAmount / Math.max(1, Number(body.hours || body.duration || 1)),
      duration: Number(body.hours || body.duration || 1),
      time: String(body.time || ""),
      amount: payableAmount,
      originalAmount,
      memberLevelName: customer.memberLevelName,
      memberDiscount: discount,
      revenueConfigId: String(body.revenueConfigId || ""),
      currency: TOKEN_CURRENCY,
      tokenName: TOKEN_NAME,
      status: isSpecifiedPlayerOrder ? "待打手接单" : "待确认",
      source: "小程序",
      requiresPlayerAccept: isSpecifiedPlayerOrder,
      specifiedPlayerId: isSpecifiedPlayerOrder ? specifiedPlayer.id : "",
      specifiedPlayerName: isSpecifiedPlayerOrder ? specifiedPlayer.name : "",
      assigneeId: assignedStaff ? assignedStaff.id : "",
      assignee: assignedStaff ? assignedStaff.name : "",
      note: String(body.note || ""),
      contact: String(body.contact || "小程序内联系"),
      createdAt: new Date().toISOString()
    };
    applyRevenueToOrder(store, order);
    const alreadyPaid = body.paymentStatus === "paid_cat_food" || body.paidCatFood === true;
    if (!alreadyPaid) {
      const balance = Math.max(0, Number(customer.balanceCatFood || 0));
      if (balance < payableAmount) {
        return send(res, 400, {
          error: "猫粮不足",
          balance,
          shortage: Number((payableAmount - balance).toFixed(2))
        });
      }
      customer.balanceCatFood = Number(Math.max(0, balance - payableAmount).toFixed(2));
      addCustomerBill(store, customer, {
        type: "order",
        title: "订单消费",
        amount: -payableAmount,
        note: `${order.serviceName} · ${customer.memberLevelName}${discount < 100 ? ` ${discount}折` : ""}`
      });
    }
    customer.spentCatFood = Number((Number(customer.spentCatFood || 0) + originalAmount).toFixed(2));
    order.paymentStatus = "paid_cat_food";
    order.paidCatFood = payableAmount;
    ensureCustomer(store, customer);
    const referralCommission = applyReferralCommission(store, order, customer);
    let session = store.sessions.find((item) => item.id === order.sessionId);
    if (!session) {
      session = {
        id: order.sessionId,
        title: `${order.serviceName || "订单"}客服群聊`,
        channel: "小程序订单群",
        userName: order.userName,
        userId: order.userId,
        status: "open",
        priority: isSpecifiedPlayerOrder ? "high" : "normal",
        assignedTo: assignedStaff ? assignedStaff.id : null,
        tags: ["小程序", "订单"],
        contact: order.contact || "小程序内联系",
        remark: order.note || "",
        unreadStaff: 1,
        unreadUser: 0,
        firstSeenAt: new Date().toISOString(),
        lastUserMessageAt: new Date().toISOString(),
        lastStaffReplyAt: "",
        lastMessageAt: new Date().toISOString()
      };
      store.sessions.unshift(session);
      store.messages.push({
        id: makeId("msg_"),
        sessionId: order.sessionId,
        senderType: "system",
        senderName: "系统",
        type: "text",
        visibility: "public",
        content: `订单已创建：${order.serviceName || order.id}，订单号 ${order.id}。`,
        card: null,
        createdAt: new Date().toISOString()
      });
      if (order.note) {
        store.messages.push({
          id: makeId("msg_"),
          sessionId: order.sessionId,
          senderType: "system",
          senderName: "系统",
          type: "text",
          visibility: "public",
          content: `老板备注：${order.note}`,
          card: null,
          createdAt: new Date().toISOString()
        });
      }
    } else if (assignedStaff && !session.assignedTo) {
      session.assignedTo = assignedStaff.id;
      session.lastMessageAt = new Date().toISOString();
    }
    store.orders.unshift(order);
    saveStore(store);
    return send(res, 201, { order, referralCommission });
  }

  if (req.method === "POST" && pathname === "/api/public/session") {
    const body = await readBody(req);
    const userId = body.userId || "guest";
    const id = publicSessionId(userId);
    let session = store.sessions.find((item) => item.id === id);
    if (!session) {
      const assignedStaff = pickOnlineStaff(store);
      session = {
        id,
        title: "小程序客服群聊",
        channel: "小程序群聊",
        userName: body.userName || "小程序用户",
        userId,
        status: "open",
        priority: "normal",
        assignedTo: assignedStaff ? assignedStaff.id : null,
        tags: ["小程序"],
        contact: "小程序内联系",
        remark: "",
        unreadStaff: 1,
        unreadUser: 0,
        firstSeenAt: new Date().toISOString(),
        lastUserMessageAt: "",
        lastStaffReplyAt: "",
        lastMessageAt: new Date().toISOString()
      };
      store.sessions.unshift(session);
      store.messages.push({
        id: makeId("msg_"),
        sessionId: id,
        senderType: "system",
        senderName: "系统",
        type: "text",
        content: store.settings.autoGreeting,
        card: null,
        createdAt: new Date().toISOString()
      });
      saveStore(store);
    } else if (!session.assignedTo) {
      const assignedStaff = pickOnlineStaff(store);
      if (assignedStaff) {
        session.assignedTo = assignedStaff.id;
        session.lastMessageAt = new Date().toISOString();
        saveStore(store);
      }
    }
    return send(res, 200, { session });
  }

  if (req.method === "GET" && pathname === "/api/public/order-groups") {
    const playerId = String(url.searchParams.get("playerId") || url.searchParams.get("playerNo") || "").trim();
    const userId = String(url.searchParams.get("userId") || "").trim();
    const activeStatuses = new Set(["待确认", "待打手接单", "已确认", "待老板确认结单"]);
    const orders = (store.orders || []).filter((order) => {
      const isOwnUser = userId && String(order.userId || "") === userId;
      const isOwnPlayer = playerId && [order.playerId, order.playerNo, order.playerName, order.specifiedPlayerId, order.specifiedPlayerName]
        .map((item) => String(item || ""))
        .includes(playerId);
      if (isOwnUser || isOwnPlayer) return true;
      if (!playerId && userId) return false;
      if (order.requiresPlayerAccept) return false;
      return activeStatuses.has(order.status || "");
    }).map((order) => publicOrderSnapshot(store, order));
    return send(res, 200, { orders });
  }

  const publicMessagesMatch = pathname.match(/^\/api\/public\/sessions\/([^/]+)\/messages$/);
  if (publicMessagesMatch) {
    const sessionId = decodeURIComponent(publicMessagesMatch[1]);
    let target = store.sessions.find((item) => item.id === sessionId);
    if (!target) {
      const assignedStaff = pickOnlineStaff(store);
      target = {
        id: sessionId,
        title: "小程序订单群",
        channel: "小程序订单群",
        userName: "小程序用户",
        userId: sessionId.replace(/^group-/, "user_"),
        status: "open",
        priority: "normal",
        assignedTo: assignedStaff ? assignedStaff.id : null,
        tags: ["小程序", "订单"],
        contact: "小程序内联系",
        remark: "",
        unreadStaff: 0,
        unreadUser: 0,
        firstSeenAt: new Date().toISOString(),
        lastUserMessageAt: "",
        lastStaffReplyAt: "",
        lastMessageAt: new Date().toISOString()
      };
      store.sessions.unshift(target);
      saveStore(store);
    }
    if (req.method === "GET") {
      target.unreadUser = 0;
      const order = (store.orders || []).find((item) => item.sessionId === sessionId || item.id === sessionId || item.id === sessionId.replace(/^group-/, ""));
      saveStore(store);
      return send(res, 200, {
        messages: sortByTime(store.messages.filter((item) => item.sessionId === sessionId && item.visibility !== "internal")),
        order: publicOrderSnapshot(store, order),
        session: {
          id: target.id,
          status: target.status || "open",
          assignedTo: target.assignedTo || null
        }
      });
    }
    if (req.method === "POST") {
      const body = await readBody(req);
      if (!String(body.content || "").trim() && !body.card) return send(res, 400, { error: "消息不能为空" });
      const senderType = ["user", "player"].includes(String(body.senderType || "")) ? String(body.senderType) : "user";
      const message = createMessage(store, sessionId, {
        senderType,
        senderName: body.senderName || target.userName || "用户",
        type: "text",
        content: body.content,
        clientMessageId: body.clientMessageId || ""
      });
      saveStore(store);
      return send(res, 201, { message });
    }
  }

  if (pathname.startsWith("/api/admin/")) {
    const owner = requireOwner(req, res);
    if (!owner) return;

    if (req.method === "GET" && pathname === "/api/admin/me") {
      return send(res, 200, { user: owner });
    }

    if (req.method === "GET" && pathname === "/api/admin/dashboard") {
      const today = todayChinaDate();
      const users = store.customers.map((customer) => ({
        ...customer,
        source: "小程序",
        lastSeenAt: customer.updatedAt || customer.createdAt || ""
      }));
      return send(res, 200, {
        stats: {
          staff: store.staffAccounts.length,
          games: store.catalog.games.filter((item) => item.id !== "all").length,
          players: store.catalog.players.length,
          orders: store.orders.length,
          todayOrders: store.orders.filter((item) => startsWithChinaDate(item.createdAt, today)).length,
          sessions: store.sessions.length,
          users: users.length,
          onlineStaff: store.staffAccounts.filter(isStaffOnline).length,
          amount: store.orders.reduce((sum, item) => sum + Number(item.amount || 0), 0),
          rechargeAmount: store.rechargeOrders.reduce((sum, item) => sum + Number(item.tokenAmount || 0), 0),
          pendingWithdrawals: store.playerWithdrawals.filter((item) => item.status === "pending").length,
          pendingWithdrawalAmount: store.playerWithdrawals
            .filter((item) => item.status === "pending")
            .reduce((sum, item) => sum + Number(item.amount || 0), 0)
        },
        staff: store.staffAccounts.map((account) => safeStaffWithStats(account, store)),
        catalog: store.catalog,
        settings: store.settings,
        orders: store.orders,
        rechargeOrders: store.rechargeOrders,
        playerWithdrawals: store.playerWithdrawals,
        playerTransactions: store.playerTransactions,
        referrals: store.referrals,
        referralCommissions: store.referralCommissions,
        complaints: publicComplaints(store),
        sessions: store.sessions.map((session) => enrichSession(session, store)),
        users,
        customerBills: allCustomerBillsForResponse(store)
      });
    }

    const adminCustomerBalanceMatch = pathname.match(/^\/api\/admin\/customers\/([^/]+)\/balance$/);
    if (adminCustomerBalanceMatch && req.method === "POST") {
      const customerId = decodeURIComponent(adminCustomerBalanceMatch[1]);
      const body = await readBody(req);
      const amount = Number(body.amount || 0);
      if (!Number.isFinite(amount) || amount === 0) return send(res, 400, { error: "请输入调整猫粮数量" });
      const customer = ensureCustomer(store, {
        id: customerId,
        userName: body.userName || "小程序用户",
        contact: body.contact || "小程序内联系"
      });
      customer.balanceCatFood = Number(Math.max(0, Number(customer.balanceCatFood || 0) + amount).toFixed(2));
      customer.updatedAt = new Date().toISOString();
      ensureCustomer(store, customer);
      const bill = addCustomerBill(store, customer, {
        type: amount > 0 ? "admin_recharge" : "admin_deduct",
        title: amount > 0 ? "后台预存" : "后台扣减",
        amount,
        note: body.note || "总后台调整"
      });
      saveStore(store);
      return send(res, 200, {
        customer,
        bill: serializeCustomerBill(bill),
        customers: store.customers,
        customerBills: allCustomerBillsForResponse(store)
      });
    }

    if (req.method === "GET" && pathname === "/api/admin/staff") {
      return send(res, 200, { staff: store.staffAccounts.map((account) => safeStaffWithStats(account, store)) });
    }

    if (req.method === "POST" && pathname === "/api/admin/staff") {
      const body = await readBody(req);
      const username = String(body.username || "").trim();
      const name = String(body.name || "").trim();
      const password = String(body.password || "").trim();
      if (!username || !name || !password) return send(res, 400, { error: "账号、名称和密码不能为空" });
      if (password.length < 8) return send(res, 400, { error: "密码至少需要 8 位" });
      const duplicated = [...store.staffAccounts, ...store.adminAccounts].some((item) => item.username === username);
      if (duplicated) return send(res, 400, { error: "账号已存在" });
      const account = {
        id: String(body.id || username).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || makeId("staff_"),
        name,
        role: "support",
        username,
        password,
        avatar: String(body.avatar || ""),
        isOnline: body.isOnline !== false,
        lastOnlineAt: new Date().toISOString()
      };
      store.staffAccounts.push(account);
      saveStore(store);
      return send(res, 201, {
        staff: store.staffAccounts.map((item) => safeStaffWithStats(item, store)),
        account: safeStaffWithStats(account, store)
      });
    }

    const adminStaffMatch = pathname.match(/^\/api\/admin\/staff\/([^/]+)$/);
    if (adminStaffMatch) {
      const staffId = decodeURIComponent(adminStaffMatch[1]);
      const account = store.staffAccounts.find((item) => item.id === staffId);
      if (!account) return send(res, 404, { error: "客服不存在" });
      if (req.method === "PATCH") {
        const body = await readBody(req);
        if (body.username !== undefined) {
          const username = String(body.username || "").trim();
          if (!username) return send(res, 400, { error: "账号不能为空" });
          const duplicated = [...store.staffAccounts, ...store.adminAccounts]
            .some((item) => item.id !== account.id && item.username === username);
          if (duplicated) return send(res, 400, { error: "账号已存在" });
          account.username = username;
        }
        if (body.name !== undefined) account.name = String(body.name || "").trim();
        if (body.password !== undefined && String(body.password || "").trim()) {
          const password = String(body.password).trim();
          if (password.length < 8) return send(res, 400, { error: "密码至少需要 8 位" });
          account.password = password;
        }
        if (body.avatar !== undefined) account.avatar = String(body.avatar || "");
        if (body.isOnline !== undefined) {
          account.isOnline = Boolean(body.isOnline);
          account.lastOnlineAt = new Date().toISOString();
        }
        if (!account.name) return send(res, 400, { error: "客服名称不能为空" });
        saveStore(store);
        return send(res, 200, {
          staff: store.staffAccounts.map((item) => safeStaffWithStats(item, store)),
          account: safeStaffWithStats(account, store)
        });
      }
      if (req.method === "DELETE") {
        store.staffAccounts = store.staffAccounts.filter((item) => item.id !== staffId);
        store.sessions.forEach((session) => {
          if (session.assignedTo === staffId) session.assignedTo = null;
        });
        saveStore(store);
        return send(res, 200, { staff: store.staffAccounts.map((item) => safeStaffWithStats(item, store)) });
      }
    }

    if (req.method === "GET" && pathname === "/api/admin/catalog") {
      return send(res, 200, { catalog: store.catalog });
    }

    const adminPlayerBindCustomerMatch = pathname.match(/^\/api\/admin\/players\/([^/]+)\/bind-customer$/);
    if (req.method === "POST" && adminPlayerBindCustomerMatch) {
      const playerId = decodeURIComponent(adminPlayerBindCustomerMatch[1]);
      const body = await readBody(req);
      const customerId = String(body.customerId || body.userId || "").trim();
      if (!customerId) return send(res, 400, { error: "请输入用户ID" });
      const player = (store.catalog.players || []).find((item) => String(item.id || "") === playerId || String(item.playerNo || "") === playerId);
      if (!player) return send(res, 404, { error: "打手不存在" });
      const customer = (store.customers || []).find((item) => String(item.id || "") === customerId);
      if (!customer) return send(res, 404, { error: "用户不存在，请先用这个微信登录一次小程序" });
      const openid = String(customer.openid || "").trim();
      if (!openid) return send(res, 400, { error: "该用户没有微信OpenID，请先用微信登录小程序" });
      player.workbenchOpenid = openid;
      player.workbenchBoundAt = new Date().toISOString();
      player.workbenchBoundCustomerId = customer.id;
      player.workbenchBoundCustomerName = customer.name || "";
      saveStore(store);
      const { workbenchSecret, playerSecret, secret, workbenchOpenid, boundWechatOpenid, ...safePlayer } = player;
      return send(res, 200, {
        player,
        safePlayer,
        message: `已绑定 ${customer.name || customer.id} 为 ${player.name || player.id} 的工作台微信`
      });
    }

    if (req.method === "POST" && pathname === "/api/admin/uploads") {
      const body = await readBody(req);
      const url = saveUploadedImage(body.dataUrl, body.fileName);
      if (!url) return send(res, 400, { error: "请上传图片文件" });
      return send(res, 201, { url });
    }

    if (req.method === "PATCH" && pathname === "/api/admin/catalog") {
      const body = await readBody(req);
      store.catalog = normalizeCatalog(body.catalog || body);
      store.catalog.players.forEach((player) => {
        if (!store.settings.revenueConfigs.some((item) => item.id === player.revenueConfigId)) {
          player.revenueConfigId = store.settings.defaultRevenueConfigId;
        }
      });
      store.orders.forEach((order) => {
        refreshOrderRevenueConfigFromPlayer(store, order);
        applyRevenueToOrder(store, order);
        settleCompletedOrder(store, order);
      });
      store.serviceCards = catalogToServiceCards(store.catalog);
      saveStore(store);
      return send(res, 200, { catalog: store.catalog, serviceCards: store.serviceCards });
    }

    if (req.method === "GET" && pathname === "/api/admin/orders") {
      return send(res, 200, { orders: store.orders });
    }

    if (req.method === "GET" && pathname === "/api/admin/player-withdrawals") {
      return send(res, 200, { playerWithdrawals: store.playerWithdrawals });
    }

    const adminWithdrawalMatch = pathname.match(/^\/api\/admin\/player-withdrawals\/([^/]+)$/);
    if (adminWithdrawalMatch && req.method === "PATCH") {
      const withdrawalId = decodeURIComponent(adminWithdrawalMatch[1]);
      const body = await readBody(req);
      const withdrawal = store.playerWithdrawals.find((item) => item.id === withdrawalId);
      if (!withdrawal) return send(res, 404, { error: "提现申请不存在" });
      const nextStatus = String(body.status || "").trim();
      if (!["success", "rejected"].includes(nextStatus)) return send(res, 400, { error: "提现状态不正确" });
      if (withdrawal.status !== "pending") return send(res, 400, { error: "该提现申请已处理" });
      const player = findWithdrawalPlayer(store, withdrawal);
      withdrawal.status = nextStatus;
      withdrawal.statusText = nextStatus === "success" ? "提现成功" : "已拒绝";
      withdrawal.remark = String(body.remark || "").trim();
      withdrawal.processedAt = new Date().toISOString();
      if (player) {
        player.pendingWithdrawCatFood = Number(Math.max(0, Number(player.pendingWithdrawCatFood || 0) - Number(withdrawal.amount || 0)).toFixed(2));
        if (nextStatus === "success") {
          player.withdrawnCatFood = Number((Number(player.withdrawnCatFood || 0) + Number(withdrawal.amount || 0)).toFixed(2));
        }
        if (nextStatus === "rejected" && !withdrawal.refunded) {
          player.earnedCatFood = Number((Number(player.earnedCatFood ?? player.balanceCatFood ?? 0) + Number(withdrawal.amount || 0)).toFixed(2));
          player.balanceCatFood = player.earnedCatFood;
          withdrawal.refunded = true;
        }
        player.totalCatFood = Number((Number(player.earnedCatFood || 0) + Number(player.rechargeCatFood || 0)).toFixed(2));
      }
      saveStore(store);
      return send(res, 200, {
        withdrawal,
        playerWithdrawals: store.playerWithdrawals,
        catalog: store.catalog
      });
    }

    const adminOrderMatch = pathname.match(/^\/api\/admin\/orders\/([^/]+)$/);
    if (adminOrderMatch && req.method === "PATCH") {
      const orderId = decodeURIComponent(adminOrderMatch[1]);
      const body = await readBody(req);
      const order = store.orders.find((item) => item.id === orderId);
      if (!order) return send(res, 404, { error: "订单不存在" });
      ["contact", "time", "assignee", "note"].forEach((key) => {
        if (body[key] !== undefined) order[key] = String(body[key] || "").trim();
      });
      if (body.status !== undefined) updateOrderStatusWithSideEffects(store, order, String(body.status || "").trim(), owner.name || "总后台");
      if (body.assignee !== undefined) Object.assign(order, normalizeStaffAssignment(store, body.assignee));
      ensureOrderAssignee(store, order);
      if (body.amount !== undefined) order.amount = Number(body.amount || 0);
      applyRevenueToOrder(store, order);
      if (order.status === "已完成") settleCompletedOrder(store, order);
      order.updatedAt = new Date().toISOString();
      saveStore(store);
      return send(res, 200, { order, orders: store.orders });
    }

    const adminOrderInviteMatch = pathname.match(/^\/api\/admin\/orders\/([^/]+)\/invite-player$/);
    if (adminOrderInviteMatch && req.method === "POST") {
      const orderId = decodeURIComponent(adminOrderInviteMatch[1]);
      const body = await readBody(req);
      const order = store.orders.find((item) => item.id === orderId);
      if (!order) return send(res, 404, { error: "订单不存在" });
      try {
        const player = attachPlayerToOrder(store, order, body.playerId || body.playerNo || body.playerName, owner.name || "总后台");
        refreshOrderRevenueConfigFromPlayer(store, order);
        applyRevenueToOrder(store, order);
        saveStore(store);
        return send(res, 200, { order, player, orders: store.orders });
      } catch (error) {
        return send(res, error.status || 400, { error: error.message || "拉打手失败" });
      }
    }

    if (req.method === "GET" && pathname === "/api/admin/sessions") {
      return send(res, 200, { sessions: store.sessions.map((session) => enrichSession(session, store)) });
    }

    if (req.method === "PATCH" && pathname === "/api/admin/settings") {
      const body = await readBody(req);
      ["shopName", "businessHours", "autoGreeting", "customerServiceQrUrl", "offlineMessage", "quickMatchBackgroundUrl", "paymentMode", "virtualPaymentOfferId", "virtualPaymentAppKey", "virtualPaymentMode", "virtualPaymentEnv", "virtualPaymentCurrencyType", "virtualPaymentPlatform"].forEach((key) => {
        if (body[key] !== undefined) store.settings[key] = String(body[key] || "").trim();
      });
      if (body.slaMinutes !== undefined) store.settings.slaMinutes = Math.max(1, Math.min(120, Number(body.slaMinutes || 5)));
      if (body.referralEnabled !== undefined) store.settings.referralEnabled = body.referralEnabled !== false && body.referralEnabled !== "false";
      if (body.auditMode !== undefined) store.settings.auditMode = body.auditMode !== false && body.auditMode !== "false";
      if (body.referralCommissionRate !== undefined) store.settings.referralCommissionRate = Math.max(0, Math.min(100, Number(body.referralCommissionRate || 5)));
      if (body.referralCommissionMonths !== undefined) store.settings.referralCommissionMonths = Math.max(1, Math.min(12, Number(body.referralCommissionMonths || 1)));
      if (body.rechargeTiers !== undefined) store.settings.rechargeTiers = normalizeRechargeTiers(body.rechargeTiers);
      if (body.revenueConfigs !== undefined) store.settings.revenueConfigs = normalizeRevenueConfigs(body.revenueConfigs);
      if (body.memberLevels !== undefined) store.settings.memberLevels = normalizeMemberLevels(body.memberLevels);
      if (body.giftCatalog !== undefined) store.settings.giftCatalog = normalizeGiftCatalog(body.giftCatalog);
      if (body.defaultRevenueConfigId !== undefined) store.settings.defaultRevenueConfigId = String(body.defaultRevenueConfigId || "").trim();
      store.settings.revenueConfigs = normalizeRevenueConfigs(store.settings.revenueConfigs);
      store.settings.memberLevels = normalizeMemberLevels(store.settings.memberLevels);
      store.settings.giftCatalog = normalizeGiftCatalog(store.settings.giftCatalog);
      store.settings.paymentMode = ["official_virtual", "service_account_wechat"].includes(store.settings.paymentMode) ? store.settings.paymentMode : "official_virtual";
      if (!store.settings.revenueConfigs.some((item) => item.id === store.settings.defaultRevenueConfigId)) {
        store.settings.defaultRevenueConfigId = store.settings.revenueConfigs[0]?.id || "config_1";
      }
      store.catalog.players.forEach((player) => {
        if (!store.settings.revenueConfigs.some((item) => item.id === player.revenueConfigId)) {
          player.revenueConfigId = store.settings.defaultRevenueConfigId;
        }
      });
      store.orders.forEach((order) => {
        refreshOrderRevenueConfigFromPlayer(store, order);
        applyRevenueToOrder(store, order);
        settleCompletedOrder(store, order);
      });
      store.customers.forEach((customer) => ensureCustomer(store, customer));
      saveStore(store);
      return send(res, 200, { settings: store.settings });
    }

    return send(res, 404, { error: "总后台接口不存在" });
  }

  const user = requireStaff(req, res);
  if (!user) return;

  if (req.method === "GET" && pathname === "/api/me") {
    const account = findStaffAccount(store, user);
    const safeUser = account ? safeStaffWithStats(account, store) : user;
    Object.assign(user, safeUser);
    return send(res, 200, { user: safeUser });
  }

  if (req.method === "PATCH" && pathname === "/api/me/online") {
    const account = findStaffAccount(store, user);
    if (!account) return send(res, 404, { error: "客服账号不存在" });
    const body = await readBody(req);
    account.isOnline = Boolean(body.isOnline);
    account.lastOnlineAt = new Date().toISOString();
    saveStore(store);
    const safeUser = safeStaffWithStats(account, store);
    Object.assign(user, safeUser);
    return send(res, 200, { user: safeUser });
  }

  if (req.method === "PATCH" && pathname === "/api/me") {
    const account = findStaffAccount(store, user);
    if (!account) return send(res, 404, { error: "账号不存在" });
    const body = await readBody(req);
    const name = body.name !== undefined ? String(body.name || "").trim() : account.name;
    const avatar = body.avatar !== undefined ? String(body.avatar || "").trim() : account.avatar;
    if (!name) return send(res, 400, { error: "客服名称不能为空" });
    if (avatar.length > 800 * 1024) return send(res, 400, { error: "头像文件过大" });
    account.name = name;
    account.avatar = avatar;
    saveStore(store);
    const safeUser = safeStaffWithStats(account, store);
    Object.assign(user, safeUser);
    return send(res, 200, { user: safeUser });
  }

  if (req.method === "PATCH" && pathname === "/api/me/password") {
    const account = findStaffAccount(store, user);
    if (!account) return send(res, 404, { error: "账号不存在" });
    const body = await readBody(req);
    const oldPassword = String(body.oldPassword || "");
    const newPassword = String(body.newPassword || "");
    if (account.password !== oldPassword) return send(res, 400, { error: "原密码不正确" });
    if (newPassword.length < 6) return send(res, 400, { error: "新密码至少 6 位" });
    account.password = newPassword;
    saveStore(store);
    return send(res, 200, { ok: true });
  }

  if (req.method === "GET" && pathname === "/api/dashboard") {
    const today = todayChinaDate();
    const visibleSessions = staffScopedSessions(store, user);
    const visibleOrders = staffScopedOrders(store, user);
    const enrichedSessions = visibleSessions.map((session) => enrichSession(session, store));
    return send(res, 200, {
      stats: {
        openSessions: visibleSessions.filter((item) => item.status !== "closed").length,
        unread: visibleSessions.reduce((sum, item) => sum + Number(item.unreadStaff || 0), 0),
        pendingOrders: visibleOrders.filter((item) => item.status === "待确认").length,
        todayOrders: visibleOrders.filter((item) => startsWithChinaDate(item.createdAt, today)).length,
        waiting: enrichedSessions.filter((item) => item.slaStatus === "waiting").length,
        overdue: enrichedSessions.filter((item) => item.slaStatus === "overdue").length,
        onlineStaff: store.staffAccounts.filter(isStaffOnline).length
      },
      staff: store.staffAccounts.map((account) => safeStaffWithStats(account, store)),
      quickReplies: store.quickReplies,
      serviceCards: store.serviceCards,
      catalog: publicCatalog(store.catalog, store),
      settings: store.settings
    });
  }

  const staffCustomerMatch = pathname.match(/^\/api\/customers\/([^/]+)$/);
  if (staffCustomerMatch && req.method === "GET") {
    const customerId = decodeURIComponent(staffCustomerMatch[1]);
    const customer = ensureCustomer(store, { id: customerId });
    saveStore(store);
    return send(res, 200, {
      customer,
      bills: customerBillsForResponse(store, customer.id, 20)
    });
  }

  if (req.method === "POST" && pathname === "/api/customers/balance") {
    const body = await readBody(req);
    const customerId = String(body.userId || body.id || "").trim();
    const amount = Number(body.amount || 0);
    if (!customerId) return send(res, 400, { error: "请输入客户ID" });
    if (!Number.isFinite(amount) || amount === 0) return send(res, 400, { error: "请输入猫粮数量" });
    const customer = ensureCustomer(store, {
      id: customerId,
      userName: body.userName || body.name || "小程序用户",
      contact: body.contact || "客服补录"
    });
    const nextBalance = Number((Number(customer.balanceCatFood || 0) + amount).toFixed(2));
    if (nextBalance < 0) return send(res, 400, { error: "客户猫粮不能小于 0" });
    customer.balanceCatFood = nextBalance;
    customer.updatedAt = new Date().toISOString();
    ensureCustomer(store, customer);
    const bill = addCustomerBill(store, customer, {
      type: amount > 0 ? "staff_recharge" : "staff_deduct",
      title: amount > 0 ? "客服充值" : "客服扣减",
      amount,
      note: body.note || `${user.name || "客服"}后台处理`
    });
    saveStore(store);
    return send(res, 200, {
      customer,
      bill: serializeCustomerBill(bill),
      bills: customerBillsForResponse(store, customer.id, 20)
    });
  }

  if (req.method === "POST" && pathname === "/api/staff/orders") {
    const body = await readBody(req);
    const paymentMode = String(body.paymentMode || "customer_balance");
    const useCustomerBalance = paymentMode === "customer_balance";
    const customerId = String(body.customerId || body.userId || "").trim();
    if (useCustomerBalance && !customerId) return send(res, 400, { error: "请输入老板ID" });

    const orderItems = store.catalog?.orderItems || [];
    const itemId = String(body.itemId || "").trim();
    const item = orderItems.find((entry) => entry.id === itemId);
    if (!item && !String(body.serviceName || body.title || body.playName || body.skillName || "").trim()) {
      return send(res, 400, { error: "请选择小程序订单或填写派单项目" });
    }

    const tierId = String(body.tierId || "").trim();
    const tiers = Array.isArray(item?.priceTiers) ? item.priceTiers : [];
    const tier = tiers.find((entry) => entry.id === tierId) || tiers[0] || null;
    const orderMode = String(body.orderMode || item?.orderMode || "fixed_tier");
    const quantity = Math.max(1, Number(body.quantity || body.duration || body.hours || 1));
    const duration = quantity;
    const unitPrice = Math.max(0, Number(body.amount || tier?.price || item?.price || 0));
    if (!Number.isFinite(unitPrice) || unitPrice < 0) return send(res, 400, { error: "请输入有效订单金额" });

    const originalAmount = Number((unitPrice * quantity).toFixed(2));
    const customer = ensureCustomer(store, {
      id: customerId || "offline-customer",
      userName: body.userName || (useCustomerBalance ? "小程序用户" : "私下收款老板"),
      contact: body.contact || (useCustomerBalance ? "小程序内联系" : "私下收款")
    });
    const discount = useCustomerBalance ? Math.max(1, Math.min(100, Number(customer.memberDiscount || 100))) : 100;
    const payableAmount = Number((originalAmount * discount / 100).toFixed(2));

    if (useCustomerBalance) {
      const balance = Math.max(0, Number(customer.balanceCatFood || 0));
      if (balance < payableAmount) {
        return send(res, 400, {
          error: "老板猫粮余额不足",
          balance,
          shortage: Number((payableAmount - balance).toFixed(2))
        });
      }
      customer.balanceCatFood = Number(Math.max(0, balance - payableAmount).toFixed(2));
      addCustomerBill(store, customer, {
        type: "staff_order",
        title: "客服代下订单消费",
        amount: -payableAmount,
        note: `${item?.title || body.serviceName || "客服派单"} · ${user.name || "客服"}代下${discount < 100 ? ` · 会员${discount}折` : ""}`
      });
    }

    customer.spentCatFood = Number((Number(customer.spentCatFood || 0) + originalAmount).toFixed(2));
    customer.updatedAt = new Date().toISOString();
    ensureCustomer(store, customer);

    const sessionId = String(body.sessionId || (customerId ? publicSessionId(customerId) : "") || "").trim();
    const skillId = String(body.skillId || item?.gameId || "").trim();
    const skillName = String(body.skillName || "").trim();
    const playName = String(body.playName || "").trim();
    const game = (store.catalog?.games || []).find((entry) => entry.id === skillId || entry.id === item?.gameId);
    const specifiedPlayerKey = String(body.playerId || body.playerNo || body.playerName || "").trim();
    const specifiedPlayer = specifiedPlayerKey
      ? (store.catalog?.players || []).find((player) => (
        player.id === specifiedPlayerKey ||
        player.playerNo === specifiedPlayerKey ||
        player.name === specifiedPlayerKey
      ))
      : null;
    const hasSpecifiedPlayer = Boolean(specifiedPlayerKey && specifiedPlayer);
    const order = {
      id: String(body.id || `P${Date.now()}`),
      sessionId,
      userId: customer.id,
      userName: String(body.userName || customer.name || (useCustomerBalance ? "小程序用户" : "私下收款老板")),
      userPhone: String(body.contact || customer.contact || (useCustomerBalance ? "小程序内联系" : "私下收款")),
      playerId: hasSpecifiedPlayer ? specifiedPlayer.id : String(body.playerId || ""),
      playerName: String(body.playerName || "待分配"),
      orderItemId: item?.id || "",
      priceTierId: tier?.id || "",
      priceTierName: tier?.name || "",
      gameName: String(body.gameName || item?.gameName || game?.name || item?.gameId || "小程序订单"),
      serviceName: String(body.serviceName || item?.title || "客服派单"),
      platform: String(body.platform || item?.platform || "小程序"),
      unitPrice,
      duration,
      quantity,
      time: String(body.time || ""),
      amount: payableAmount,
      originalAmount,
      memberLevelName: customer.memberLevelName,
      memberDiscount: discount,
      revenueConfigId: String(body.revenueConfigId || ""),
      currency: TOKEN_CURRENCY,
      tokenName: TOKEN_NAME,
      status: "待确认",
      source: useCustomerBalance ? "客服代下-余额扣款" : "客服派单-私下收款",
      orderMethod: useCustomerBalance ? "老板小程序账号余额扣款" : "私下收钱直接派单",
      paymentStatus: useCustomerBalance ? "paid_cat_food_by_staff" : "offline_paid",
      paidCatFood: useCustomerBalance ? payableAmount : 0,
      offlinePaidCatFood: useCustomerBalance ? 0 : originalAmount,
      assigneeId: user.id || "",
      assignee: user.name || user.username || "",
      note: [
        `下单方式：${useCustomerBalance ? "老板ID余额扣款" : "私下收钱派单"}`,
        tier ? `价位：${tier.name || tier.id}` : "",
        body.paymentRemark ? `收款备注：${body.paymentRemark}` : "",
        body.note ? `客服备注：${body.note}` : ""
      ].filter(Boolean).join("；"),
      contact: String(body.contact || customer.contact || ""),
      createdAt: new Date().toISOString()
    };
    order.playerName = hasSpecifiedPlayer ? specifiedPlayer.name : order.playerName;
    order.gameName = String(body.gameName || skillName || item?.gameName || game?.name || item?.gameId || order.gameName || "");
    order.serviceName = String(body.serviceName || item?.title || [skillName || game?.name, playName].filter(Boolean).join(" / ") || order.serviceName || "");
    order.skillId = skillId;
    order.skillName = skillName || game?.name || "";
    order.playId = String(body.playId || "").trim();
    order.playName = playName;
    order.orderKind = String(body.filters?.orderKind || body.orderKind || (item ? "fun" : "quick_hour"));
    order.billingMode = String(body.filters?.billingMode || body.billingMode || (orderMode === "random_hour" ? "hour_refund" : "fixed"));
    order.filters = body.filters && typeof body.filters === "object" ? body.filters : {};
    order.filters.skillName = order.filters.skillName || order.skillName;
    order.filters.playName = order.filters.playName || order.playName;
    order.filters.remark = order.filters.remark || String(body.note || "");
    order.filters.quantity = order.filters.quantity || (order.orderKind === "fun_order" || order.orderKind === "fun" ? quantity : "");
    order.filters.durationName = order.filters.durationName || (order.orderKind === "quick_hour" ? `${quantity}小时` : `${quantity}份`);
    order.filters.orderedHours = order.filters.orderedHours || (order.orderKind === "quick_hour" ? quantity : "");
    order.filters.orderedMinutes = order.filters.orderedMinutes || (order.orderKind === "quick_hour" ? quantity * 60 : "");
    order.filters.priceTierId = order.filters.priceTierId || order.priceTierId;
    order.filters.priceTierName = order.filters.priceTierName || order.priceTierName;
    if (hasSpecifiedPlayer) {
      order.status = "\u5f85\u6253\u624b\u63a5\u5355";
      order.requiresPlayerAccept = true;
      order.specifiedPlayerId = specifiedPlayer.id;
      order.specifiedPlayerName = specifiedPlayer.name;
    }
    refreshOrderRevenueConfigFromPlayer(store, order);
    applyRevenueToOrder(store, order);
    store.orders.unshift(order);
    saveStore(store);
    return send(res, 201, {
      order,
      customer,
      bills: customerBillsForResponse(store, customer.id, 20)
    });
  }

  if (req.method === "GET" && pathname === "/api/sessions") {
    const sessionsList = staffScopedSessions(store, user)
      .map((session) => enrichSession(session, store))
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    return send(res, 200, { sessions: sessionsList });
  }

  const messagesMatch = pathname.match(/^\/api\/sessions\/([^/]+)\/messages$/);
  if (messagesMatch) {
    const sessionId = decodeURIComponent(messagesMatch[1]);
    const target = store.sessions.find((item) => item.id === sessionId);
    if (!target) return send(res, 404, { error: "会话不存在" });
    if (!canStaffAccessSession(store, user, target)) return send(res, 403, { error: "不能查看或处理其他客服的群聊" });
    if (req.method === "GET") {
      target.unreadStaff = 0;
      saveStore(store);
      return send(res, 200, { messages: sortByTime(store.messages.filter((item) => item.sessionId === sessionId)) });
    }
    if (req.method === "POST") {
      const body = await readBody(req);
      if (!String(body.content || "").trim() && !body.card) return send(res, 400, { error: "消息不能为空" });
      const message = createMessage(store, sessionId, {
        senderType: "staff",
        senderName: user.name,
        type: body.type || (body.card ? "card" : "text"),
        visibility: body.visibility || "public",
        content: body.content || (body.card ? `${body.card.title}：${body.card.desc}` : ""),
        card: body.card || null
      });
      target.assignedTo = target.assignedTo || user.id;
      saveStore(store);
      return send(res, 201, { message });
    }
  }

  const sessionMatch = pathname.match(/^\/api\/sessions\/([^/]+)$/);
  if (sessionMatch && req.method === "PATCH") {
    const sessionId = decodeURIComponent(sessionMatch[1]);
    const body = await readBody(req);
    const session = store.sessions.find((item) => item.id === sessionId);
    if (!session) return send(res, 404, { error: "会话不存在" });
    if (!canStaffAccessSession(store, user, session)) return send(res, 403, { error: "不能修改其他客服的群聊" });
    ["status", "priority"].forEach((key) => {
      if (body[key] !== undefined) session[key] = body[key];
    });
    ["title", "userId", "userName", "contact", "remark"].forEach((key) => {
      if (body[key] !== undefined) session[key] = String(body[key] || "").trim();
    });
    if (Array.isArray(body.tags)) session.tags = body.tags;
    session.lastMessageAt = new Date().toISOString();
    saveStore(store);
    return send(res, 200, { session: enrichSession(session, store) });
  }

  if (req.method === "POST" && pathname === "/api/quick-replies") {
    const body = await readBody(req);
    const text = String(body.text || "").trim();
    if (!text) return send(res, 400, { error: "快捷回复不能为空" });
    if (!store.quickReplies.includes(text)) store.quickReplies.unshift(text);
    saveStore(store);
    return send(res, 201, { quickReplies: store.quickReplies });
  }

  const quickReplyMatch = pathname.match(/^\/api\/quick-replies\/(\d+)$/);
  if (quickReplyMatch && req.method === "PATCH") {
    const index = Number(quickReplyMatch[1]);
    const body = await readBody(req);
    const text = String(body.text || "").trim();
    if (!store.quickReplies[index]) return send(res, 404, { error: "快捷回复不存在" });
    if (!text) return send(res, 400, { error: "快捷回复不能为空" });
    store.quickReplies[index] = text;
    saveStore(store);
    return send(res, 200, { quickReplies: store.quickReplies });
  }

  if (quickReplyMatch && req.method === "DELETE") {
    const index = Number(quickReplyMatch[1]);
    if (!store.quickReplies[index]) return send(res, 404, { error: "快捷回复不存在" });
    store.quickReplies.splice(index, 1);
    saveStore(store);
    return send(res, 200, { quickReplies: store.quickReplies });
  }

  if (req.method === "GET" && pathname === "/api/settings") {
    return send(res, 200, { settings: store.settings });
  }

  if (req.method === "PATCH" && pathname === "/api/settings") {
    const body = await readBody(req);
    const next = { ...store.settings };
    ["shopName", "businessHours", "autoGreeting", "customerServiceQrUrl", "offlineMessage", "quickMatchBackgroundUrl", "paymentMode", "virtualPaymentOfferId", "virtualPaymentEnv", "virtualPaymentCurrencyType", "virtualPaymentPlatform"].forEach((key) => {
      if (body[key] !== undefined) next[key] = String(body[key] || "").trim();
    });
    if (body.slaMinutes !== undefined) {
      next.slaMinutes = Math.max(1, Math.min(120, Number(body.slaMinutes || 5)));
    }
    if (body.auditMode !== undefined) next.auditMode = body.auditMode !== false && body.auditMode !== "false";
    ["autoAssign", "notifySound", "safetyNotice", "orderLock"].forEach((key) => {
      if (body[key] !== undefined) next[key] = Boolean(body[key]);
    });
    store.settings = { ...seed.settings, ...next };
    store.settings.paymentMode = ["official_virtual", "service_account_wechat"].includes(store.settings.paymentMode) ? store.settings.paymentMode : "official_virtual";
    saveStore(store);
    return send(res, 200, { settings: store.settings });
  }

  if (req.method === "POST" && pathname === "/api/service-cards") {
    const body = await readBody(req);
    const title = String(body.title || "").trim();
    if (!title) return send(res, 400, { error: "服务卡标题不能为空" });
    const card = {
      id: makeId("card_"),
      title,
      desc: String(body.desc || "").trim(),
      price: String(body.price || "").trim()
    };
    store.serviceCards.unshift(card);
    saveStore(store);
    return send(res, 201, { serviceCards: store.serviceCards, card });
  }

  const serviceCardMatch = pathname.match(/^\/api\/service-cards\/([^/]+)$/);
  if (serviceCardMatch && req.method === "PATCH") {
    const cardId = decodeURIComponent(serviceCardMatch[1]);
    const body = await readBody(req);
    const card = store.serviceCards.find((item) => item.id === cardId);
    if (!card) return send(res, 404, { error: "服务卡不存在" });
    ["title", "desc", "price"].forEach((key) => {
      if (body[key] !== undefined) card[key] = String(body[key] || "").trim();
    });
    if (!card.title) return send(res, 400, { error: "服务卡标题不能为空" });
    saveStore(store);
    return send(res, 200, { serviceCards: store.serviceCards, card });
  }

  if (serviceCardMatch && req.method === "DELETE") {
    const cardId = decodeURIComponent(serviceCardMatch[1]);
    const index = store.serviceCards.findIndex((item) => item.id === cardId);
    if (index < 0) return send(res, 404, { error: "服务卡不存在" });
    store.serviceCards.splice(index, 1);
    saveStore(store);
    return send(res, 200, { serviceCards: store.serviceCards });
  }

  if (req.method === "GET" && pathname === "/api/tickets") {
    return send(res, 200, { tickets: store.tickets });
  }

  if (req.method === "POST" && pathname === "/api/tickets") {
    const body = await readBody(req);
    const ticket = {
      id: makeId("TK"),
      sessionId: body.sessionId,
      title: String(body.title || "未命名工单").trim(),
      status: body.status || "processing",
      priority: body.priority || "normal",
      owner: user.name,
      createdAt: new Date().toISOString()
    };
    store.tickets.unshift(ticket);
    saveStore(store);
    return send(res, 201, { ticket });
  }

  const ticketMatch = pathname.match(/^\/api\/tickets\/([^/]+)$/);
  if (ticketMatch && req.method === "PATCH") {
    const ticketId = decodeURIComponent(ticketMatch[1]);
    const body = await readBody(req);
    const ticket = store.tickets.find((item) => item.id === ticketId);
    if (!ticket) return send(res, 404, { error: "工单不存在" });
    ["title", "status", "priority", "owner"].forEach((key) => {
      if (body[key] !== undefined) ticket[key] = String(body[key] || "").trim();
    });
    ticket.updatedAt = new Date().toISOString();
    saveStore(store);
    return send(res, 200, { ticket });
  }

  if (req.method === "GET" && pathname === "/api/orders") {
    return send(res, 200, { orders: staffScopedOrders(store, user) });
  }

  const orderMatch = pathname.match(/^\/api\/orders\/([^/]+)$/);
  if (orderMatch && req.method === "PATCH") {
    const orderId = decodeURIComponent(orderMatch[1]);
    const body = await readBody(req);
    const order = store.orders.find((item) => item.id === orderId);
    if (!order) return send(res, 404, { error: "订单不存在" });
    if (!canStaffAccessOrder(store, user, order)) return send(res, 403, { error: "不能修改其他客服处理的订单" });
    ["contact", "time"].forEach((key) => {
      if (body[key] !== undefined) order[key] = String(body[key] || "").trim();
    });
    if (body.status !== undefined) updateOrderStatusWithSideEffects(store, order, String(body.status || "").trim(), user.name || "客服");
    if (body.assignee !== undefined && isOwnerUser(user)) Object.assign(order, normalizeStaffAssignment(store, body.assignee));
    ensureOrderAssignee(store, order);
    if (body.note !== undefined) order.note = String(body.note || "").trim();
    if (body.amount !== undefined) order.amount = Number(body.amount || 0);
    applyRevenueToOrder(store, order);
    if (order.status === "已完成") settleCompletedOrder(store, order);
    order.updatedAt = new Date().toISOString();
    saveStore(store);
    return send(res, 200, { order, orders: staffScopedOrders(store, user) });
  }

  const orderInviteMatch = pathname.match(/^\/api\/orders\/([^/]+)\/invite-player$/);
  if (orderInviteMatch && req.method === "POST") {
    const orderId = decodeURIComponent(orderInviteMatch[1]);
    const body = await readBody(req);
    const order = store.orders.find((item) => item.id === orderId);
    if (!order) return send(res, 404, { error: "订单不存在" });
    if (!canStaffAccessOrder(store, user, order)) return send(res, 403, { error: "不能处理其他客服的订单" });
    try {
      const player = attachPlayerToOrder(store, order, body.playerId || body.playerNo || body.playerName, user.name || "客服");
      refreshOrderRevenueConfigFromPlayer(store, order);
      applyRevenueToOrder(store, order);
      saveStore(store);
      return send(res, 200, { order, player, orders: staffScopedOrders(store, user) });
    } catch (error) {
      return send(res, error.status || 400, { error: error.message || "拉打手失败" });
    }
  }

  send(res, 404, { error: "接口不存在" });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === "OPTIONS") return send(res, 204, {});
  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    if (url.pathname === "/pay/recharge") {
      sendHtml(res, await renderRechargePayPage(url));
      return;
    }
    if (url.pathname === "/favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }
    const requested = url.pathname === "/" ? "/index.html" : url.pathname === "/admin" ? "/admin.html" : url.pathname;
    const filePath = path.normalize(path.join(PUBLIC_DIR, requested));
    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    sendFile(res, filePath);
  } catch (error) {
    send(res, 500, { error: error.message || "服务异常" });
  }
});

server.listen(PORT, () => {
  ensureStore();
  console.log(`Customer service console: http://127.0.0.1:${PORT}`);
});
