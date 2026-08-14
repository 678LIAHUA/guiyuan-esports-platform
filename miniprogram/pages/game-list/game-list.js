const { getGames, getOtherGames, getOrdersByGame } = require("../../utils/order-catalog")

function attachStats(games = []) {
  return games.map((game) => {
    const orders = getOrdersByGame(game.id)
    const orderCount = orders.reduce((sum, order) => sum + Number(order.orderCount || 0), 0)
    return {
      ...game,
      orderSizeText: orders.length ? `${orders.length}个单子` : "待上架",
      hotText: orderCount ? `${orderCount}人下单` : "后台可配置"
    }
  })
}

Page({
  data: {
    games: []
  },

  onLoad() {
    this.fetchGameList()
  },

  fetchGameList() {
    // TODO: 后台做好后，这里请求“其他游戏”列表。
    // 支持新增、删除、隐藏、排序，并维护每个游戏的 iconUrl/name。
    const otherGames = getOtherGames()
    const games = otherGames.length ? otherGames : getGames({ excludeOther: true })
    this.setData({
      games: attachStats(games)
    })
  },

  openGame(e) {
    const gameId = e.currentTarget.dataset.gameId
    if (!gameId) return
    wx.navigateTo({ url: `/pages/game-orders/game-orders?gameId=${gameId}` })
  }
})
