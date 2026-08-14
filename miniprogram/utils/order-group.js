const GROUPS_KEY = "orderGroups"
const ACTIVE_GROUP_KEY = "activeOrderGroupId"
const RECRUIT_TASK_KEY = "bossRecruitTask"
const PLAYER_INCOME_RATE_KEY = "playerIncomeRate"
const DEFAULT_PLAYER_INCOME_RATE = 70
const BACKEND_API_BASE_KEY = "backendApiBase"
const DEFAULT_BACKEND_API_BASE = "https://api.example.com"
const { getCustomerProfile, loadCustomerProfile } = require("./customer-account")

const defaultService = {
  id: "cs-auto-001",
  name: "系统客服",
  role: "service",
  from: "backend",
  avatar: "/assets/entry/quick-service.png"
}

const bossUser = {
  id: "",
  name: "老板",
  role: "boss",
  avatar: "/assets/profile-hero.jpg"
}

function nowText() {
  const date = new Date()
  const hour = String(date.getHours()).padStart(2, "0")
  const minute = String(date.getMinutes()).padStart(2, "0")
  return `${hour}:${minute}`
}

function apiBase() {
  return String(wx.getStorageSync(BACKEND_API_BASE_KEY) || DEFAULT_BACKEND_API_BASE).replace(/\/$/, "")
}

function isSamePlayer(left, right) {
  return Boolean(left && right && (
    left.id === right.id ||
    left.id === right.playerNo ||
    left.playerNo === right.id ||
    left.playerNo === right.playerNo
  ))
}

function isSingleOrder(group) {
  const filters = group.filters || {}
  const playType = String(filters.playType || "").toLowerCase()
  const playTypeName = String(filters.playTypeName || "")
  return playType === "single" || playTypeName.includes("单陪") || playTypeName.includes("单人")
}

function getFinishRequiredCount(group) {
  if (isSingleOrder(group)) return 1
  return Math.max(1, (group.players || []).length)
}

function normalizeRate(value) {
  if (value === "" || value === null || value === undefined) return DEFAULT_PLAYER_INCOME_RATE
  const rate = Number(value)
  if (!Number.isFinite(rate)) return DEFAULT_PLAYER_INCOME_RATE
  return Math.max(0, Math.min(100, rate))
}

function getPlayerIncomeRate(options = {}) {
  if (options.playerRate !== undefined) return normalizeRate(options.playerRate)
  if (options.revenueConfig && options.revenueConfig.playerRate !== undefined) {
    return normalizeRate(options.revenueConfig.playerRate)
  }
  return normalizeRate(wx.getStorageSync(PLAYER_INCOME_RATE_KEY))
}

function getOrderAmount(order = {}) {
  const amount = Number(order.originalAmount || order.price || order.amount || order.totalPrice || 0)
  return Number.isFinite(amount) ? Math.max(0, amount) : 0
}

function buildOrderRevenue(order = {}, options = {}) {
  const originalAmount = getOrderAmount(order)
  const playerRate = getPlayerIncomeRate(options)
  const platformRate = Math.max(0, 100 - playerRate)
  const playerIncome = Math.round(originalAmount * playerRate) / 100
  const platformCommission = Math.max(0, Math.round((originalAmount - playerIncome) * 100) / 100)
  return {
    originalAmount,
    playerRate,
    platformRate,
    playerIncome,
    platformCommission
  }
}

function getFinishRequests(group) {
  if (Array.isArray(group.finishRequests) && group.finishRequests.length) {
    return group.finishRequests
  }
  if (group.finishRequest && group.finishRequest.playerId) {
    return [group.finishRequest]
  }
  return []
}

function hasFinishRequest(requests, player) {
  return requests.some((request) => isSamePlayer({
    id: request.playerId,
    playerNo: request.playerNo
  }, player))
}

function createOrderNo(existingGroups = []) {
  const date = new Date()
  const year = String(date.getFullYear()).slice(2)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const prefix = `PW${year}${month}${day}`

  for (let index = 0; index < 10; index += 1) {
    const random = Math.random().toString(36).slice(2, 6).toUpperCase()
    const orderNo = `${prefix}${random}`
    if (!existingGroups.some((group) => group.orderNo === orderNo)) return orderNo
  }

  return `${prefix}${Date.now().toString(36).slice(-4).toUpperCase()}`
}

function getGroups() {
  const groups = wx.getStorageSync(GROUPS_KEY) || []
  let changed = false
  let existingGroups = groups
  const nextGroups = groups.map((group) => {
    if (group.orderNo) return group
    changed = true
    const orderNo = createOrderNo(existingGroups)
    existingGroups = [...existingGroups, { orderNo }]
    return {
      ...group,
      orderNo
    }
  })
  if (changed) saveGroups(nextGroups)
  return nextGroups
}

