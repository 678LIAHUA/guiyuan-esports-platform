const { getGroups, syncOrderGroupsFromBackend } = require("../../utils/order-group")
const { confirmBackendOrderComplete, getCustomerProfile, loadBackendOrders, submitPlayerReview } = require("../../utils/customer-account")

const REVIEWED_ORDER_KEY = "reviewedBossOrders"
const CONFIRMED_FINISH_KEY = "bossConfirmedFinishOrders"
const REVIEW_DIMENSIONS = [
  { key: "skill", name: "技术水平" },
  { key: "emotion", name: "情绪价值" },
  { key: "voice", name: "声音听感" },
  { key: "pressure", name: "抗压能力" },
  { key: "service", name: "店内表现" }
]

function defaultReviewScores() {
  return REVIEW_DIMENSIONS.map((item) => ({ ...item, value: 10 }))
}

function scoreAverage(scores = []) {
  const values = scores.map((item) => Number(item.value)).filter((value) => Number.isFinite(value))
  if (!values.length) return "10.0"
  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)
}

function lineBetween(from, to, className = "") {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.sqrt(dx * dx + dy * dy)
  const angle = Math.atan2(dy, dx) * 180 / Math.PI
  return { className, left: `${from.x}%`, top: `${from.y}%`, width: `${length}%`, transform: `rotate(${angle}deg)` }
}

function buildReviewRadar(scores = defaultReviewScores()) {
  const center = { x: 50, y: 50 }
  const maxRadius = 29
  const labelRadius = 43
  const start = -90
  const vertexFor = (radius, index) => {
    const angle = (start + (360 / scores.length) * index) * Math.PI / 180
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    }
  }
  const points = scores.map((item, index) => vertexFor(maxRadius * Math.max(1, Math.min(10, Number(item.value) || 1)) / 10, index))
  const ringLines = []
  ;[29, 21.75, 14.5, 7.25].forEach((radius, ringIndex) => {
    const ringPoints = scores.map((item, index) => vertexFor(radius, index))
    ringPoints.forEach((point, index) => {
      ringLines.push(lineBetween(point, ringPoints[(index + 1) % ringPoints.length], `ring-${ringIndex}`))
    })
  })
  return {
    reviewAverage: scoreAverage(scores),
    reviewPolygon: points.map((point) => `${point.x}% ${point.y}%`).join(", "),
    reviewPoints: points.map((point) => ({ left: `${point.x}%`, top: `${point.y}%` })),
    reviewLines: points.map((point, index) => lineBetween(point, points[(index + 1) % points.length], "score-line")),
    reviewRingLines: ringLines,
    reviewAxes: scores.map((item, index) => lineBetween(center, vertexFor(maxRadius, index), "axis-line")),
    reviewLabels: scores.map((item, index) => {
      const point = vertexFor(labelRadius, index)
      return { ...item, left: `${point.x}%`, top: `${point.y}%` }
    })
  }
}

function getStatusText(status) {
  if (status === "completed") return "已完结"
  if (status === "finish_pending") return "待确认结单"
  if (status === "serving") return "服务中"
  return "待接单"
}

function getStatusClass(status) {
  if (status === "completed") return "done"
  if (status === "finish_pending") return "pending"
  if (status === "serving") return "serving"
  return "waiting"
}

function getRequirementText(filters = {}) {
  const values = [
    filters.difficultyName,
    filters.levelName,
    filters.genderName,
    filters.playTypeName,
    filters.durationName
  ].filter(Boolean)
  return values.length ? values.join(" · ") : "暂无特殊要求"
}

function remoteStatusToLocal(status) {
  if (status === "已取消") return "cancelled"
  if (status === "已完成") return "completed"
  if (status === "待老板确认结单") return "finish_pending"
  if (status === "已确认") return "serving"
  if (status === "待打手接单") return "waiting_player"
  return "waiting_player"
}

