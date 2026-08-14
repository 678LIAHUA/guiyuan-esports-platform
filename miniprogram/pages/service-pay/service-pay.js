const CARD_IMG = "https://api.example.com/assets/guiyuan-logo.jpg"
const API_BASE = "https://api.example.com"

function decodeValue(value) {
  try {
    return decodeURIComponent(value || "")
  } catch (error) {
    return value || ""
  }
}

function moneyText(value) {
  const number = Number(value || 0)
  return Number.isFinite(number) ? number.toFixed(2) : "0.00"
}

function tokenText(value) {
  const number = Number(value || 0)
  if (!Number.isFinite(number)) return "0"
  return number % 1 === 0 ? String(number) : number.toFixed(1)
}

function buildOrderNo() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, "0")
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${String(Date.now()).slice(-6)}`
}

function createH5PayOrder(payload, callback) {
  wx.request({
    url: `${API_BASE}/api/public/recharge-orders`,
    method: "POST",
    data: payload,
    success: (res) => {
      const data = res.data || {}
      if (data.payUrl) {
        callback({ ok: true, payUrl: data.payUrl })
        return
      }
      callback({ ok: false, error: data.error || "支付链接生成失败" })
    },
    fail: () => callback({ ok: false, error: "支付接口暂不可用" })
  })
}

Page({
  data: {
    scene: "recharge",
    orderNo: "",
    title: "桂圆电竞猫粮充值",
    amountYuan: 0,
    amountYuanText: "0.00",
    tokenAmount: "0",
    userId: "",
    userName: "",
    cover: "/assets/cat-food.jpg",
    expireMinutes: "59",
    expireSeconds: "59",
    contactMessageTitle: "桂圆电竞订单支付",
    contactMessagePath: "/pages/service-pay/service-pay",
    contactMessageImg: CARD_IMG,
    payUrl: "",
    sessionFrom: "",
    sendingHint: "点击立即支付后进入客服消息，系统会自动发送专属微信支付链接。"
  },

  onLoad(options = {}) {
    const scene = decodeValue(options.scene || "recharge")
    const amountYuan = Number(decodeValue(options.amountYuan || "0"))
    const tokenAmount = decodeValue(options.tokenAmount || "0")
    const userId = decodeValue(options.userId || "")
    const userName = decodeValue(options.userName || "")
    const title = decodeValue(options.title || (scene === "recharge" ? "桂圆电竞猫粮充值" : "桂圆电竞订单支付"))
    const amountYuanText = moneyText(amountYuan)
    const normalizedToken = tokenText(tokenAmount || amountYuan * 10)
    const orderNo = options.orderNo || buildOrderNo()
    const payUrl = decodeValue(options.payUrl || "")
    const sessionFrom = JSON.stringify({
      type: "guiyuan_pay",
      orderNo,
      amountYuan: amountYuanText,
      tokenAmount: normalizedToken,
      payUrl
    })
    const cardPath = `/pages/service-pay/service-pay?scene=${encodeURIComponent(scene)}&amountYuan=${encodeURIComponent(amountYuanText)}&tokenAmount=${encodeURIComponent(normalizedToken)}&userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}&title=${encodeURIComponent(title)}&orderNo=${encodeURIComponent(orderNo)}&payUrl=${encodeURIComponent(payUrl)}`

    this.setData({
      scene,
      orderNo,
      title,
      amountYuan: Number(amountYuanText),
      amountYuanText,
      tokenAmount: normalizedToken,
      userId,
      userName,
      contactMessageTitle: `${title} ￥${amountYuanText}`,
      contactMessagePath: cardPath,
      contactMessageImg: CARD_IMG,
      payUrl,
      sessionFrom
    })
    this.startCountdown()
    if (amountYuan > 0 && !payUrl && !options.orderNo) {
      createH5PayOrder({
        orderNo,
        userId: userId || "boss-demo",
        userName: userName || "小程序用户",
        amountYuan: Number(amountYuanText),
        tokenAmount: Number(normalizedToken || 0)
      }, (result) => {
        if (!result.ok) {
          wx.showToast({ title: result.error, icon: "none" })
          return
        }
        this.setData({
          payUrl: result.payUrl,
          contactMessagePath: `/pages/service-pay/service-pay?scene=${encodeURIComponent(scene)}&amountYuan=${encodeURIComponent(amountYuanText)}&tokenAmount=${encodeURIComponent(normalizedToken)}&userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}&title=${encodeURIComponent(title)}&orderNo=${encodeURIComponent(orderNo)}&payUrl=${encodeURIComponent(result.payUrl)}`,
          sessionFrom: JSON.stringify({
            type: "guiyuan_pay",
            orderNo,
            amountYuan: amountYuanText,
            tokenAmount: normalizedToken,
            payUrl: result.payUrl
          })
        })
      })
    }
  },

  onUnload() {
    if (this.countdownTimer) clearInterval(this.countdownTimer)
  },

  startCountdown() {
    let left = 59 * 60 + 59
    if (this.countdownTimer) clearInterval(this.countdownTimer)
    this.countdownTimer = setInterval(() => {
      left = Math.max(0, left - 1)
      this.setData({
        expireMinutes: String(Math.floor(left / 60)).padStart(2, "0"),
        expireSeconds: String(left % 60).padStart(2, "0")
      })
      if (left <= 0 && this.countdownTimer) clearInterval(this.countdownTimer)
    }, 1000)
  },

  onContactPay() {
    wx.showToast({
      title: "请在消息里点击支付链接",
      icon: "none"
    })
  },

  copyPayUrl() {
    if (!this.data.payUrl) {
      wx.showToast({ title: "支付链接生成中", icon: "none" })
      return
    }
    wx.setClipboardData({
      data: this.data.payUrl,
      success: () => wx.showToast({ title: "支付链接已复制", icon: "success" })
    })
  },

})