function saveGroups(groups) {
  wx.setStorageSync(GROUPS_KEY, groups)
}

function getMessageAvatar(message, group) {
  if (message.role === "system") return ""
  if (message.avatar) return message.avatar
  if (message.role === "boss") return (group.boss || bossMember()).avatar
  if (message.role === "service") return (group.service || defaultService).avatar
  if (message.role === "player") {
    const player = (group.players || []).find((item) => item.name === message.sender)
    return player ? player.avatar : "/assets/avatar-yinyue.jpg"
  }
  return ""
}

function normalizeMessages(group) {
  return (group.messages || []).map((message) => ({
    ...message,
    avatar: getMessageAvatar(message, group),
    avatarText: message.role === "service" ? "客" : message.role === "boss" ? "我" : "打",
    showAvatar: message.role !== "system"
  }))
}

function remoteTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return nowText()
  const hour = String(date.getHours()).padStart(2, "0")
  const minute = String(date.getMinutes()).padStart(2, "0")
  return `${hour}:${minute}`
}

function remoteMessageToLocal(message = {}, group = {}) {
  const senderType = message.senderType || "user"
  const role = senderType === "staff"
    ? "service"
    : senderType === "player"
      ? "player"
      : senderType === "system"
        ? "system"
        : "boss"
  return {
    id: message.clientMessageId || message.id || `${group.id || "group"}-remote-${Date.now()}`,
    remoteMessageId: message.id || "",
    clientMessageId: message.clientMessageId || "",
    role,
    sender: role === "boss" ? (message.senderName || (group.boss || bossMember()).name || "老板") : (message.senderName || (role === "service" ? "客服" : "系统")),
    avatar: "",
    text: message.content || "",
    time: remoteTime(message.createdAt),
    type: message.type === "image" ? "image" : "text",
    imageUrl: message.imageUrl || ""
  }
}

function mergeRemoteMessages(group = {}, remoteMessages = []) {
  const mapped = remoteMessages.map((message) => remoteMessageToLocal(message, group))
  const remoteKeys = new Set(mapped.flatMap((message) => [message.id, message.remoteMessageId, message.clientMessageId].filter(Boolean)))
  const mappedTextKeys = new Set(mapped.map((message) => `${message.role}|${message.sender}|${message.text}`))
  const pending = (group.messages || []).filter((message) => {
    if (message.remoteMessageId || remoteKeys.has(message.id) || remoteKeys.has(message.clientMessageId)) return false
    const key = `${message.role}|${message.sender}|${message.text}`
    return !mappedTextKeys.has(key)
  })
  return [...pending, ...mapped]
}

function remoteOrderStatusToGroupStatus(status) {
  if (status === "\u5df2\u53d6\u6d88") return "cancelled"
  if (status === "\u5df2\u5b8c\u6210") return "completed"
  if (status === "\u5f85\u8001\u677f\u786e\u8ba4\u7ed3\u5355") return "finish_pending"
  if (status === "\u5df2\u786e\u8ba4") return "serving"
  if (status === "\u5f85\u6253\u624b\u63a5\u5355") return "waiting_player"
  return ""
}

function hasCompletedMessage(group = {}) {
  return (group.messages || []).some((message) => {
    const text = String(message.text || "")
    return text.includes("老板已确认结单") || text.includes("本单已完结")
  })
}

function remoteFinishRequest(order = {}, group = {}) {
  if (!order.finishPending && !(order.playerConfirmedDone && !order.bossConfirmedDone)) return null
  const request = order.finishRequest || {}
  const player = (group.players || [])[0] || {}
  return {
    id: request.id || `finish-${order.id || group.orderNo || Date.now()}`,
    playerId: request.playerId || order.playerId || player.id || "",
    playerNo: request.playerNo || order.playerNo || order.playerId || player.playerNo || "",
    playerName: request.playerName || order.playerName || player.name || "达人",
    status: "pending",
    time: request.time || (order.updatedAt ? remoteTime(order.updatedAt) : nowText()),
    requiredCount: Number(request.requiredCount || 1),
    confirmedCount: Number(request.confirmedCount || 1)
  }
}

