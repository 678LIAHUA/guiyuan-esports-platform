const { getPlayers, refreshRemotePlayerCatalog, searchPlayers } = require("../../utils/player-catalog")

Page({
  data: {
    allPlayers: [],
    players: [],
    searchKeyword: "",
    resultText: "全部达人",
    featuredPlayer: null,
    hasFeaturedPlayer: false,
    matchText: ""
  },

  onLoad(options = {}) {
    if (options.keyword) {
      this.setData({ searchKeyword: decodeURIComponent(options.keyword) })
    }
    this.loadPlayers()
  },

  onShow() {
    this.loadPlayers()
  },

  loadPlayers() {
    const allPlayers = getPlayers()
    this.setData({ allPlayers }, () => {
      this.filterPlayers()
    })
    refreshRemotePlayerCatalog((catalog) => {
      if (!catalog) return
      const refreshedPlayers = getPlayers()
      this.setData({ allPlayers: refreshedPlayers }, () => {
        this.filterPlayers()
      })
    })
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value || "" }, () => {
      this.filterPlayers()
    })
  },

  clearSearch() {
    this.setData({
      searchKeyword: "",
      featuredPlayer: null,
      hasFeaturedPlayer: false,
      matchText: ""
    }, () => {
      this.filterPlayers()
    })
  },

  filterPlayers() {
    const keyword = (this.data.searchKeyword || "").trim().toLowerCase()
    const players = keyword
      ? searchPlayers(keyword)
      : this.data.allPlayers

    this.setData({
      players,
      resultText: keyword ? `找到 ${players.length} 位达人` : "全部达人"
    })
  },

  confirmSearch() {
    const keyword = (this.data.searchKeyword || "").trim().toLowerCase()
    if (!keyword) {
      wx.showToast({ title: "请输入搜索内容", icon: "none" })
      return
    }

    const scorePlayer = (player) => {
      const id = (player.id || "").toLowerCase()
      const name = (player.name || "").toLowerCase()
      const tags = (player.tags || []).join(" ").toLowerCase()
      const desc = (player.desc || "").toLowerCase()
      const rank = (player.rankValue || "").toLowerCase()
      const level = (player.level || "").toLowerCase()
      const profile = [player.gender, player.age, ...(player.priceTiers || []).map((tier) => `${tier.name}${tier.price}${tier.desc || ""}`)].join(" ").toLowerCase()
      if (id === keyword || name === keyword) return 100
      if (id.includes(keyword) || name.includes(keyword)) return 80
      if (tags.includes(keyword)) return 60
      if (rank.includes(keyword) || level.includes(keyword)) return 45
      if (profile.includes(keyword)) return 40
      if (desc.includes(keyword)) return 35
      return 0
    }

    const ranked = this.data.allPlayers
      .map((player) => ({ ...player, matchScore: scorePlayer(player) }))
      .filter((player) => player.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)

    if (!ranked.length) {
      this.setData({
        featuredPlayer: null,
        hasFeaturedPlayer: false,
        matchText: ""
      })
      wx.showToast({ title: "没有找到匹配达人", icon: "none" })
      return
    }

    const featuredPlayer = ranked[0]
    this.setData({
      players: ranked,
      resultText: `找到 ${ranked.length} 位达人`,
      featuredPlayer,
      hasFeaturedPlayer: true,
      matchText: `最匹配：${featuredPlayer.name}`
    })
  },

  openDetail(e) {
    const playerId = e.currentTarget.dataset.playerId || "DT10001"
    wx.navigateTo({ url: `/pages/detail/detail?playerId=${playerId}` })
  }
})
