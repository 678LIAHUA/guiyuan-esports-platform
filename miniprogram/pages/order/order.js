const { findListedOrderById } = require("../../utils/order-catalog")
const { createOrderGroup, saveRecruitTask } = require("../../utils/order-group")
const { applyMemberDiscount, getCustomerProfile, loadCustomerProfile, payWithCatFood, requireLogin } = require("../../utils/customer-account")
const { searchPlayers } = require("../../utils/player-catalog")
const CONTACT_CARD_IMG = "https://api.example.com/assets/guiyuan-logo.jpg"

const fallbackOrder = {
  id: "default-order",
  title: "趣味单",
  price: 880,
  imageUrl: "/assets/entry/entry-fun.png",
  detailImageUrl: "/assets/banner-1.jpg",
  selectedPriceTier: null,
  priceTiers: [{ id: "default", name: "默认规格", price: 880, desc: "确认后自动建群" }]
}

function formatAmount(value) {
  const number = Number(value || 0)
  if (!Number.isFinite(number)) return "0"
  return number % 1 === 0 ? String(number) : number.toFixed(1)
}

function buildOrderContactPay(order = {}, catFoodAmount = 0) {
  const profile = getCustomerProfile()
  const tokenAmount = Math.max(0, Number(catFoodAmount || 0))
  const amountYuan = tokenAmount / 10
  const title = encodeURIComponent(`桂圆电竞订单支付：${order.title || "趣味单"}`)
  const userId = encodeURIComponent(profile.id || "boss-demo")
  const userName = encodeURIComponent(profile.name || "喵喵喵")
  return {
    contactMessageTitle: `订单支付 ${formatAmount(tokenAmount)}猫粮 · ￥${amountYuan.toFixed(2)}`,
    contactMessagePath: `/pages/service-pay/service-pay?scene=order&amountYuan=${encodeURIComponent(amountYuan.toFixed(2))}&tokenAmount=${encodeURIComponent(formatAmount(tokenAmount))}&userId=${userId}&userName=${userName}&title=${title}`,
    contactMessageImg: CONTACT_CARD_IMG
  }
}

function rechargeForShortage(shortage, title = "猫粮充值") {
  const tokenAmount = Math.max(0, Number(shortage || 0))
  const amountYuan = tokenAmount / 10
  wx.navigateTo({
    url: `/pages/recharge/recharge?amountYuan=${encodeURIComponent(amountYuan.toFixed(2))}&title=${encodeURIComponent(title)}`
  })
}

function normalizeOrder(order = {}) {
  const tiers = Array.isArray(order.priceTiers) && order.priceTiers.length
    ? order.priceTiers
    : [{ id: "default", name: "默认规格", price: order.price || 0, desc: "" }]
  const selectedId = (order.selectedPriceTier && order.selectedPriceTier.id) || order.selectedTierId || tiers[0].id
  const selectedTier = tiers.find((tier) => tier.id === selectedId) || tiers[0]
  return {
    ...fallbackOrder,
    ...order,
    imageUrl: order.imageUrl || order.detailImageUrl || fallbackOrder.imageUrl,
    selectedPriceTier: selectedTier,
    price: Number(selectedTier.price || order.price || 0),
    priceText: formatAmount(selectedTier.price || order.price || 0),
    priceTiers: tiers.map((tier) => ({
      ...tier,
      priceText: formatAmount(tier.price || 0),
      cls: tier.id === selectedTier.id ? "active" : ""
    }))
  }
}

function buildPlayerOptions(keyword = "") {
  return searchPlayers(keyword).map((player) => ({
    id: player.id,
    playerNo: player.id,
    name: player.name,
    avatar: player.avatar,
    level: player.level,
    gender: player.gender,
    selected: false
  }))
}