function applyRemoteOrderToGroup(group = {}, order = {}) {
  if (!order || !order.id) return group
  const status = remoteOrderStatusToGroupStatus(order.status)
  const localCompleted = group.status === "completed" || hasCompletedMessage(group)
  const pendingFinish = remoteFinishRequest(order, group)
  const nextStatus = localCompleted
    ? "completed"
    : pendingFinish
    ? "finish_pending"
    : (group.status === "finish_pending" && status === "serving")
      ? group.status
      : status || group.status
  const players = [...(group.players || [])]
  const playerId = order.playerId || order.playerNo || order.playerName || ""
  if (playerId && order.playerName && !players.some((item) => isSamePlayer(item, { id: playerId, playerNo: order.playerNo || playerId }))) {
    players.push({
      id: playerId,
      playerNo: order.playerNo || playerId,
      name: order.playerName,
      avatar: order.playerAvatar || "/assets/avatar-yinyue.jpg",
      role: "player"
    })
  }
  const specifiedPlayer = order.specifiedPlayerId
    ? {
      id: order.specifiedPlayerId,
      playerNo: order.specifiedPlayerId,
      name: order.specifiedPlayerName || order.playerName || order.specifiedPlayerId,
      avatar: order.playerAvatar || "/assets/avatar-yinyue.jpg"
    }
    : group.specifiedPlayer
  return {
    ...group,
    orderNo: order.orderNo || order.id || group.orderNo,
    orderId: order.id || group.orderId,
    orderTitle: order.serviceName || group.orderTitle,
    status: nextStatus,
    finishRequest: pendingFinish || group.finishRequest,
    finishRequests: pendingFinish
      ? [pendingFinish]
      : (Array.isArray(group.finishRequests) ? group.finishRequests : []),
    dissolved: status === "cancelled" ? true : group.dissolved,
    cancelledAt: status === "cancelled" ? (order.updatedAt || nowText()) : group.cancelledAt,
    refundAmount: order.refundAmount !== undefined ? Number(order.refundAmount || 0) : group.refundAmount,
    reviewed: Boolean(order.reviewed || group.reviewed),
    canReview: Boolean(order.canReview),
    requiresPlayerAccept: Boolean(order.requiresPlayerAccept),
    specifiedPlayer,
    players,
    updatedAt: order.updatedAt ? remoteTime(order.updatedAt) : group.updatedAt
  }
}

function remoteOrderToGroup(order = {}) {
  const id = order.sessionId || `group-${order.id || order.orderNo || Date.now()}`
  const playerId = order.playerId || order.playerNo || order.playerName || ""
  const players = playerId || order.playerName
    ? [{
      id: playerId,
      playerNo: order.playerNo || playerId,
      name: order.playerName,
      avatar: order.playerAvatar || "/assets/avatar-yinyue.jpg",
      role: "player"
    }]
    : []
  const specifiedPlayer = order.specifiedPlayerId
    ? {
      id: order.specifiedPlayerId,
      playerNo: order.specifiedPlayerId,
      name: order.specifiedPlayerName || order.playerName || order.specifiedPlayerId,
      avatar: order.playerAvatar || "/assets/avatar-yinyue.jpg"
    }
    : null
  const pendingFinish = remoteFinishRequest(order, { players })
  return normalizeGroup({
    id,
    orderNo: order.orderNo || order.id,
    orderId: order.id || order.orderNo,
    title: `${order.serviceName || order.gameName || "订单"}专属群`,
    orderTitle: order.serviceName || order.gameName || "订单",
    originalAmount: Number(order.originalAmount || order.amount || 0),
    price: Number(order.amount || order.originalAmount || 0),
    payableAmount: Number(order.payableAmount || order.amount || 0),
    playerIncome: Number(order.playerIncome || 0),
    playerRate: Number(order.playerRate || 70),
    platformRate: Number(order.platformRate || 30),
    status: pendingFinish ? "finish_pending" : (remoteOrderStatusToGroupStatus(order.status) || "waiting_player"),
    service: defaultService,
    boss: {
      ...bossUser,
      id: order.userId || "",
      name: order.userName || bossUser.name
    },
    players,
    specifiedPlayer,
    requiresPlayerAccept: Boolean(order.requiresPlayerAccept),
    filters: order.filters || {},
    remark: order.note || "",
    refundAmount: Number(order.refundAmount || 0),
    finishRequest: pendingFinish,
    finishRequests: pendingFinish ? [pendingFinish] : [],
    reviewed: Boolean(order.reviewed),
    canReview: Boolean(order.canReview),
    unread: 0,
    updatedAt: order.updatedAt ? remoteTime(order.updatedAt) : nowText(),
    lastMessage: order.status === "\u5df2\u53d6\u6d88" ? "订单已取消，群聊已解散" : "订单状态已同步",
    messages: []
  })
}

function mergeRemoteOrdersToGroups(remoteOrders = []) {
  const groups = getGroups()
  const nextGroups = [...groups]
  remoteOrders.forEach((order) => {
    const index = nextGroups.findIndex((group) => (
      group.id === order.sessionId ||
      group.orderNo === order.id ||
      group.orderNo === order.orderNo ||
      group.orderId === order.id
    ))
    if (index >= 0) {
      nextGroups[index] = normalizeGroup(applyRemoteOrderToGroup(nextGroups[index], order))
      return
    }
    nextGroups.unshift(remoteOrderToGroup(order))
  })
  saveGroups(nextGroups)
  return nextGroups
}

