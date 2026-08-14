const {
  findGameById,
  getOrderCategoriesByGame,
  getOrdersByGame,
  normalizeList,
  refreshOrderCatalog
} = require("../../utils/order-catalog")

function markCategories(categories, activeId) {
  return categories.map((item) => ({
    ...item,
    cls: item.id === activeId ? "active" : ""
  }))
}

Page({
  data: {
    gameId: "",
    title: "游戏下单",
    game: null,
    categories: [],
    orders: [],
    goods: [],
    activeCategoryId: "",
    emptyText: "这个游戏暂时还没有上架单子"
  },

  onLoad(options) {
    this.loadGameOrders(options.gameId || "")
    refreshOrderCatalog(() => {
      this.loadGameOrders(options.gameId || "")
    })
  },

  loadGameOrders(gameId) {
    const game = findGameById(gameId)
    if (!game) {
      this.setData({
        title: "游戏下单",
        emptyText: "没有找到这个游戏分类"
      })
      return
    }

    // TODO: 后台做好后，按 gameId 请求该游戏自己的分类和已上架单子。
    // 游戏名、图标、排序、分类、单子图片和详情都应由后台配置。
    const categories = normalizeList(getOrderCategoriesByGame(game.id))
    const orders = normalizeList(getOrdersByGame(game.id)).map((order) => ({
      ...order,
      priceText: Array.isArray(order.priceTiers) && order.priceTiers.length > 1
        ? `${order.priceTiers[0].price} 猫粮起`
        : `${order.price} 猫粮`
    }))
    const activeCategoryId = categories[0] ? categories[0].id : ""

    this.setData({
      gameId: game.id,
      title: game.name,
      game,
      categories: markCategories(categories, activeCategoryId),
      orders,
      activeCategoryId,
      goods: this.filterGoods(orders, activeCategoryId),
      emptyText: `${game.name}暂时还没有上架单子`
    })
  },

  filterGoods(orders, categoryId) {
    if (!categoryId) return orders
    const matched = orders.filter((item) => item.categoryId === categoryId)
    return matched.length ? matched : orders
  },

  chooseCategory(e) {
    const id = e.currentTarget.dataset.id
    this.setData({
      activeCategoryId: id,
      categories: markCategories(this.data.categories, id),
      goods: this.filterGoods(this.data.orders, id)
    })
  },

  openOrder(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.orders.find((order) => order.id === id)
    if (!item) return
    wx.setStorageSync("selectedQuickOrder", item)
    wx.navigateTo({ url: `/pages/order-detail/order-detail?orderId=${id}` })
  }
})
