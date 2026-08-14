const { findPlayerById } = require("../../utils/player-catalog")
const { appendPrivateMessage, getPrivateChat } = require("../../utils/private-chat")

function fallbackPlayer(playerId) {
  const id = String(playerId || "DT10001").trim() || "DT10001"
  return {
    id,
    name: "达人",
    avatar: "/assets/avatar-yinyue.jpg",
    cover: "/assets/avatar-yinyue.jpg",
    level: "达人",
    rankValue: "达人"
  }
}

Page({
  data: {
    playerId: "",
    player: null,
    chat: null,
    inputText: "",
    chatBottomId: "private-chat-bottom"
  },

  onLoad(options) {
    const playerId = options.playerId || "DT10001"
    this.setData({ playerId })
    this.loadChat(playerId, () => {
      this.scrollChatToBottom()
    })
  },

  onShow() {
    if (!this.data.playerId) return
    this.loadChat(this.data.playerId, () => {
      this.scrollChatToBottom()
    })
  },

  loadChat(playerId, callback) {
    const player = findPlayerById(playerId) || findPlayerById("DT10001") || fallbackPlayer(playerId)
    const chat = getPrivateChat(player)
    this.setData({ player, chat }, callback)
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value })
  },

  sendMessage() {
    const text = String(this.data.inputText || "").trim()
    if (!text || !this.data.player) return
    appendPrivateMessage(this.data.player, "boss", text)
    this.setData({ inputText: "" })
    this.loadChat(this.data.player.id, () => {
      this.scrollChatToBottom()
    })
  },

  back() {
    wx.navigateBack({ delta: 1 })
  },

  scrollChatToBottom() {
    const scroll = () => {
      this.setData({ chatBottomId: "" }, () => {
        this.setData({ chatBottomId: "private-chat-bottom" })
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
