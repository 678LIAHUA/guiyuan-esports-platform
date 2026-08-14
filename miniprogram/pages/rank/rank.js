const { backendRequest, getCustomerProfile } = require("../../utils/customer-account")

const DEFAULT_AVATAR = "/assets/avatar-yinyue.jpg"

function normalizeRankEntry(item = {}, index = 0) {
  const rank = Number(item.rank || index + 1)
  return {
    ...item,
    rank,
    rankText: item.rankText || (rank === 1 ? "冠" : String(rank)),
    name: item.name || "未命名",
    img: item.img || item.avatar || DEFAULT_AVATAR,
    amount: item.amount === undefined ? "0" : String(item.amount),
    orderCount: item.orderCount === undefined ? "0" : String(item.orderCount),
    desc: item.desc || "实际数据生成"
  }
}

function emptyRankData(type) {
  const labels = {
    today: ["今日实际订单流水", "今日接单", "实时更新"],
    week: ["本周实际订单流水", "本周接单", "每周一 00:00 更新"],
    whale: ["本周老板实际消费", "消费次数", "每周一 00:00 更新"]
  }[type || "today"]
  return {
    summary: labels[0],
    metricLabel: type === "whale" ? "本周消费" : (type === "week" ? "本周流水" : "今日流水"),
    subMetricLabel: labels[1],
    updateText: labels[2],
    periodText: "",
    myRank: "榜单人数：0",
    myAmount: "按实际数据生成",
    top: [],
    list: []
  }
}

Page({
  data: {
    activeType: "today",
    tabs: [
      { name: "今日榜", type: "today", cls: "active" },
      { name: "周榜", type: "week", cls: "" },
      { name: "神豪榜", type: "whale", cls: "" }
    ],
    summary: "",
    metricLabel: "",
    subMetricLabel: "",
    updateText: "",
    periodText: "",
    myRank: "",
    myAmount: "",
    loading: false,
    isEmpty: false,
    top: [],
    list: []
  },

  onLoad() {
    this.fetchRankData("today")
  },

  onShow() {
    const tabBar = this.getTabBar && this.getTabBar()
    if (tabBar) tabBar.setData({ selected: 1 })
    this.fetchRankData(this.data.activeType || "today", { silent: true })
  },

  switchTab(e) {
    const type = e.currentTarget.dataset.type
    this.fetchRankData(type)
  },

  fetchRankData(type, options = {}) {
    const rankType = ["today", "week", "whale"].includes(type) ? type : "today"
    const tabs = this.data.tabs.map((item) => ({
      ...item,
      cls: item.type === rankType ? "active" : ""
    }))
    this.setData({
      activeType: rankType,
      tabs,
      loading: !options.silent
    })
    const user = getCustomerProfile()
    const query = `type=${encodeURIComponent(rankType)}&userId=${encodeURIComponent(user.id || "")}`
    backendRequest(`/api/public/rankings?${query}`, {}, (result) => {
      if (result && result.ok && result.data && result.data.ranking) {
        this.applyRankData(rankType, result.data.ranking)
        return
      }
      this.applyRankData(rankType, emptyRankData(rankType))
      if (!options.silent) wx.showToast({ title: result && result.error || "排行榜加载失败", icon: "none" })
    })
  },

  applyRankData(type, data = {}) {
    const rankData = {
      ...emptyRankData(type),
      ...data
    }
    const tabs = this.data.tabs.map((item) => ({
      ...item,
      cls: item.type === type ? "active" : ""
    }))
    const top = (rankData.top || []).map(normalizeRankEntry)
    const list = (rankData.list || []).map(normalizeRankEntry)

    this.setData({
      activeType: type,
      tabs,
      summary: rankData.summary,
      metricLabel: rankData.metricLabel,
      subMetricLabel: rankData.subMetricLabel,
      updateText: rankData.updateText,
      periodText: rankData.periodText || "",
      myRank: rankData.myRank,
      myAmount: rankData.myAmount,
      top,
      list,
      loading: false,
      isEmpty: !top.length && !list.length
    })
  }
})