function syncOrderGroupsFromBackend(options = {}, callback) {
  const query = [
    options.userId ? `userId=${encodeURIComponent(options.userId)}` : "",
    options.playerId ? `playerId=${encodeURIComponent(options.playerId)}` : "",
    options.playerNo ? `playerNo=${encodeURIComponent(options.playerNo)}` : ""
  ].filter(Boolean).join("&")
  wx.request({
    url: `${apiBase()}/api/public/order-groups${query ? `?${query}` : ""}`,
    method: "GET",
    success: (res) => {
      if (res.statusCode >= 400) {
        if (callback) callback(getGroups())
        return
      }
      const groups = mergeRemoteOrdersToGroups((res.data && res.data.orders) || [])
      syncGroupsFromBackend(() => {
        if (callback) callback(groups)
      })
    },
    fail: () => {
      if (callback) callback(getGroups())
    }
  })
}

function syncGroupMessagesFromBackend(groupId, callback) {
  if (!groupId) {
    if (callback) callback(null)
    return
  }
  wx.request({
    url: `${apiBase()}/api/public/sessions/${encodeURIComponent(groupId)}/messages`,
    method: "GET",
    success: (res) => {
      if (res.statusCode >= 400) {
        if (callback) callback(null)
        return
      }
      const messages = (res.data && res.data.messages) || []
      const remoteOrder = (res.data && res.data.order) || null
      const updated = updateGroup(groupId, (group) => ({
        ...applyRemoteOrderToGroup(group, remoteOrder),
        messages: mergeRemoteMessages(group, messages),
        lastMessage: messages.length ? (messages[messages.length - 1].content || group.lastMessage) : group.lastMessage,
        updatedAt: nowText()
      }))
      if (callback) callback(updated)
    },
    fail: () => {
      if (callback) callback(null)
    }
  })
}

function syncGroupsFromBackend(callback) {
  const groups = getGroups()
  if (!groups.length) {
    if (callback) callback([])
    return
  }
  let pending = groups.length
  groups.forEach((group) => {
    syncGroupMessagesFromBackend(group.id, () => {
      pending -= 1
      if (pending <= 0 && callback) callback(getGroups())
    })
  })
}

function postGroupMessageToBackend(groupId, message = {}, senderType = "user") {
  if (!groupId || !message.text) return
  wx.request({
    url: `${apiBase()}/api/public/sessions/${encodeURIComponent(groupId)}/messages`,
    method: "POST",
    data: {
      content: message.text,
      senderName: message.sender || "",
      senderType,
      clientMessageId: message.id || ""
    },
    success: () => {
      syncGroupMessagesFromBackend(groupId)
    }
  })
}

function normalizeGroup(group) {
  const players = group.players || []
  const revenue = buildOrderRevenue({
    originalAmount: group.originalAmount || group.price || group.amount,
    price: group.price
  }, {
    playerRate: group.playerRate
  })
  const nextGroup = {
    ...group,
    originalAmount: group.originalAmount !== undefined ? group.originalAmount : revenue.originalAmount,
    playerRate: group.playerRate !== undefined ? group.playerRate : revenue.playerRate,
    platformRate: group.platformRate !== undefined ? group.platformRate : revenue.platformRate,
    playerIncome: group.playerIncome !== undefined ? group.playerIncome : revenue.playerIncome,
    platformCommission: group.platformCommission !== undefined ? group.platformCommission : revenue.platformCommission,
    price: group.price !== undefined ? group.price : Number(group.payableAmount || group.amount || revenue.originalAmount || 0),
    payableAmount: group.payableAmount !== undefined ? group.payableAmount : Number(group.price || group.amount || revenue.originalAmount || 0),
    memberDiscount: group.memberDiscount !== undefined ? group.memberDiscount : 100,
    memberLevelName: group.memberLevelName || "",
    service: group.service || defaultService,
    boss: group.boss || bossMember(),
    players,
    invitedPlayers: group.invitedPlayers || [],
    members: [group.boss || bossMember(), group.service || defaultService, ...players]
  }
  return {
    ...nextGroup,
    messages: normalizeMessages(nextGroup)
  }
}

