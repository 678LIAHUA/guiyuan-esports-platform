const { getHomeGames, getListedOrders } = require("../../utils/order-catalog")
const { findPlayerById, getPlayers, searchPlayers } = require("../../utils/player-catalog")
const {
  bindReferral,
  currentUser,
  getCustomerReferral,
  getReferralConfig,
  loadCustomerProfile
} = require("../../utils/customer-account")

function normalizeEntryList(list = []) {
  return list
    .filter((item) => item && item.visible !== false)
    .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0))
}

function normalizeAssetUrl(url) {
  const value = String(url || "").trim()
  if (!value) return "https://api.example.com/assets/guiyuan-logo.jpg"
  if (/^https:\/\//i.test(value)) return value
  if (value.startsWith("/")) return `https://api.example.com${value}`
  return "https://api.example.com/assets/guiyuan-logo.jpg"
}

function normalizeBannerList(list = []) {
  return normalizeEntryList(list)
    .map((item, index) => ({
      img: normalizeAssetUrl(item.imageUrl || item.img),
      cls: index === 0 ? "active" : ""
    }))
    .filter((item) => item.img)
}

Page({
  data: {
    currentBanner: 0,
    banners: [
      { img: "/assets/banner-1.jpg", cls: "active" },
      { img: "/assets/banner-2.jpg", cls: "" },
      { img: "/assets/banner-3.jpg", cls: "" }
    ],
    funSearchKeyword: "",
    games: [],
    players: [],
    hotOrders: [],
    serviceBubbleTitle: "桂圆电竞客服",
    serviceBubblePath: "/pages/index/index",
    serviceBubbleImg: "https://api.example.com/assets/guiyuan-logo.jpg",
    serviceBubbleSession: JSON.stringify({ type: "home_customer_service", source: "index_float" }),
    customerServiceQrUrl: "https://api.example.com/assets/guiyuan-logo.jpg",
    showCustomerQr: false,
    invite: {
      title: "邀请有礼",
      desc: "新用户注册填写你的ID，首月消费返提成",
      myId: "",
      inviterId: "",
      rate: 5,
      months: 1,
      statusText: "未绑定邀请人"
    },
    broadcasts: [
      "老板 346030 刚刚收藏了化神期达人圆圆",
      "三角洲绝密单支持机密/绝密价位选择",
      "小时陪按整小时预扣，少玩部分结单后按分钟退款"
    ],
    quicks: [
      { id: "service", name: "联系客服", desc: "订单问题找客服", iconUrl: "/assets/entry/quick-service.png", target: "service" },
      { id: "advice", name: "提点建议", desc: "反馈体验问题", iconUrl: "/assets/entry/quick-notice.png", target: "advice" },
      { id: "notice", name: "点单须知", desc: "下单前先看", iconUrl: "/assets/entry/quick-order.png", target: "notice" }
    ]
  },

  onLoad() {
    this.refreshInviteInfo()
    this.fetchPlayerList()
    this.fetchEntryConfig()
    this.fetchCustomerQr()
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) tabBar.setData({ selected: 0 })
    this.refreshInviteInfo()
    this.fetchPlayerList()
  },

  refreshInviteInfo() {
    const user = currentUser()
    const referral = getCustomerReferral()
    const config = getReferralConfig()
    this.setData({
      invite: {
        ...this.data.invite,
        myId: user.id,
        inviterId: referral && referral.inviterId ? referral.inviterId : "",
        rate: Number(config.rate || (referral && referral.rate) || 5),
        months: Number(config.months || (referral && referral.months) || 1),
        statusText: referral && referral.inviterId ? `已绑定 ${referral.inviterId}` : "未绑定邀请人"
      }
    })
    loadCustomerProfile((profile, bills, memberLevels, remoteReferral, remoteConfig) => {
      this.setData({
        invite: {
          ...this.data.invite,
          myId: profile.id || user.id,
          inviterId: remoteReferral && remoteReferral.inviterId ? remoteReferral.inviterId : this.data.invite.inviterId,
          rate: Number((remoteConfig && remoteConfig.rate) || this.data.invite.rate || 5),
          months: Number((remoteConfig && remoteConfig.months) || this.data.invite.months || 1),
          statusText: remoteReferral && remoteReferral.inviterId ? `已绑定 ${remoteReferral.inviterId}` : this.data.invite.statusText
        }
      })
    })
  },

  fetchPlayerList() {
    this.applyPlayerList(getPlayers())
    this.setData({
      hotOrders: getListedOrders().slice(0, 6)
    })
    wx.request({
      url: `https://api.example.com/api/public/catalog?t=${Date.now()}`,
      success: (res) => {
        const catalog = res.data && res.data.catalog
        if (!catalog || !Array.isArray(catalog.players)) return
        wx.setStorageSync("remotePlayerCatalog", catalog)
        this.applyPlayerList(getPlayers())
        if (Array.isArray(catalog.games)) this.applyEntryConfig({ games: catalog.games })
        const banners = normalizeBannerList(catalog.banners || [])
        if (banners.length) this.setData({ currentBanner: 0, banners })
      }
    })
  },

  applyPlayerList(players = []) {
    this.setData({
      players: players.map((item) => ({
        ...item,
        statusClass: item.acceptingOrders ? "on" : "off",
        statusText: item.acceptingOrders ? "在线" : "离线"
      }))
    })
  },

  fetchEntryConfig() {
    this.applyEntryConfig({
      games: getHomeGames()
    })
  },

  fetchCustomerQr() {
    wx.request({
      url: "https://api.example.com/api/public/bootstrap",
      success: (res) => {
        const settings = res.data && res.data.settings
        if (!settings) return
        this.setData({
          customerServiceQrUrl: normalizeAssetUrl(settings.customerServiceQrUrl)
        })
      }
    })
  },

  applyEntryConfig(config = {}) {
    const mergeById = (defaults, updates) => defaults.map((item) => ({
      ...item,
      ...((updates || []).find((entry) => entry.id === item.id) || {})
    }))

    this.setData({
      games: normalizeEntryList(config.games || this.data.games),
      quicks: mergeById(this.data.quicks, config.quicks)
    })
  },

  onBannerChange(e) {
    const current = e.detail.current || 0
    const banners = this.data.banners.map((item, index) => ({
      ...item,
      cls: index === current ? "active" : ""
    }))
    this.setData({ currentBanner: current, banners })
  },

  openDetail(e) {
    const playerId = e.currentTarget.dataset.playerId || "DT10001"
    wx.navigateTo({ url: `/pages/detail/detail?playerId=${playerId}` })
  },

  onFunSearchInput(e) {
    this.setData({ funSearchKeyword: e.detail.value || "" })
  },

  confirmFunSearch() {
    const keyword = (this.data.funSearchKeyword || "").trim()
    const exactPlayer = findPlayerById(keyword)
    if (exactPlayer) {
      wx.navigateTo({ url: `/pages/detail/detail?playerId=${exactPlayer.id}` })
      return
    }
    if (keyword && searchPlayers(keyword).length) {
      wx.navigateTo({
        url: `/pages/player-list/player-list?keyword=${encodeURIComponent(keyword)}`
      })
      return
    }
    wx.navigateTo({
      url: `/pages/fun-order-search/fun-order-search?keyword=${encodeURIComponent(keyword)}`
    })
  },

  openPlayerList() {
    wx.navigateTo({ url: "/pages/player-list/player-list" })
  },

  openOrder(e) {
    const orderId = e.currentTarget.dataset.orderId
    wx.navigateTo({ url: `/pages/order-detail/order-detail?orderId=${orderId}` })
  },

  openCustomerQr() {
    this.setData({ showCustomerQr: true })
  },

  closeCustomerQr() {
    this.setData({ showCustomerQr: false })
  },

  noop() {
    return false
  },

  copyInviteId() {
    const id = this.data.invite.myId
    if (!id) return
    wx.setClipboardData({
      data: id,
      success: () => wx.showToast({ title: "已复制我的ID", icon: "success" })
    })
  },

  fillInviterId() {
    wx.showModal({
      title: "填写邀请人ID",
      editable: true,
      placeholderText: "请输入老用户6位ID，首月返佣",
      confirmText: "保存",
      success: (res) => {
        if (!res.confirm) return
        const inviterId = String(res.content || "").trim()
        bindReferral(inviterId, (result) => {
          if (!result.ok) {
            wx.showToast({ title: result.error || "保存失败", icon: "none" })
            return
          }
          this.refreshInviteInfo()
          wx.showToast({ title: result.message || "已保存", icon: "none" })
        })
      }
    })
  },

  chooseGame(e) {
    const gameId = e.currentTarget.dataset.gameId
    const game = this.data.games.find((item) => item.id === gameId)
    if (!game) return
    if (game.isOther) {
      wx.navigateTo({ url: "/pages/game-list/game-list" })
      return
    }
    wx.navigateTo({ url: `/pages/game-orders/game-orders?gameId=${game.id}` })
  },

  handleEntryTap(e) {
    const target = e.currentTarget.dataset.target
    if (target === "service") {
      wx.switchTab({ url: "/pages/message/message" })
      return
    }
    if (target === "notice") {
      wx.showModal({
        title: "点单须知",
        content: "小时陪按整小时预扣，结单时按实际服务分钟计算，少玩的猫粮会退回账单；完成服务后可评价、收藏或举报达人。",
        showCancel: false,
        confirmText: "知道了"
      })
      return
    }
    if (target === "advice") {
      wx.showToast({ title: "建议入口已预留，后续接客服后台", icon: "none" })
      return
    }
    if (target === "games") {
      wx.navigateTo({ url: "/pages/game-list/game-list" })
      return
    }
    wx.showToast({
      title: target ? "功能准备中" : "敬请期待",
      icon: "none"
    })
  },

  onServiceBubbleContact() {
    wx.showToast({
      title: "已进入客服",
      icon: "none"
    })
  }
})
