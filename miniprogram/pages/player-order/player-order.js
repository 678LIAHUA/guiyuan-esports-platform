const { addPlayerToGroup, createOrderGroup } = require("../../utils/order-group")
const { getCustomerProfile, payWithCatFood, requireLogin } = require("../../utils/customer-account")
const { findPlayerById } = require("../../utils/player-catalog")
const CONTACT_CARD_IMG = "https://api.example.com/assets/guiyuan-logo.jpg"

function fallbackPlayer(playerId) {
  const id = String(playerId || "DT10001").trim() || "DT10001"
  return {
    id,
    name: "达人",
    avatar: "/assets/avatar-yinyue.jpg",
    price: 100,
    level: "达人",
    priceTiers: [{ id: "default", name: "默认价位", price: 100, unit: "小时", desc: "默认价位" }]
  }
}

function buildContactPay(player = {}, catFoodAmount = 0) {
  const profile = getCustomerProfile()
  const tokenAmount = Math.max(0, Number(catFoodAmount || 0))
  const amountYuan = tokenAmount / 10
  const title = encodeURIComponent(`桂圆电竞订单支付：指定${player.name || "达人"}陪伴`)
  return {
    contactMessageTitle: `指定下单 ${tokenAmount}猫粮 · ￥${amountYuan.toFixed(2)}`,
    contactMessagePath: `/pages/service-pay/service-pay?scene=order&amountYuan=${encodeURIComponent(amountYuan.toFixed(2))}&tokenAmount=${encodeURIComponent(tokenAmount)}&userId=${encodeURIComponent(profile.id || "boss-demo")}&userName=${encodeURIComponent(profile.name || "喵喵喵")}&title=${title}`,
    contactMessageImg: CONTACT_CARD_IMG
  }
}

function formatRechargeAmount(value) {
  const number = Number(value || 0)
  if (!Number.isFinite(number)) return "0"
  return number % 1 === 0 ? String(number) : number.toFixed(1)
}

function rechargeForShortage(shortage) {
  const tokenAmount = Math.max(0, Number(shortage || 0))
  const amountYuan = tokenAmount / 10
  wx.navigateTo({
    url: `/pages/recharge/recharge?amountYuan=${encodeURIComponent(amountYuan.toFixed(2))}`
  })
}

Page({
  data: {
    player: null,
    selectedTierIndex: 0,
    selectedTier: null,
    orderedHours: 1,
    durationName: "1小时",
    minutePriceText: "0",
    remark: "",
    remarkLength: 0,
    prepaidPrice: 0,
    refundRuleText: "未使用时长结单后按分钟退回",
    contactMessageTitle: "桂圆电竞订单支付",
    contactMessagePath: "/pages/service-pay/service-pay?scene=order",
    contactMessageImg: CONTACT_CARD_IMG
  },

  onLoad(options) {
    const player = findPlayerById(options.playerId || "DT10001") || findPlayerById("DT10001") || fallbackPlayer(options.playerId)
    const selectedTier = (player.priceTiers || [])[0] || { id: "default", name: "默认价位", price: Number(player.price || 0), unit: "小时" }
    this.setData({
      player,
      selectedTier,
      selectedTierIndex: 0
    }, () => {
      this.recalculatePrice()
    })
  },

  selectTier(e) {
    const index = Number(e.currentTarget.dataset.index || 0)
    const selectedTier = (this.data.player.priceTiers || [])[index]
    if (!selectedTier) return
    this.setData({
      selectedTierIndex: index,
      selectedTier
    }, () => {
      this.recalculatePrice()
    })
  },

  changeHour(e) {
    const step = Number(e.currentTarget.dataset.step || 0)
    const nextHours = Math.max(1, Math.min(24, this.data.orderedHours + step))
    this.setData({
      orderedHours: nextHours
    }, () => {
      this.recalculatePrice()
    })
  },

  recalculatePrice() {
    const playerPrice = this.data.player ? this.data.player.price : 0
    const hourlyPrice = Number((this.data.selectedTier || {}).price || playerPrice || 0)
    const orderedHours = Number(this.data.orderedHours || 1)
    const minutePrice = hourlyPrice / 60
    const prepaidPrice = hourlyPrice * orderedHours
    this.setData({
      durationName: `${orderedHours}小时`,
      minutePriceText: this.formatAmount(minutePrice),
      prepaidPrice: this.formatAmount(prepaidPrice),
      ...buildContactPay(this.data.player || {}, prepaidPrice)
    })
  },

  formatAmount(value) {
    const number = Number(value)
    if (!Number.isFinite(number)) return "0"
    return number % 1 === 0 ? String(number) : number.toFixed(1)
  },

  onRemarkInput(e) {
    const remark = (e.detail.value || "").slice(0, 120)
    this.setData({
      remark,
      remarkLength: remark.length
    })
  },

  submitOrder() {
    if (!requireLogin()) return
    const player = this.data.player
    if (!player || !player.id) return
    const selectedTier = this.data.selectedTier || (player.priceTiers || [])[0] || {}
    const hourlyPrice = Number(selectedTier.price || player.price || 0)
    const minutePrice = hourlyPrice / 60
    const orderedHours = Number(this.data.orderedHours || 1)
    const prepaidAmount = hourlyPrice * orderedHours
    const order = {
      id: `appoint-${player.id}-${Date.now()}`,
      title: `指定${player.name}陪伴`,
      price: prepaidAmount,
      amount: prepaidAmount,
      originalAmount: prepaidAmount,
      payableAmount: prepaidAmount,
      playerName: player.name,
      selectedPriceTier: selectedTier,
      duration: orderedHours
    }
    payWithCatFood(prepaidAmount, {
      orderId: order.id,
      title: "订单消费",
      note: `${order.title} · ${this.data.durationName}`
    }, (result) => {
      if (!result.ok) {
        const shortage = Number(result.shortage || Math.max(0, prepaidAmount - Number(result.balance || 0)))
        wx.showModal({
          title: "猫粮不足",
          content: `当前猫粮不足，还差 ${this.formatAmount(shortage)} 猫粮，是否前往充值？`,
          confirmText: "去充值",
          cancelText: "取消",
          success: (res) => {
            if (res.confirm) rechargeForShortage(shortage)
          }
        })
        return
      }
      const paidOrder = {
        ...order,
        paymentStatus: "paid_cat_food",
        paidCatFood: prepaidAmount
      }
      const group = createOrderGroup(paidOrder, {
      filters: {
        playType: "single",
        playTypeName: "指定达人",
        billingMode: "hour_refund",
        orderedHours,
        orderedMinutes: orderedHours * 60,
        durationName: this.data.durationName,
        hourlyPrice,
        minutePrice,
        prepaidAmount,
        priceTierName: selectedTier.name || "默认价位",
        levelName: selectedTier.desc || player.level || "",
        levelHint: "小时单按整小时预扣；结单时按实际服务分钟计算，未使用部分退回老板猫粮。",
        remark: this.data.remark.trim()
      }
      })
      addPlayerToGroup(group.id, {
        id: player.id,
        playerNo: player.id,
        name: player.name,
        avatar: player.avatar
      })
      wx.showToast({ title: "支付成功，已建群", icon: "success" })
      setTimeout(() => {
        wx.switchTab({ url: "/pages/message/message" })
      }, 450)
    })
  }
})