function syncOrderToBackend(group, order = {}) {
  const customer = getCustomerProfile()
  wx.request({
    url: `${apiBase()}/api/public/orders`,
    method: "POST",
    data: {
      id: group.orderNo,
      sessionId: group.id,
      userId: customer.id || "000000",
      userName: customer.name || "老板",
      contact: customer.contact || "小程序内联系",
      title: group.orderTitle || order.title,
      serviceName: group.orderTitle || order.serviceName || order.title,
      playerName: order.playerName || "",
      playerId: order.playerId || (group.specifiedPlayer ? group.specifiedPlayer.id : ""),
      gameName: order.gameName || order.game || "",
      price: group.originalAmount,
      amount: group.originalAmount,
      originalAmount: group.originalAmount,
      paymentStatus: order.paymentStatus || "paid_cat_food",
      paidCatFood: order.paidCatFood !== undefined ? order.paidCatFood : group.payableAmount,
      duration: order.duration || order.hours || 1,
      note: group.remark || "",
      filters: group.filters || {}
    },
    success: () => {
      loadCustomerProfile(() => {})
      syncGroupMessagesFromBackend(group.id)
    }
  })
}

function bossMember() {
  const customer = getCustomerProfile()
  return {
    ...bossUser,
    id: customer.id || "000000",
    name: customer.name || bossUser.name,
    avatar: customer.avatar || bossUser.avatar
  }
}

function createOrderGroup(order, options = {}) {
  const groups = getGroups()
  const id = `group-${Date.now()}`
  const orderNo = options.orderNo || createOrderNo(groups)
  const filters = options.filters || {}
  const remark = (filters.remark || "").trim()
  const systemMessages = [
    {
      id: `${id}-system`,
      role: "system",
      sender: "系统",
      text: `订单已创建，订单号 ${orderNo}，系统已自动生成本单专属群聊。`,
      time: nowText()
    },
    {
      id: `${id}-service`,
      role: "service",
      sender: options.serviceName || defaultService.name,
      avatar: (options.service || defaultService).avatar,
      text: "您好，我是本单客服。达人接单后会自动进入本群，后续沟通都在这里进行。",
      time: nowText()
    }
  ]
  const messages = remark
    ? [
      ...systemMessages,
      {
        id: `${id}-remark`,
        role: "system",
        sender: "系统",
        text: `老板备注：${remark}`,
        time: nowText()
      }
    ]
    : systemMessages
  const revenue = buildOrderRevenue(order, options)
  const group = normalizeGroup({
    id,
    orderNo,
    orderId: order.id || `order-${Date.now()}`,
    title: `${order.title || "陪伴订单"}专属群`,
    orderTitle: order.title || "陪伴订单",
    ...revenue,
    price: Number(order.price || order.amount || revenue.originalAmount || 0),
    payableAmount: Number(order.payableAmount || order.price || order.amount || revenue.originalAmount || 0),
    memberDiscount: Number(order.memberDiscount || 100),
    memberLevelName: order.memberLevelName || "",
    selectedPriceTier: order.selectedPriceTier || null,
    status: "waiting_player",
    service: options.service || defaultService,
    boss: bossMember(),
    players: [],
    specifiedPlayer: options.specifiedPlayer || null,
    requiresPlayerAccept: Boolean(options.specifiedPlayer),
    filters,
    remark,
    unread: 2,
    updatedAt: nowText(),
    lastMessage: options.specifiedPlayer
      ? `已指定 ${options.specifiedPlayer.name}，等待达人确认接单。`
      : (remark ? `老板备注：${remark}` : "系统客服已进入本单专属群，正在等待达人接单。"),
    messages
  })

  saveGroups([group, ...groups.filter((item) => item.id !== id)])
  wx.setStorageSync(ACTIVE_GROUP_KEY, id)
  syncOrderToBackend(group, order)
  return group
}

function getSpecifiedOrdersForPlayer(player) {
  return getGroups().filter((group) => {
    const target = group.specifiedPlayer || {}
    return group.requiresPlayerAccept && isSamePlayer(target, player) && !(group.players || []).some((item) => isSamePlayer(item, player))
  })
}

function updateGroup(groupId, updater) {
  const groups = getGroups()
  let updated = null
  const nextGroups = groups.map((group) => {
    if (group.id !== groupId) return group
    updated = normalizeGroup(updater(normalizeGroup(group)))
    return updated
  })
  saveGroups(nextGroups)
  return updated
}

function getGroup(groupId) {
  const groups = getGroups()
  return normalizeGroup(groups.find((group) => group.id === groupId) || groups[0] || {})
}

