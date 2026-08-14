const { getCustomerProfile, loadCustomerProfile } = require("../../utils/customer-account")
const MEMBER_ASSET_BASE = "/assets/member"
const ASSET_HOST = "https://api.example.com"

const defaultLevels = [
  { id: "silver", name: "白银会员", threshold: 0, discount: 100, imageUrl: `${MEMBER_ASSET_BASE}/silver.jpg`, benefits: "基础会员身份、专属成长值、活动优先提醒" },
  { id: "gold", name: "黄金会员", threshold: 1000, discount: 98, imageUrl: `${MEMBER_ASSET_BASE}/gold.jpg`, benefits: "98% 支付扣款、客服优先响应、专属会员卡" },
  { id: "platinum", name: "铂金会员", threshold: 5000, discount: 95, imageUrl: `${MEMBER_ASSET_BASE}/platinum.jpg`, benefits: "95% 支付扣款、热门达人优先推荐、专属活动资格" },
  { id: "green_diamond", name: "绿钻会员", threshold: 12000, discount: 93, imageUrl: `${MEMBER_ASSET_BASE}/green-diamond.jpg`, benefits: "93% 支付扣款、订单优先派单、专属客服跟进" },
  { id: "blue_diamond", name: "蓝钻会员", threshold: 30000, discount: 90, imageUrl: `${MEMBER_ASSET_BASE}/blue-diamond.jpg`, benefits: "90% 支付扣款、高阶达人优先匹配、生日福利" },
  { id: "pink_diamond", name: "粉钻会员", threshold: 60000, discount: 88, imageUrl: `${MEMBER_ASSET_BASE}/pink-diamond.jpg`, benefits: "88% 支付扣款、热门档期优先锁定、专属活动资格" },
  { id: "emerald", name: "翡翠会员", threshold: 100000, discount: 85, imageUrl: `${MEMBER_ASSET_BASE}/emerald.jpg`, benefits: "85% 支付扣款、专属客服跟进、活动优先提醒" },
  { id: "black_gold", name: "黑金会员", threshold: 180000, discount: 82, imageUrl: `${MEMBER_ASSET_BASE}/black-gold.jpg`, benefits: "82% 支付扣款、尊享全部权益、专属管家服务" }
]

const imageByName = {
  白银会员: `${MEMBER_ASSET_BASE}/silver.jpg`,
  黄金会员: `${MEMBER_ASSET_BASE}/gold.jpg`,
  铂金会员: `${MEMBER_ASSET_BASE}/platinum.jpg`,
  绿钻会员: `${MEMBER_ASSET_BASE}/green-diamond.jpg`,
  蓝钻会员: `${MEMBER_ASSET_BASE}/blue-diamond.jpg`,
  粉钻会员: `${MEMBER_ASSET_BASE}/pink-diamond.jpg`,
  翡翠会员: `${MEMBER_ASSET_BASE}/emerald.jpg`,
  黑金会员: `${MEMBER_ASSET_BASE}/black-gold.jpg`
}

const imageById = defaultLevels.reduce((map, level) => {
  map[level.id] = level.imageUrl
  return map
}, {})

function localMemberImage(level = {}) {
  const remote = String(level.imageUrl || "").trim()
  const fallback = imageById[level.id] || imageByName[level.name] || `${MEMBER_ASSET_BASE}/silver.jpg`
  if (!remote || remote.includes("/assets/cat-food") || remote.includes("/assets/guiyuan-logo")) return fallback
  if (remote.includes("/assets/member/")) {
    const fileName = remote.split("/").pop()
    return `${MEMBER_ASSET_BASE}/${fileName}`
  }
  if (remote.startsWith("/")) return `${ASSET_HOST}${remote}`
  return remote
}

function mergeMemberLevels(levels = []) {
  const remote = Array.isArray(levels) ? levels : []
  const merged = defaultLevels.map((fallback) => {
    const matched = remote.find((level) => level.id === fallback.id || level.name === fallback.name)
    return {
      ...fallback,
      ...(matched || {})
    }
  })
  remote.forEach((level) => {
    const exists = merged.some((item) => item.id === level.id || item.name === level.name)
    if (!exists && defaultLevels.some((item) => item.id === level.id || item.name === level.name)) merged.push(level)
  })
  return merged
}

function normalizeLevels(levels = [], customer = {}) {
  const spent = Number(customer.spentCatFood || 0)
  return levels.map((level, index) => {
    const fallback = defaultLevels[index] || defaultLevels[0]
    const threshold = Number(level.threshold || 0)
    const unlocked = spent >= threshold
    const discount = Number(level.discount || 100)
    return {
      ...fallback,
      ...level,
      threshold,
      discount,
      imageUrl: localMemberImage({ ...fallback, ...level }),
      benefits: level.benefits || fallback.benefits || `${discount >= 100 ? "暂无折扣" : `${discount}% 支付扣款`}，累计消费达到 ${threshold} 猫粮后解锁。`,
      unlocked,
      cls: unlocked ? "unlocked" : "",
      lockText: unlocked ? "已解锁" : "未解锁",
      remainText: unlocked ? "已解锁" : `还差 ${Math.max(0, threshold - spent).toFixed(0)} 猫粮`,
      discountText: discount >= 100 ? "暂无折扣" : `${discount}% 支付扣款`
    }
  })
}

function buildView(customer, levels) {
  const current = customer || getCustomerProfile()
  const sourceLevels = mergeMemberLevels(levels)
  const normalizedLevels = normalizeLevels(sourceLevels, current)
  const currentLevel = [...normalizedLevels]
    .sort((a, b) => Number(a.threshold || 0) - Number(b.threshold || 0))
    .reduce((matched, level) => (
      Number(current.spentCatFood || 0) >= Number(level.threshold || 0) ? level : matched
    ), normalizedLevels[0])
  const currentLevelIndex = Math.max(0, normalizedLevels.findIndex((level) => level.id === currentLevel.id))
  const selectedLevel = normalizedLevels[currentLevelIndex] || currentLevel
  const next = normalizedLevels.find((level) => Number(level.threshold || 0) > Number(current.spentCatFood || 0))
  const discount = Number(current.memberDiscount || currentLevel.discount || 100)
  return {
    customer: {
      ...current,
      avatar: current.avatar || "/assets/avatar-yinyue.jpg",
      memberLevelName: current.memberLevelName || currentLevel.name,
      memberImageUrl: currentLevel.imageUrl || `${MEMBER_ASSET_BASE}/silver.jpg`
    },
    levels: normalizedLevels,
    swiperCurrent: currentLevelIndex,
    currentLevelIndex,
    selectedLevel,
    selectedLocked: !selectedLevel.unlocked,
    nextLevelText: next ? `距离 ${next.name} 还差 ${Math.max(0, Number(next.threshold || 0) - Number(current.spentCatFood || 0)).toFixed(0)} 猫粮` : "已解锁最高等级",
    discountText: discount >= 100 ? "暂无折扣" : `${discount}% 支付扣款`
  }
}

Page({
  data: buildView(getCustomerProfile(), []),

  onShow() {
    loadCustomerProfile((customer, bills, levels) => {
      this.setData(buildView(customer, levels))
    })
  },

  onLevelSwiperChange(e) {
    const index = Number(e.detail.current || 0)
    const selectedLevel = this.data.levels[index] || this.data.levels[0]
    this.setData({
      swiperCurrent: index,
      selectedLevel,
      selectedLocked: !selectedLevel.unlocked
    })
    if (selectedLevel && !selectedLevel.unlocked) {
      wx.showToast({ title: "该会员等级未解锁，可先查看权益", icon: "none" })
    }
  }
})