Page({
  data: {
    order: normalizeOrder(fallbackOrder),
    gameNickname: "",
    gameId: "",
    assignMode: "random",
    quantity: 1,
    agreed: false,
    totalAmount: "0",
    selectedPlayer: null,
    playerKeyword: "",
    playerOptions: buildPlayerOptions(),
    showPlayerPicker: false,
    showTierList: false,
    specSwitchText: "切换 ›",
    contactMessageTitle: "桂圆电竞订单支付",
    contactMessagePath: "/pages/service-pay/service-pay?scene=order",
    contactMessageImg: CONTACT_CARD_IMG
  },

  onLoad(options = {}) {
    const fromCatalog = options.orderId ? findListedOrderById(options.orderId) : null
    const selectedOrder = wx.getStorageSync("selectedQuickOrder")
    this.setData({
      order: normalizeOrder(fromCatalog || selectedOrder || fallbackOrder)
    }, () => {
      this.recalculateTotal()
    })
    loadCustomerProfile(() => {})
  },

  chooseTier(e) {
    const tierId = e.currentTarget.dataset.id
    const selectedTier = this.data.order.priceTiers.find((tier) => tier.id === tierId)
    if (!selectedTier) return
    this.setData({
      order: normalizeOrder({
        ...this.data.order,
        selectedPriceTier: selectedTier
      }),
      showTierList: false,
      specSwitchText: "切换 ›"
    }, () => {
      this.recalculateTotal()
    })
  },

  openSpecTip() {
    const showTierList = !this.data.showTierList
    this.setData({
      showTierList,
      specSwitchText: showTierList ? "收起" : "切换 ›"
    })
  },

  recalculateTotal() {
    const amount = Number(this.data.order.price || 0) * Number(this.data.quantity || 1)
    this.setData({
      totalAmount: formatAmount(amount),
      ...buildOrderContactPay(this.data.order, amount)
    })
  },

  onGameNicknameInput(e) {
    this.setData({ gameNickname: (e.detail.value || "").slice(0, 20) })
  },

  onGameIdInput(e) {
    this.setData({ gameId: (e.detail.value || "").slice(0, 30) })
  },

  chooseAssignMode(e) {
    const mode = e.currentTarget.dataset.mode || "random"
    this.setData({ assignMode: mode })
    if (mode === "appoint") this.openPlayerPicker()
  },

  changeQuantity(e) {
    const step = Number(e.currentTarget.dataset.step || 0)
    const quantity = Math.max(1, Math.min(99, Number(this.data.quantity || 1) + step))
    this.setData({ quantity }, () => this.recalculateTotal())
  },

  toggleAgreement() {
    this.setData({ agreed: !this.data.agreed })
  },

  openPlayerPicker() {
    this.setData({
      showPlayerPicker: true,
      playerOptions: this.markSelectedPlayers(buildPlayerOptions(this.data.playerKeyword))
    })
  },

  closePlayerPicker() {
    this.setData({ showPlayerPicker: false })
  },

  onPlayerSearchInput(e) {
    const playerKeyword = e.detail.value || ""
    this.setData({
      playerKeyword,
      playerOptions: this.markSelectedPlayers(buildPlayerOptions(playerKeyword))
    })
  },

  markSelectedPlayers(list) {
    const selectedId = this.data.selectedPlayer ? this.data.selectedPlayer.id : ""
    return list.map((player) => ({
      ...player,
      selected: player.id === selectedId
    }))
  },

  selectPlayer(e) {
    const playerId = e.currentTarget.dataset.playerId
    const selectedPlayer = this.data.playerOptions.find((player) => player.id === playerId)
    if (!selectedPlayer) return
    this.setData({
      selectedPlayer,
      assignMode: "appoint",
      playerOptions: this.data.playerOptions.map((player) => ({
        ...player,
        selected: player.id === selectedPlayer.id
      }))
    })
  },

  confirmPlayerPicker() {
    if (!this.data.selectedPlayer) {
      wx.showToast({ title: "请选择陪练", icon: "none" })
      return
    }
    this.setData({ showPlayerPicker: false })
  },

  showAgreement() {
    wx.showModal({
      title: "下单协议",
      content: "平台内下单、平台内沟通；随机安排会进入接单大厅，指定陪练会直接拉入订单群。",
      showCancel: false,
      confirmText: "知道了"
    })
  },

  submitOrder() {
    if (!requireLogin()) return
    if (!this.data.agreed) {
      wx.showToast({ title: "请先同意下单协议", icon: "none" })
      return
    }
    if (this.data.assignMode === "appoint" && !this.data.selectedPlayer) {
      wx.showToast({ title: "请选择指定陪练", icon: "none" })
      this.openPlayerPicker()
      return
    }
    const unitAmount = Number(this.data.order.price || 0)
    const originalAmount = unitAmount * Number(this.data.quantity || 1)
    const discount = applyMemberDiscount(originalAmount)
    const tier = this.data.order.selectedPriceTier || {}
    const order = {
      ...this.data.order,
      title: this.data.order.title,
      price: discount.originalAmount,
      amount: discount.originalAmount,
      originalAmount: discount.originalAmount,
      payableAmount: discount.payableAmount,
      memberDiscount: discount.discount,
      memberLevelName: discount.memberLevelName,
      quantity: this.data.quantity,
      selectedPriceTier: {
        ...tier,
        originalPrice: unitAmount,
        payablePrice: discount.payableAmount
      }
    }
    payWithCatFood(discount.payableAmount, {
      orderId: order.id || `${order.title}-${Date.now()}`,
      title: "订单消费",
      note: `${order.title} · ${tier.name || "默认规格"}`
    }, (result) => {
      if (!result.ok) {
        const shortage = Number(result.shortage || Math.max(0, discount.payableAmount - Number(result.balance || 0)))
        wx.showModal({
          title: "猫粮不足",
          content: `当前猫粮不足，还差 ${formatAmount(shortage)} 猫粮，是否前往充值？`,
          confirmText: "去充值",
          cancelText: "取消",
          success: (res) => {
            if (res.confirm) rechargeForShortage(shortage, "桂圆电竞猫粮充值")
          }
        })
        return
      }
      const paidOrder = {
        ...order,
        paymentStatus: "paid_cat_food",
        paidCatFood: discount.payableAmount,
        playerId: this.data.selectedPlayer ? this.data.selectedPlayer.id : "",
        playerName: this.data.selectedPlayer ? this.data.selectedPlayer.name : ""
      }
      const group = createOrderGroup(paidOrder, {
      specifiedPlayer: this.data.assignMode === "appoint" && this.data.selectedPlayer ? {
        id: this.data.selectedPlayer.id,
        playerNo: this.data.selectedPlayer.playerNo || this.data.selectedPlayer.id,
        name: this.data.selectedPlayer.name,
        avatar: this.data.selectedPlayer.avatar
      } : null,
      filters: {
        orderKind: "fun_order",
        priceTierId: tier.id || "",
        priceTierName: tier.name || "默认规格",
        priceTierDesc: tier.desc || "",
        gameNickname: this.data.gameNickname.trim(),
        gameId: this.data.gameId.trim(),
        quantity: this.data.quantity,
        playType: this.data.assignMode,
        playTypeName: this.data.assignMode === "appoint" ? "指定陪练" : "随机安排",
        assignedPlayerId: this.data.selectedPlayer ? this.data.selectedPlayer.id : "",
        assignedPlayerName: this.data.selectedPlayer ? this.data.selectedPlayer.name : "",
        remark: ""
      }
      })
      if (this.data.assignMode === "appoint" && this.data.selectedPlayer) {
        wx.showToast({ title: "已提交，等待指定达人接单", icon: "none" })
      } else {
        saveRecruitTask({
          orderId: order.id || "fun-order",
          groupId: group.id,
          title: order.title,
          status: "recruiting",
          serviceId: group.service.id
        })
      }
      if (this.data.assignMode !== "appoint") wx.showToast({ title: "支付成功，已建群", icon: "success" })
      setTimeout(() => {
        if (this.data.assignMode === "appoint") {
          wx.navigateTo({ url: "/pages/boss-orders/boss-orders" })
          return
        }
        wx.switchTab({ url: "/pages/message/message" })
      }, 450)
    })
  }
})