function addPlayerToGroup(groupId, player) {
  return updateGroup(groupId, (group) => {
    const exists = (group.players || []).some((item) => isSamePlayer(item, player))
    const players = exists ? group.players : [...(group.players || []), { ...player, role: "player" }]
    const message = {
      id: `${groupId}-join-${Date.now()}`,
      role: "system",
      sender: "系统",
      text: `${player.name} 已接单并进入本单群聊。`,
      time: nowText()
    }
    return {
      ...group,
      players,
      requiresPlayerAccept: false,
      playerAcceptedAt: new Date().toISOString(),
      invitedPlayers: (group.invitedPlayers || []).filter((item) => !isSamePlayer(item, player)),
      status: "serving",
      unread: (group.unread || 0) + 1,
      updatedAt: nowText(),
      lastMessage: message.text,
      messages: [...(group.messages || []), message]
    }
  })
}

function invitePlayerToGroup(groupId, inviter, target) {
  return updateGroup(groupId, (group) => {
    const exists = (group.players || []).some((player) => isSamePlayer(player, target))
    const invited = (group.invitedPlayers || []).some((player) => isSamePlayer(player, target))
    if (exists || invited) return group

    const invite = {
      id: target.id,
      playerNo: target.playerNo || target.id,
      name: target.name,
      avatar: target.avatar,
      invitedBy: inviter.id,
      invitedByName: inviter.name,
      status: "pending"
    }
    const message = {
      id: `${groupId}-invite-${Date.now()}`,
      role: "system",
      sender: "系统",
      text: `${inviter.name} 已邀请 ${target.name} 加入本单。`,
      time: nowText()
    }

    return {
      ...group,
      invitedPlayers: [...(group.invitedPlayers || []), invite],
      unread: (group.unread || 0) + 1,
      updatedAt: nowText(),
      lastMessage: message.text,
      messages: [...(group.messages || []), message]
    }
  })
}

function requestFinishGroup(groupId, player) {
  return updateGroup(groupId, (group) => {
    if (group.status === "completed") return group
    if (group.status === "finish_pending" && group.finishRequest && group.finishRequest.status === "pending") return group

    const requests = getFinishRequests(group)
    if (hasFinishRequest(requests, player)) return group

    const request = {
      id: `${groupId}-finish-${Date.now()}`,
      playerId: player.id,
      playerNo: player.playerNo || player.id,
      playerName: player.name,
      status: "pending",
      time: nowText()
    }
    const nextRequests = [...requests, request]
    const requiredCount = getFinishRequiredCount(group)
    const readyPlayers = (group.players || []).filter((groupPlayer) => hasFinishRequest(nextRequests, groupPlayer))
    const isReadyForBoss = readyPlayers.length >= requiredCount
    if (!isReadyForBoss) {
      return {
        ...group,
        status: group.status === "waiting_player" ? "serving" : group.status,
        finishRequest: null,
        finishRequests: nextRequests,
        updatedAt: nowText()
      }
    }

    const readyNames = readyPlayers.map((item) => item.name).filter(Boolean)
    const requestText = !isSingleOrder(group) && readyPlayers.length > 1
      ? `${readyNames.join("、")} 均已确认结单，请老板确认是否结单。`
      : `${player.name} 确认结单，请老板确认是否结单。`
    const message = {
      id: request.id,
      role: "system",
      sender: "系统",
      text: requestText,
      time: nowText()
    }

    return {
      ...group,
      status: "finish_pending",
      finishRequest: {
        id: request.id,
        playerId: player.id,
        playerNo: player.playerNo || player.id,
        playerName: readyNames.join("、") || player.name,
        status: "pending",
        time: nowText(),
        requiredCount,
        confirmedCount: readyPlayers.length
      },
      finishRequests: nextRequests,
      unread: (group.unread || 0) + 1,
      updatedAt: nowText(),
      lastMessage: message.text,
      messages: [...(group.messages || []), message]
    }
  })
}

function buildHourRefundSettlement(group, settlement = {}) {
  const filters = group.filters || {}
  if (filters.billingMode !== "hour_refund") return null
  const orderedMinutes = Math.max(60, Number(filters.orderedMinutes || filters.durationMinutes || 60))
  const hourlyPrice = Number(filters.hourlyPrice || (orderedMinutes ? Number(group.originalAmount || group.price || 0) / (orderedMinutes / 60) : 0))
  const minutePrice = hourlyPrice / 60
  const inputMinutes = settlement.actualMinutes === "" || settlement.actualMinutes === undefined
    ? orderedMinutes
    : Number(settlement.actualMinutes)
  const actualMinutes = Math.max(0, Math.min(orderedMinutes, Number.isFinite(inputMinutes) ? inputMinutes : orderedMinutes))
  const refundMinutes = Math.max(0, orderedMinutes - actualMinutes)
  const refundAmount = Math.round(refundMinutes * minutePrice * 100) / 100
  const usedAmount = Math.max(0, Math.round((Number(group.originalAmount || group.price || 0) - refundAmount) * 100) / 100)
  return {
    actualMinutes,
    orderedMinutes,
    refundMinutes,
    refundAmount,
    usedAmount,
    minutePrice: Math.round(minutePrice * 100) / 100
  }
}

