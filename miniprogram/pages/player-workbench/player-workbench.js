const { getGroups, requestFinishGroup, syncOrderGroupsFromBackend, updatePlayerProfileInGroups } = require("../../utils/order-group")
const { findPlayerById, updateCachedPlayerProfile } = require("../../utils/player-catalog")
const { backendRequest, confirmBackendOrderComplete, updatePlayerProfileMedia, uploadPublicImageByRequest } = require("../../utils/customer-account")
const { addPlayerIncome, getPlayerWallet, requestPlayerWithdrawal } = require("../../utils/player-wallet")

const WORKBENCH_TARGET_KEY = "playerWorkbenchTarget"
const PLAYER_PROFILE_KEY = "currentPlayerProfile"
const PLAYER_WORKBENCH_AUTH_KEY = "playerWorkbenchAuth"
const PLAYER_SIGNATURE_KEY = "playerSignature"
const PENDING_COVER_CROP_KEY = "pendingCoverCropSrc"
const PLAYER_MEDIA_OVERRIDE_KEY = "playerProfileMediaOverrides"
const DEFAULT_BACKEND_API_BASE = "https://api.example.com"

const defaultSignature = "三角洲主玩撤离，沟通清楚，稳一点也能快乐一点。"
const DEFAULT_AVATAR = "/assets/avatar-yinyue.jpg"

