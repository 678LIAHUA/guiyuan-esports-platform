const { loginWithWechat, skipLogin } = require("../../utils/customer-account")

const tabPages = ["/pages/index/index", "/pages/rank/rank", "/pages/publish/publish", "/pages/message/message", "/pages/mine/mine"]

function goAfterLogin(redirect) {
  if (!redirect) {
    wx.navigateBack({ delta: 1 })
    return
  }
  const path = redirect.split("?")[0]
  if (tabPages.includes(path)) {
    wx.switchTab({ url: path })
    return
  }
  wx.redirectTo({ url: redirect })
}

Page({
  data: {
    agreed: false,
    redirect: "",
    submitting: false,
    logo: "/assets/guiyuan-logo.jpg"
  },

  onLoad(options = {}) {
    this.setData({
      redirect: decodeURIComponent(options.redirect || "")
    })
  },

  toggleAgreement() {
    this.setData({ agreed: !this.data.agreed })
  },

  openAgreement() {
    wx.navigateTo({ url: "/pages/legal-detail/legal-detail?type=agreement" })
  },

  openPrivacy() {
    wx.navigateTo({ url: "/pages/legal-detail/legal-detail?type=privacy" })
  },

  openWechatPrivacy() {
    if (wx.openPrivacyContract) {
      wx.openPrivacyContract({
        fail: () => {
          this.openPrivacy()
        }
      })
      return
    }
    this.openPrivacy()
  },

  loginByWechat() {
    if (!this.data.agreed) {
      wx.showToast({ title: "请先阅读并同意协议和隐私政策", icon: "none" })
      return
    }
    this.setData({ submitting: true })
    loginWithWechat((result) => {
      this.setData({ submitting: false })
      if (!result.ok) {
        wx.showToast({ title: result.error || "登录失败", icon: "none" })
        return
      }
      wx.showToast({ title: "登录成功", icon: "success" })
      setTimeout(() => {
        goAfterLogin(this.data.redirect)
      }, 300)
    })
  },

  skip() {
    skipLogin()
    goAfterLogin(this.data.redirect)
  }
})
