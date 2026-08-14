const { appendBossImage, appendBossMessage, confirmFinishGroup, getGroup, markGroupRead, syncGroupMessagesFromBackend } = require("../../utils/order-group")
const { addLocalCustomerRefund, confirmBackendOrderComplete } = require("../../utils/customer-account")
const CONFIRMED_FINISH_KEY = "bossConfirmedFinishOrders"

function formatAmount(value) {
  const number = Number(value || 0)
  if (!Number.isFinite(number)) return "0"
  return number % 1 === 0 ? String(number) : number.toFixed(1)
}

function buildRefundPreview(group, actualMinutesValue) {
  const filters = group.filters || {}
  if (filters.billingMode !== "hour_refund") {
    return {
      showSettlementInput: false,
      actualMinutesInput: "",
      refundPreviewText: ""
    }
  }
  const orderedMinutes = Math.max(60, Number(filters.orderedMinutes || 60))
  const hourlyPrice = Number(filters.hourlyPrice || 0)
  const minutePrice = hourlyPrice / 60
  const actualMinutes = Math.max(0, Math.min(orderedMinutes, Number(actualMinutesValue || orderedMinutes)))
  const refundMinutes = Math.max(0, orderedMinutes - actualMinutes)
  const refundAmount = Math.round(refundMinutes * minutePrice * 100) / 100
  return {
    showSettlementInput: true,
    actualMinutesInput: String(actualMinutes),
    refundPreviewText: refundMinutes > 0
      ? `已下单${orderedMinutes}分钟，实际${actualMinutes}分钟，预计退${refundMinutes}分钟 / ${formatAmount(refundAmount)}猫粮`
      : `已下单${orderedMinutes}分钟，实际${actualMinutes}分钟，无需退款`
  }
}

function getPendingFinishRequest(group = {}) {
  if (group.status === "completed" || group.status === "cancelled") return null
  const confirmed = wx.getStorageSync(CONFIRMED_FINISH_KEY) || {}
  if (confirmed[group.id] || confirmed[group.orderNo] || confirmed[group.orderId]) return null
  const hasConfirmedMessage = (group.messages || []).some((message) => {
    const text = String(message.text || "")
    return text.includes("老板已确认结单") || text.includes("本单已完结")
  })
  if (hasConfirmedMessage) return null
  if (group.finishRequest && group.finishRequest.status === "pending") return group.finishRequest
  const requests = Array.isArray(group.finishRequests) ? group.finishRequests : []
  const pending = requests.find((item) => item && item.status === "pending")
  if (pending) return pending
  const finishMessage = [...(group.messages || [])].reverse().find((message) => {
    const text = String(message.text || "")
    return text.includes("确认结单") && (text.includes("请老板确认") || text.includes("请问是否结单"))
  })
  if (!finishMessage) return null
  const text = String(finishMessage.text || "")
  const playerName = text.split("已确认结单")[0] || text.split("确认结单")[0] || "达人"
  return {
    id: `${group.id || group.orderNo || "group"}-message-finish`,
    playerName: playerName.trim() || "达人",
    status: "pending"
  }
}

