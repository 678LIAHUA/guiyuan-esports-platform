const PLAYER_PROFILE_KEY = "currentPlayerProfile"
const PENDING_COVER_CROP_KEY = "pendingCoverCropSrc"

const outputSize = {
  width: 750,
  height: 430
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

Page({
  data: {
    src: "",
    imageInfo: null,
    frame: { width: 0, height: 0 },
    imageStyle: "",
    x: 0,
    y: 0,
    baseWidth: 0,
    baseHeight: 0,
    baseScale: 1,
    scale: 1,
    scaleValue: 100,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0
  },

  onLoad() {
    const src = wx.getStorageSync(PENDING_COVER_CROP_KEY)
    if (!src) {
      wx.showToast({ title: "没有可裁剪图片", icon: "none" })
      setTimeout(() => wx.navigateBack(), 300)
      return
    }
    this.setData({ src })
    wx.getImageInfo({
      src,
      success: (imageInfo) => {
        this.setData({ imageInfo }, () => this.initFrame())
      }
    })
  },

  initFrame() {
    wx.createSelectorQuery()
      .in(this)
      .select(".crop-frame")
      .boundingClientRect((rect) => {
        if (!rect || !this.data.imageInfo) return
        const info = this.data.imageInfo
        const baseScale = Math.max(rect.width / info.width, rect.height / info.height)
        const baseWidth = info.width * baseScale
        const baseHeight = info.height * baseScale
        const x = (rect.width - baseWidth) / 2
        const y = (rect.height - baseHeight) / 2
        this.setData({
          frame: { width: rect.width, height: rect.height },
          baseScale,
          baseWidth,
          baseHeight,
          x,
          y,
          scale: 1,
          scaleValue: 100
        }, () => this.updateImageStyle())
      })
      .exec()
  },

  updateImageStyle() {
    const width = this.data.baseWidth * this.data.scale
    const height = this.data.baseHeight * this.data.scale
    this.setData({
      imageStyle: `width:${width}px;height:${height}px;left:${this.data.x}px;top:${this.data.y}px;`
    })
  },

  clampPosition(x, y, scale = this.data.scale) {
    const width = this.data.baseWidth * scale
    const height = this.data.baseHeight * scale
    const frame = this.data.frame
    return {
      x: clamp(x, frame.width - width, 0),
      y: clamp(y, frame.height - height, 0)
    }
  },

  onTouchStart(e) {
    const touch = e.touches && e.touches[0]
    if (!touch) return
    this.setData({
      startX: touch.clientX,
      startY: touch.clientY,
      startLeft: this.data.x,
      startTop: this.data.y
    })
  },

  onTouchMove(e) {
    const touch = e.touches && e.touches[0]
    if (!touch) return
    const next = this.clampPosition(
      this.data.startLeft + touch.clientX - this.data.startX,
      this.data.startTop + touch.clientY - this.data.startY
    )
    this.setData({
      x: next.x,
      y: next.y
    }, () => this.updateImageStyle())
  },

  onScaleChange(e) {
    const oldScale = this.data.scale
    const scale = Number(e.detail.value || 100) / 100
    const frame = this.data.frame
    const centerX = frame.width / 2
    const centerY = frame.height / 2
    const nextX = centerX - (centerX - this.data.x) * scale / oldScale
    const nextY = centerY - (centerY - this.data.y) * scale / oldScale
    const next = this.clampPosition(nextX, nextY, scale)
    this.setData({
      scale,
      scaleValue: e.detail.value,
      x: next.x,
      y: next.y
    }, () => this.updateImageStyle())
  },

  saveCrop() {
    if (!this.data.imageInfo || !this.data.frame.width) return
    const realScale = this.data.baseScale * this.data.scale
    const sx = Math.max(0, -this.data.x / realScale)
    const sy = Math.max(0, -this.data.y / realScale)
    const sw = this.data.frame.width / realScale
    const sh = this.data.frame.height / realScale
    const ctx = wx.createCanvasContext("cropCanvas", this)
    ctx.clearRect(0, 0, outputSize.width, outputSize.height)
    ctx.drawImage(this.data.src, sx, sy, sw, sh, 0, 0, outputSize.width, outputSize.height)
    ctx.draw(false, () => {
      wx.canvasToTempFilePath({
        canvasId: "cropCanvas",
        width: outputSize.width,
        height: outputSize.height,
        destWidth: outputSize.width,
        destHeight: outputSize.height,
        success: (res) => {
          const player = wx.getStorageSync(PLAYER_PROFILE_KEY) || {}
          wx.setStorageSync(PLAYER_PROFILE_KEY, {
            ...player,
            cover: res.tempFilePath || player.cover || "/assets/avatar-yinyue.jpg"
          })
          wx.removeStorageSync(PENDING_COVER_CROP_KEY)
          wx.showToast({ title: "背景已更换", icon: "none" })
          setTimeout(() => wx.navigateBack(), 300)
        },
        fail: () => {
          wx.showToast({ title: "裁剪失败，请重试", icon: "none" })
        }
      }, this)
    })
  }
})