function safeImageUrl(url, fallback = DEFAULT_AVATAR) {
  const value = String(url || "").trim()
  if (!value) return fallback
  if (value.startsWith("/assets/")) return value
  if (value.startsWith("/uploads/")) return `${DEFAULT_BACKEND_API_BASE}${value}`
  if (/^https:\/\//i.test(value)) return value
  if (/^wxfile:\/\//i.test(value)) return value
  if (/^http:\/\/tmp\//i.test(value)) return value
  if (/^http:\/\/usr\//i.test(value)) return value
  if (/^file:\/\//i.test(value)) return value
  if (value.includes("/tmp/")) return value
  if (/^http:\/\/127\.0\.0\.1/i.test(value) || value.includes("/tmp/")) return fallback
  return fallback
}

function isCancelError(error) {
  return String(error && error.errMsg || "").toLowerCase().includes("cancel")
}

function ensurePrivacyReady(callback) {
  if (!wx.getPrivacySetting || !wx.requirePrivacyAuthorize) {
    callback()
    return
  }
  wx.getPrivacySetting({
    success: (res) => {
      if (!res.needAuthorization) {
        callback()
        return
      }
      wx.requirePrivacyAuthorize({
        success: callback,
        fail: () => wx.showToast({ title: "请先同意隐私协议", icon: "none" })
      })
    },
    fail: callback
  })
}

function pickImage(sourceType, onSelected, onFailed) {
  const fail = (error) => {
    if (isCancelError(error)) return
    const message = String(error && error.errMsg || "图片选择失败")
      .replace(/^choose(Media|Image|MessageFile):fail\s*/i, "")
    onFailed(message.length > 18 ? message.slice(0, 18) : message)
  }
  const chooseImageFallback = () => {
    if (!wx.chooseImage) {
      onFailed("当前版本不支持选图")
      return
    }
    wx.chooseImage({
      count: 1,
      sourceType: [sourceType],
      sizeType: ["compressed"],
      success: (res) => onSelected((res.tempFilePaths && res.tempFilePaths[0]) || ""),
      fail
    })
  }
  if (wx.chooseImage) {
    chooseImageFallback()
    return
  }
  if (wx.chooseMedia) {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: [sourceType],
      sizeType: ["compressed"],
      success: (res) => {
        const file = (res.tempFiles || [])[0] || {}
        onSelected(file.tempFilePath || file.path || "")
      },
      fail: (error) => {
        if (isCancelError(error)) return
        chooseImageFallback()
      }
    })
    return
  }
  if (!wx.chooseImage) {
    onFailed("当前版本不支持选图")
    return
  }
  wx.chooseImage({
    count: 1,
    sourceType: [sourceType],
    sizeType: ["compressed"],
    success: (res) => onSelected((res.tempFilePaths && res.tempFilePaths[0]) || ""),
    fail
  })
}

const playerStats = {
  DT10001: { todayOrders: 5, todayIncome: "440", monthIncome: "9523" },
  DT10002: { todayOrders: 4, todayIncome: "312", monthIncome: "8130" },
  DT10003: { todayOrders: 3, todayIncome: "204", monthIncome: "6028" },
  DT10004: { todayOrders: 1, todayIncome: "65", monthIncome: "3180" },
  DT10005: { todayOrders: 2, todayIncome: "144", monthIncome: "4860" },
  DT10006: { todayOrders: 6, todayIncome: "492", monthIncome: "10320" },
  DT10007: { todayOrders: 2, todayIncome: "150", monthIncome: "5210" },
  DT10008: { todayOrders: 3, todayIncome: "210", monthIncome: "5740" }
}

function buildPlayerProfile(player) {
  if (!player) {
    player = { id: "DT10001", playerNo: "DT10001", name: "达人", avatar: DEFAULT_AVATAR }
  }
  const playerId = player.id || player.playerNo || "DT10001"
  const stats = playerStats[player.id] || playerStats.DT10001
  return {
    ...player,
    id: playerId,
    playerNo: player.playerNo || playerId,
    name: player.name || "达人",
    avatar: safeImageUrl(player.avatar),
    cover: safeImageUrl(player.cover, player.avatar),
    ...stats
  }
}

function mediaOverridesFor(playerId) {
  const all = wx.getStorageSync(PLAYER_MEDIA_OVERRIDE_KEY) || {}
  return all[playerId] || {}
}

function saveMediaOverride(playerId, patch = {}) {
  if (!playerId) return
  const all = wx.getStorageSync(PLAYER_MEDIA_OVERRIDE_KEY) || {}
  all[playerId] = {
    ...(all[playerId] || {}),
    ...patch
  }
  wx.setStorageSync(PLAYER_MEDIA_OVERRIDE_KEY, all)
}

function getCurrentPlayer() {
  const saved = wx.getStorageSync(PLAYER_PROFILE_KEY)
  if (saved && (saved.playerNo || saved.id)) {
    const player = findPlayerById(saved.playerNo || saved.id)
    const playerId = (player && (player.id || player.playerNo)) || saved.id || saved.playerNo
    const media = mediaOverridesFor(playerId)
    if (player) {
      return {
        ...buildPlayerProfile(player),
        name: saved.name || player.name,
        avatar: safeImageUrl(media.avatar || saved.avatar, player.avatar),
        cover: safeImageUrl(media.cover || saved.cover, player.cover || player.avatar)
      }
    }
    return buildPlayerProfile({
      ...saved,
      ...media
    })
  }
  const fallback = findPlayerById("DT10001")
  return buildPlayerProfile({
    ...fallback,
    ...mediaOverridesFor(fallback && (fallback.id || fallback.playerNo))
  })
}

function getPlayerSignature() {
  const saved = wx.getStorageSync(PLAYER_SIGNATURE_KEY)
  return typeof saved === "string" && saved.trim() ? saved.trim() : defaultSignature
}

function isSamePlayer(item, player) {
  return Boolean(item && player && (
    item.id === player.id ||
    item.id === player.playerNo ||
    item.playerNo === player.id ||
    item.playerNo === player.playerNo
  ))
}

function getWorkbenchAuth() {
  const auth = wx.getStorageSync(PLAYER_WORKBENCH_AUTH_KEY)
  if (!auth || !(auth.playerId || auth.playerNo)) return null
  if (!auth.wechatBound) return null
  return auth
}

function isAuthForPlayer(auth, player) {
  const authPlayerId = String(auth && auth.playerId || "").toUpperCase()
  const authPlayerNo = String(auth && auth.playerNo || "").toUpperCase()
  const playerId = String(player && player.id || "").toUpperCase()
  const playerNo = String(player && player.playerNo || "").toUpperCase()
  return Boolean(auth && player && (
    authPlayerId === playerId ||
    authPlayerId === playerNo ||
    authPlayerNo === playerId ||
    authPlayerNo === playerNo
  ))
}

function getAuthedPlayer(auth) {
  if (!auth) return null
  const catalogPlayer = findPlayerById(auth.playerId || auth.playerNo)
  if (catalogPlayer) {
    const player = buildPlayerProfile(catalogPlayer)
    return {
      ...player,
      name: auth.playerName || player.name
    }
  }
  const saved = wx.getStorageSync(PLAYER_PROFILE_KEY)
  if (saved && isAuthForPlayer(auth, saved)) return buildPlayerProfile(saved)
  return null
}

function backToMine() {
  wx.switchTab({
    url: "/pages/mine/mine",
    fail: () => wx.navigateBack()
  })
}

function hasPlayerInGroup(group, player) {
  return Boolean(group && group.id && (group.players || []).some((item) => isSamePlayer(item, player)))
}

function isActiveOrder(group) {
  return Boolean(group && !["completed", "cancelled"].includes(group.status))
}

function hasActivePlayerOrder(groups, player) {
  return (groups || []).some((group) => isActiveOrder(group) && hasPlayerInGroup(group, player))
}

function isPlayerInvited(group, player) {
  return Boolean(group && group.id && (group.invitedPlayers || []).some((item) => isSamePlayer(item, player)))
}

function isSingleOrder(group) {
  const filters = group.filters || {}
  const playType = String(filters.playType || "").toLowerCase()
  const playTypeName = String(filters.playTypeName || "")
  return playType === "single" || playTypeName.includes("单陪") || playTypeName.includes("单人")
}

function groupCapacity(group) {
  return isSingleOrder(group) ? 1 : 2
}

function estimatedPlayerIncome(group, includeJoiningPlayer = false) {
  const playerCount = (group.players || []).length + (includeJoiningPlayer ? 1 : 0)
  const shareCount = Math.max(1, playerCount)
  return Number((Number(group.playerIncome || 0) / shareCount).toFixed(2))
}

function settledPlayerIncome(group) {
  const settlement = group.settlement || {}
  if (group.status === "completed" && settlement.playerShareIncome !== undefined) {
    return Number(settlement.playerShareIncome || 0)
  }
  return estimatedPlayerIncome(group, false)
}

function settledPlayerCount(group) {
  const settlement = group.settlement || {}
  if (group.status === "completed" && settlement.playerCount !== undefined) {
    return Math.max(1, Number(settlement.playerCount || 1))
  }
  return Math.max(1, (group.players || []).length)
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

function getRemarkText(filters = {}) {
  const remark = (filters.remark || "").trim()
  return remark || "无"
}

function buildHallOrder(group, player) {
  const accepted = hasPlayerInGroup(group, player)
  const invited = isPlayerInvited(group, player)
  const hasActive = hasActivePlayerOrder(getGroups(), player)
  const playerCount = (group.players || []).length
  const capacity = groupCapacity(group)
  const isFull = playerCount >= capacity
  const specified = Boolean(group.requiresPlayerAccept && isSamePlayer(group.specifiedPlayer, player))
  const lockedReason = !accepted && hasActive
    ? "当前已有进行中订单，完成后才能接新单"
    : isFull
      ? "订单已满"
      : ""
  const canAccept = accepted || specified || invited || (!hasActive && !isFull)
  const statusText = accepted
    ? "已接单"
    : invited
      ? "待你确认"
      : lockedReason
        ? lockedReason
        : "抢单"

  return {
    id: group.orderId,
    groupId: group.id,
    orderNo: group.orderNo || "--",
    title: group.orderTitle || group.title,
    bossText: `老板 ${group.boss ? group.boss.name : "老板"} · ID ${group.boss ? group.boss.id : "000000"}`,
    originalAmountText: formatCatFoodAmount(group.originalAmount || group.price || group.amount || 0),
    playerIncomeText: formatCatFoodAmount(estimatedPlayerIncome(group, !accepted)),
    playerRateText: `${Number(group.playerRate || 70)}%`,
    status: group.status,
    statusText: specified ? "指定给你" : statusText,
    requirementText: getFilterText(group.filters || {}),
    remarkText: getRemarkText(group.filters || {}),
    levelHint: (group.filters || {}).levelHint || "老板未填写额外说明",
    serviceName: group.service ? group.service.name : "系统客服",
    playerCount,
    capacity,
    isFull,
    accepted,
    invited,
    specified,
    canAccept,
    lockedReason,
    canOpen: true,
    cardClass: specified ? "specified" : invited ? "invited" : accepted ? "active" : lockedReason ? "locked" : "",
    group
  }
}

function canShowInHall(group, player, groups = []) {
  if (hasPlayerInGroup(group, player)) return false
  if (group.status === "finish_pending" || group.status === "completed" || group.status === "cancelled") return false
  if (group.requiresPlayerAccept) return false
  const playerCount = (group.players || []).length
  const capacity = groupCapacity(group)
  return playerCount < capacity
}

function getGroupStatusText(group) {
  if (group.status === "completed") return "已完结"
  if (group.status === "finish_pending") return "待老板确认"
  if (group.status === "serving") return "服务中"
  return "待接单"
}

function getFinishRequests(group) {
  if (Array.isArray(group.finishRequests) && group.finishRequests.length) return group.finishRequests
  if (group.finishRequest && group.finishRequest.playerId) return [group.finishRequest]
  return []
}

function hasPlayerRequestedFinish(group, player) {
  return getFinishRequests(group).some((request) => isSamePlayer({
    id: request.playerId,
    playerNo: request.playerNo
  }, player))
}

function formatCatFoodAmount(amount) {
  const value = Number(amount)
  if (!Number.isFinite(value) || value <= 0) return "待同步"
  return `${value % 1 === 0 ? value : value.toFixed(1)} 猫粮`
}

function buildPlayerGroup(group) {
  return {
    ...group,
    orderNo: group.orderNo || "--",
    memberText: `订单号 ${group.orderNo || "--"} · 客服 ${group.service ? group.service.name : "系统客服"} · 达人 ${(group.players || []).length} 人`,
    statusText: getGroupStatusText(group)
  }
}

function buildPlayerOrder(group, player) {
  const finishPending = group.status === "finish_pending"
  const completed = group.status === "completed"
  const requested = hasPlayerRequestedFinish(group, player)
  const statusText = requested && !finishPending && !completed ? "待队友确认" : getGroupStatusText(group)
  const originalAmount = Number(group.originalAmount || group.price || group.amount || 0)
  const playerIncome = completed ? settledPlayerIncome(group) : estimatedPlayerIncome(group, false)
  const playerRate = Number(group.playerRate || 70)
  return {
    id: group.id,
    groupId: group.id,
    title: group.orderTitle || group.title || "陪伴订单",
    orderNo: group.orderNo || "--",
    requirementText: getFilterText(group.filters || {}),
    serviceName: group.service ? group.service.name : "系统客服",
    playerCount: (group.players || []).length,
    originalAmountText: formatCatFoodAmount(originalAmount),
    playerIncomeText: formatCatFoodAmount(playerIncome),
    playerRateText: `${playerRate}%`,
    statusText,
    buttonText: completed ? "已完结" : finishPending ? "待确认" : requested ? "等队友" : "确认结单",
    buttonClass: completed || finishPending || requested ? "disabled" : "",
    canRequestFinish: !completed && !finishPending && !requested
  }
}

function buildTabs(activePanel) {
  return [
    { icon: "▤", label: "接单大厅", panel: "hall", active: activePanel === "hall" },
    { icon: "◉", label: "群聊", panel: "message", active: activePanel === "message" },
    { icon: "▣", label: "订单", panel: "orders", active: activePanel === "orders" },
    { icon: "￥", label: "钱包", panel: "wallet", active: activePanel === "wallet" },
    { icon: "♙", label: "我的", panel: "mine", active: activePanel === "mine" }
  ]
}

Page({
  data: {
    activePanel: "hall",
    showHallPanel: true,
    showMessagePanel: false,
    showOrdersPanel: false,
    showWalletPanel: false,
    showMinePanel: false,
    acceptingOrders: true,
    acceptingStatusClass: "on",
    acceptingStatusText: "在线",
    acceptingStatusDesc: "开启后首页展示在线",
    acceptingButtonText: "接单中",
    player: getCurrentPlayer(),
    nameInput: getCurrentPlayer().name,
    signatureInput: getPlayerSignature(),
    signatureLength: getPlayerSignature().length,
    switchPlayerId: "",
    specifiedOrders: [],
    hasSpecifiedOrders: false,
    hallOrders: [],
    playerOrders: [],
    hasPlayerOrders: false,
    playerGroups: [],
    hasPlayerGroups: false,
    wallet: getPlayerWallet(getCurrentPlayer()),
    withdrawAmount: "",
    tabs: buildTabs("hall")
  },

  onLoad() {
    if (!this.ensureWorkbenchAuth()) return
    const saved = wx.getStorageSync("playerAcceptingOrders")
    if (saved !== "") this.applyAcceptingStatus(Boolean(saved))
    this.refreshWorkbenchData()
  },

  onShow() {
    if (!this.ensureWorkbenchAuth()) return
    this.syncWorkbenchNow()
    this.startWorkbenchSyncTimer()
    this.consumeWorkbenchTarget()
  },

  onHide() {
    this.stopWorkbenchSyncTimer()
  },

  onUnload() {
    this.stopWorkbenchSyncTimer()
  },

  startWorkbenchSyncTimer() {
    this.stopWorkbenchSyncTimer()
    this.workbenchSyncTimer = setInterval(() => this.syncWorkbenchNow(), 2000)
  },

  stopWorkbenchSyncTimer() {
    if (this.workbenchSyncTimer) {
      clearInterval(this.workbenchSyncTimer)
      this.workbenchSyncTimer = null
    }
  },

  syncWorkbenchNow() {
    if (this.workbenchSyncing) return
    this.workbenchSyncing = true
    const player = getCurrentPlayer()
    this.refreshWorkbenchData()
    syncOrderGroupsFromBackend({
      playerId: player.id,
      playerNo: player.playerNo
    }, () => {
      this.syncPlayerWalletFromBackend(player, () => {
        this.workbenchSyncing = false
        updatePlayerProfileInGroups(getCurrentPlayer())
        this.refreshWorkbenchData()
      })
    })
  },

  syncPlayerWalletFromBackend(player, callback) {
    const playerId = player.id || player.playerNo
    if (!playerId) {
      if (callback) callback()
      return
    }
    backendRequest(`/api/public/player-wallet?playerId=${encodeURIComponent(playerId)}`, {}, (result) => {
      const data = result && result.data || {}
      if (result && result.ok && Array.isArray(data.transactions)) {
        data.transactions.forEach((item) => {
          addPlayerIncome(player, {
            id: item.id,
            groupId: item.groupId || "",
            orderNo: item.orderNo || "",
            title: item.title || "礼物收入",
            amount: Number(item.amount || 0),
            desc: item.desc || item.note || "礼物猫粮已全额入账"
          })
        })
      }
      if (data.player) {
        const nextPlayer = {
          ...this.data.player,
          ...data.player
        }
        wx.setStorageSync(PLAYER_PROFILE_KEY, nextPlayer)
        this.setData({ player: nextPlayer })
      }
      if (callback) callback()
    })
  },

  ensureWorkbenchAuth() {
    const auth = getWorkbenchAuth()
    if (!auth) {
      wx.showModal({
        title: "需要达人验证",
        content: "请先在“我的-达人工作台”输入达人ID和密钥。",
        showCancel: false,
        confirmText: "知道了",
        success: backToMine
      })
      return false
    }
    const player = getAuthedPlayer(auth)
    if (!player) {
      wx.removeStorageSync(PLAYER_WORKBENCH_AUTH_KEY)
      wx.showToast({ title: "达人资料不存在，请重新验证", icon: "none" })
      backToMine()
      return false
    }
    if (!isAuthForPlayer(auth, this.data.player)) {
      wx.setStorageSync(PLAYER_PROFILE_KEY, player)
      this.setData({ player, nameInput: player.name, wallet: getPlayerWallet(player) })
    }
    return true
  },

  consumeWorkbenchTarget() {
    const target = wx.getStorageSync(WORKBENCH_TARGET_KEY)
    if (!target || !target.groupId) return
    wx.removeStorageSync(WORKBENCH_TARGET_KEY)
    this.setData({
      activePanel: "message",
      showHallPanel: false,
      showMessagePanel: true,
      showOrdersPanel: false,
      showWalletPanel: false,
      showMinePanel: false,
      tabs: buildTabs("message")
    }, () => {
      this.refreshPlayerGroups(target.groupId)
      wx.navigateTo({
        url: `/pages/player-chat/player-chat?groupId=${target.groupId}`
      })
    })
  },

  refreshWorkbenchData() {
    const player = getCurrentPlayer()
    const signatureInput = getPlayerSignature()
    const groups = getGroups()
    const specifiedOrders = groups
      .filter((group) => group.requiresPlayerAccept && isSamePlayer(group.specifiedPlayer, player) && canShowInHall({ ...group, requiresPlayerAccept: false }, player, groups))
      .map((group) => buildHallOrder(group, player))
    const hallOrders = groups
      .filter((group) => canShowInHall(group, player, groups))
      .map((group) => buildHallOrder(group, player))
    const playerGroups = groups
      .filter((group) => hasPlayerInGroup(group, player))
      .map(buildPlayerGroup)
    const playerOrders = groups
      .filter((group) => hasPlayerInGroup(group, player))
      .map((group) => buildPlayerOrder(group, player))
    groups
      .filter((group) => group.status === "completed" && hasPlayerInGroup(group, player))
      .forEach((group) => {
        addPlayerIncome(player, {
          id: `income-${group.id}-${player.playerNo || player.id}`,
          groupId: group.id,
          orderNo: group.orderNo,
          title: group.orderTitle || group.title || "订单收入",
          amount: settledPlayerIncome(group),
          desc: `订单 ${group.orderNo || "--"} 已结单，按${settledPlayerCount(group)}名达人平分`
        })
      })

    this.setData({
      player,
      nameInput: player.name,
      signatureInput,
      signatureLength: signatureInput.length,
      specifiedOrders,
      hasSpecifiedOrders: Boolean(specifiedOrders.length),
      hallOrders,
      playerOrders,
      hasPlayerOrders: Boolean(playerOrders.length),
      playerGroups,
      hasPlayerGroups: Boolean(playerGroups.length),
      wallet: getPlayerWallet(player)
    })
    wx.setStorageSync(PLAYER_PROFILE_KEY, player)
  },

  switchPanel(e) {
    const panel = e.currentTarget.dataset.panel || "hall"
    this.setData({
      activePanel: panel,
      showHallPanel: panel === "hall",
      showMessagePanel: panel === "message",
      showOrdersPanel: panel === "orders",
      showWalletPanel: panel === "wallet",
      showMinePanel: panel === "mine",
      tabs: buildTabs(panel)
    }, () => {
      if (panel === "message") this.refreshPlayerGroups()
      if (panel === "hall" || panel === "orders" || panel === "wallet") this.refreshWorkbenchData()
    })
  },

  refreshPlayerGroups(activeGroupId = "") {
    const groups = getGroups()
      .filter((group) => hasPlayerInGroup(group, this.data.player))
      .map((group) => ({
        ...buildPlayerGroup(group),
        cardClass: activeGroupId === group.id ? "active" : ""
      }))
    this.setData({
      playerGroups: groups,
      hasPlayerGroups: Boolean(groups.length)
    })
  },

  requestFinishOrder(e) {
    const groupId = e.currentTarget.dataset.groupId
    const order = this.data.playerOrders.find((item) => item.id === groupId)
    if (!order || !order.canRequestFinish) return

    const updated = requestFinishGroup(groupId, {
      id: this.data.player.id,
      playerNo: this.data.player.playerNo,
      name: this.data.player.name,
      avatar: this.data.player.avatar
    })
    if (updated) {
      confirmBackendOrderComplete(updated.orderNo || updated.orderId, "player", {
        playerId: this.data.player.id,
        playerNo: this.data.player.playerNo
      }, () => {})
    }
    this.refreshWorkbenchData()
    wx.showToast({
      title: updated && updated.status === "finish_pending" ? "已提交老板确认" : "已确认，等待队友",
      icon: "none"
    })
  },

  toggleAccepting(e) {
    const acceptingOrders = e.detail.value
    this.applyAcceptingStatus(acceptingOrders)
    wx.setStorageSync("playerAcceptingOrders", acceptingOrders)
    wx.showToast({
      title: acceptingOrders ? "已开启接单" : "已关闭接单",
      icon: "none"
    })
  },

  applyAcceptingStatus(acceptingOrders) {
    this.setData({
      acceptingOrders,
      acceptingStatusClass: acceptingOrders ? "on" : "off",
      acceptingStatusText: acceptingOrders ? "在线" : "离线",
      acceptingStatusDesc: acceptingOrders ? "开启后首页展示在线" : "关闭后首页展示离线",
      acceptingButtonText: acceptingOrders ? "接单中" : "已暂停"
    })
  },

  chooseAvatar() {
    this.chooseProfileImage("avatar")
  },

  onChooseAvatar(e) {
    const avatarUrl = e.detail && e.detail.avatarUrl
    if (!avatarUrl) return
    this.applyProfileImage("avatar", avatarUrl)
  },

  chooseCover() {
    this.chooseProfileImage("cover")
  },

  isRemoteProfileImage(url) {
    return /^https:\/\//i.test(String(url || "")) || String(url || "").startsWith("/uploads/")
  },

  applyPlayerProfilePatch(patch = {}, options = {}) {
    const previousName = this.data.player.name
    const playerId = this.data.player.id || this.data.player.playerNo
    const player = {
      ...this.data.player,
      ...patch
    }
    if (patch.avatar !== undefined || patch.cover !== undefined) {
      saveMediaOverride(playerId, {
        ...(patch.avatar !== undefined ? { avatar: player.avatar } : {}),
        ...(patch.cover !== undefined ? { cover: player.cover } : {})
      })
    }
    wx.setStorageSync(PLAYER_PROFILE_KEY, player)
    updateCachedPlayerProfile(player)
    updatePlayerProfileInGroups({ ...player, previousName })
    this.setData({ player, nameInput: player.name })
    return player
  },

  syncRemotePlayerProfile(patch = {}, player = this.data.player, callback) {
    const playerId = player.id || player.playerNo
    if (!playerId) {
      if (callback) callback({ ok: false, error: "打手ID为空" })
      return
    }
    const remotePatch = {}
    if (patch.name !== undefined) remotePatch.name = String(patch.name || "").trim()
    if (patch.avatar !== undefined && this.isRemoteProfileImage(patch.avatar)) remotePatch.avatar = patch.avatar
    if (patch.cover !== undefined && this.isRemoteProfileImage(patch.cover)) remotePatch.cover = patch.cover
    if (!Object.keys(remotePatch).length) {
      if (callback) callback({ ok: true })
      return
    }
    updatePlayerProfileMedia(playerId, remotePatch, (result) => {
      const remotePlayer = result && result.ok && result.data && result.data.player
      if (remotePlayer) this.applyPlayerProfilePatch(remotePlayer)
      if (callback) callback(result || { ok: false, error: "同步失败" })
    })
  },

  applyProfileImage(type, path, silent = false, options = {}) {
    const imageUrl = safeImageUrl(path, this.data.player[type] || DEFAULT_AVATAR)
    const localPlayer = this.applyPlayerProfilePatch({ [type]: imageUrl })
    const successTitle = type === "cover" ? "背景已同步" : "头像已同步"
    const pendingTitle = type === "cover" ? "背景已更换，正在同步" : "头像已更换，正在同步"
    if (this.isRemoteProfileImage(imageUrl)) {
      this.syncRemotePlayerProfile({ [type]: imageUrl }, localPlayer, (result) => {
        if (!silent) wx.showToast({ title: result && result.ok ? successTitle : "本机已更换，同步失败", icon: "none" })
      })
      return
    }
    if (!silent) wx.showToast({ title: pendingTitle, icon: "none" })
    uploadPublicImageByRequest(path, `${localPlayer.id || localPlayer.playerNo || "player"}-${type}-${Date.now()}.jpg`, (uploadResult) => {
      if (!uploadResult || !uploadResult.ok || !uploadResult.url) {
        if (!silent) wx.showToast({ title: uploadResult && uploadResult.error || "图片上传失败", icon: "none" })
        return
      }
      const remotePlayer = this.applyPlayerProfilePatch({ [type]: uploadResult.url })
      this.syncRemotePlayerProfile({ [type]: uploadResult.url }, remotePlayer, (result) => {
        if (!silent) wx.showToast({ title: result && result.ok ? successTitle : "本机已更换，同步失败", icon: "none" })
      })
    })
    return
    this.applyPlayerProfilePatch({ [type]: imageUrl })
    if (!silent) wx.showToast({ title: type === "cover" ? "背景已更换" : "头像已更换", icon: "none" })
  },

  chooseProfileImage(type) {
    const handlePath = (tempPath) => {
      if (!tempPath) return
      this.applyProfileImage(type, tempPath)
    }
    const itemList = ["从相册选择", "拍照"]
    wx.showActionSheet({
      itemList,
      success: (res) => {
        const sourceType = res.tapIndex === 1 ? "camera" : "album"
        ensurePrivacyReady(() => pickImage(sourceType, handlePath, (message) => {
          wx.showToast({ title: message || "图片选择失败", icon: "none" })
        }))
      },
      fail: () => wx.showToast({ title: "已取消选择", icon: "none" })
    })
  },

  onNameInput(e) {
    this.setData({ nameInput: (e.detail.value || "").slice(0, 12) })
  },

  saveProfile() {
    const name = (this.data.nameInput || "").trim()
    if (!name) {
      wx.showToast({ title: "请输入名字", icon: "none" })
      return
    }
    const player = {
      ...this.data.player,
      name
    }
    const updatedPlayer = this.applyPlayerProfilePatch({ name })
    this.syncRemotePlayerProfile({ name }, updatedPlayer, (result) => {
      wx.showToast({ title: result && result.ok ? "资料已同步" : "本机已保存，同步失败", icon: "none" })
    })
    return
    wx.showToast({ title: "资料已保存", icon: "none" })
  },

  onSignatureInput(e) {
    const signatureInput = (e.detail.value || "").slice(0, 60)
    this.setData({
      signatureInput,
      signatureLength: signatureInput.length
    })
  },

  saveSignature() {
    const signature = (this.data.signatureInput || "").trim()
    if (!signature) {
      wx.showToast({ title: "请输入个性签名", icon: "none" })
      return
    }
    wx.setStorageSync(PLAYER_SIGNATURE_KEY, signature)
    this.setData({
      signatureInput: signature,
      signatureLength: signature.length
    })
    wx.showToast({ title: "签名已保存", icon: "none" })
  },

  selectHallOrder(e) {
    const order = this.data.hallOrders.find((item) => item.groupId === e.currentTarget.dataset.groupId)
    if (!order) return
    wx.navigateTo({
      url: `/pages/player-order-detail/player-order-detail?groupId=${order.groupId}`
    })
  },

  openPlayerGroup(e) {
    wx.navigateTo({
      url: `/pages/player-chat/player-chat?groupId=${e.currentTarget.dataset.groupId}`
    })
  },

  openPlayerOrderGroup(e) {
    wx.navigateTo({
      url: `/pages/player-chat/player-chat?groupId=${e.currentTarget.dataset.groupId}`
    })
  },

  onWithdrawAmountInput(e) {
    this.setData({ withdrawAmount: (e.detail.value || "").replace(/[^\d.]/g, "") })
  },

  submitWithdrawal() {
    const result = requestPlayerWithdrawal(this.data.player, this.data.withdrawAmount)
    if (!result.ok) {
      wx.showToast({ title: result.error, icon: "none" })
      this.setData({ wallet: result.wallet })
      return
    }
    this.setData({
      wallet: result.wallet,
      withdrawAmount: ""
    })
    wx.showToast({ title: "提现申请已提交", icon: "none" })
  },

  onSwitchPlayerInput(e) {
    this.setData({ switchPlayerId: (e.detail.value || "").trim().toUpperCase() })
  },

  switchPlayerById() {
    const target = findPlayerById(this.data.switchPlayerId)
    if (!target) {
      wx.showToast({ title: "未找到该达人ID", icon: "none" })
      return
    }
    const auth = getWorkbenchAuth()
    if (!isAuthForPlayer(auth, target)) {
      wx.showModal({
        title: "需要重新验证",
        content: "切换到其他达人前，需要回到“我的”页面输入该达人的工作台密钥。",
        showCancel: false,
        confirmText: "知道了"
      })
      this.setData({ switchPlayerId: "" })
      return
    }
    const player = buildPlayerProfile(target)
    wx.setStorageSync(PLAYER_PROFILE_KEY, player)
    this.setData({
      player,
      switchPlayerId: ""
    }, () => {
      this.refreshWorkbenchData()
    })
    wx.showToast({ title: `已切换为${player.name}`, icon: "none" })
  }
})
