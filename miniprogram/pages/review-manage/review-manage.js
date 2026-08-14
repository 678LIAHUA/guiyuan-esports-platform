const { loadPlayerReviews } = require("../../utils/customer-account")

Page({
  data: {
    reviews: [],
    hasReviews: false
  },

  onShow() {
    loadPlayerReviews({}, (reviews = []) => {
      this.setData({
        reviews: reviews.map((item) => ({
          ...item,
          ratingText: Number(item.rating || 5).toFixed(1),
          tagText: (item.tags || []).join("、") || "好评",
          timeText: String(item.updatedAt || item.createdAt || "").replace("T", " ").slice(0, 16)
        })),
        hasReviews: Boolean(reviews.length)
      })
    })
  }
})