function confirmFinishGroup(groupId, settlement = {}) {
  return updateGroup(groupId, (group) => {
    const hasConfirmedMessage = (group.messages || []).some((message) => {
      const text = String(message.text || "")
      return text.includes("老板已确认结单") || text.includes("本单已完结")
    })
    if (group.status === "completed" && hasConfirmedMessage) return group
    const playerName = group.finishRequest ? group.finishRequest.playerName : "达人"
    const refundSettlement = buildHourRefundSettlement(group, settlement)
    const playerCountAtFinish = Math.max(1, (group.players || []).length)
    const playerRate = Number(group.playerRate || DEFAULT_PLAYER_INCOME_RATE)
    const totalPlayerIncome = refundSettlement
      ? Number((Number(refundSettlement.usedAmount || 0) * playerRate / 100).toFixed(2))
      : Number(Number(group.playerIncome || 0).toFixed(2))
    const playerShareIncome = Number((totalPlayerIncome / playerCountAtFinish).toFixed(2))
    const finalSettlement = {
      ...(group.settlement || {}),
      ...(refundSettlement || {}),
      playerCount: playerCountAtFinish,
      totalPlayerIncome,
      playerShareIncome,
      settledAt: new Date().toISOString()
    }
    const refundText = refundSettlement && refundSettlement.refundAmount > 0
      ? ` 实际服务${refundSettlement.actualMinutes}分钟，退回${refundSettlement.refundMinutes}分钟，共${refundSettlement.refundAmount}猫粮。`
      : ""
    const message = {
      id: `${groupId}-finish-confirm-${Date.now()}`,
      role: "system",
      sender: "系统",
      text: `老板已确认结单，本单已完结。${refundText}`,
      time: nowText()
    }

    return {
      ...group,
      status: "completed",
      settlement: finalSettlement,
      refundAmount: refundSettlement ? refundSettlement.refundAmount : Number(group.refundAmount || 0),
      finishRequest: {
        ...(group.finishRequest || {}),
        playerName,
        status: "confirmed",
        confirmedAt: nowText()
      },
      finishRequests: getFinishRequests(group).map((request) => ({
        ...request,
        status: "confirmed"
      })),
      unread: 0,
      updatedAt: nowText(),
      lastMessage: message.text,
      messages: hasConfirmedMessage ? (group.messages || []) : [...(group.messages || []), message]
    }
  })
}

function cancelGroup(groupId, operator = {}) {
  return updateGroup(groupId, (group) => {
    if (group.status === "completed" || group.status === "cancelled") return group
    const operatorName = operator.name || "老板"
    const reason = (operator.reason || "").trim()
    const message = {
      id: `${groupId}-cancel-${Date.now()}`,
      role: "system",
      sender: "系统",
      text: reason ? `${operatorName} 已取消订单：${reason}` : `${operatorName} 已取消订单，本单群聊已归档。`,
      time: nowText()
    }
    return {
      ...group,
      status: "cancelled",
      cancelledBy: operatorName,
      cancelledReason: reason,
      cancelledAt: nowText(),
      unread: (group.unread || 0) + 1,
      updatedAt: nowText(),
      lastMessage: message.text,
      messages: [...(group.messages || []), message]
    }
  })
}

function appendBossMessage(groupId, text) {
  let nextMessage = null
  const updated = updateGroup(groupId, (group) => {
    nextMessage = {
      id: `${groupId}-boss-${Date.now()}`,
      role: "boss",
      sender: (group.boss || bossMember()).name || "老板",
      avatar: (group.boss || bossMember()).avatar,
      text,
      time: nowText()
    }
    return {
      ...group,
      unread: 0,
      updatedAt: nowText(),
      lastMessage: text,
      messages: [...(group.messages || []), nextMessage]
    }
  })
  postGroupMessageToBackend(groupId, nextMessage, "user")
  return updated
}

function appendBossImage(groupId, imageUrl) {
  let nextMessage = null
  const updated = updateGroup(groupId, (group) => {
    nextMessage = {
      id: `${groupId}-boss-img-${Date.now()}`,
      role: "boss",
      sender: (group.boss || bossMember()).name || "老板",
      avatar: (group.boss || bossMember()).avatar,
      type: "image",
      imageUrl,
      text: "[图片]",
      time: nowText()
    }
    return {
      ...group,
      unread: 0,
      updatedAt: nowText(),
      lastMessage: "[图片]",
      messages: [...(group.messages || []), nextMessage]
    }
  })
  postGroupMessageToBackend(groupId, { ...nextMessage, text: "[图片]" }, "user")
  return updated
}

