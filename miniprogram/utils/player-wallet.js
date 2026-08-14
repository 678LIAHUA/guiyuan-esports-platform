const PLAYER_WALLETS_KEY = "playerWallets"
const PLAYER_WITHDRAWALS_KEY = "playerWithdrawals"
const BACKEND_API_BASE_KEY = "backendApiBase"
const DEFAULT_BACKEND_API_BASE = "https://api.example.com"

function playerKey(player = {}) {
  return String(player.playerNo || player.id || "DT10001").trim() || "DT10001"
}

function nowText() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hour = String(date.getHours()).padStart(2, "0")
  const minute = String(date.getMinutes()).padStart(2, "0")
  return `${month}-${day} ${hour}:${minute}`
}

function readWallets() {
  return wx.getStorageSync(PLAYER_WALLETS_KEY) || {}
}

function saveWallets(wallets) {
  wx.setStorageSync(PLAYER_WALLETS_KEY, wallets)
}

function normalizeWallet(wallet = {}) {
  const transactions = Array.isArray(wallet.transactions) ? wallet.transactions : []
  const balance = Number(wallet.balance || 0)
  const totalIncome = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const pendingWithdraw = transactions
    .filter((item) => item.type === "withdraw" && item.status === "pending")
    .reduce((sum, item) => sum + Math.abs(Number(item.amount || 0)), 0)
  const totalWithdraw = transactions
    .filter((item) => item.type === "withdraw" && item.status === "success")
    .reduce((sum, item) => sum + Math.abs(Number(item.amount || 0)), 0)

  return {
    balance: Number(balance.toFixed(2)),
    totalIncome: Number(totalIncome.toFixed(2)),
    pendingWithdraw: Number(pendingWithdraw.toFixed(2)),
    totalWithdraw: Number(totalWithdraw.toFixed(2)),
    transactions: transactions.sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")))
  }
}

function getPlayerWallet(player) {
  const wallets = readWallets()
  return normalizeWallet(wallets[playerKey(player)] || { balance: 0, transactions: [] })
}

function savePlayerWallet(player, wallet) {
  const wallets = readWallets()
  wallets[playerKey(player)] = normalizeWallet(wallet)
  saveWallets(wallets)
  return wallets[playerKey(player)]
}

function addPlayerIncome(player, payload = {}) {
  const amount = Number(payload.amount || 0)
  if (!player || !playerKey(player) || !Number.isFinite(amount) || amount <= 0) return getPlayerWallet(player)
  const wallet = getPlayerWallet(player)
  const txId = payload.id || `income-${payload.groupId || payload.orderNo || Date.now()}-${playerKey(player)}`
  if (wallet.transactions.some((item) => item.id === txId)) return wallet

  wallet.balance = Number((Number(wallet.balance || 0) + amount).toFixed(2))
  wallet.transactions.unshift({
    id: txId,
    type: "income",
    status: "success",
    title: payload.title || "订单收入",
    amount,
    orderNo: payload.orderNo || "",
    groupId: payload.groupId || "",
    desc: payload.desc || "老板确认结单，收入已入账",
    hint: "",
    createdAt: new Date().toISOString(),
    timeText: nowText()
  })
  return savePlayerWallet(player, wallet)
}

function readWithdrawals() {
  return wx.getStorageSync(PLAYER_WITHDRAWALS_KEY) || []
}

function saveWithdrawals(list) {
  wx.setStorageSync(PLAYER_WITHDRAWALS_KEY, list)
}

function pushWithdrawalToBackend(withdrawal) {
  const base = String(wx.getStorageSync(BACKEND_API_BASE_KEY) || DEFAULT_BACKEND_API_BASE).replace(/\/$/, "")
  if (!base) return
  wx.request({
    url: `${base}/api/public/player-withdrawals`,
    method: "POST",
    data: withdrawal,
    fail: () => {}
  })
}

function requestPlayerWithdrawal(player, amount) {
  const value = Number(amount || 0)
  const wallet = getPlayerWallet(player)
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, error: "请输入提现金额", wallet }
  }
  if (value > Number(wallet.balance || 0)) {
    return { ok: false, error: "余额不足", wallet }
  }

  const id = `W${Date.now()}${Math.random().toString(16).slice(2, 6)}`
  const nextBalance = Number((Number(wallet.balance || 0) - value).toFixed(2))
  const transaction = {
    id: `tx-${id}`,
    withdrawalId: id,
    type: "withdraw",
    status: "pending",
    title: "提现申请",
    amount: -value,
    desc: "提现申请已提交",
    hint: "正在审核中",
    createdAt: new Date().toISOString(),
    timeText: nowText()
  }
  const nextWallet = savePlayerWallet(player, {
    ...wallet,
    balance: nextBalance,
    transactions: [transaction, ...wallet.transactions]
  })
  const withdrawal = {
    id,
    playerId: playerKey(player),
    playerNo: playerKey(player),
    playerName: player.name || "达人",
    avatar: player.avatar || "",
    amount: value,
    tokenName: "猫粮",
    status: "pending",
    statusText: "审核中",
    createdAt: new Date().toISOString(),
    timeText: nowText()
  }
  const withdrawals = readWithdrawals()
  saveWithdrawals([withdrawal, ...withdrawals])
  pushWithdrawalToBackend(withdrawal)
  return { ok: true, wallet: nextWallet, withdrawal }
}

module.exports = {
  addPlayerIncome,
  getPlayerWallet,
  requestPlayerWithdrawal
}
