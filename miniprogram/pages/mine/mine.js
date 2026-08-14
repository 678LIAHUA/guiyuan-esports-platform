const { getCustomerProfile, getLoginState, loadCustomerProfile } = require("../../utils/customer-account")
const { findPlayerById, getPlayers } = require("../../utils/player-catalog")

const PLAYER_WORKBENCH_URL = "/pages/player-workbench/player-workbench"
const PLAYER_WORKBENCH_AUTH_KEY = "playerWorkbenchAuth"
const PLAYER_PROFILE_KEY = "currentPlayerProfile"
const BACKEND_API_BASE_KEY = "backendApiBase"
const DEFAULT_BACKEND_API_BASE = "https://api.example.com"
const GLOBAL_PLAYER_WORKBENCH_SECRET = ""

function apiBase() {
  return String(wx.getStorageSync(BACKEND_API_BASE_KEY) || DEFAULT_BACKEND_API_BASE).replace(/\/$/, "")
}

function normalizeMemberImage(url) {
  const value = String(url || "").trim()
  if (!value) return "/assets/member/silver.jpg"
  if (value.includes("/assets/member/")) {
    const fileName = value.split("/").pop()
    return `/assets/member/${fileName}`
  }
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith("/assets/member/")) return value
  if (value.startsWith("/")) return `${apiBase()}${value}`
  return "/assets/member/silver.jpg"
}

function normalizeCustomer(customer = {}) {
  return {
    ...customer,
    memberLevelName: customer.memberLevelName || "白银会员",
    memberImageUrl: normalizeMemberImage(customer.memberImageUrl)
  }
}

function buildWalletItems(profile) {
  return [
    { key: "catFood", icon: "/assets/cat-food.jpg", label: "猫粮", value: Number(profile.balanceCatFood || 0).toFixed(0), url: "/pages/recharge/recharge" },
    { key: "memberCard", iconText: "会", label: "会员卡", value: profile.memberLevelName || "会员", url: "/pages/member-card/member-card" }
  ]
}

function normalizePlayerProfile(player) {
  if (!player) return null
  return {
    ...player,
    playerNo: player.playerNo || player.id,
    id: player.id || player.playerNo
  }
}

function firstLocalPlayer() {
  const players = getPlayers()
  return players && players.length ? players[0] : null
}

