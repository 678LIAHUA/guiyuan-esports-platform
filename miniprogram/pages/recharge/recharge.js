const DEFAULT_TIERS = [10, 30, 50, 100, 200]
const TOKEN_RATE = 10
const API_BASE = "https://api.example.com"
const { getCustomerProfile, loadCustomerProfile } = require("../../utils/customer-account")
const PENDING_RECHARGE_KEY = "pendingRechargeOrder"

function moneyText(value) {
  return Number(value || 0).toFixed(2)
}

function normalizeTiers(list = [], rate = TOKEN_RATE) {
  const values = list
    .map((item) => Number(item.yuan || item.amountYuan || item))
    .filter((value) => Number.isFinite(value) && value > 0)
    .slice(0, 5)
  const source = values.length ? values : DEFAULT_TIERS
  return source.map((yuan) => ({
    yuan,
    yuanText: moneyText(yuan),
    tokenAmount: Math.floor(yuan * rate)
  }))
}

Page({
  data: {
    balance: 0,
    tokenRate: TOKEN_RATE,
    tokenIcon: "/assets/cat-food.jpg",
    tiers: normalizeTiers(DEFAULT_TIERS),
    selectedIndex: 0,
    customAmount: "",
    payAmount: 10,
    payAmountText: moneyText(10),
    previewTokenAmount: 100,
    hasPendingRecharge: false,
    pendingRechargeText: "",
    pendingRechargeHint: "",
    tokenName: "猫粮",
    auditMode: true,
    paymentMode: "official_virtual",
    payMethodText: "官方虚拟支付",
    submitting: false
  },

  onLoad(options = {}) {
    this.initialAmountYuan = Number(options.amountYuan || 0)
    this.loadRechargeConfig()
    this.refreshCustomerBalance()
    if (this.initialAmountYuan > 0) this.applyAmount(this.initialAmountYuan)
  },

  onShow() {
    this.refreshCustomerBalance()
    this.checkPendingRecharge()
  },

  refreshCustomerBalance() {
    const profile = getCustomerProfile()
    this.setData({ balance: Number(profile.balanceCatFood || 0).toFixed(0) })
    loadCustomerProfile((customer) => {
      this.setData({ balance: Number(customer.balanceCatFood || 0).toFixed(0) })
    })
  },

  checkPendingRecharge() {
    const pending = wx.getStorageSync(PENDING_RECHARGE_KEY)
    if (!pending || !pending.orderNo || this.checkingPendingRecharge) return
    this.checkingPendingRecharge = true
    this.setData({
      hasPendingRecharge: true,
      pendingRechargeText: `最近充值 ${moneyText(pending.amountYuan || 0)}元`,
      pendingRechargeHint: "正在确认支付结果"
    })
    wx.request({
      url: `${API_BASE}/api/public/recharge-order?orderNo=${encodeURIComponent(pending.orderNo)}`,
      method: "GET",
      success: (res) => {
        const order = res.data && res.data.order
        if (!order) return
        if (order.status === "paid") {
          wx.removeStorageSync(PENDING_RECHARGE_KEY)
          this.setData({
            hasPendingRecharge: true,
            pendingRechargeText: `充值成功 +${Number(order.tokenAmount || pending.tokenAmount || 0).toFixed(0)}猫粮`,
            pendingRechargeHint: "猫粮已到账，账单流水已同步"
          })
          loadCustomerProfile((customer) => {
            this.setData({ balance: Number(customer.balanceCatFood || 0).toFixed(0) })
          })
          wx.showToast({ title: "猫粮已到账", icon: "success" })
          return
        }
        if (order.status === "pending") {
          this.setData({
            pendingRechargeHint: "待支付，返回支付页可继续完成"
          })
          return
        }
        this.setData({ pendingRechargeHint: "订单未完成，请重新发起充值" })
      },
      complete: () => {
        this.checkingPendingRecharge = false
      }
    })
  },

  loadRechargeConfig() {
    wx.request({
      url: `${API_BASE}/api/public/recharge-config`,
      method: "GET",
      success: (res) => {
        const config = res.data && res.data.config
        if (!config) return
        const tokenRate = Number(config.tokenRate || TOKEN_RATE)
        const tiers = normalizeTiers(config.tiers || [], tokenRate)
        const first = tiers[0] || normalizeTiers(DEFAULT_TIERS, tokenRate)[0]
        this.setData({
          tokenRate,
          tokenName: config.tokenName || "猫粮",
          tokenIcon: config.tokenIcon || "/assets/cat-food.jpg",
          auditMode: config.auditMode !== false,
          paymentMode: config.paymentMode || "official_virtual",
          payMethodText: config.paymentMode === "service_account_wechat" ? "微信支付" : "官方虚拟支付",
          tiers,
          selectedIndex: 0,
          customAmount: "",
          payAmount: first.yuan,
          payAmountText: moneyText(first.yuan),
          previewTokenAmount: first.tokenAmount
        }, () => {
          if (this.initialAmountYuan > 0) this.applyAmount(this.initialAmountYuan)
        })
      }
    })
  },

  applyAmount(amountYuan) {
    const payAmount = Number(amountYuan || 0)
    if (!Number.isFinite(payAmount) || payAmount <= 0) return
    const selectedIndex = this.data.tiers.findIndex((tier) => Number(tier.yuan) === payAmount)
    this.setData({
      selectedIndex,
      customAmount: selectedIndex >= 0 ? "" : moneyText(payAmount),
      payAmount,
      payAmountText: moneyText(payAmount),
      previewTokenAmount: Math.floor(payAmount * this.data.tokenRate)
    })
  },

  chooseTier(e) {
    const selectedIndex = Number(e.currentTarget.dataset.index || 0)
    const tier = this.data.tiers[selectedIndex]
    if (!tier) return
    this.setData({
      selectedIndex,
      customAmount: "",
      payAmount: tier.yuan,
      payAmountText: moneyText(tier.yuan),
      previewTokenAmount: tier.tokenAmount
    })
  },

  onCustomInput(e) {
    const customAmount = e.detail.value || ""
    const payAmount = Number(customAmount)
    const validAmount = Number.isFinite(payAmount) ? payAmount : 0
    this.setData({
      customAmount,
      selectedIndex: -1,
      payAmount: validAmount,
      payAmountText: moneyText(validAmount),
      previewTokenAmount: Math.floor(validAmount * this.data.tokenRate)
    })
  },

  submitRecharge() {
    const amountYuan = Number(this.data.payAmount)
    if (!Number.isFinite(amountYuan) || amountYuan <= 0) {
      wx.showToast({ title: "请输入充值金额", icon: "none" })
      return
    }
    this.setData({ submitting: true })
    wx.login({
      success: (loginRes) => this.createRechargeOrder(amountYuan, loginRes.code || ""),
      fail: () => this.createRechargeOrder(amountYuan, ""),
      complete: () => {}
    })
  },

  createRechargeOrder(amountYuan, code = "") {
    wx.request({
      url: `${API_BASE}/api/public/recharge-orders`,
      method: "POST",
      data: {
        userId: getCustomerProfile().id || "boss-demo",
        userName: getCustomerProfile().name || "喵喵喵",
        code,
        amountYuan,
        tokenAmount: Math.floor(amountYuan * this.data.tokenRate)
      },
      success: (res) => {
        const data = res.data || {}
        if (res.statusCode >= 400 || data.error) {
          console.error("[recharge-order-error]", res.statusCode, data)
          wx.showModal({
            title: "支付参数生成失败",
            content: data.error || data.warning || "服务器暂时无法创建充值订单",
            showCancel: false
          })
          return
        }
        if (data.warning) console.warn("[recharge-order-warning]", data.warning)
        if (data.virtualPayParams || data.paymentMode === "official_virtual") {
          this.handleVirtualPayment(data, amountYuan)
          return
        }
        if (data.payUrl) {
          const recharge = data.recharge || {}
          wx.setStorageSync(PENDING_RECHARGE_KEY, {
            orderNo: recharge.orderNo || recharge.id || "",
            amountYuan,
            tokenAmount: recharge.tokenAmount || Math.floor(amountYuan * this.data.tokenRate),
            payUrl: data.payUrl,
            createdAt: recharge.createdAt || new Date().toISOString()
          })
          wx.navigateTo({
            url: `/pages/service-pay/service-pay?scene=recharge&amountYuan=${encodeURIComponent(moneyText(amountYuan))}&tokenAmount=${encodeURIComponent(recharge.tokenAmount || Math.floor(amountYuan * this.data.tokenRate))}&userId=${encodeURIComponent(getCustomerProfile().id || "boss-demo")}&userName=${encodeURIComponent(getCustomerProfile().name || "喵喵喵")}&title=${encodeURIComponent("桂圆电竞猫粮充值")}&orderNo=${encodeURIComponent(recharge.orderNo || recharge.id || "")}&payUrl=${encodeURIComponent(data.payUrl)}`
          })
          return
        }
        const payParams = data.payParams
        if (!payParams) {
          wx.showToast({ title: "支付链接生成失败", icon: "none" })
          return
        }
        wx.requestPayment({
          ...payParams,
          success: () => {
            wx.showToast({ title: "充值成功", icon: "success" })
          },
          fail: () => {
            wx.showToast({ title: "支付未完成", icon: "none" })
          }
        })
      },
      fail: () => {
        wx.showToast({ title: "充值接口暂不可用", icon: "none" })
      },
      complete: () => {
        this.setData({ submitting: false })
      }
    })
  },

  handleVirtualPayment(data = {}, amountYuan) {
    const recharge = data.recharge || {}
    const virtualPayParams = data.virtualPayParams
    wx.setStorageSync(PENDING_RECHARGE_KEY, {
      orderNo: recharge.orderNo || recharge.id || "",
      amountYuan,
      tokenAmount: recharge.tokenAmount || Math.floor(amountYuan * this.data.tokenRate),
      createdAt: recharge.createdAt || new Date().toISOString()
    })
    if (!virtualPayParams) {
      wx.showModal({
        title: "官方虚拟支付未配置",
        content: data.warning || "后台已切到官方虚拟支付，请先在总后台填写微信虚拟支付 OfferId/AppKey 并确认微信后台已开通该能力。",
        showCancel: false
      })
      return
    }
    if (!virtualPayParams.paySig || !virtualPayParams.signature) {
      wx.showModal({
        title: "虚拟支付签名缺失",
        content: data.warning || "请确认服务器已配置 WECHAT_MINI_SECRET，并重新进入小程序后再试。",
        showCancel: false
      })
      return
    }
    if (!wx.requestVirtualPayment) {
      wx.showModal({
        title: "当前版本不支持",
        content: "请使用支持小程序虚拟支付的微信版本或真机环境测试。",
        showCancel: false
      })
      return
    }
    wx.requestVirtualPayment({
      ...virtualPayParams,
      success: () => {
        wx.showToast({ title: "支付成功", icon: "success" })
        wx.request({
          url: `${API_BASE}/api/public/recharge-orders/complete`,
          method: "POST",
          data: {
            orderNo: recharge.orderNo || recharge.id || "",
            transactionId: `virtual_${recharge.orderNo || recharge.id || Date.now()}`
          },
          complete: () => {
            setTimeout(() => this.checkPendingRecharge(), 400)
          }
        })
      },
      fail: () => {
        wx.showToast({ title: "支付未完成", icon: "none" })
      }
    })
  },

  showRecords() {
    wx.navigateTo({ url: "/pages/bill-list/bill-list" })
  }
})
