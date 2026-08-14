const defaultGames = [
  { id: "delta", name: "三角洲行动", iconUrl: "/assets/game/delta.png", sort: 1, visible: true, showOnHome: true },
  { id: "honor", name: "王者荣耀", iconUrl: "/assets/game/honor.png", sort: 2, visible: true, showOnHome: true },
  { id: "peace", name: "和平精英", iconUrl: "/assets/game/peace.png", sort: 3, visible: true, showOnHome: true },
  { id: "other", name: "其他游戏", iconUrl: "/assets/game/other.png", sort: 99, visible: true, showOnHome: true, isOther: true }
]

const defaultCategories = [
  { id: "fun", name: "趣味体验", sort: 1, visible: true }
]

const defaultOrders = [
  {
    id: "audit-fun-demo",
    gameId: "delta",
    categoryId: "fun",
    title: "趣味体验测试单",
    desc: "用于体验下单流程的测试项目",
    note: "审核测试项目，后台可自行新增正式项目",
    price: 100,
    orderMode: "fixed_tier",
    orderCount: 1,
    tag: "测试",
    tags: ["体验", "测试"],
    keywords: ["体验", "测试", "趣味"],
    imageUrl: "/assets/entry/entry-fun.png",
    detailImageUrl: "/assets/banner-1.jpg",
    detailImageWidth: "100%",
    detailDesc: "这是用于小程序审核和流程演示的测试项目。正式项目可在后台商品配置中自行新增、隐藏、排序和设置价格。",
    priceTiers: [
      { id: "demo", name: "测试体验", price: 100, desc: "流程测试" }
    ],
    sort: 1,
    visible: true
  }
]

const CATALOG_CACHE_KEY = "adminOrderCatalogCache"
const BACKEND_API_BASE_KEY = "backendApiBase"
const DEFAULT_BACKEND_API_BASE = "https://api.example.com"

function getCachedCatalog() {
  if (typeof wx === "undefined" || !wx.getStorageSync) return null
  const catalog = wx.getStorageSync(CATALOG_CACHE_KEY)
  return catalog && (catalog.orderItems || catalog.games) ? catalog : null
}

function normalizeOrderItem(item = {}, index = 0) {
  const basePrice = Number(item.price || 0)
  const mainImageUrl = item.mainImageUrl || item.detailImageUrl || item.imageUrl || "/assets/entry/entry-fun.png"
  const priceTiers = Array.isArray(item.priceTiers) && item.priceTiers.length
    ? item.priceTiers
    : [{ id: "demo", name: `${item.title || "测试项目"} · 体验`, price: basePrice, desc: "体验" }]
  const price = Number(item.price || priceTiers[0].price || 0)
  return {
    ...item,
    id: item.id || `order-${index}`,
    title: item.title || "测试项目",
    categoryId: item.categoryId || "fun",
    gameId: item.gameId || "delta",
    price,
    orderMode: item.orderMode === "random_hour" ? "random_hour" : "fixed_tier",
    priceTiers: priceTiers.map((tier, tierIndex) => ({
      id: tier.id || `tier-${tierIndex}`,
      name: tier.name || `价位${tierIndex + 1}`,
      price: Number(tier.price || price || 0),
      desc: tier.desc || ""
    })),
    tags: Array.isArray(item.tags) ? item.tags : [],
    mainImageUrl,
    imageUrl: mainImageUrl,
    detailImageUrl: mainImageUrl,
    detailImageWidth: item.detailImageWidth || "100%"
  }
}

function configuredGames() {
  const catalog = getCachedCatalog()
  return catalog && Array.isArray(catalog.games) && catalog.games.length ? catalog.games : defaultGames
}

function configuredCategories() {
  const catalog = getCachedCatalog()
  return catalog && Array.isArray(catalog.orderCategories) && catalog.orderCategories.length
    ? catalog.orderCategories
    : defaultCategories
}

function configuredOrders() {
  const catalog = getCachedCatalog()
  const source = catalog && Array.isArray(catalog.orderItems) && catalog.orderItems.length
    ? catalog.orderItems
    : defaultOrders
  return source.map(normalizeOrderItem)
}

function refreshOrderCatalog(callback) {
  if (typeof wx === "undefined" || !wx.request) {
    if (callback) callback(null)
    return
  }
  const base = String(wx.getStorageSync(BACKEND_API_BASE_KEY) || DEFAULT_BACKEND_API_BASE).replace(/\/$/, "")
  wx.request({
    url: `${base}/api/public/catalog`,
    method: "GET",
    success: (res) => {
      const catalog = res.data && res.data.catalog
      if (catalog) wx.setStorageSync(CATALOG_CACHE_KEY, catalog)
      if (callback) callback(catalog || null)
    },
    fail: () => {
      if (callback) callback(null)
    }
  })
}

function normalizeList(list = []) {
  return list
    .filter((item) => item && item.visible !== false)
    .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0))
}

function getOrderCategories() {
  return normalizeList(configuredCategories())
}

function getListedOrders() {
  return normalizeList(configuredOrders())
}

function findListedOrderById(orderId) {
  return getListedOrders().find((order) => order.id === orderId) || null
}

function getGames(options = {}) {
  const games = normalizeList(configuredGames())
  if (options.homeOnly) return games.filter((game) => game.showOnHome)
  if (options.excludeOther) return games.filter((game) => !game.isOther)
  return games
}

function getHomeGames() {
  return getGames({ homeOnly: true })
}

function getOtherGames() {
  return getGames({ excludeOther: true }).filter((game) => !game.showOnHome)
}

function findGameById(gameId) {
  return getGames().find((game) => game.id === gameId) || null
}

function getOrdersByGame(gameId) {
  return getListedOrders().filter((order) => order.gameId === gameId)
}

function getOrderCategoriesByGame(gameId) {
  const orders = getOrdersByGame(gameId)
  const categoryIds = orders.map((order) => order.categoryId)
  return getOrderCategories().filter((category) => categoryIds.includes(category.id))
}

module.exports = {
  findGameById,
  findListedOrderById,
  getGames,
  getHomeGames,
  getListedOrders,
  getOrderCategoriesByGame,
  getOrderCategories,
  getOrdersByGame,
  getOtherGames,
  normalizeList,
  refreshOrderCatalog
}
