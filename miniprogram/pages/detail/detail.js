const { findPlayerById, refreshRemotePlayerCatalog } = require("../../utils/player-catalog")
const { backendRequest, currentUser, loadPlayerFavorites, loadPlayerReviews, payWithCatFood, requireLogin, togglePlayerFavorite } = require("../../utils/customer-account")
const { addPlayerGiftCount, buildGiftWall, refreshGiftCatalogFromBackend } = require("../../utils/gift-catalog")

const PLAYER_SIGNATURE_KEY = "playerSignature"
const FAVORITE_PLAYERS_KEY = "favoritePlayers"
const FAVORITE_PLAYER_SNAPSHOTS_KEY = "favoritePlayerSnapshots"
const defaultSignature = "沟通清楚，节奏稳定，认真打也能快乐一点。"
const REVIEW_DIMENSIONS = [
  { key: "skill", name: "技术水平" },
  { key: "emotion", name: "情绪价值" },
  { key: "voice", name: "声音听感" },
  { key: "pressure", name: "抗压能力" },
  { key: "service", name: "店内表现" }
]

function getPlayerSignature(source) {
  const saved = wx.getStorageSync(PLAYER_SIGNATURE_KEY)
  if (source.id === "DT10001" && typeof saved === "string" && saved.trim()) return saved.trim()
  return source.signature || source.desc || defaultSignature
}

function clampScore(value, fallback = 9.5) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(1, Math.min(10, Number(number.toFixed(1))))
}

function reviewScores(review = {}) {
  const source = review.scores || review.dimensionScores || {}
  const hasDimensionScores = Boolean(review.scores || review.dimensionScores)
  return REVIEW_DIMENSIONS.map((dimension) => ({
    ...dimension,
    value: clampScore((() => {
      let value = source[dimension.key] ?? source[dimension.name] ?? review[dimension.key] ?? review.rating
      if (!hasDimensionScores && Number(value) > 0 && Number(value) <= 5) value = Number(value) * 2
      return value
    })())
  }))
}

function averageReviewAbilities(reviews = [], fallbackAbilities = []) {
  if (!reviews.length) return fallbackAbilities
  return REVIEW_DIMENSIONS.map((dimension) => {
    const values = reviews.map((review) => {
      const item = reviewScores(review).find((score) => score.key === dimension.key)
      return Number(item && item.value)
    }).filter((value) => Number.isFinite(value))
    const fallback = (fallbackAbilities || []).find((item) => item.name === dimension.name)
    const fallbackValue = fallback ? Number(fallback.value) : 9.5
    const value = values.length
      ? values.reduce((sum, item) => sum + item, 0) / values.length
      : fallbackValue
    return { ...dimension, value: clampScore(value) }
  })
}

