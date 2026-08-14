Page({
  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) tabBar.setData({ selected: 0 })
  },

  openQuickMatch() {
    wx.navigateTo({ url: "/pages/quick-match/quick-match" })
  }
})
