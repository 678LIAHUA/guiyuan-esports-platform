const CUSTOMER_PROFILE_KEY = "customerProfile"
const CUSTOMER_BILLS_KEY = "customerBills"
const CUSTOMER_REFERRAL_KEY = "customerReferral"
const CUSTOMER_LOGIN_KEY = "customerLoginState"
const BACKEND_API_BASE_KEY = "backendApiBase"
const DEFAULT_BACKEND_API_BASE = "https://api.example.com"
const DEFAULT_AVATAR = "/assets/avatar-yinyue.jpg"
const DEFAULT_USER = { id: "", name: "喵喵喵", avatar: DEFAULT_AVATAR }

function safeImageUrl(url, fallback = DEFAULT_AVATAR) {
  const value = String(url || "").trim()
  if (!value) return fallback
  if (value.startsWith("/assets/")) return value
  if (value.startsWith("/uploads/")) return `${apiBase()}${value}`
  if (/^https:\/\//i.test(value)) return value
  if (/^wxfile:\/\//i.test(value)) return value
  if (/^http:\/\/tmp\//i.test(value)) return value
  if (/^http:\/\/usr\//i.test(value)) return value
  if (/^file:\/\//i.test(value)) return value
  if (value.includes("/tmp/")) return value
  if (/^http:\/\/127\.0\.0\.1/i.test(value) || value.includes("/tmp/")) return fallback
  return fallback
}

function createSixDigitId() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function isSixDigitId(id) {
  return /^\d{6}$/.test(String(id || ""))
}

function getOrCreateCustomerId() {
  const saved = wx.getStorageSync("currentCustomerProfile") || wx.getStorageSync(CUSTOMER_PROFILE_KEY) || {}
  if (isSixDigitId(saved.id)) return saved.id
  const id = createSixDigitId()
  wx.setStorageSync("currentCustomerProfile", {
    ...saved,
    id,
    name: saved.name || DEFAULT_USER.name,
    avatar: saved.avatar || DEFAULT_AVATAR
  })
  return id
}

function apiBase() {
  return String(wx.getStorageSync(BACKEND_API_BASE_KEY) || DEFAULT_BACKEND_API_BASE).replace(/\/$/, "")
}

function currentUser() {
  const saved = wx.getStorageSync("currentCustomerProfile") || {}
  return normalizeCustomerProfile({
    ...DEFAULT_USER,
    ...saved,
    id: isSixDigitId(saved.id) ? saved.id : getOrCreateCustomerId()
  })
}

function normalizeCustomerProfile(profile = {}) {
  return {
    ...profile,
    id: isSixDigitId(profile.id) ? profile.id : getOrCreateCustomerId(),
    name: profile.name || DEFAULT_USER.name,
    avatar: safeImageUrl(profile.avatar, DEFAULT_AVATAR)
  }
}

function fallbackProfile() {
  return normalizeCustomerProfile(wx.getStorageSync(CUSTOMER_PROFILE_KEY) || {
    id: DEFAULT_USER.id,
    name: DEFAULT_USER.name,
    avatar: DEFAULT_AVATAR,
    balanceCatFood: 0,
    spentCatFood: 0,
    memberLevelName: "白银会员",
    memberDiscount: 100,
    memberImageUrl: "/assets/member/silver.jpg"
  })
}

function saveProfile(customer, bills) {
  if (customer) wx.setStorageSync(CUSTOMER_PROFILE_KEY, normalizeCustomerProfile(customer))
  if (customer) wx.setStorageSync("currentCustomerProfile", normalizeCustomerProfile(customer))
  if (Array.isArray(bills)) wx.setStorageSync(CUSTOMER_BILLS_KEY, bills)
}

function getCustomerProfile() {
  return fallbackProfile()
}

function getLoginState() {
  const saved = wx.getStorageSync(CUSTOMER_LOGIN_KEY) || {}
  return {
    loggedIn: Boolean(saved.loggedIn),
    skipped: Boolean(saved.skipped),
    token: saved.token || "",
    loginAt: saved.loginAt || ""
  }
}

function isCustomerLoggedIn() {
  return Boolean(getLoginState().loggedIn)
}

function saveLoginState(payload = {}) {
  const next = {
    loggedIn: payload.loggedIn !== false,
    skipped: false,
    token: payload.token || "",
    loginAt: new Date().toISOString()
  }
  wx.setStorageSync(CUSTOMER_LOGIN_KEY, next)
  return next
}

function skipLogin() {
  const next = {
    loggedIn: false,
    skipped: true,
    token: "",
    loginAt: ""
  }
  wx.setStorageSync(CUSTOMER_LOGIN_KEY, next)
  return next
}

function clearLoginState() {
  wx.removeStorageSync(CUSTOMER_LOGIN_KEY)
}

function requireLogin(callback) {
  if (isCustomerLoggedIn()) {
    if (callback) callback(getCustomerProfile())
    return true
  }
  const pages = getCurrentPages()
  const current = pages[pages.length - 1]
  const route = current ? `/${current.route}` : "/pages/index/index"
  const options = current && current.options
    ? Object.keys(current.options).map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(current.options[key])}`).join("&")
    : ""
  const redirect = `${route}${options ? `?${options}` : ""}`
  wx.navigateTo({ url: `/pages/login/login?redirect=${encodeURIComponent(redirect)}` })
  return false
}

function loginWithPhone(phoneCode, callback) {
  wx.login({
    success: (loginRes) => {
      wx.request({
        url: `${apiBase()}/api/public/phone-login`,
        method: "POST",
        data: {
          code: loginRes.code || "",
          phoneCode: phoneCode || ""
        },
        success: (res) => {
          const data = res.data || {}
          if (res.statusCode >= 400 || data.ok === false) {
            if (callback) callback({ ok: false, error: data.error || "登录失败" })
            return
          }
          if (data.customer) {
            saveProfile(data.customer, data.bills || getCustomerBills())
          }
          saveLoginState({ token: data.token || "" })
          if (callback) callback({ ok: true, customer: data.customer || getCustomerProfile(), token: data.token || "" })
        },
        fail: () => {
          if (callback) callback({ ok: false, error: "无法连接登录接口" })
        }
      })
    },
    fail: () => {
      if (callback) callback({ ok: false, error: "微信登录失败" })
    }
  })
}

function loginWithWechat(callback) {
  wx.login({
    success: (loginRes) => {
      if (!loginRes.code) {
        if (callback) callback({ ok: false, error: "微信登录凭证为空，请重新点击登录" })
        return
      }
      const loginUrl = `${apiBase()}/api/public/login`
      console.info("[guiyuan-login]", loginUrl)
      wx.request({
        url: loginUrl,
        method: "POST",
        data: {
          code: loginRes.code || "",
          userName: getCustomerProfile().name || DEFAULT_USER.name,
          avatar: getCustomerProfile().avatar || DEFAULT_AVATAR
        },
        success: (res) => {
          const data = res.data || {}
          if (res.statusCode >= 400 || data.ok === false) {
            let error = data.error || data.message || "微信登录失败，请检查小程序 AppID/AppSecret 和服务器域名"
            if (String(error).includes("未登录或登录已过期")) {
              error = "登录接口打到了后台受保护接口，请确认服务器已更新新包并重新编译小程序"
            }
            if (callback) callback({ ok: false, error })
            return
          }
          if (data.customer) saveProfile(data.customer, data.bills || getCustomerBills())
          saveLoginState({ token: data.token || "" })
          if (callback) callback({ ok: true, customer: data.customer || getCustomerProfile(), token: data.token || "" })
        },
        fail: () => {
          if (callback) callback({ ok: false, error: "无法连接登录接口，请检查服务器域名" })
        }
      })
    },
    fail: () => {
      if (callback) callback({ ok: false, error: "微信登录失败" })
    }
  })
}

function updateCustomerProfile(patch = {}, callback) {
  const current = getCustomerProfile()
  const next = normalizeCustomerProfile({
    ...current,
    ...patch,
    id: current.id || patch.id,
    name: patch.name || current.name,
    avatar: safeImageUrl(patch.avatar, current.avatar || DEFAULT_AVATAR)
  })
  saveProfile(next, getCustomerBills())
  wx.request({
    url: `${apiBase()}/api/public/customer-profile`,
    method: "PATCH",
    data: {
      userId: next.id,
      userName: next.name,
      avatar: next.avatar
    },
    success: (res) => {
      const data = res.data || {}
      const saved = data.customer
        ? normalizeCustomerProfile({ ...data.customer, name: next.name, avatar: next.avatar })
        : next
      saveProfile(saved, data.bills || getCustomerBills())
      if (callback) callback(saved)
    },
    fail: () => {
      if (callback) callback(next)
    }
  })
}

function logoutCustomer() {
  wx.removeStorageSync(CUSTOMER_PROFILE_KEY)
  wx.removeStorageSync("currentCustomerProfile")
  wx.removeStorageSync(CUSTOMER_BILLS_KEY)
  wx.removeStorageSync(CUSTOMER_REFERRAL_KEY)
  clearLoginState()
}

function getCustomerBills() {
  return wx.getStorageSync(CUSTOMER_BILLS_KEY) || []
}

function saveLocalPayment(amount, payload = {}) {
  const payAmount = Math.max(0, Number(amount || 0))
  const profile = getCustomerProfile()
  const balance = Math.max(0, Number(profile.balanceCatFood || 0))
  if (balance < payAmount) {
    return {
      ok: false,
      error: "猫粮不足",
      balance,
      shortage: Number((payAmount - balance).toFixed(2))
    }
  }
  const nextProfile = {
    ...profile,
    balanceCatFood: Number(Math.max(0, balance - payAmount).toFixed(2))
  }
  const bill = {
    id: payload.billId || `pay-${Date.now()}`,
    type: payload.type || "order",
    title: payload.title || "订单消费",
    source: payload.source || "小程序猫粮支付",
    note: payload.note || "",
    amount: -payAmount,
    balanceAfter: nextProfile.balanceCatFood,
    createdAt: new Date().toISOString()
  }
  saveProfile(nextProfile, [bill, ...getCustomerBills()])
  return { ok: true, customer: nextProfile, bill }
}

function payWithCatFood(amount, payload = {}, callback) {
  const payAmount = Math.max(0, Number(amount || 0))
  if (payAmount <= 0) {
    if (callback) callback({ ok: false, error: "支付金额必须大于0" })
    return
  }
  const user = currentUser()
  wx.request({
    url: `${apiBase()}/api/public/customer-pay`,
    method: "POST",
      data: {
        userId: user.id,
        userName: user.name,
        amount: payAmount,
        title: payload.title || "订单消费",
        note: payload.note || "",
        orderId: payload.orderId || "",
        type: payload.type || "order",
        playerId: payload.playerId || "",
        playerNo: payload.playerNo || "",
        playerName: payload.playerName || "",
        playerAvatar: payload.playerAvatar || "",
        giftId: payload.giftId || "",
        giftName: payload.giftName || ""
      },
    success: (res) => {
      const data = res.data || {}
      if (res.statusCode >= 400 || data.ok === false) {
        if (callback) callback({
          ok: false,
          error: data.error || "猫粮不足",
          balance: Number(data.balance || 0),
          shortage: Number(data.shortage || 0)
        })
        return
      }
      if (data.customer) saveProfile(data.customer, data.bills || getCustomerBills())
      if (callback) callback({ ok: true, customer: data.customer || getCustomerProfile(), bill: data.bill })
    },
    fail: () => {
      if (payload.type === "gift") {
        if (callback) callback({ ok: false, error: "礼物入账需要连接服务器，请稍后重试" })
        return
      }
      if (callback) callback(saveLocalPayment(payAmount, payload))
    }
  })
}

function backendRequest(path, options = {}, callback) {
  wx.request({
    url: `${apiBase()}${path}`,
    method: options.method || "GET",
    data: options.data || {},
    success: (res) => {
      const data = res.data || {}
      if (res.statusCode >= 400) {
        if (callback) callback({ ok: false, error: data.error || "请求失败", data })
        return
      }
      if (callback) callback({ ok: true, data })
    },
    fail: () => {
      if (callback) callback({ ok: false, error: "无法连接服务器" })
    }
  })
}

function imageMimeFromPath(filePath = "") {
  const value = String(filePath || "").toLowerCase()
  if (value.includes(".png")) return "image/png"
  if (value.includes(".webp")) return "image/webp"
  if (value.includes(".gif")) return "image/gif"
  return "image/jpeg"
}

function uploadPublicImage(filePath, fileName = "", callback) {
  if (!filePath) {
    if (callback) callback({ ok: false, error: "图片不存在" })
    return
  }
  if (/^https:\/\//i.test(filePath)) {
    if (callback) callback({ ok: true, url: filePath })
    return
  }
  if (!wx.uploadFile) {
    if (callback) callback({ ok: false, error: "当前微信版本不支持上传图片" })
    return
  }
  wx.uploadFile({
    url: `${apiBase()}/api/public/upload-file`,
    filePath,
    name: "file",
    formData: {
      fileName: fileName || `image-${Date.now()}.jpg`,
      mime: imageMimeFromPath(filePath)
    },
    timeout: 15000,
    success: (res) => {
      let data = {}
      try {
        data = typeof res.data === "string" ? JSON.parse(res.data) : (res.data || {})
      } catch (error) {
        data = {}
      }
      if (res.statusCode >= 200 && res.statusCode < 300 && data.url) {
        if (callback) callback({ ok: true, url: data.url })
        return
      }
      if (callback) callback({ ok: false, error: data.error || "图片上传失败" })
    },
    fail: () => {
      if (callback) callback({ ok: false, error: "图片上传超时" })
    }
  })
}

function uploadPublicImageByRequest(filePath, fileName = "", callback) {
  if (!filePath) {
    if (callback) callback({ ok: false, error: "图片不存在" })
    return
  }
  if (/^https:\/\//i.test(filePath)) {
    if (callback) callback({ ok: true, url: filePath })
    return
  }
  let finished = false
  const finish = (result) => {
    if (finished) return
    finished = true
    if (callback) callback(result)
  }
  const readAndUpload = (targetPath) => {
    const fs = wx.getFileSystemManager && wx.getFileSystemManager()
    if (!fs || !fs.readFile) {
      finish({ ok: false, error: "当前微信版本不支持读取图片" })
      return
    }
    fs.readFile({
      filePath: targetPath,
      encoding: "base64",
      success: (fileRes) => {
        wx.request({
          url: `${apiBase()}/api/public/uploads`,
          method: "POST",
          timeout: 20000,
          data: {
            fileName: fileName || `image-${Date.now()}.jpg`,
            dataUrl: `data:${imageMimeFromPath(targetPath)};base64,${fileRes.data || ""}`
          },
          success: (res) => {
            const data = res.data || {}
            if (res.statusCode >= 200 && res.statusCode < 300 && data.url) {
              finish({ ok: true, url: data.url })
              return
            }
            finish({ ok: false, error: data.error || "图片上传失败" })
          },
          fail: () => {
            finish({ ok: false, error: "图片同步失败" })
          }
        })
      },
      fail: () => {
        finish({ ok: false, error: "图片读取失败" })
      }
    })
  }
  const uploadWithFallback = (targetPath) => {
    uploadPublicImage(targetPath, fileName, (result) => {
      if (result && result.ok && result.url) {
        finish(result)
        return
      }
      readAndUpload(targetPath)
    })
  }
  if (wx.compressImage) {
    wx.compressImage({
      src: filePath,
      quality: 35,
      success: (res) => uploadWithFallback(res.tempFilePath || filePath),
      fail: () => uploadWithFallback(filePath)
    })
    return
  }
  uploadWithFallback(filePath)
}

function updatePlayerProfileMedia(playerId, patch = {}, callback) {
  backendRequest("/api/public/player-profile-media", {
    method: "PATCH",
    data: {
      playerId,
      ...patch
    }
  }, callback)
}

function loadPlayerFavorites(callback) {
  const user = currentUser()
  backendRequest(`/api/public/player-favorites?userId=${encodeURIComponent(user.id)}`, {}, (result) => {
    if (result.ok) wx.setStorageSync("favoritePlayersRemote", result.data.favorites || [])
    if (callback) callback(result.ok ? (result.data.favorites || []) : (wx.getStorageSync("favoritePlayersRemote") || []))
  })
}

function togglePlayerFavorite(player, favorite, callback) {
  const user = currentUser()
  const playerId = String(player && (player.id || player.playerNo) || "").trim()
  if (!playerId) {
    if (callback) callback({ ok: false, error: "达人信息不存在" })
    return
  }
  if (favorite) {
    backendRequest("/api/public/player-favorites", {
      method: "POST",
      data: { userId: user.id, playerId }
    }, callback)
    return
  }
  backendRequest(`/api/public/player-favorites?userId=${encodeURIComponent(user.id)}&playerId=${encodeURIComponent(playerId)}`, {
    method: "DELETE"
  }, callback)
}

function loadPlayerReviews(params = {}, callback) {
  const query = params.playerId
    ? `playerId=${encodeURIComponent(params.playerId)}`
    : `userId=${encodeURIComponent(params.userId || currentUser().id)}`
  backendRequest(`/api/public/player-reviews?${query}`, {}, (result) => {
    if (callback) callback(result.ok ? (result.data.reviews || []) : [])
  })
}

function submitPlayerReview(payload = {}, callback) {
  const user = currentUser()
  backendRequest("/api/public/player-reviews", {
    method: "POST",
    data: {
      userId: user.id,
      userName: user.name,
      orderId: payload.orderId,
      rating: payload.rating,
      scores: payload.scores || payload.dimensionScores || {},
      tags: payload.tags || [],
      content: payload.content || ""
    }
  }, callback)
}

function confirmBackendOrderComplete(orderId, role, payload = {}, callback) {
  const user = currentUser()
  backendRequest(`/api/public/orders/${encodeURIComponent(orderId)}/confirm-complete`, {
    method: "POST",
    data: {
      role,
      userId: user.id,
      ...payload
    }
  }, callback)
}

function loadBackendOrders(callback) {
  const user = currentUser()
  backendRequest(`/api/public/orders?userId=${encodeURIComponent(user.id)}`, {}, (result) => {
    if (callback) callback(result.ok ? (result.data.orders || []) : [])
  })
}

function loadCustomerProfile(callback) {
  const user = currentUser()
  wx.request({
    url: `${apiBase()}/api/public/customer-profile?userId=${encodeURIComponent(user.id)}&userName=${encodeURIComponent(user.name)}`,
    method: "GET",
    success: (res) => {
      const data = res.data || {}
      let customer = data.customer || fallbackProfile()
      if (data.customer) {
        customer = normalizeCustomerProfile({
          ...data.customer,
          name: user.name || data.customer.name,
          avatar: user.avatar || data.customer.avatar
        })
        saveProfile(customer, data.bills || [])
      }
      if (data.referral) wx.setStorageSync(CUSTOMER_REFERRAL_KEY, data.referral)
      if (data.referralConfig) wx.setStorageSync("referralConfig", data.referralConfig)
      if (callback) callback(customer, data.bills || getCustomerBills(), data.memberLevels || [], data.referral || getCustomerReferral(), data.referralConfig || getReferralConfig())
    },
    fail: () => {
      if (callback) callback(fallbackProfile(), getCustomerBills(), [], getCustomerReferral(), getReferralConfig())
    }
  })
}

function getReferralConfig() {
  return wx.getStorageSync("referralConfig") || { enabled: true, rate: 5, months: 1 }
}

function getCustomerReferral() {
  return wx.getStorageSync(CUSTOMER_REFERRAL_KEY) || null
}

function bindReferral(inviterId, callback) {
  const user = currentUser()
  const code = String(inviterId || "").trim()
  if (!isSixDigitId(code)) {
    if (callback) callback({ ok: false, error: "请输入正确的 6 位用户 ID" })
    return
  }
  if (code === user.id) {
    if (callback) callback({ ok: false, error: "不能填写自己的 ID" })
    return
  }
  const localReferral = {
    userId: user.id,
    userName: user.name,
    inviterId: code,
    rate: getReferralConfig().rate || 5,
    months: getReferralConfig().months || 1,
    status: "active",
    createdAt: new Date().toISOString()
  }
  wx.setStorageSync(CUSTOMER_REFERRAL_KEY, localReferral)
  wx.request({
    url: `${apiBase()}/api/public/referrals`,
    method: "POST",
    data: {
      userId: user.id,
      userName: user.name,
      inviterId: code
    },
    success: (res) => {
      const data = res.data || {}
      if (res.statusCode >= 400) {
        if (callback) callback({ ok: false, error: data.error || "保存失败" })
        return
      }
      if (data.referral) wx.setStorageSync(CUSTOMER_REFERRAL_KEY, data.referral)
      if (data.referralConfig) wx.setStorageSync("referralConfig", data.referralConfig)
      if (callback) callback({ ok: true, referral: data.referral || localReferral, message: data.message || "邀请关系已保存" })
    },
    fail: () => {
      if (callback) callback({ ok: true, referral: localReferral, message: "已本地保存，联网后同步" })
    }
  })
}

function loadCustomerBills(callback) {
  const user = currentUser()
  wx.request({
    url: `${apiBase()}/api/public/customer-bills?userId=${encodeURIComponent(user.id)}`,
    method: "GET",
    success: (res) => {
      const bills = (res.data && res.data.bills) || []
      wx.setStorageSync(CUSTOMER_BILLS_KEY, bills)
      if (callback) callback(bills)
    },
    fail: () => {
      if (callback) callback(getCustomerBills())
    }
  })
}

function applyMemberDiscount(amount) {
  const profile = getCustomerProfile()
  const discount = Math.max(1, Math.min(100, Number(profile.memberDiscount || 100)))
  const originalAmount = Number(amount || 0)
  return {
    originalAmount,
    payableAmount: Math.round(originalAmount * discount) / 100,
    discount,
    memberLevelName: profile.memberLevelName || "会员"
  }
}

function addLocalCustomerRefund(group = {}) {
  const refundAmount = Number(group.refundAmount || (group.settlement && group.settlement.refundAmount) || 0)
  if (!Number.isFinite(refundAmount) || refundAmount <= 0) return getCustomerProfile()
  const bills = getCustomerBills()
  const billId = `refund-${group.id}`
  if (bills.some((bill) => bill.id === billId)) return getCustomerProfile()
  const profile = getCustomerProfile()
  const nextProfile = {
    ...profile,
    balanceCatFood: Math.round((Number(profile.balanceCatFood || 0) + refundAmount) * 100) / 100
  }
  const bill = {
    id: billId,
    type: "refund",
    title: "小时陪退款",
    source: "订单结单退款",
    note: `订单 ${group.orderNo || "--"} 未使用时长退回`,
    amount: refundAmount,
    createdAt: new Date().toISOString()
  }
  saveProfile(nextProfile, [bill, ...bills])
  return nextProfile
}

module.exports = {
  addLocalCustomerRefund,
  applyMemberDiscount,
  bindReferral,
  backendRequest,
  confirmBackendOrderComplete,
  currentUser,
  getCustomerBills,
  getCustomerReferral,
  getCustomerProfile,
  getLoginState,
  getReferralConfig,
  isCustomerLoggedIn,
  loginWithPhone,
  loginWithWechat,
  loadCustomerBills,
  loadCustomerProfile,
  loadBackendOrders,
  loadPlayerFavorites,
  loadPlayerReviews,
  logoutCustomer,
  payWithCatFood,
  requireLogin,
  saveLoginState,
  skipLogin,
  submitPlayerReview,
  togglePlayerFavorite,
  updateCustomerProfile,
  updatePlayerProfileMedia,
  uploadPublicImage,
  uploadPublicImageByRequest
}
