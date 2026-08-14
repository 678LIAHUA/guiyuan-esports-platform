// app.js
App({
  onLaunch() {
    wx.setStorageSync("backendApiBase", "https://api.example.com")
    const profile = wx.getStorageSync("currentPlayerProfile")
    if (profile && profile.name === "\u94f6\u6708") {
      wx.setStorageSync("currentPlayerProfile", {
        ...profile,
        name: "圆圆"
      })
    }
  },

  globalData: {
    brand: {
      name: "桂圆电竞",
      logo: "/assets/guiyuan-logo.jpg",
      tokenName: "猫粮",
      tokenIcon: "/assets/cat-food.jpg",
      tokenRate: 10,
      currency: "cat_food"
    }
  }
})
