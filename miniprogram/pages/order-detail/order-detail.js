const { findListedOrderById } = require("../../utils/order-catalog")
const { loadCustomerProfile } = require("../../utils/customer-account")

const fallbackOrder = {
  id: "default-order",
  title: "2陪 趣味上分车",
  desc: "下单后会进入订单房间，老板可选择达人、邀请达人，或直接招募达人进入抢单池。",
  note: "适合想快速组局、需要两位陪伴的老板。",
  price: 880,
  orderCount: 2386,
  tags: ["热门地带", "安全撤离", "轻松局"],
  tag: "推荐",
  detailImageUrl: "/assets/banner-1.jpg",
  detailImageWidth: "100%",
  detailDesc: "下单后会进入订单房间，老板可选择达人、邀请达人，或直接招募达人进入抢单池。",
  orderMode: "fixed_tier",
  priceTiers: [{ id: "default", name: "默认价位", price: 880, desc: "确认后自动建群" }],
  matchLevels: []
}

function buildOrderView(order) {
  const tiers = Array.isArray(order.priceTiers) && order.priceTiers.length
    ? order.priceTiers
    : [{ id: "default", name: "默认价位", price: order.price || 0, desc: "" }]
  const selectedTierId = order.selectedTierId || tiers[0].id
  const selectedTier = tiers.find((tier) => tier.id === selectedTierId) || tiers[0]
  const selectedPrice = Number(selectedTier.price || order.price || 0)
  return {
    ...order,
    price: selectedPrice,
    priceText: selectedPrice.toFixed(0),
    selectedTierId: selectedTier.id,
    selectedTier,
    priceTiers: tiers.map((tier) => {
      return {
        ...tier,
        priceText: Number(tier.price || selectedPrice || 0).toFixed(0),
        cls: tier.id === selectedTier.id ? "active" : ""
      }
    }),
    actionText: "立即下单"
  }
}

Page({
  data: {
    order: buildOrderView(fallbackOrder)
  },

  onLoad(options) {
    const orderFromSearch = options.orderId ? findListedOrderById(options.orderId) : null
    const selectedOrder = orderFromSearch || wx.getStorageSync("selectedQuickOrder")
    if (selectedOrder && selectedOrder.id) {
      const order = {
        ...fallbackOrder,
        ...selectedOrder
      }
      this.setData({
        order: buildOrderView({
          ...order,
          detailImageUrl: order.detailImageUrl || fallbackOrder.detailImageUrl,
          detailImageWidth: order.detailImageWidth || "100%",
          detailDesc: order.detailDesc || order.desc || fallbackOrder.detailDesc
        })
      })
    }
    loadCustomerProfile(() => {
      this.setData({ order: buildOrderView(this.data.order) })
    })
  },

  chooseTier(e) {
    const tierId = e.currentTarget.dataset.id
    this.setData({
      order: buildOrderView({
        ...this.data.order,
        selectedTierId: tierId
      })
    })
  },

  contactService() {
    wx.switchTab({ url: "/pages/message/message" })
  },

  openRoom() {
    const tier = this.data.order.selectedTier
    const order = {
      ...this.data.order,
      selectedPriceTier: {
        ...tier,
        originalPrice: Number(tier.price || this.data.order.price || 0)
      }
    }
    wx.setStorageSync("selectedQuickOrder", order)
    wx.navigateTo({ url: `/pages/order/order?orderId=${order.id}` })
  }
})
