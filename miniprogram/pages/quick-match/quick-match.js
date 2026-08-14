const { createOrderGroup, saveRecruitTask } = require("../../utils/order-group")
const { applyMemberDiscount, getCustomerProfile, loadCustomerProfile, payWithCatFood, requireLogin } = require("../../utils/customer-account")

const BACKEND_API_BASE_KEY = "backendApiBase"
const DEFAULT_BACKEND_API_BASE = "https://api.example.com"
const CONTACT_CARD_IMG = "https://api.example.com/assets/guiyuan-logo.jpg"

function apiBase() {
  return String(wx.getStorageSync(BACKEND_API_BASE_KEY) || DEFAULT_BACKEND_API_BASE).replace(/\/$/, "")
}

function normalizeAssetUrl(url) {
  const value = String(url || "").trim()
  if (!value) return ""
  if (/^https?:\/\//i.test(value)) return value
  if (value.startsWith("/")) return `${apiBase()}${value}`
  return value
}

function formatAmount(value) {
  const number = Number(value || 0)
  if (!Number.isFinite(number)) return "0"
  return number % 1 === 0 ? String(number) : number.toFixed(0)
}

function buildContactPay(catFoodAmount = 0, title = "快速小时陪") {
  const profile = getCustomerProfile()
  const tokenAmount = Math.max(0, Number(catFoodAmount || 0))
  const amountYuan = tokenAmount / 10
  return {
    contactMessageTitle: `${title} ${formatAmount(tokenAmount)}猫粮 / ￥${amountYuan.toFixed(2)}`,
    contactMessagePath: `/pages/service-pay/service-pay?scene=order&amountYuan=${encodeURIComponent(amountYuan.toFixed(2))}&tokenAmount=${encodeURIComponent(formatAmount(tokenAmount))}&userId=${encodeURIComponent(profile.id || "boss-demo")}&userName=${encodeURIComponent(profile.name || "老板")}&title=${encodeURIComponent(`桂圆电竞订单支付：${title}`)}`,
    contactMessageImg: CONTACT_CARD_IMG
  }
}

function rechargeForShortage(shortage) {
  const tokenAmount = Math.max(0, Number(shortage || 0))
  const amountYuan = tokenAmount / 10
  wx.navigateTo({
    url: `/pages/recharge/recharge?amountYuan=${encodeURIComponent(amountYuan.toFixed(2))}`
  })
}

const fallbackConfig = {
  skills: [
    {
      id: "delta",
      name: "三角洲",
      price: 0,
      plays: [
        { id: "space", name: "航天", price: 40 },
        { id: "prison", name: "监狱", price: 30 },
        { id: "dam", name: "大坝", price: 10 }
      ]
    }
  ],
  services: [
    { id: "rush", name: "技术猛攻单", price: 60 },
    { id: "loot", name: "技术物资单", price: 90 }
  ],
  genders: [
    { id: "any", name: "不限", price: 0 },
    { id: "male", name: "男", price: 0 },
    { id: "female", name: "女", price: 30 }
  ],
  types: [
    { id: "single", name: "单陪", price: 0, multiplier: 1 },
    { id: "double", name: "双陪", price: 0, multiplier: 2 }
  ],
  levelGroups: [
    {
      id: "confidential",
      name: "机密",
      levels: [
        { id: "huashen", name: "化神期", price: 100, hint: "化神期 - 技术和稳定性最强" },
        { id: "yuanying", name: "元婴期", price: 75, hint: "元婴期 - 高阶达人，适合效率单" },
        { id: "jindan", name: "金丹期", price: 60, hint: "金丹期 - 稳定好用，性价比高" }
      ]
    }
  ]
}

function visibleSorted(list = []) {
  return (Array.isArray(list) ? list : [])
    .filter((item) => item && item.visible !== false)
    .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0))
}

function normalizeConfig(catalog = {}) {
  const quick = catalog.quickMatchConfig || {}
  const skills = visibleSorted(quick.skills && quick.skills.length ? quick.skills : fallbackConfig.skills)
    .map((skill) => ({
      ...skill,
      levelGroupIds: Array.isArray(skill.levelGroupIds) ? skill.levelGroupIds.map(String).filter(Boolean) : [],
      levelGroups: visibleSorted(skill.levelGroups || []).map((group) => ({
        ...group,
        levels: visibleSorted(group.levels && group.levels.length ? group.levels : [{ id: "default", name: "Default", price: 0 }])
      })),
      plays: visibleSorted(skill.plays && skill.plays.length ? skill.plays : [{ id: "default", name: "默认玩法", price: 0 }])
    }))
  return {
    skills,
    services: visibleSorted(quick.services && quick.services.length ? quick.services : fallbackConfig.services),
    genders: visibleSorted(quick.genders && quick.genders.length ? quick.genders : fallbackConfig.genders),
    types: visibleSorted(quick.types && quick.types.length ? quick.types : fallbackConfig.types),
    levelGroups: visibleSorted(catalog.playerLevelGroups && catalog.playerLevelGroups.length ? catalog.playerLevelGroups : fallbackConfig.levelGroups)
      .map((group) => ({
        ...group,
        levels: visibleSorted(group.levels && group.levels.length ? group.levels : [{ id: "default", name: "默认等级", price: 0 }])
      }))
  }
}