Page({
  data: {
    playerId: "DT10001",
    player: {
      id: "DT10001",
      name: "圆圆",
      avatar: "/assets/avatar-yinyue.jpg",
      cover: "/assets/avatar-yinyue.jpg",
      served: "1523",
      price: "880",
      acceptingOrders: true,
      statusClass: "on",
      statusText: "在线",
      tags: [],
      priceTiers: [],
      gifts: [],
      reviews: []
    },
    stats: [],
    signature: defaultSignature,
    overallScore: "9.5",
    abilities: [],
    abilityLabels: [],
    abilityPolygon: "",
    abilityPoints: [],
    radarLines: [],
    radarAxes: [],
    abilityLines: [],
    favoriteText: "收藏",
    giftWallExpanded: false,
    giftItems: [],
    giftToggleText: "展开全部",
    sendingGiftId: "",
    reviewExpanded: false,
    allReviews: [],
    showReviewToggle: false,
    reviewToggleText: "显示全部评价",
    showReportModal: false,
    reportReasons: ["服务态度问题", "内容不符", "价格争议", "恶意拖延", "其他问题"],
    reportReason: "服务态度问题",
    reportContent: "",
    reportSubmitting: false
  },

  onLoad(options) {
    this.setData({ playerId: options.playerId || "DT10001" })
    this.fetchPlayerDetail()
    refreshGiftCatalogFromBackend(() => {
      this.refreshGiftWall()
    })
  },

  onShow() {
    this.fetchPlayerDetail()
  },

  fetchPlayerDetail() {
    const source = findPlayerById(this.data.playerId || "DT10001") || findPlayerById("DT10001") || this.data.player
    this.applyPlayerDetail({
      ...source,
      cover: source.cover || source.avatar,
      signature: getPlayerSignature(source),
      abilities: source.abilities || []
    })
    refreshRemotePlayerCatalog((catalog) => {
      if (!catalog) return
      const refreshedSource = findPlayerById(this.data.playerId || "DT10001") || source
      this.applyPlayerDetail({
        ...refreshedSource,
        cover: refreshedSource.cover || refreshedSource.avatar,
        signature: getPlayerSignature(refreshedSource),
        abilities: refreshedSource.abilities || []
      })
    })
  },

  applyPlayerDetail(player) {
    const reviews = Array.isArray(player.reviews) ? player.reviews : []
    this.setData({
      player: {
        ...this.data.player,
        ...player,
        reviews: this.visibleReviews(reviews),
        statusClass: player.acceptingOrders ? "on" : "off",
        statusText: player.acceptingOrders ? "在线" : "离线"
      },
      allReviews: reviews,
      showReviewToggle: reviews.length > 5,
      reviewToggleText: this.data.reviewExpanded ? "收起评价" : "显示全部评价",
      stats: [
        { label: "接单数", value: player.served || "0" },
        { label: "好评率", value: "99%" },
        { label: player.rankLabel || "达人等级", value: player.rankValue || player.level || "-" }
      ],
      signature: player.signature || defaultSignature,
      abilities: player.abilities || []
    }, () => {
      this.buildAbilityRadar()
      this.refreshFavoriteState()
      this.refreshGiftWall()
    })
  },

  visibleReviews(reviews = []) {
    return this.data.reviewExpanded ? reviews : reviews.slice(0, 5)
  },

  setReviewList(reviews = []) {
    const list = Array.isArray(reviews) ? reviews : []
    this.setData({
      allReviews: list,
      showReviewToggle: list.length > 5,
      reviewToggleText: this.data.reviewExpanded ? "收起评价" : "显示全部评价",
      player: {
        ...this.data.player,
        reviews: this.visibleReviews(list)
      }
    })
  },

  toggleReviews() {
    this.setData({ reviewExpanded: !this.data.reviewExpanded }, () => {
      this.setReviewList(this.data.allReviews)
    })
  },

  refreshGiftWall() {
    const wall = buildGiftWall(this.data.player, this.data.giftWallExpanded)
    this.setData({
      giftItems: wall.visible.map((item) => ({
        ...item,
        sending: this.data.sendingGiftId === item.id
      })),
      giftToggleText: this.data.giftWallExpanded ? "收起" : "展开全部"
    })
  },

  toggleGiftWall() {
    this.setData({ giftWallExpanded: !this.data.giftWallExpanded }, () => {
      this.refreshGiftWall()
    })
  },

  refreshFavoriteState() {
    const localFavorites = wx.getStorageSync(FAVORITE_PLAYERS_KEY) || []
    const localExists = localFavorites.includes(this.data.player.id)
    this.setData({ favoriteText: localExists ? "已收藏" : "收藏" })
    loadPlayerFavorites((favorites = []) => {
      const exists = favorites.some((item) => item.playerId === this.data.player.id || item.player?.id === this.data.player.id)
      this.setData({ favoriteText: (localExists || exists) ? "已收藏" : "收藏" })
    })
    loadPlayerReviews({ playerId: this.data.player.id }, (reviews = []) => {
      if (!reviews.length) return
      const abilities = averageReviewAbilities(reviews, this.data.player.abilities || this.data.abilities || [])
      const rating = abilities.length
        ? (abilities.reduce((sum, item) => sum + Number(item.value || 0), 0) / abilities.length).toFixed(1)
        : this.data.overallScore
      const mappedReviews = reviews.map((item) => ({
        user: item.userName || "老板",
        score: Number(item.rating || rating || 10).toFixed(1),
        text: item.content || (item.tags || []).join("、") || "好评"
      }))
      this.setData({
        player: {
          ...this.data.player,
          rating,
          abilities,
          reviews: mappedReviews
        },
        abilities
      }, () => {
        this.buildAbilityRadar()
      })
      this.setReviewList(mappedReviews)
    })
  },

  toggleFavorite() {
    if (!requireLogin()) {
      wx.showToast({ title: "请先登录后收藏", icon: "none" })
      return
    }
    const playerId = this.data.player.id
    const favorites = wx.getStorageSync(FAVORITE_PLAYERS_KEY) || []
    const exists = favorites.includes(playerId)
    const next = exists ? favorites.filter((id) => id !== playerId) : [playerId, ...favorites]
    wx.setStorageSync(FAVORITE_PLAYERS_KEY, next)
    const snapshots = wx.getStorageSync(FAVORITE_PLAYER_SNAPSHOTS_KEY) || {}
    if (exists) {
      delete snapshots[playerId]
    } else {
      snapshots[playerId] = {
        ...this.data.player,
        id: playerId,
        avatar: this.data.player.avatar || "/assets/avatar-yinyue.jpg",
        title: this.data.player.title || this.data.player.desc || "",
        rating: this.data.player.rating || this.data.player.score || this.data.overallScore || "5.0"
      }
    }
    wx.setStorageSync(FAVORITE_PLAYER_SNAPSHOTS_KEY, snapshots)
    this.refreshFavoriteState()
    togglePlayerFavorite(this.data.player, !exists, () => {
      wx.showToast({ title: exists ? "已取消收藏" : "已收藏", icon: "none" })
    })
  },

  chatPlayer() {
    if (!requireLogin()) {
      wx.showToast({ title: "请先登录后私聊", icon: "none" })
      return
    }
    const playerId = encodeURIComponent(this.data.player.id || this.data.playerId || "DT10001")
    wx.navigateTo({
      url: `/pages/private-chat/private-chat?playerId=${playerId}`,
      fail: (error) => {
        wx.showToast({ title: error.errMsg || "私聊页面打开失败", icon: "none" })
      }
    })
  },

  sendGift(e) {
    const giftId = e.currentTarget.dataset.id
    const gift = (buildGiftWall(this.data.player, true).all || []).find((item) => item.id === giftId)
    if (!gift || this.data.sendingGiftId) return
    wx.showModal({
      title: "送出礼物",
      content: `送给 ${this.data.player.name}「${gift.name}」，消耗 ${gift.price} 猫粮`,
      confirmText: "确认赠送",
      success: (modal) => {
        if (!modal.confirm) return
        this.setData({ sendingGiftId: gift.id }, () => {
          this.refreshGiftWall()
        })
        const giftOrderId = `gift-${this.data.player.id}-${gift.id}-${Date.now()}`
        payWithCatFood(gift.price, {
          type: "gift",
          title: `送礼物：${gift.name}`,
          note: `送给达人 ${this.data.player.name}（${this.data.player.id}）`,
          orderId: giftOrderId,
          playerId: this.data.player.id || "",
          playerNo: this.data.player.playerNo || this.data.player.id || "",
          playerName: this.data.player.name || "",
          playerAvatar: this.data.player.avatar || "",
          giftId: gift.id,
          giftName: gift.name
        }, (result) => {
          this.setData({ sendingGiftId: "" }, () => {
            this.refreshGiftWall()
          })
          if (!result.ok) {
            this.handleGiftPayFailed(result)
            return
          }
          addPlayerGiftCount(this.data.player.id, gift.id, 1)
          this.refreshGiftWall()
          wx.showToast({ title: "已送出礼物", icon: "none" })
        })
      }
    })
  },

  handleGiftPayFailed(result = {}) {
    if (result.error !== "猫粮不足") {
      wx.showToast({ title: result.error || "赠送失败", icon: "none" })
      return
    }
    const shortage = Math.max(1, Number(result.shortage || 0))
    const amountYuan = Math.max(10, Math.ceil(shortage / 10))
    wx.showModal({
      title: "猫粮不足",
      content: `当前猫粮不足，还差 ${shortage} 猫粮，是否去充值？`,
      confirmText: "去充值",
      success: (modal) => {
        if (!modal.confirm) return
        wx.navigateTo({ url: `/pages/recharge/recharge?amountYuan=${encodeURIComponent(amountYuan)}` })
      }
    })
  },

  reportPlayer() {
    if (!requireLogin()) {
      wx.showToast({ title: "请先登录后投诉", icon: "none" })
      return
    }
    this.setData({
      showReportModal: true,
      reportReason: this.data.reportReason || this.data.reportReasons[0],
      reportContent: ""
    })
  },

  noop() {},

  closeReportModal() {
    if (this.data.reportSubmitting) return
    this.setData({ showReportModal: false, reportContent: "" })
  },

  chooseReportReason(e) {
    this.setData({ reportReason: e.currentTarget.dataset.reason || this.data.reportReasons[0] })
  },

  onReportInput(e) {
    this.setData({ reportContent: e.detail.value || "" })
  },

  submitReport() {
    if (this.data.reportSubmitting) return
    const content = String(this.data.reportContent || "").trim()
    if (!content) {
      wx.showToast({ title: "请填写投诉内容", icon: "none" })
      return
    }
    const user = currentUser()
    const player = this.data.player || {}
    this.setData({ reportSubmitting: true })
    backendRequest("/api/public/player-complaints", {
      method: "POST",
      data: {
        userId: user.id,
        userName: user.name,
        playerId: player.id || this.data.playerId,
        playerName: player.name || "",
        reason: this.data.reportReason,
        content
      }
    }, (result) => {
      this.setData({ reportSubmitting: false })
      if (!result.ok) {
        wx.showToast({ title: result.error || "投诉提交失败", icon: "none" })
        return
      }
      this.setData({ showReportModal: false, reportContent: "" })
      wx.showToast({ title: "投诉已提交", icon: "success" })
    })
  },

  buildAbilityRadar() {
    const fallbackAbilities = [
      { name: "技术水平", value: 9.5 },
      { name: "情绪价值", value: 9.5 },
      { name: "声音听感", value: 9.5 },
      { name: "抗压能力", value: 9.5 },
      { name: "店内表现", value: 9.5 }
    ]
    const sourceAbilities = Array.isArray(this.data.abilities) && this.data.abilities.length
      ? this.data.abilities
      : fallbackAbilities
    const abilities = sourceAbilities.slice(0, 5)
    const total = abilities.reduce((sum, item) => sum + Math.max(0, Math.min(10, Number(item.value) || 0)), 0)
    const overallScore = abilities.length ? (total / abilities.length).toFixed(1) : "0.0"
    const center = { x: 50, y: 50 }
    const maxRadius = 30
    const labelRadius = 43
    const start = -90
    const vertexFor = (radius, index) => {
      const angle = (start + (360 / abilities.length) * index) * Math.PI / 180
      return {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius
      }
    }
    if (!abilities.length) {
      this.setData({ overallScore, abilityLabels: [], abilityPolygon: "", abilityPoints: [], radarLines: [], radarAxes: [], abilityLines: [] })
      return
    }
    const points = abilities.map((item, index) => {
      const value = Math.max(0, Math.min(10, Number(item.value) || 0))
      return vertexFor(maxRadius * value / 10, index)
    })
    const labels = abilities.map((item, index) => {
      const point = vertexFor(labelRadius, index)
      return { name: item.name, value: item.value, left: `${point.x}%`, top: `${point.y}%` }
    })
    const lineBetween = (from, to, className = "") => {
      const dx = to.x - from.x
      const dy = to.y - from.y
      const length = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx) * 180 / Math.PI
      return { className, left: `${from.x}%`, top: `${from.y}%`, width: `${length}%`, transform: `rotate(${angle}deg)` }
    }
    const radarLines = []
    ;[30, 22.5, 15, 7.5].forEach((radius, ringIndex) => {
      const ringPoints = abilities.map((item, index) => vertexFor(radius, index))
      ringPoints.forEach((point, index) => {
        radarLines.push(lineBetween(point, ringPoints[(index + 1) % ringPoints.length], `ring-line ring-${ringIndex}`))
      })
    })
    const radarAxes = abilities.map((item, index) => lineBetween(center, vertexFor(maxRadius, index), "axis-line"))
    const abilityLines = points.map((point, index) => lineBetween(point, points[(index + 1) % points.length], "score-line"))
    this.setData({
      overallScore,
      abilityLabels: labels,
      abilityPolygon: points.map((point) => `${point.x}% ${point.y}%`).join(", "),
      abilityPoints: points.map((point) => ({ left: `${point.x}%`, top: `${point.y}%` })),
      radarLines,
      radarAxes,
      abilityLines
    }, () => {
      this.drawAbilityRadarCanvas(abilities)
    })
  },

  drawAbilityRadarCanvas(abilities = []) {
    const query = wx.createSelectorQuery().in(this)
    query.select(".radar-chart").boundingClientRect((rect) => {
      const size = Math.max(1, Math.min(rect?.width || 225, rect?.height || 225))
      const ctx = wx.createCanvasContext("abilityRadar", this)
      const center = size / 2
      const maxRadius = size * 0.3
      const start = -90
      const count = Math.max(3, abilities.length)
      const vertex = (radius, index) => {
        const angle = (start + (360 / count) * index) * Math.PI / 180
        return {
          x: center + Math.cos(angle) * radius,
          y: center + Math.sin(angle) * radius
        }
      }
      ctx.clearRect(0, 0, size, size)
      ctx.setLineWidth(1)
      ;[1, 0.75, 0.5, 0.25].forEach((scale) => {
        ctx.beginPath()
        for (let i = 0; i < count; i += 1) {
          const p = vertex(maxRadius * scale, i)
          if (i === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        }
        ctx.closePath()
        ctx.setStrokeStyle("rgba(96, 74, 86, 0.28)")
        ctx.stroke()
      })
      for (let i = 0; i < count; i += 1) {
        const p = vertex(maxRadius, i)
        ctx.beginPath()
        ctx.moveTo(center, center)
        ctx.lineTo(p.x, p.y)
        ctx.setStrokeStyle("rgba(96, 74, 86, 0.2)")
        ctx.stroke()
      }
      const points = abilities.map((item, index) => {
        const value = Math.max(0, Math.min(10, Number(item.value) || 0))
        return vertex(maxRadius * value / 10, index)
      })
      if (points.length) {
        ctx.beginPath()
        points.forEach((p, index) => {
          if (index === 0) ctx.moveTo(p.x, p.y)
          else ctx.lineTo(p.x, p.y)
        })
        ctx.closePath()
        ctx.setFillStyle("rgba(219, 111, 135, 0.22)")
        ctx.fill()
        ctx.setStrokeStyle("rgba(200, 86, 113, 0.62)")
        ctx.setLineWidth(2)
        ctx.stroke()
        points.forEach((p) => {
          ctx.beginPath()
          ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2)
          ctx.setFillStyle("#d96f7f")
          ctx.fill()
        })
      }
      ctx.draw()
    }).exec()
  },

  order() {
    if (!requireLogin()) {
      wx.showToast({ title: "请先登录后下单", icon: "none" })
      return
    }
    const playerId = encodeURIComponent(this.data.player.id || this.data.playerId || "DT10001")
    wx.navigateTo({
      url: `/pages/player-order/player-order?playerId=${playerId}`,
      fail: (error) => {
        wx.showToast({ title: error.errMsg || "下单页面打开失败", icon: "none" })
      }
    })
  }
})
