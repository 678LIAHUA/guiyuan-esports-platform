const legalDocs = require("../../utils/legal-docs")

Page({
  data: {
    title: "用户协议",
    paragraphs: []
  },

  onLoad(options = {}) {
    const type = options.type === "privacy" ? "privacy" : "agreement"
    const title = type === "privacy" ? "隐私政策" : "用户协议"
    const content = legalDocs[type] || ""
    this.setData({
      title,
      paragraphs: content
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
    })
  }
})
