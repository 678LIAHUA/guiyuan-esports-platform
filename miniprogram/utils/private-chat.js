const PRIVATE_CHAT_KEY = "guiyuanPrivateChats"
const DEFAULT_AVATAR = "/assets/avatar-yinyue.jpg"

function nowText() {
  const date = new Date()
  const hour = String(date.getHours()).padStart(2, "0")
  const minute = String(date.getMinutes()).padStart(2, "0")
  return `${hour}:${minute}`
}

function readChats() {
  const saved = wx.getStorageSync(PRIVATE_CHAT_KEY) || {}
  return saved && typeof saved === "object" ? saved : {}
}

function saveChats(chats) {
  wx.setStorageSync(PRIVATE_CHAT_KEY, chats || {})
}

function seedChat(player = {}) {
  player = player || {}
  return {
    playerId: player.id || "",
    playerName: player.name || "达人",
    playerAvatar: player.avatar || DEFAULT_AVATAR,
    messages: [
      {
        id: `sys-${Date.now()}`,
        role: "system",
        sender: "系统",
        time: nowText(),
        text: "私聊已开启，老板可以在这里直接和达人沟通需求。"
      }
    ],
    updatedAt: Date.now()
  }
}

function getPrivateChat(player = {}) {
  player = player || {}
  const chats = readChats()
  const playerId = player.id || "unknown"
  if (!chats[playerId]) {
    chats[playerId] = seedChat(player)
    saveChats(chats)
  } else {
    chats[playerId] = {
      ...chats[playerId],
      playerName: player.name || chats[playerId].playerName,
      playerAvatar: player.avatar || chats[playerId].playerAvatar || DEFAULT_AVATAR
    }
  }
  return chats[playerId]
}

function appendPrivateMessage(player = {}, role, text) {
  player = player || {}
  const value = String(text || "").trim()
  if (!value) return getPrivateChat(player)
  const chats = readChats()
  const playerId = player.id || "unknown"
  const chat = chats[playerId] || seedChat(player)
  const message = {
    id: `${role}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    role,
    sender: role === "boss" ? "老板" : (player.name || "达人"),
    avatar: role === "player" ? (player.avatar || DEFAULT_AVATAR) : "",
    avatarText: role === "boss" ? "老" : "打",
    showAvatar: role !== "system",
    time: nowText(),
    text: value
  }
  chat.messages = [...(chat.messages || []), message]
  chat.updatedAt = Date.now()
  chats[playerId] = chat
  saveChats(chats)
  return chat
}

module.exports = {
  appendPrivateMessage,
  getPrivateChat
}
