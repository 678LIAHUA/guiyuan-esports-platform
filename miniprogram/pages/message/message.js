const { getGroups, markGroupRead, syncGroupsFromBackend } = require("../../utils/order-group")

Page({
  data: {
    groups: []
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) tabBar.setData({ selected: 3, hidden: false })
    this.loadGroups()
    this.syncGroups()
    this.startSyncTimer()
  },

  onHide() {
    this.stopSyncTimer()
  },

  onUnload() {
    this.stopSyncTimer()
  },

  startSyncTimer() {
    this.stopSyncTimer()
    this.syncTimer = setInterval(() => this.syncGroups(), 3000)
  },

  stopSyncTimer() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
  },

  syncGroups() {
    syncGroupsFromBackend(() => this.loadGroups())
  },

  loadGroups() {
    const groups = getGroups().filter((group) => !group.requiresPlayerAccept).map((group) => ({
      ...group,
      orderNo: group.orderNo || "--",
      memberText: `订单号 ${group.orderNo || "--"} · 客服 ${group.service ? group.service.name : "系统客服"} · 达人 ${(group.players || []).length} 人`,
      statusText: group.status === "serving" ? "服务中" : "待接单"
    }))
    this.setData({
      groups
    })
  },

  openGroup(e) {
    const group = this.data.groups.find((item) => item.id === e.currentTarget.dataset.id)
    if (!group) return
    markGroupRead(group.id)
    wx.navigateTo({
      url: `/pages/order-chat/order-chat?groupId=${group.id}`
    })
  }
})