Page({
  data: {
    groupId: "",
    activeGroup: null,
    inputText: "",
    chatBottomId: "boss-chat-bottom",
    playerCount: 0,
    statusText: "待接单",
    hasFinishRequest: false,
    finishRequestText: "",
    showSettlementInput: false,
    actualMinutesInput: "",
    refundPreviewText: ""
  },

  onLoad(options) {
    const groupId = options.groupId || ""
    this.setData({ groupId })
    this.loadGroup(groupId, () => {
      this.scrollChatToBottom()
    })
  },

  onShow() {
    if (this.data.groupId) {
      this.loadGroup(this.data.groupId, () => {
        this.scrollChatToBottom()
      })
      this.syncGroup()
      this.startSyncTimer()
    }
  },

  onHide() {
    this.stopSyncTimer()
  },

  onUnload() {
    this.stopSyncTimer()
  },

  startSyncTimer() {
    this.stopSyncTimer()
    this.syncTimer = setInterval(() => this.syncGroup(), 3000)
  },

  stopSyncTimer() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
  },

  syncGroup() {
    if (!this.data.groupId) return
    syncGroupMessagesFromBackend(this.data.groupId, () => {
      this.loadGroup(this.data.groupId, () => {
        this.scrollChatToBottom()
      })
    })
  },

  loadGroup(groupId, callback) {
    const group = getGroup(groupId)
    if (!group || !group.id) return
    markGroupRead(group.id)
    const pendingFinishRequest = getPendingFinishRequest(group)
    const refundPreview = buildRefundPreview(group, this.data.actualMinutesInput)
    this.setData({
      activeGroup: {
        ...group,
        unread: 0
      },
      playerCount: (group.players || []).length,
      statusText: this.getStatusText(group),
      hasFinishRequest: Boolean((group.status === "finish_pending" && pendingFinishRequest) || pendingFinishRequest),
      finishRequestText: pendingFinishRequest
        ? `${pendingFinishRequest.playerName || "达人"} 确认结单，请问是否结单？`
        : "",
      ...refundPreview
    }, callback)
  },

  getStatusText(group) {
    if (group.status === "completed") return "已完结"
    if (group.status === "finish_pending") return "待确认"
    if (group.status === "serving") return "服务中"
    return "待接单"
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value })
  },

  sendMessage() {
    const text = (this.data.inputText || "").trim()
    if (!text || !this.data.activeGroup) return
    if (this.data.activeGroup.status === "cancelled" || this.data.activeGroup.dissolved) {
      wx.showToast({ title: "群聊已解散，不能继续发送", icon: "none" })
      return
    }
    appendBossMessage(this.data.activeGroup.id, text)
    this.setData({ inputText: "" })
    this.loadGroup(this.data.activeGroup.id, () => {
      this.scrollChatToBottom()
    })
  },

  chooseImage() {
    if (!this.data.activeGroup) return
    const choose = wx.chooseMedia
      ? wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["album", "camera"],
        success: (res) => {
          const file = res.tempFiles && res.tempFiles[0]
          const imageUrl = file && (file.tempFilePath || file.path)
          this.sendImage(imageUrl)
        }
      })
      : wx.chooseImage({
        count: 1,
        sourceType: ["album", "camera"],
        success: (res) => {
          this.sendImage(res.tempFilePaths && res.tempFilePaths[0])
        }
      })
    return choose
  },

  sendImage(imageUrl) {
    if (!imageUrl || !this.data.activeGroup) return
    if (this.data.activeGroup.status === "cancelled" || this.data.activeGroup.dissolved) {
      wx.showToast({ title: "群聊已解散，不能继续发送", icon: "none" })
      return
    }
    appendBossImage(this.data.activeGroup.id, imageUrl)
    this.loadGroup(this.data.activeGroup.id, () => {
      this.scrollChatToBottom()
    })
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    wx.previewImage({ urls: [url], current: url })
  },

  onActualMinutesInput(e) {
    const actualMinutesInput = (e.detail.value || "").replace(/[^\d]/g, "")
    const preview = this.data.activeGroup
      ? buildRefundPreview(this.data.activeGroup, actualMinutesInput)
      : { refundPreviewText: "" }
    this.setData({
      actualMinutesInput,
      refundPreviewText: preview.refundPreviewText
    })
  },

  confirmFinish() {
    if (!this.data.activeGroup || !this.data.hasFinishRequest) return
    if (this.confirmingFinish) return
    this.confirmingFinish = true
    const updated = confirmFinishGroup(this.data.activeGroup.id, {
      actualMinutes: this.data.actualMinutesInput
    })
    const confirmed = wx.getStorageSync(CONFIRMED_FINISH_KEY) || {}
    ;[updated.id, updated.orderNo, updated.orderId, this.data.activeGroup.orderNo].filter(Boolean).forEach((key) => {
      confirmed[key] = true
    })
    wx.setStorageSync(CONFIRMED_FINISH_KEY, confirmed)
    confirmBackendOrderComplete(updated.orderNo || updated.orderId || this.data.activeGroup.orderNo, "boss", {}, () => {
      this.confirmingFinish = false
    })
    addLocalCustomerRefund(updated)
    this.loadGroup(this.data.activeGroup.id, () => {
      this.scrollChatToBottom()
    })
    wx.showToast({ title: updated && Number(updated.refundAmount || 0) > 0 ? "已结单并退款" : "已确认结单", icon: "none" })
  },

  back() {
    wx.navigateBack({ delta: 1 })
  },

  scrollChatToBottom() {
    const scroll = () => {
      this.setData({ chatBottomId: "" }, () => {
        this.setData({ chatBottomId: "boss-chat-bottom" })
      })
    }

    if (wx.nextTick) {
      wx.nextTick(() => {
        setTimeout(scroll, 30)
      })
      return
    }

    setTimeout(scroll, 30)
  }
})
