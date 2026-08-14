const { getFunOrders } = require("../../utils/fun-order-catalog")

function getMatchScore(order, keyword) {
  if (!keyword) return 0
  const title = (order.title || "").toLowerCase()
  const desc = (order.desc || order.subtitle || "").toLowerCase()
  const note = (order.note || "").toLowerCase()
  const tag = (order.tag || "").toLowerCase()
  const tags = (order.tags || []).join(" ").toLowerCase()
  const keywords = (order.keywords || []).join(" ").toLowerCase()
  if (title.includes(keyword)) return 100
  if (tag.includes(keyword)) return 90
  if (tags.includes(keyword)) return 80
  if (keywords.includes(keyword)) return 70
  if (desc.includes(keyword)) return 50
  if (note.includes(keyword)) return 40
  return 0
}

function buildResults(keyword) {
  const normalized = (keyword || "").trim().toLowerCase()
  return getFunOrders()
    .map((order) => ({
      ...order,
      matchScore: getMatchScore(order, normalized)
    }))
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
      return b.orderCount - a.orderCount
    })
    .map((order, index) => ({
      ...order,
      rankText: order.matchScore > 0 ? (index === 0 ? "最吻合" : "匹配推荐") : "热门推荐",
      rankClass: order.matchScore > 0 ? "matched" : "hot"
    }))
}

Page({
  data: {
    keyword: "",
    resultTitle: "趣味单推荐",
    orders: []
  },

  onLoad(options) {
    const keyword = decodeURIComponent(options.keyword || "")
    this.setData({ keyword }, () => {
      this.loadResults()
    })
  },

  loadResults() {
    const orders = buildResults(this.data.keyword)
    this.setData({
      orders,
      resultTitle: this.data.keyword ? `“${this.data.keyword}”的趣味单` : "热门趣味单"
    })
  },

  openOrder(e) {
    const orderId = e.currentTarget.dataset.orderId
    wx.navigateTo({ url: `/pages/order-detail/order-detail?orderId=${orderId}` })
  }
})
