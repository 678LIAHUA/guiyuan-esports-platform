Page({
  data: {
    url: "",
    orderNo: ""
  },

  onLoad(options = {}) {
    const url = decodeURIComponent(options.url || "")
    if (!/^https:\/\/xcxkfsy\.top\//.test(url)) {
      wx.showToast({ title: "支付链接不合法", icon: "none" })
      setTimeout(() => wx.navigateBack(), 800)
      return
    }
    const match = url.match(/[?&]orderNo=([^&]+)/)
    this.setData({
      url,
      orderNo: match ? decodeURIComponent(match[1]) : ""
    })
  },

  onUnload() {
    wx.setStorageSync("paymentReturnAt", Date.now())
  }
})