function remoteOrderToGroup(order = {}) {
  const playerId = order.playerId || order.playerNo || ""
  const players = playerId || order.playerName
    ? [{
      id: playerId,
      playerNo: order.playerNo || playerId,
      name: order.playerName || "达人",
      avatar: order.playerAvatar || "/assets/avatar-yinyue.jpg"
    }]
    : []
  return {
    id: order.sessionId || order.id || order.orderNo,
    orderNo: order.orderNo || order.id,
    orderId: order.id || order.orderNo,
    orderTitle: order.serviceName || order.gameName || "陪伴订单",
    title: order.serviceName || order.gameName || "陪伴订单",
    status: remoteStatusToLocal(order.status),
    filters: order.filters || {},
    remark: order.note || "",
    players,
    messages: [],
    updatedAt: order.updatedAt || "--"
  }
}

function isOwnLocalGroup(group = {}, user = {}, remoteOrder = null) {
  const userId = String(user.id || "").trim()
  if (!userId) return false
  if (remoteOrder) return String(remoteOrder.userId || "") === userId
  const bossId = String((group.boss && group.boss.id) || group.userId || group.customerId || "").trim()
  return Boolean(bossId && bossId === userId)
}

function buildOrder(group, remoteOrder = null) {
  const filters = group.filters || {}
  const remark = (filters.remark || group.remark || "").trim()
  const reviewed = wx.getStorageSync(REVIEWED_ORDER_KEY) || {}
  const key = group.orderNo || group.id
  const firstPlayer = (group.players || [])[0] || {}
  const confirmed = wx.getStorageSync(CONFIRMED_FINISH_KEY) || {}
  const hasCompletedMessage = (group.messages || []).some((message) => {
    const text = String(message.text || "")
    return text.includes("老板已确认结单") || text.includes("本单已完结")
  })
  const localCompleted = Boolean(confirmed[group.id] || confirmed[group.orderNo] || confirmed[group.orderId] || group.status === "completed" || hasCompletedMessage)
  const remoteCompleted = remoteOrder && remoteOrder.status === "已完成"
  const status = localCompleted || remoteCompleted ? "completed" : group.status
  const remoteCanReview = remoteOrder ? Boolean(remoteOrder.canReview) : false
  const remoteReviewed = remoteOrder ? Boolean(remoteOrder.reviewed || remoteOrder.review) : false
  return {
    id: group.id,
    orderNo: group.orderNo || "--",
    title: group.orderTitle || group.title || "陪伴订单",
    status,
    statusText: getStatusText(status),
    statusClass: getStatusClass(status),
    requirementText: getRequirementText(filters),
    remarkText: remark || "无",
    playerText: (group.players || []).length ? (group.players || []).map((item) => item.name).join("、") : "等待达人抢单",
    playerId: (remoteOrder && remoteOrder.playerId) || firstPlayer.id || "",
    playerNo: (remoteOrder && remoteOrder.playerNo) || firstPlayer.playerNo || firstPlayer.id || "",
    playerName: (remoteOrder && remoteOrder.playerName) || firstPlayer.name || "",
    playerAvatar: (remoteOrder && remoteOrder.playerAvatar) || firstPlayer.avatar || "",
    updatedAt: group.updatedAt || "--",
    canReview: status === "completed" && !remoteReviewed && !reviewed[key],
    reviewed: remoteReviewed || Boolean(reviewed[key])
  }
}

