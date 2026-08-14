const { appendPlayerImage, appendPlayerMessage, getGroup, invitePlayerToGroup, markGroupRead, syncGroupMessagesFromBackend } = require("../../utils/order-group")
const { findPlayerById } = require("../../utils/player-catalog")

function getCurrentPlayer() {
  return wx.getStorageSync("currentPlayerProfile") || {
    id: "DT10001",
    playerNo: "DT10001",
    name: "圆圆",
    avatar: "/assets/avatar-yinyue.jpg"
  }
}

function isSamePlayer(item, player) {
  return Boolean(item && player && (
    item.id === player.id ||
    item.id === player.playerNo ||
    item.playerNo === player.id ||
    item.playerNo === player.playerNo
  ))
}

function isSingleOrder(group) {
  const filters = group.filters || {}
  const playType = String(filters.playType || "").toLowerCase()
  const playTypeName = String(filters.playTypeName || "")
  return playType === "single" || playTypeName.includes("单陪") || playTypeName.includes("单人")
}

Page({
  data: {
    groupId: "",
    player: getCurrentPlayer(),
    activeGroup: null,
    inputText: "",
    invitePlayerId: "",
    invitePanelOpen: false,
    inviteButtonText: "邀请另一个达人",
    chatBottomId: "player-chat-bottom",
    playerCount: 0,
    statusText: "待接单",
    canInvitePlayer: false,
    inviteHintText: ""
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
    const playerCount = (group.players || []).length
    const accepted = (group.players || []).some((item) => isSamePlayer(item, this.data.player))
    const singleOrder = isSingleOrder(group)
    const closed = ["completed", "cancelled", "finish_pending"].includes(group.status)
    const pendingInvites = (group.invitedPlayers || []).map((item) => item.name).filter(Boolean)
    const canInvitePlayer = !singleOrder && accepted && !closed && !pendingInvites.length
    const inviteHintText = canInvitePlayer
      ? "输入另一个达人ID，确认后他会在达人端接单大厅看到待确认订单"
      : pendingInvites.length
        ? `已邀请：${pendingInvites.join("、")}`
        : !accepted
          ? "接单后才能邀请另一个达人"
          : singleOrder
            ? "单陪订单不能邀请第二个达人"
            : closed
              ? "当前订单状态不能邀请"
              : "暂时不能邀请"
    const messages = (group.messages || []).map((message) => {
      const isMine = message.role === "player" && (
        message.playerId === this.data.player.id ||
        message.playerId === this.data.player.playerNo ||
        message.sender === this.data.player.name
      )
      return {
        ...message,
        rowClass: isMine ? "player" : message.role === "system" ? "system" : "other"
      }
    })
    this.setData({
      activeGroup: {
        ...group,
        messages,
        unread: 0
      },
      playerCount,
      statusText: this.getStatusText(group),
      canInvitePlayer,
      inviteButtonText: canInvitePlayer ? "邀请另一个达人" : "邀请另一个达人",
      invitePanelOpen: canInvitePlayer ? this.data.invitePanelOpen : false,
      inviteHintText
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

  onInviteInput(e) {
    this.setData({ invitePlayerId: (e.detail.value || "").trim().toUpperCase() })
  },

  toggleInvitePanel() {
    if (!this.data.canInvitePlayer) {
      wx.showToast({ title: this.data.inviteHintText || "当前不能邀请", icon: "none" })
      return
    }
    this.setData({ invitePanelOpen: !this.data.invitePanelOpen })
  },

  invitePlayer() {
    const group = this.data.activeGroup
    const inputId = this.data.invitePlayerId
    if (!group || !group.id) return
    if (!this.data.canInvitePlayer) {
      wx.showToast({ title: this.data.inviteHintText || "当前不能邀请", icon: "none" })
      return
    }
    if (!inputId) {
      wx.showToast({ title: "请输入达人ID", icon: "none" })
      return
    }
    if (inputId === this.data.player.id || inputId === this.data.player.playerNo) {
      wx.showToast({ title: "不能邀请自己", icon: "none" })
      return
    }

    const target = findPlayerById(inputId)
    if (!target) {
      wx.showToast({ title: "未找到该达人ID", icon: "none" })
      return
    }
    const alreadyJoined = (group.players || []).some((item) => item.id === target.id || item.playerNo === target.id)
    const alreadyInvited = (group.invitedPlayers || []).some((item) => item.id === target.id || item.playerNo === target.id)
    if (alreadyJoined) {
      wx.showToast({ title: "该达人已在群里", icon: "none" })
      return
    }
    if (alreadyInvited) {
      wx.showToast({ title: "已邀请该达人", icon: "none" })
      return
    }

    invitePlayerToGroup(group.id, this.data.player, {
      id: target.id,
      playerNo: target.id,
      name: target.name,
      avatar: target.avatar
    })
    this.setData({ invitePlayerId: "" })
    this.loadGroup(group.id, () => {
      this.scrollChatToBottom()
    })
    wx.showToast({ title: "已发送邀请", icon: "none" })
  },

  sendMessage() {
    const text = (this.data.inputText || "").trim()
    if (!text || !this.data.activeGroup) return
    if (this.data.activeGroup.status === "cancelled" || this.data.activeGroup.dissolved) {
      wx.showToast({ title: "群聊已解散，不能继续发送", icon: "none" })
      return
    }
    appendPlayerMessage(this.data.activeGroup.id, this.data.player, text)
    this.setData({ inputText: "" })
    this.loadGroup(this.data.activeGroup.id, () => {
      this.scrollChatToBottom()
    })
  },

  chooseImage() {
    if (!this.data.activeGroup) return
    if (wx.chooseMedia) {
      wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["album", "camera"],
        success: (res) => {
          const file = res.tempFiles && res.tempFiles[0]
          const imageUrl = file && (file.tempFilePath || file.path)
          this.sendImage(imageUrl)
        }
      })
      return
    }
    wx.chooseImage({
      count: 1,
      sourceType: ["album", "camera"],
      success: (res) => {
        this.sendImage(res.tempFilePaths && res.tempFilePaths[0])
      }
    })
  },

  sendImage(imageUrl) {
    if (!imageUrl || !this.data.activeGroup) return
    if (this.data.activeGroup.status === "cancelled" || this.data.activeGroup.dissolved) {
      wx.showToast({ title: "群聊已解散，不能继续发送", icon: "none" })
      return
    }
    appendPlayerImage(this.data.activeGroup.id, this.data.player, imageUrl)
    this.loadGroup(this.data.activeGroup.id, () => {
      this.scrollChatToBottom()
    })
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    wx.previewImage({ urls: [url], current: url })
  },

  back() {
    wx.navigateBack({ delta: 1 })
  },

  scrollChatToBottom() {
    const scroll = () => {
      this.setData({ chatBottomId: "" }, () => {
        this.setData({ chatBottomId: "player-chat-bottom" })
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
