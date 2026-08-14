const { getCustomerProfile, loadCustomerProfile, logoutCustomer, updateCustomerProfile, uploadPublicImageByRequest } = require("../../utils/customer-account")
const CUSTOMER_MEDIA_OVERRIDE_KEY = "customerProfileMediaOverride"

function isRemoteImage(url) {
  return /^https:\/\//i.test(String(url || "")) || String(url || "").startsWith("/uploads/")
}

function localMediaProfile(profile = {}) {
  const media = wx.getStorageSync(CUSTOMER_MEDIA_OVERRIDE_KEY) || {}
  return {
    ...profile,
    avatar: media.avatar || profile.avatar
  }
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
  chooseImageFallback()
}

Page({
  data: {
    cacheSize: "18.57M",
    profile: getCustomerProfile(),
    nicknameInput: getCustomerProfile().name || "喵喵喵",
    groups: [
      [
        { id: "account", name: "账号与安全", arrow: true },
        { id: "teen", name: "青少年模式", arrow: true }
      ],
      [
        { id: "privacy", name: "隐私设置", arrow: true },
        { id: "notice", name: "消息提醒", arrow: true },
        { id: "cache", name: "清除缓存", value: "18.57M" }
      ],
      [
        { id: "personal", name: "个人信息收集清单", arrow: true },
        { id: "thirdParty", name: "第三方信息共享清单", arrow: true },
        { id: "about", name: "关于桂圆电竞", arrow: true }
      ]
    ]
  },

  onShow() {
    const profile = localMediaProfile(getCustomerProfile())
    this.setData({
      profile,
      nicknameInput: profile.name || "喵喵喵"
    })
    loadCustomerProfile((customer) => {
      const localProfile = localMediaProfile(getCustomerProfile())
      this.setData({
        profile: {
          ...customer,
          name: localProfile.name || customer.name,
          avatar: localProfile.avatar || customer.avatar
        },
        nicknameInput: localProfile.name || customer.name || "喵喵喵"
      })
    })
  },

  applyAvatarLocal(avatar) {
    if (!avatar) return
    wx.setStorageSync(CUSTOMER_MEDIA_OVERRIDE_KEY, { avatar })
    const profile = {
      ...this.data.profile,
      avatar
    }
    this.setData({ profile })
  },

  saveAvatar(avatar, options = {}) {
    if (!avatar) return
    this.applyAvatarLocal(avatar)
    if (!isRemoteImage(avatar)) {
      if (!options.silent) wx.showToast({ title: "头像已更换，正在同步", icon: "none" })
      uploadPublicImageByRequest(avatar, `boss-avatar-${Date.now()}.jpg`, (uploadResult) => {
        if (!uploadResult || !uploadResult.ok || !uploadResult.url) {
          if (!options.silent) wx.showToast({ title: uploadResult && uploadResult.error || "头像上传失败", icon: "none" })
          return
        }
        this.saveAvatar(uploadResult.url, options)
      })
      return
    }
    const profile = {
      ...this.data.profile,
      avatar
    }
    updateCustomerProfile(profile, (customer) => {
      this.setData({
        profile: {
          ...customer,
          avatar
        },
        nicknameInput: customer.name || this.data.nicknameInput
      })
      if (!options.silent) wx.showToast({ title: "头像已更换", icon: "none" })
    })
  },

  chooseAvatarImage() {
    const handlePath = (tempPath) => {
      if (!tempPath) return
      this.saveAvatar(tempPath)
    }
    wx.showActionSheet({
      itemList: ["从相册选择", "拍照"],
      success: (res) => {
        const sourceType = res.tapIndex === 1 ? "camera" : "album"
        ensurePrivacyReady(() => pickImage(sourceType, handlePath, (message) => {
          wx.showToast({ title: message || "图片选择失败", icon: "none" })
        }))
      },
      fail: () => wx.showToast({ title: "已取消选择", icon: "none" })
    })
  },

  onChooseAvatar(e) {
    const avatarUrl = e.detail && e.detail.avatarUrl
    if (!avatarUrl) return
    this.saveAvatar(avatarUrl)
  },

  onNicknameInput(e) {
    this.setData({ nicknameInput: (e.detail.value || "").slice(0, 16) })
  },

  saveProfile() {
    const name = String(this.data.nicknameInput || "").trim()
    if (!name) {
      wx.showToast({ title: "请输入昵称", icon: "none" })
      return
    }
    const patch = { ...this.data.profile, name }
    if (!isRemoteImage(patch.avatar)) delete patch.avatar
    updateCustomerProfile(patch, (customer) => {
      const localProfile = localMediaProfile(customer)
      this.setData({
        profile: localProfile,
        nicknameInput: localProfile.name
      })
      wx.showToast({ title: "资料已保存", icon: "none" })
    })
  },

  handleSetting(e) {
    const id = e.currentTarget.dataset.id
    if (id === "cache") {
      wx.showToast({ title: "缓存已清理", icon: "none" })
      this.setData({ cacheSize: "0M" })
      return
    }
    wx.showToast({ title: "功能准备中", icon: "none" })
  },

  logout() {
    wx.showModal({
      title: "退出登录",
      content: "退出后会清除本机账号资料，需要重新登录后才能下单。",
      confirmText: "退出",
      success: (res) => {
        if (!res.confirm) return
        logoutCustomer()
        wx.removeStorageSync(CUSTOMER_MEDIA_OVERRIDE_KEY)
        const profile = getCustomerProfile()
        this.setData({
          profile,
          nicknameInput: profile.name || "喵喵喵"
        })
        wx.showToast({ title: "已退出账号", icon: "none" })
      }
    })
  }
})