Page({
  data: {
    customer: normalizeCustomer(getCustomerProfile()),
    walletItems: buildWalletItems(normalizeCustomer(getCustomerProfile())),
    tools: [
      { icon: "▣", name: "我的订单", url: "/pages/boss-orders/boss-orders" },
      { icon: "♡", name: "收藏达人", url: "/pages/favorite-players/favorite-players" },
      { icon: "☰", name: "评价管理", url: "/pages/review-manage/review-manage" },
      { icon: "▤", name: "猫粮充值", url: "/pages/recharge/recharge" },
      { icon: "◎", name: "账单流水", url: "/pages/bill-list/bill-list" },
      { icon: "☎", name: "联系客服" },
      { icon: "✦", name: "达人工作台", url: "/pages/player-workbench/player-workbench" },
      { icon: "⚙", name: "设置", url: "/pages/settings/settings" }
    ]
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) tabBar.setData({ selected: 4 })
    const loginState = getLoginState()
    if (!loginState.loggedIn && !loginState.skipped) {
      wx.navigateTo({ url: "/pages/login/login?redirect=/pages/mine/mine" })
      return
    }
    loadCustomerProfile((customer) => {
      const normalized = normalizeCustomer(customer)
      this.setData({
        customer: normalized,
        walletItems: buildWalletItems(normalized)
      })
    })
  },

  openWallet(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    wx.navigateTo({ url })
  },

  openMemberCard() {
    wx.navigateTo({ url: "/pages/member-card/member-card" })
  },

  openTool(e) {
    const url = e.currentTarget.dataset.url || ""
    if (!url) return
    if (url === PLAYER_WORKBENCH_URL) {
      this.openPlayerWorkbench()
      return
    }
    wx.navigateTo({ url })
  },

  openPlayerWorkbench() {
    const saved = wx.getStorageSync(PLAYER_WORKBENCH_AUTH_KEY)
    if (saved && saved.playerId && saved.verifiedAt && saved.wechatBound) {
      wx.navigateTo({ url: PLAYER_WORKBENCH_URL })
      return
    }
    wx.removeStorageSync(PLAYER_WORKBENCH_AUTH_KEY)
    this.askPlayerId()
  },

  askPlayerId() {
    wx.showModal({
      title: "达人验证",
      editable: true,
      placeholderText: "请输入达人ID，例如 DT10001",
      confirmText: "下一步",
      success: (res) => {
        if (!res.confirm) return
        const playerId = String(res.content || "").trim().toUpperCase()
        if (!playerId) {
          wx.showToast({ title: "请输入达人ID", icon: "none" })
          return
        }
        if (playerId === GLOBAL_PLAYER_WORKBENCH_SECRET) {
          this.enterWorkbenchDirectly("")
          return
        }
        this.askPlayerSecret(playerId)
      }
    })
  },

  askPlayerSecret(playerId) {
    wx.showModal({
      title: "输入达人密钥",
      editable: true,
      placeholderText: `${playerId} 的后台工作台密钥`,
      confirmText: "验证",
      success: (res) => {
        if (!res.confirm) return
        const secret = String(res.content || "").trim()
        if (!secret) {
          wx.showToast({ title: "请输入达人密钥", icon: "none" })
          return
        }
        if (secret.toUpperCase() === GLOBAL_PLAYER_WORKBENCH_SECRET) {
          this.enterWorkbenchDirectly(playerId)
          return
        }
        this.verifyPlayerSecret(playerId, secret)
      }
    })
  },

  enterWorkbenchDirectly(playerId) {
    const player = normalizePlayerProfile(findPlayerById(playerId) || firstLocalPlayer())
    if (!player) {
      wx.showToast({ title: "暂无可进入的达人", icon: "none" })
      return
    }
    wx.setStorageSync(PLAYER_WORKBENCH_AUTH_KEY, {
      playerId: player.id,
      playerNo: player.playerNo,
      playerName: player.name,
      wechatBound: true,
      globalWorkbench: true,
      verifiedAt: Date.now()
    })
    wx.setStorageSync(PLAYER_PROFILE_KEY, player)
    wx.showToast({ title: "已进入达人工作台", icon: "success" })
    wx.navigateTo({ url: PLAYER_WORKBENCH_URL })
  },

  verifyPlayerSecret(playerId, secret) {
    wx.showLoading({ title: "验证中" })
    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          wx.hideLoading()
          wx.showToast({ title: "微信登录凭证为空，请重试", icon: "none" })
          return
        }
        wx.request({
          url: `${apiBase()}/api/public/player-auth`,
          method: "POST",
          data: { playerId, secret, code: loginRes.code },
          success: (res) => {
            const data = res.data || {}
            if (res.statusCode >= 200 && res.statusCode < 300 && data.ok) {
              const player = normalizePlayerProfile(data.player)
              wx.setStorageSync(PLAYER_WORKBENCH_AUTH_KEY, {
                ...(data.auth || {}),
                playerId: player.id,
                playerNo: player.playerNo,
                playerName: player.name,
                verifiedAt: Date.now()
              })
              wx.setStorageSync(PLAYER_PROFILE_KEY, player)
              wx.showToast({ title: "验证成功", icon: "success" })
              wx.navigateTo({ url: PLAYER_WORKBENCH_URL })
              return
            }
            wx.showToast({ title: data.error || "密钥或微信账号不匹配", icon: "none" })
          },
          fail: () => {
            wx.showToast({ title: "无法连接后台，请检查域名", icon: "none" })
          },
          complete: () => {
            wx.hideLoading()
          }
        })
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: "微信登录失败，请重试", icon: "none" })
      }
    })
  }
})