Page({
  data: {
    orders: [],
    hasOrders: false,
    reviewModalOpen: false,
    reviewTargetOrder: null,
    reviewScores: defaultReviewScores(),
    reviewContent: "",
    reviewSubmitting: false,
    ...buildReviewRadar(defaultReviewScores())
  },

  onLoad() {
    this.loadOrders()
  },

  onShow() {
    this.loadOrders()
  },

  loadOrders() {
    const user = getCustomerProfile()
    syncOrderGroupsFromBackend({ userId: user.id }, () => {
      loadBackendOrders((backendOrders = []) => {
        const userId = String(user.id || "").trim()
        const ownBackendOrders = backendOrders.filter((order) => String(order.userId || "") === userId)
        const remoteMap = ownBackendOrders.reduce((map, order) => {
          if (order.id) map[order.id] = order
          if (order.orderNo) map[order.orderNo] = order
          return map
        }, {})
        const seen = {}
        const orders = getGroups().filter((group) => {
          const remoteOrder = remoteMap[group.orderNo] || remoteMap[group.orderId] || null
          return isOwnLocalGroup(group, user, remoteOrder)
        }).map((group) => {
          const remoteOrder = remoteMap[group.orderNo] || remoteMap[group.orderId] || null
          const key = group.orderNo || group.orderId || group.id
          if (key) seen[key] = true
          if (remoteOrder) {
            seen[remoteOrder.id] = true
            seen[remoteOrder.orderNo] = true
          }
          return buildOrder(group, remoteOrder)
        })
        ownBackendOrders.forEach((order) => {
          const key = order.orderNo || order.id
          if (seen[key] || seen[order.id]) return
          orders.push(buildOrder(remoteOrderToGroup(order), order))
        })
        this.setData({
          orders,
          hasOrders: Boolean(orders.length)
        })
      })
    })
  },

  openOrder(e) {
    const groupId = e.currentTarget.dataset.groupId
    if (!groupId) return
    wx.navigateTo({ url: `/pages/order-chat/order-chat?groupId=${groupId}` })
  },

  reviewOrder(e) {
    const orderNo = e.currentTarget.dataset.orderNo
    const order = this.data.orders.find((item) => item.orderNo === orderNo)
    if (!order || !order.canReview) return
    const scores = defaultReviewScores()
    this.setData({
      reviewModalOpen: true,
      reviewTargetOrder: order,
      reviewScores: scores,
      reviewContent: "",
      reviewSubmitting: false,
      ...buildReviewRadar(scores)
    })
  },

  noop() {},

  closeReviewModal() {
    if (this.data.reviewSubmitting) return
    this.setData({ reviewModalOpen: false })
  },

  onReviewScoreChange(e) {
    const key = e.currentTarget.dataset.key
    const value = Math.max(1, Math.min(10, Number(e.detail.value || 10)))
    const reviewScores = this.data.reviewScores.map((item) => item.key === key ? { ...item, value } : item)
    this.setData({
      reviewScores,
      ...buildReviewRadar(reviewScores)
    })
  },

  onReviewContentInput(e) {
    this.setData({ reviewContent: String(e.detail.value || "").slice(0, 300) })
  },

  submitReview() {
    const order = this.data.reviewTargetOrder
    if (!order || this.data.reviewSubmitting) return
    const scores = this.data.reviewScores
    const scoreMap = scores.reduce((map, item) => {
      map[item.key] = Number(item.value)
      return map
    }, {})
    this.setData({ reviewSubmitting: true })
    const payload = {
      orderId: order.orderNo,
      rating: Number(scoreAverage(scores)),
      scores: scoreMap,
      tags: [],
      content: String(this.data.reviewContent || "").trim(),
      playerId: order.playerId || "",
      playerNo: order.playerNo || "",
      playerName: order.playerName || "",
      playerAvatar: order.playerAvatar || ""
    }
    const finishSuccess = () => {
      this.setData({ reviewSubmitting: false })
      const reviewed = wx.getStorageSync(REVIEWED_ORDER_KEY) || {}
      reviewed[order.orderNo] = true
      wx.setStorageSync(REVIEWED_ORDER_KEY, reviewed)
      this.setData({ reviewModalOpen: false })
      this.loadOrders()
      wx.showToast({ title: "评价已提交", icon: "none" })
    }
    const postReview = (retried = false) => {
      submitPlayerReview(payload, (result) => {
        if (result && result.ok) {
          finishSuccess()
          return
        }
        const error = String(result && result.error || "评价失败")
        if (!retried && (error.includes("完成后") || error.includes("结单") || error.includes("状态"))) {
          confirmBackendOrderComplete(order.orderNo, "boss", {}, () => postReview(true))
          return
        }
        this.setData({ reviewSubmitting: false })
        wx.showToast({ title: error, icon: "none" })
      })
    }
    postReview(false)
  }
})
