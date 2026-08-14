const { addPlayerToGroup, getGroup, getGroups } = require("../../utils/order-group")
const { backendRequest } = require("../../utils/customer-account")

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

function hasPlayerInGroup(group, player) {
  return Boolean(group && group.id && (group.players || []).some((item) => isSamePlayer(item, player)))
}

function isActiveOrder(group) {
  return Boolean(group && !["completed", "cancelled"].includes(group.status))
}

function hasOtherActiveOrder(groups, player, currentGroupId) {
  return (groups || []).some((group) => group.id !== currentGroupId && isActiveOrder(group) && hasPlayerInGroup(group, player))
}

function getFilterText(filters = {}) {
  const values = [
    filters.difficultyName,
    filters.levelName,
    filters.genderName,
    filters.playTypeName,
    filters.durationName
  ].filter(Boolean)
  return values.length ? values.join(" · ") : "暂无特殊要求"
}

function getRemarkText(group, filters = {}) {
  const remark = (filters.remark || group.remark || "").trim()
  return remark || "无"
}

function isSingleOrder(group) {
  const filters = group.filters || {}
  const playType = String(filters.playType || "").toLowerCase()
  const playTypeName = String(filters.playTypeName || "")
  return playType === "single" || playTypeName.includes("单陪") || playTypeName.includes("单人")
}

function buildDetail(group, player) {
  const accepted = hasPlayerInGroup(group, player)
  const filters = group.filters || {}
  const playType = filters.playType || ""
  const playerCount = (group.players || []).length
  const capacity = isSingleOrder(group) ? 1 : 2
  const isFull = playerCount >= capacity
  const hasActive = hasOtherActiveOrder(getGroups(), player, group.id)
  const canAccept = accepted || (!isFull && !hasActive)
  const lockedReason = hasActive ? "当前已有进行中订单，完成后才能接新单" : "订单已满"
  return {
    groupId: group.id,
    orderNo: group.orderNo || "--",
    title: group.orderTitle || group.title || "陪伴订单",
    statusText: accepted ? "已接单" : group.status === "serving" ? "服务中" : "待接单",
    serviceName: group.service ? group.service.name : "系统客服",
    requirementText: getFilterText(filters),
    remarkText: getRemarkText(group, filters),
    levelHint: filters.levelHint || "老板未填写额外说明",
    playType,
    playTypeText: filters.playTypeName || "不限",
    playerCount,
    capacity,
    isFull,
    accepted,
    canAccept,
    buttonClass: canAccept ? "" : "disabled",
    buttonText: accepted ? "进入群聊" : canAccept ? "确认接单" : lockedReason
  }
}

Page({
  data: {
    groupId: "",
    player: getCurrentPlayer(),
    detail: null
  },

  onLoad(options) {
    const groupId = options.groupId || ""
    this.setData({ groupId })
    this.loadDetail(groupId)
  },

  onShow() {
    if (this.data.groupId) {
      this.loadDetail(this.data.groupId)
    }
  },

  loadDetail(groupId) {
    const group = getGroup(groupId)
    if (!group || !group.id) return
    this.setData({
      detail: buildDetail(group, this.data.player)
    })
  },

  handlePrimary() {
    const detail = this.data.detail
    if (!detail || !detail.groupId) return
    if (!detail.canAccept) {
      wx.showToast({ title: detail.buttonText || "暂时不能接单", icon: "none" })
      return
    }

    if (!detail.accepted) {
      if (hasOtherActiveOrder(getGroups(), this.data.player, detail.groupId)) {
        wx.showToast({ title: "当前已有服务中订单，完成后才能继续抢单", icon: "none" })
        return
      }
      const freshDetail = buildDetail(getGroup(detail.groupId), this.data.player)
      if (!freshDetail.canAccept) {
        this.setData({ detail: freshDetail })
        wx.showToast({ title: "该订单已满员", icon: "none" })
        return
      }
      addPlayerToGroup(detail.groupId, {
        id: this.data.player.id,
        playerNo: this.data.player.playerNo,
        name: this.data.player.name,
        avatar: this.data.player.avatar
      })
      backendRequest(`/api/public/player-orders/${encodeURIComponent(detail.orderNo)}/accept`, {
        method: "POST",
        data: {
          playerId: this.data.player.id,
          playerNo: this.data.player.playerNo,
          playerName: this.data.player.name,
          playerAvatar: this.data.player.avatar
        }
      }, () => {})
      wx.showToast({ title: "接单成功，已进群", icon: "none" })
      this.loadDetail(detail.groupId)
      return
    }

    wx.redirectTo({
      url: `/pages/player-chat/player-chat?groupId=${detail.groupId}`
    })
  }
})
