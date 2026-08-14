const GIFT_PRICE_STORAGE_KEY = "guiyuanGiftPriceOverrides"
const GIFT_COUNTS_STORAGE_KEY = "guiyuanPlayerGiftCounts"
const DEFAULT_BACKEND_API_BASE = "https://api.example.com"
const ASSET_BASE = "https://api.example.com/assets/gift"

function normalizeAssetUrl(value, fallback = "") {
  const url = String(value || "").trim()
  if (!url) return fallback
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith("/")) return `${DEFAULT_BACKEND_API_BASE}${url}`
  return url
}

const defaultGiftCatalog = [
  { id: "chickenLeg", name: "鸡腿", price: 10, imageUrl: `${ASSET_BASE}/chicken-leg.png` },
  { id: "ostrichLeg", name: "鸵鸟腿", price: 20, imageUrl: `${ASSET_BASE}/ostrich-leg.png` },
  { id: "cola", name: "可乐", price: 30, imageUrl: `${ASSET_BASE}/cola.png` },
  { id: "milkTea", name: "奶茶", price: 50, imageUrl: `${ASSET_BASE}/milk-tea.png` },
  { id: "kfc", name: "KFC", price: 88, imageUrl: `${ASSET_BASE}/kfc.png` },
  { id: "roseBouquet", name: "玫瑰花束", price: 188, imageUrl: `${ASSET_BASE}/rose-bouquet.png` },
  { id: "africaHeart", name: "非洲之心", price: 520, imageUrl: `${ASSET_BASE}/africa-heart.png` },
  { id: "oceanTear", name: "海洋之泪", price: 999, imageUrl: `${ASSET_BASE}/ocean-tear.png` },
  { id: "sportsCar", name: "跑车", price: 1314, imageUrl: `${ASSET_BASE}/sports-car.png` },
  { id: "cheerDuck", name: "加油鸭", price: 66, imageUrl: `${ASSET_BASE}/cheer-duck.png` },
  { id: "fireworks", name: "烟花", price: 288, imageUrl: `${ASSET_BASE}/fireworks.png` },
  { id: "guiyuanOne", name: "桂圆1号", price: 1888, imageUrl: `${ASSET_BASE}/guiyuan-one.png` }
]

const legacyGiftMap = {
  猫粮罐头: "chickenLeg",
  星光徽章: "oceanTear",
  老板点赞: "cola",
  战术手册: "kfc",
  甜心糖果: "milkTea",
  陪伴小花: "roseBouquet"
}

function apiBase() {
  return String(wx.getStorageSync("backendApiBase") || DEFAULT_BACKEND_API_BASE).replace(/\/$/, "")
}

function normalizePrice(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? Math.round(number * 100) / 100 : fallback
}

function getPriceOverrides() {
  const saved = wx.getStorageSync(GIFT_PRICE_STORAGE_KEY) || {}
  return saved && typeof saved === "object" ? saved : {}
}

function getGiftCatalog() {
  const overrides = getPriceOverrides()
  return defaultGiftCatalog.map((gift) => {
    const saved = overrides[gift.id] || overrides[gift.name] || {}
    const savedPrice = typeof saved === "object" ? saved.price : saved
    return {
      ...gift,
      price: normalizePrice(savedPrice, gift.price),
      imageUrl: normalizeAssetUrl((saved && saved.imageUrl) || gift.imageUrl, gift.imageUrl)
    }
  })
}

function refreshGiftCatalogFromBackend(callback) {
  wx.request({
    url: `${apiBase()}/api/public/gifts`,
    method: "GET",
    success: (res) => {
      const gifts = (res.data && (res.data.gifts || res.data.data)) || []
      if (Array.isArray(gifts) && gifts.length) {
        const overrides = {}
        gifts.forEach((item) => {
        const id = item.id || item.giftId || item.name
        if (!id) return
        overrides[id] = {
          price: item.price || item.amount || item.catFood,
          imageUrl: normalizeAssetUrl(item.imageUrl || item.icon || item.cover || "")
        }
        })
        wx.setStorageSync(GIFT_PRICE_STORAGE_KEY, overrides)
      }
      if (callback) callback(getGiftCatalog())
    },
    fail: () => {
      if (callback) callback(getGiftCatalog())
    }
  })
}

function readAllGiftCounts() {
  const saved = wx.getStorageSync(GIFT_COUNTS_STORAGE_KEY) || {}
  return saved && typeof saved === "object" ? saved : {}
}

function seedCountsFromPlayer(player = {}) {
  const counts = {}
  ;(player.gifts || []).forEach((item) => {
    const matchedGift = getGiftCatalog().find((gift) => gift.name === item.name)
    const giftId = legacyGiftMap[item.name] || (matchedGift && matchedGift.id)
    if (!giftId) return
    counts[giftId] = Math.max(0, Number(counts[giftId] || 0) + Number(item.count || 0))
  })
  return counts
}

function getPlayerGiftCounts(player = {}) {
  const playerId = player.id || "unknown"
  const allCounts = readAllGiftCounts()
  if (!allCounts[playerId]) {
    allCounts[playerId] = seedCountsFromPlayer(player)
    wx.setStorageSync(GIFT_COUNTS_STORAGE_KEY, allCounts)
  }
  return allCounts[playerId] || {}
}

function addPlayerGiftCount(playerId, giftId, count = 1) {
  const allCounts = readAllGiftCounts()
  const id = playerId || "unknown"
  const current = allCounts[id] || {}
  current[giftId] = Math.max(0, Number(current[giftId] || 0) + Number(count || 1))
  allCounts[id] = current
  wx.setStorageSync(GIFT_COUNTS_STORAGE_KEY, allCounts)
  return current
}

function buildGiftWall(player = {}, expanded = false) {
  const counts = getPlayerGiftCounts(player)
  const catalog = getGiftCatalog().map((gift) => {
    const count = Math.max(0, Number(counts[gift.id] || 0))
    return {
      ...gift,
      count,
      lit: count > 0
    }
  })
  return {
    all: catalog,
    visible: expanded ? catalog : catalog.slice(0, 6),
    hasMore: catalog.length > 6,
    total: catalog.length
  }
}

module.exports = {
  addPlayerGiftCount,
  buildGiftWall,
  getGiftCatalog,
  refreshGiftCatalogFromBackend
}