function firstId(list = []) {
  return list[0] ? list[0].id : ""
}

function findById(list = [], id) {
  return list.find((item) => item.id === id) || list[0] || {}
}

function optionsWithActive(list = [], activeId) {
  return list.map((item) => ({
    ...item,
    cls: item.id === activeId ? "active" : ""
  }))
}

function levelGroupsForSkill(config, skill) {
  if (Array.isArray(skill && skill.levelGroups) && skill.levelGroups.length) {
    return visibleSorted(skill.levelGroups).map((group) => ({
      ...group,
      levels: visibleSorted(group.levels && group.levels.length ? group.levels : [{ id: "default", name: "Default", price: 0 }])
    }))
  }
  const ids = Array.isArray(skill && skill.levelGroupIds) ? skill.levelGroupIds.map(String).filter(Boolean) : []
  const groups = visibleSorted(config.levelGroups || [])
  const linked = ids.length ? groups.filter((group) => ids.includes(String(group.id))) : groups
  return linked.length ? linked : groups
}

Page({
  data: {
    config: fallbackConfig,
    active: {
      skill: "delta",
      play: "space",
      difficulty: "confidential",
      level: "huashen",
      service: "rush",
      gender: "any",
      type: "single"
    },
    hours: 1,
    remark: "",
    skillOptions: [],
    playOptions: [],
    difficultyOptions: [],
    levelOptions: [],
    serviceOptions: [],
    genderOptions: [],
    typeOptions: [],
    levelHint: "",
    quickBgUrl: "",
    priceText: "0",
    priceRangeText: "0猫粮",
    contactMessageTitle: "桂圆电竞订单支付",
    contactMessagePath: "/pages/service-pay/service-pay?scene=order",
    contactMessageImg: CONTACT_CARD_IMG
  },

  onLoad() {
    loadCustomerProfile(() => {})
    this.applyConfig(normalizeConfig({}))
    this.loadQuickSettings()
  },

  loadQuickSettings() {
    wx.request({
      url: `${apiBase()}/api/public/bootstrap`,
      success: (res) => {
        const settings = res.data && res.data.settings
        if (settings) this.setData({ quickBgUrl: normalizeAssetUrl(settings.quickMatchBackgroundUrl) })
      }
    })
    wx.request({
      url: `${apiBase()}/api/public/catalog`,
      success: (res) => {
        const catalog = res.data && res.data.catalog
        if (catalog) {
          wx.setStorageSync("remotePlayerCatalog", catalog)
          this.applyConfig(normalizeConfig(catalog))
        }
      }
    })
  },

  applyConfig(config) {
    const skill = findById(config.skills, this.data.active.skill)
    const linkedGroups = levelGroupsForSkill(config, skill)
    const levelGroup = findById(linkedGroups, this.data.active.difficulty)
    const active = {
      ...this.data.active,
      skill: skill.id || firstId(config.skills),
      play: findById(skill.plays, this.data.active.play).id || firstId(skill.plays),
      difficulty: levelGroup.id || firstId(linkedGroups),
      level: findById(levelGroup.levels, this.data.active.level).id || firstId(levelGroup.levels),
      service: findById(config.services, this.data.active.service).id || firstId(config.services),
      gender: findById(config.genders, this.data.active.gender).id || firstId(config.genders),
      type: findById(config.types, this.data.active.type).id || firstId(config.types)
    }
    this.setData({ config, active }, () => this.refreshOptions())
  },

  refreshOptions() {
    const { config, active } = this.data
    const skill = findById(config.skills, active.skill)
    const linkedGroups = levelGroupsForSkill(config, skill)
    const group = findById(linkedGroups, active.difficulty)
    const level = findById(group.levels, active.level)
    this.setData({
      skillOptions: optionsWithActive(config.skills, active.skill),
      playOptions: optionsWithActive(skill.plays || [], active.play),
      difficultyOptions: optionsWithActive(linkedGroups, active.difficulty),
      levelOptions: optionsWithActive(group.levels || [], active.level),
      serviceOptions: optionsWithActive(config.services, active.service),
      genderOptions: optionsWithActive(config.genders, active.gender),
      typeOptions: optionsWithActive(config.types, active.type),
      levelHint: level.hint || `${group.name || "等级"} - ${level.name || ""}`
    }, () => this.recalculatePrice())
  },

  chooseOption(e) {
    const group = e.currentTarget.dataset.group
    const id = e.currentTarget.dataset.id
    const { config } = this.data
    const active = { ...this.data.active }
    if (group === "skills") {
      const skill = findById(config.skills, id)
      const linkedGroups = levelGroupsForSkill(config, skill)
      const levelGroup = linkedGroups[0] || {}
      active.skill = skill.id
      active.play = firstId(skill.plays)
      active.difficulty = levelGroup.id || ""
      active.level = firstId(levelGroup.levels || [])
    } else if (group === "plays") {
      active.play = id
    } else if (group === "difficulties") {
      const skill = findById(config.skills, active.skill)
      const levelGroup = findById(levelGroupsForSkill(config, skill), id)
      active.difficulty = levelGroup.id
      active.level = firstId(levelGroup.levels)
    } else if (group === "levels") {
      active.level = id
    } else if (group === "services") {
      active.service = id
    } else if (group === "genders") {
      active.gender = id
    } else if (group === "types") {
      active.type = id
    }
    this.setData({ active }, () => this.refreshOptions())
  },

  changeHours(e) {
    const step = Number(e.currentTarget.dataset.step || 0)
    const hours = Math.max(1, Math.min(24, this.data.hours + step))
    this.setData({ hours }, () => this.recalculatePrice())
  },

  onRemarkInput(e) {
    this.setData({ remark: String(e.detail.value || "").slice(0, 80) })
  },

  selectedOptions() {
    const { config, active } = this.data
    const skill = findById(config.skills, active.skill)
    const difficulty = findById(levelGroupsForSkill(config, skill), active.difficulty)
    return {
      skill,
      play: findById(skill.plays || [], active.play),
      difficulty,
      level: findById(difficulty.levels || [], active.level),
      service: findById(config.services, active.service),
      gender: findById(config.genders, active.gender),
      type: findById(config.types, active.type)
    }
  },

  recalculatePrice() {
    const selected = this.selectedOptions()
    const levelPrice = Number(selected.level.price || 0)
    const extraPrice = [
      selected.skill,
      selected.play,
      selected.service,
      selected.gender
    ].reduce((sum, item) => sum + Number(item.price || 0), 0)
    const unit = Math.max(40, levelPrice + extraPrice) * Number(selected.type.multiplier || 1)
    const total = unit * this.data.hours
    const title = `快速小时陪 / ${selected.skill.name || ""}`
    this.setData({
      priceText: formatAmount(total),
      priceRangeText: `${formatAmount(total)}猫粮`,
      ...buildContactPay(total, title)
    })
  },

  showNotice() {
    wx.showModal({
      title: "点单须知",
      content: "快速下单统一为小时单。下单后系统派到接单大厅，达人接单后进入订单群；按整小时预扣，少玩的部分结单时按分钟退回。",
      showCancel: false,
      confirmText: "知道了"
    })
  },

  startDispatch() {
    if (!requireLogin()) return
    const selected = this.selectedOptions()
    const originalAmount = Number(this.data.priceText || 0)
    const discount = applyMemberDiscount(originalAmount)
    const hourlyPrice = originalAmount / this.data.hours
    const remark = (this.data.remark || "").trim()
    const order = {
      id: `quick-hour-${Date.now()}`,
      title: `快速小时陪 / ${selected.skill.name}`,
      price: discount.originalAmount,
      amount: discount.originalAmount,
      originalAmount: discount.originalAmount,
      payableAmount: discount.payableAmount,
      memberDiscount: discount.discount,
      memberLevelName: discount.memberLevelName,
      duration: this.data.hours
    }
    payWithCatFood(discount.payableAmount, {
      orderId: order.id,
      title: "订单消费",
      note: `${order.title} / ${this.data.hours}小时${remark ? ` / 备注：${remark}` : ""}`
    }, (result) => {
      if (!result.ok) {
        const shortage = Number(result.shortage || Math.max(0, discount.payableAmount - Number(result.balance || 0)))
        wx.showModal({
          title: "猫粮不足",
          content: `当前猫粮不足，还差 ${formatAmount(shortage)} 猫粮，是否前往充值？`,
          confirmText: "去充值",
          cancelText: "取消",
          success: (res) => {
            if (res.confirm) rechargeForShortage(shortage)
          }
        })
        return
      }
      const paidOrder = {
        ...order,
        paymentStatus: "paid_cat_food",
        paidCatFood: discount.payableAmount
      }
      const group = createOrderGroup(paidOrder, {
        filters: {
          orderKind: "quick_hour",
          billingMode: "hour_refund",
          orderedHours: this.data.hours,
          orderedMinutes: this.data.hours * 60,
          hourlyPrice,
          minutePrice: hourlyPrice / 60,
          durationName: `${this.data.hours}小时`,
          difficulty: selected.difficulty.id,
          difficultyName: selected.difficulty.name,
          level: selected.level.id,
          levelName: selected.level.name,
          levelHint: selected.level.hint,
          service: selected.service.id,
          serviceName: selected.service.name,
          gender: selected.gender.id,
          genderName: selected.gender.name,
          playType: selected.type.id,
          playTypeName: selected.type.name,
          skillName: selected.skill.name,
          playName: selected.play.name,
          remark
        }
      })
      saveRecruitTask({
        orderId: order.id,
        groupId: group.id,
        title: order.title,
        status: "recruiting",
        serviceId: group.service.id
      })
      wx.showToast({ title: "支付成功，已派单", icon: "success" })
      setTimeout(() => {
        wx.switchTab({ url: "/pages/message/message" })
      }, 450)
    })
  }
})
