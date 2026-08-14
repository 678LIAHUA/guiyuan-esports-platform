const { getPriceTiersByStage } = require("./level-standard")
const DEFAULT_AVATAR = "/assets/avatar-yinyue.jpg"
const DEFAULT_BACKEND_API_BASE = "https://api.example.com"
const REMOTE_CATALOG_KEY = "remotePlayerCatalog"

function calculateScore(abilities = []) {
  const values = abilities
    .map((item) => Number(item.value))
    .filter((value) => Number.isFinite(value))
    .map((value) => Math.max(0, Math.min(10, value)))
  if (!values.length) return "0.0"
  const total = values.reduce((sum, value) => sum + value, 0)
  return (total / values.length).toFixed(1)
}

function getSavedPlayerProfile() {
  const saved = wx.getStorageSync("currentPlayerProfile")
  return saved && (saved.id || saved.playerNo) ? saved : null
}

function safeImageUrl(url, fallback = DEFAULT_AVATAR) {
  const value = String(url || "").trim()
  if (!value) return fallback
  if (value.startsWith("/assets/")) return value
  if (value.startsWith("/uploads/")) return `https://api.example.com${value}`
  if (/^https:\/\//i.test(value)) return value
  if (/^wxfile:\/\//i.test(value)) return value
  if (/^http:\/\/tmp\//i.test(value)) return value
  if (/^http:\/\/usr\//i.test(value)) return value
  if (/^file:\/\//i.test(value)) return value
  if (value.includes("/tmp/")) return value
  if (/^http:\/\/127\.0\.0\.1/i.test(value)) return fallback
  return fallback
}

function getRemoteCatalog() {
  const catalog = wx.getStorageSync(REMOTE_CATALOG_KEY)
  return catalog && Array.isArray(catalog.players) ? catalog : null
}

function samePlayer(left = {}, right = {}) {
  return Boolean(left && right && (
    String(left.id || "").toUpperCase() === String(right.id || right.playerNo || "").toUpperCase() ||
    String(left.playerNo || "").toUpperCase() === String(right.id || right.playerNo || "").toUpperCase()
  ))
}

function findLevel(group, player, fallbackName = "") {
  const levels = Array.isArray(group && group.levels) ? group.levels : []
  const ids = [
    player.levels && player.levels[group && group.id],
    group && group.id === "confidential" ? player.confidentialLevel : player.topSecretLevel,
    fallbackName,
    player.rankValue,
    player.level
  ].map((item) => String(item || "").trim()).filter(Boolean)
  return levels.find((level) => ids.some((id) => id === level.id || id === level.name)) || levels[0] || null
}

function fixedPriceTiers(player = {}, levelGroups = []) {
  if (Array.isArray(player.levelDetails) && player.levelDetails.length) {
    return player.levelDetails.map((item, index) => ({
      id: item.groupId || `tier_${index + 1}`,
      name: item.groupName || `价位${index + 1}`,
      price: Number(item.price || player.price || 0),
      unit: "小时",
      desc: item.levelName || player.level || ""
    }))
  }
  const groups = Array.isArray(levelGroups) ? levelGroups : []
  if (groups.length) {
    const tiers = groups.map((group, index) => {
      const selected = findLevel(group, player, index === 0 ? (player.confidentialLevelName || player.level) : player.topSecretLevelName)
      if (!selected) return null
      const legacyPrice = group.id === "confidential"
        ? player.confidentialPrice
        : group.id === "top_secret"
          ? player.topSecretPrice
          : 0
      return {
        id: group.id || `tier_${index + 1}`,
        name: group.name || `价位${index + 1}`,
        price: Number(legacyPrice || selected.price || player.price || 0),
        unit: "小时",
        desc: selected.name || player.level || ""
      }
    }).filter(Boolean)
    if (tiers.length) return tiers
  }
  const confidentialGroup = groups.find((item) => item.id === "confidential")
  const topSecretGroup = groups.find((item) => item.id === "top_secret")
  const confidentialLevel = findLevel(confidentialGroup, player, player.confidentialLevelName)
  const topSecretLevel = findLevel(topSecretGroup, player, player.topSecretLevelName)
  const localTiers = getPriceTiersByStage(player.rankValue || player.level || player.confidentialLevelName)
  const secretFallback = (player.priceTiers || []).find((tier) => tier.id === "secret") || localTiers[0] || {}
  const topSecretFallback = (player.priceTiers || []).find((tier) => tier.id === "top_secret") || localTiers[1] || {}
  const secretPrice = Number(player.confidentialPrice || (confidentialLevel && confidentialLevel.price) || secretFallback.price || player.price || 0)
  const topSecretPrice = Number(player.topSecretPrice || (topSecretLevel && topSecretLevel.price) || topSecretFallback.price || secretPrice || 0)
  return [
    {
      id: "secret",
      name: "机密",
      price: secretPrice,
      unit: "小时",
      desc: (confidentialLevel && confidentialLevel.name) || player.confidentialLevelName || player.rankValue || player.level || ""
    },
    {
      id: "top_secret",
      name: "绝密",
      price: topSecretPrice,
      unit: "小时",
      desc: (topSecretLevel && topSecretLevel.name) || player.topSecretLevelName || ""
    }
  ]
}

const basePlayers = [
  {
    id: "DT10001",
    name: "圆圆",
    avatar: "/assets/avatar-yinyue.jpg",
    served: "1523",
    price: "880",
    level: "化神期",
    rankLabel: "考核等级",
    rankValue: "化神期",
    examType: "双考",
    gender: "女",
    age: 22,
    tags: ["热门地带", "撤离指挥", "枪线稳定", "听声报点", "女声", "22岁"],
    priceTiers: getPriceTiersByStage("化神期"),
    gifts: [
      { name: "猫粮罐头", count: 36 },
      { name: "星光徽章", count: 18 },
      { name: "老板点赞", count: 128 }
    ],
    reviews: [
      { user: "老板A", score: "5.0", text: "报点很稳，节奏舒服，打完还帮复盘。" },
      { user: "小橘", score: "5.0", text: "声音好听，撤离路线讲得很清楚。" }
    ],
    desc: "擅长三角洲烽火地带撤离，沟通主动，适合娱乐和效率单。",
    abilities: [
      { name: "技术水平", value: 9.6 },
      { name: "情绪价值", value: 9.4 },
      { name: "声音听感", value: 9.3 },
      { name: "抗压能力", value: 9.5 },
      { name: "店内表现", value: 9.7 }
    ],
    acceptingOrders: true,
    hot: true
  },
  {
    id: "DT10002",
    name: "星河",
    avatar: "/assets/avatar-xinghe.jpg",
    served: "1320",
    price: "780",
    level: "元婴期",
    rankLabel: "考核等级",
    rankValue: "元婴期",
    examType: "单考",
    gender: "男",
    age: 24,
    tags: ["路线规划", "节奏指挥", "物资判断", "稳撤离", "男声", "24岁"],
    priceTiers: getPriceTiersByStage("元婴期"),
    gifts: [{ name: "战术手册", count: 22 }, { name: "星光徽章", count: 15 }],
    reviews: [{ user: "森森", score: "4.9", text: "路线规划很细，适合认真上分。" }],
    desc: "偏技术指挥，适合需要稳定推进和清晰沟通的老板。",
    abilities: [
      { name: "技术水平", value: 9.4 },
      { name: "情绪价值", value: 9.0 },
      { name: "声音听感", value: 8.8 },
      { name: "抗压能力", value: 9.6 },
      { name: "店内表现", value: 9.3 }
    ],
    acceptingOrders: true,
    hot: true
  },
  {
    id: "DT10003",
    name: "小桃",
    avatar: "/assets/avatar-xiaotao.jpg",
    served: "998",
    price: "680",
    level: "金丹期",
    rankLabel: "考核等级",
    rankValue: "金丹期",
    examType: "单考",
    gender: "女",
    age: 20,
    tags: ["氛围局", "陪跑图", "耐心带新", "可双陪", "女声", "20岁"],
    priceTiers: [
      { id: "fun", name: "娱乐", price: 40, unit: "小时", desc: "女娱" },
      ...getPriceTiersByStage("金丹期")
    ],
    gifts: [{ name: "甜心糖果", count: 46 }, { name: "陪伴小花", count: 30 }],
    reviews: [{ user: "阿树", score: "5.0", text: "很有耐心，新手也不会有压力。" }],
    desc: "氛围感强，适合娱乐陪伴、带新熟图和轻松局。",
    abilities: [
      { name: "技术水平", value: 8.8 },
      { name: "情绪价值", value: 9.7 },
      { name: "声音听感", value: 9.5 },
      { name: "抗压能力", value: 8.9 },
      { name: "店内表现", value: 9.4 }
    ],
    acceptingOrders: true,
    hot: false
  },
  {
    id: "DT10004",
    name: "墨白",
    avatar: "/assets/avatar-mobai.jpg",
    served: "856",
    price: "650",
    level: "筑基期",
    rankLabel: "考核等级",
    rankValue: "筑基期",
    examType: "单考",
    gender: "男",
    age: 25,
    tags: ["安静型", "架枪位", "高配合", "稳节奏", "男声", "25岁"],
    priceTiers: getPriceTiersByStage("筑基期"),
    gifts: [{ name: "老板点赞", count: 58 }],
    reviews: [{ user: "云知", score: "4.8", text: "话不多，执行很稳。" }],
    desc: "配合度高，话少但执行稳定，适合明确目标单。",
    abilities: [
      { name: "技术水平", value: 9.0 },
      { name: "情绪价值", value: 8.4 },
      { name: "声音听感", value: 8.6 },
      { name: "抗压能力", value: 9.5 },
      { name: "店内表现", value: 8.9 }
    ],
    acceptingOrders: false,
    hot: false
  },
  {
    id: "DT10005",
    name: "梨落",
    avatar: "/assets/avatar-xiaotao.jpg",
    served: "764",
    price: "720",
    level: "金丹期",
    rankLabel: "考核等级",
    rankValue: "金丹期",
    examType: "双考",
    gender: "女",
    age: 21,
    tags: ["可爱音", "双陪", "耐心带新", "搜打撤", "女声", "21岁"],
    priceTiers: [
      { id: "fun", name: "娱乐", price: 40, unit: "小时", desc: "女娱" },
      ...getPriceTiersByStage("金丹期")
    ],
    gifts: [{ name: "甜心糖果", count: 28 }, { name: "猫粮罐头", count: 19 }],
    reviews: [{ user: "晚风", score: "4.9", text: "互动很好，双陪配合也稳。" }],
    desc: "适合新手老板和慢节奏娱乐局，双陪配合稳定。",
    abilities: [
      { name: "技术水平", value: 8.9 },
      { name: "情绪价值", value: 9.6 },
      { name: "声音听感", value: 9.4 },
      { name: "抗压能力", value: 9.0 },
      { name: "店内表现", value: 9.2 }
    ],
    acceptingOrders: true,
    hot: true
  },
  {
    id: "DT10006",
    name: "南风",
    avatar: "/assets/avatar-xinghe.jpg",
    served: "1106",
    price: "820",
    level: "化神期",
    rankLabel: "考核等级",
    rankValue: "化神期",
    examType: "双考",
    gender: "男",
    age: 23,
    tags: ["实力派", "高价值撤离", "复盘", "控图", "男声", "23岁"],
    priceTiers: getPriceTiersByStage("化神期"),
    gifts: [{ name: "战术手册", count: 31 }, { name: "星光徽章", count: 20 }],
    reviews: [{ user: "老K", score: "4.9", text: "打法建议非常具体，认真局首选。" }],
    desc: "偏高价值撤离效率，能给路线和打法建议，适合认真局。",
    abilities: [
      { name: "技术水平", value: 9.5 },
      { name: "情绪价值", value: 8.8 },
      { name: "声音听感", value: 8.9 },
      { name: "抗压能力", value: 9.7 },
      { name: "店内表现", value: 9.4 }
    ],
    acceptingOrders: true,
    hot: true
  }
]

function normalizePlayer(item, index, savedProfile, levelGroups = []) {
  const isSavedPlayer = savedProfile && (
    savedProfile.id === item.id ||
    savedProfile.playerNo === item.id
  )
  const player = isSavedPlayer
    ? {
      ...item,
      name: savedProfile.name || item.name,
      avatar: safeImageUrl(savedProfile.avatar, item.avatar),
      cover: safeImageUrl(savedProfile.cover, item.cover || item.avatar)
    }
    : {
      ...item,
      avatar: safeImageUrl(item.avatar),
      cover: safeImageUrl(item.cover, item.avatar)
    }
  const priceTiers = fixedPriceTiers(player, levelGroups)
  const hourlyPrice = Number(priceTiers[0]?.price || player.confidentialPrice || player.price || 0)
  return {
    ...player,
    priceTiers,
    score: calculateScore(player.abilities),
    img: player.avatar,
    price: String(hourlyPrice),
    cardClass: index === 0 ? "active" : "",
    statusClass: player.acceptingOrders ? "on" : "off",
    statusText: player.acceptingOrders ? "在线" : "离线"
  }
}

function levelGroupsForPlayer(remote, player = {}) {
  const globalGroups = remote && Array.isArray(remote.playerLevelGroups) ? remote.playerLevelGroups : []
  const skills = remote && remote.quickMatchConfig && Array.isArray(remote.quickMatchConfig.skills)
    ? remote.quickMatchConfig.skills
    : []
  const skill = skills.find((item) => item.id === player.game) || {}
  if (Array.isArray(skill.levelGroups) && skill.levelGroups.length) return skill.levelGroups
  const ids = Array.isArray(skill.levelGroupIds) ? skill.levelGroupIds.map(String).filter(Boolean) : []
  const linked = ids.length ? globalGroups.filter((group) => ids.includes(String(group.id))) : []
  return linked.length ? linked : globalGroups
}

function getPlayers() {
  const remote = getRemoteCatalog()
  const sourcePlayers = remote && remote.players.length ? remote.players : basePlayers
  const saved = wx.getStorageSync("playerAcceptingOrders")
  const yinyueAccepting = saved === "" ? true : Boolean(saved)
  const savedProfile = getSavedPlayerProfile()
  return sourcePlayers.map((item, index) => {
    const player = {
      ...item,
      acceptingOrders: item.id === "DT10001" ? yinyueAccepting : item.acceptingOrders
    }
    return normalizePlayer(player, index, savedProfile, levelGroupsForPlayer(remote, player))
  })
}

function findPlayerById(playerId) {
  const normalized = (playerId || "").trim().toUpperCase()
  return getPlayers().find((player) => player.id === normalized) || null
}

function searchPlayers(keyword) {
  const value = String(keyword || "").trim().toLowerCase()
  if (!value) return getPlayers()
  return getPlayers().filter((player) => [
    player.id,
    player.name,
    player.desc,
    player.level,
    player.rankValue,
    player.gender,
    player.age,
    ...(player.tags || []),
    ...(player.priceTiers || []).map((tier) => `${tier.name}${tier.price}`)
  ].join(" ").toLowerCase().includes(value))
}

function updateCachedPlayerProfile(patch = {}) {
  const playerId = String(patch.id || patch.playerNo || "").trim()
  if (!playerId) return null
  const saved = wx.getStorageSync("currentPlayerProfile") || {}
  const nextProfile = samePlayer(saved, patch)
    ? { ...saved, ...patch }
    : { ...patch }
  wx.setStorageSync("currentPlayerProfile", nextProfile)

  const remote = getRemoteCatalog()
  if (remote && Array.isArray(remote.players)) {
    const players = remote.players.map((player) => samePlayer(player, nextProfile)
      ? { ...player, ...patch }
      : player)
    wx.setStorageSync(REMOTE_CATALOG_KEY, {
      ...remote,
      players
    })
  }
  return nextProfile
}

function refreshRemotePlayerCatalog(callback) {
  wx.request({
    url: `${DEFAULT_BACKEND_API_BASE}/api/public/catalog?t=${Date.now()}`,
    success: (res) => {
      const catalog = res.data && res.data.catalog
      if (catalog && Array.isArray(catalog.players)) {
        wx.setStorageSync(REMOTE_CATALOG_KEY, catalog)
        if (callback) callback(catalog)
        return
      }
      if (callback) callback(null)
    },
    fail: () => {
      if (callback) callback(null)
    }
  })
}

module.exports = {
  findPlayerById,
  getPlayers,
  refreshRemotePlayerCatalog,
  searchPlayers,
  updateCachedPlayerProfile
}
