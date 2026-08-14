const { loadPlayerFavorites } = require("../../utils/customer-account")
const { findPlayerById } = require("../../utils/player-catalog")

const FAVORITE_PLAYERS_KEY = "favoritePlayers"
const FAVORITE_PLAYER_SNAPSHOTS_KEY = "favoritePlayerSnapshots"

function fallbackPlayer(playerId) {
  const id = String(playerId || "").trim()
  return {
    id,
    name: "达人",
    avatar: "/assets/avatar-yinyue.jpg",
    level: "在线接单",
    title: "点击查看达人详情",
    rating: "5.0"
  }
}

function normalizePlayer(player) {
  if (!player || !player.id) return null
  return {
    ...player,
    avatar: player.avatar || player.img || "/assets/avatar-yinyue.jpg",
    rating: player.rating || player.score || "5.0",
    title: player.title || player.desc || "点击查看达人详情"
  }
}

function uniquePlayers(players = []) {
  const map = {}
  players.forEach((player) => {
    const normalized = normalizePlayer(player)
    if (!normalized) return
    map[normalized.id] = {
      ...(map[normalized.id] || {}),
      ...normalized
    }
  })
  return Object.keys(map).map((id) => map[id])
}

Page({
  data: {
    players: [],
    hasPlayers: false
  },

  onShow() {
    const localIds = wx.getStorageSync(FAVORITE_PLAYERS_KEY) || []
    const snapshots = wx.getStorageSync(FAVORITE_PLAYER_SNAPSHOTS_KEY) || {}
    const localPlayers = localIds
      .map((id) => snapshots[id] || findPlayerById(id) || fallbackPlayer(id))
      .filter((item) => item && item.id)
    this.setData({
      players: uniquePlayers(localPlayers),
      hasPlayers: Boolean(localPlayers.length)
    })
    loadPlayerFavorites((favorites = []) => {
      const remotePlayers = favorites.map((item) => item.player || item).filter((item) => item && item.id)
      const players = uniquePlayers([...localPlayers, ...remotePlayers])
      this.setData({ players, hasPlayers: Boolean(players.length) })
    })
  },

  openDetail(e) {
    const playerId = e.currentTarget.dataset.id
    if (!playerId) return
    wx.navigateTo({ url: `/pages/detail/detail?playerId=${playerId}` })
  }
})
