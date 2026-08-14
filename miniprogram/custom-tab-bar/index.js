Component({
  data: {
    selected: 0,
    hidden: false,
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页",
        iconPath: "/assets/tabbar/home.png",
        activeIconPath: "/assets/tabbar/home-on.png"
      },
      {
        pagePath: "/pages/rank/rank",
        text: "排行",
        iconPath: "/assets/tabbar/rank.png",
        activeIconPath: "/assets/tabbar/rank-on.png"
      },
      {
        pagePath: "/pages/publish/publish",
        targetPath: "/pages/quick-match/quick-match",
        text: "快速下单",
        iconPath: "/assets/tabbar/publish.png",
        activeIconPath: "/assets/tabbar/publish-on.png"
      },
      {
        pagePath: "/pages/message/message",
        text: "消息",
        iconPath: "/assets/tabbar/message.png",
        activeIconPath: "/assets/tabbar/message-on.png"
      },
      {
        pagePath: "/pages/mine/mine",
        text: "我的",
        iconPath: "/assets/tabbar/mine.png",
        activeIconPath: "/assets/tabbar/mine-on.png"
      }
    ]
  },

  methods: {
    switchTab(e) {
      const index = Number(e.currentTarget.dataset.index)
      const item = this.data.list[index]
      if (!item) return
      if (item.targetPath) {
        wx.navigateTo({ url: item.targetPath })
        return
      }
      if (index === this.data.selected) return
      wx.switchTab({ url: item.pagePath })
    }
  }
})