function appendPlayerMessage(groupId, player, text) {
  let nextMessage = null
  const updated = updateGroup(groupId, (group) => {
    nextMessage = {
      id: `${groupId}-player-${Date.now()}`,
      role: "player",
      playerId: player.id,
      sender: player.name,
      avatar: player.avatar,
      text,
      time: nowText()
    }
    return {
      ...group,
      unread: (group.unread || 0) + 1,
      updatedAt: nowText(),
      lastMessage: text,
      messages: [...(group.messages || []), nextMessage]
    }
  })
  postGroupMessageToBackend(groupId, nextMessage, "player")
  return updated
}

function appendPlayerImage(groupId, player, imageUrl) {
  let nextMessage = null
  const updated = updateGroup(groupId, (group) => {
    nextMessage = {
      id: `${groupId}-player-img-${Date.now()}`,
      role: "player",
      playerId: player.id,
      sender: player.name,
      avatar: player.avatar,
      type: "image",
      imageUrl,
      text: "[图片]",
      time: nowText()
    }
    return {
      ...group,
      unread: (group.unread || 0) + 1,
      updatedAt: nowText(),
      lastMessage: "[图片]",
      messages: [...(group.messages || []), nextMessage]
    }
  })
  postGroupMessageToBackend(groupId, { ...nextMessage, text: "[图片]" }, "player")
  return updated
}

function markGroupRead(groupId) {
  return updateGroup(groupId, (group) => ({
    ...group,
    unread: 0
  }))
}

function getRecruitTask() {
  return wx.getStorageSync(RECRUIT_TASK_KEY) || null
}

function saveRecruitTask(task) {
  wx.setStorageSync(RECRUIT_TASK_KEY, task)
}

function updatePlayerProfileInGroups(player = {}) {
  const playerId = String(player.id || player.playerNo || "").trim()
  if (!playerId && !player.name) return []
  const previousName = String(player.previousName || "").trim()
  const same = (item = {}) => isSamePlayer(item, player) || (
    previousName && String(item.name || "") === previousName
  ) || (
    player.name && String(item.name || "") === String(player.name || "")
  )
  const patchPlayer = (item = {}) => same(item)
    ? {
      ...item,
      id: item.id || player.id,
      playerNo: item.playerNo || player.playerNo || player.id,
      name: player.name || item.name,
      avatar: player.avatar || item.avatar,
      cover: player.cover || item.cover
    }
    : item
  const groups = getGroups()
  let changed = false
  const nextGroups = groups.map((group) => {
    let groupChanged = false
    const players = (group.players || []).map((item) => {
      const next = patchPlayer(item)
      if (next !== item) groupChanged = true
      return next
    })
    const invitedPlayers = (group.invitedPlayers || []).map((item) => {
      const next = patchPlayer(item)
      if (next !== item) groupChanged = true
      return next
    })
    const specifiedPlayer = group.specifiedPlayer && same(group.specifiedPlayer)
      ? patchPlayer(group.specifiedPlayer)
      : group.specifiedPlayer
    if (specifiedPlayer !== group.specifiedPlayer) groupChanged = true
    const messages = (group.messages || []).map((message) => {
      if (message.role !== "player") return message
      const messageMatches = (
        String(message.playerId || "").trim() === playerId ||
        (previousName && String(message.sender || "") === previousName) ||
        (player.name && String(message.sender || "") === String(player.name || ""))
      )
      if (!messageMatches) return message
      groupChanged = true
      return {
        ...message,
        playerId: message.playerId || player.id,
        sender: player.name || message.sender,
        avatar: player.avatar || message.avatar
      }
    })
    if (!groupChanged) return group
    changed = true
    return {
      ...group,
      players,
      invitedPlayers,
      specifiedPlayer,
      messages,
      updatedAt: nowText()
    }
  })
  if (changed) saveGroups(nextGroups)
  return nextGroups
}

module.exports = {
  ACTIVE_GROUP_KEY,
  PLAYER_INCOME_RATE_KEY,
  RECRUIT_TASK_KEY,
  addPlayerToGroup,
  appendBossImage,
  appendBossMessage,
  appendPlayerImage,
  appendPlayerMessage,
  buildOrderRevenue,
  cancelGroup,
  createOrderGroup,
  getGroup,
  getGroups,
  getRecruitTask,
  getSpecifiedOrdersForPlayer,
  confirmFinishGroup,
  invitePlayerToGroup,
  markGroupRead,
  requestFinishGroup,
  saveRecruitTask,
  syncOrderGroupsFromBackend,
  syncGroupMessagesFromBackend,
  syncGroupsFromBackend,
  updatePlayerProfileInGroups
}
