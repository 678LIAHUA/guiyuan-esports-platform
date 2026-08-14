Component({
  options: {
    multipleSlots: true
  },

  properties: {
    title: {
      type: String,
      value: ""
    },
    variant: {
      type: String,
      value: ""
    },
    background: {
      type: String,
      value: "transparent"
    },
    color: {
      type: String,
      value: "#191633"
    },
    back: {
      type: Boolean,
      value: true
    },
    delta: {
      type: Number,
      value: 1
    }
  },

  data: {
    safeTop: 0,
    menuRight: 0,
    navClass: "",
    innerStyle: ""
  },

  lifetimes: {
    attached() {
      let info = {}
      let rect = null
      try {
        info = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {}
      } catch (error) {
        info = {}
      }
      try {
        rect = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
      } catch (error) {
        rect = null
      }
      const windowWidth = info.windowWidth || info.screenWidth || 375
      const menuRight = rect ? windowWidth - rect.left + 8 : 110
      const isHome = this.properties.variant === "home"
      this.setData({
        safeTop: info.statusBarHeight || 0,
        menuRight,
        navClass: isHome ? "home-nav" : "",
        innerStyle: isHome ? `padding-right: ${menuRight}px;` : ""
      })
    }
  },

  methods: {
    back() {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        wx.navigateBack({ delta: this.data.delta })
      } else {
        wx.switchTab({ url: "/pages/index/index" })
      }
    }
  }
})
