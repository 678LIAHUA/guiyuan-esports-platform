const { getCustomerBills, loadCustomerBills } = require("../../utils/customer-account")

function formatBills(list = []) {
  return list.map((item) => ({
    ...item,
    amountText: `${Number(item.amount || 0) >= 0 ? "+" : ""}${Number(item.amount || 0).toFixed(0)} 猫粮`,
    amountClass: Number(item.amount || 0) >= 0 ? "plus" : "minus",
    timeText: String(item.createdAt || "").replace("T", " ").slice(0, 16)
  }))
}

Page({
  data: {
    bills: formatBills(getCustomerBills())
  },

  onShow() {
    loadCustomerBills((bills) => {
      this.setData({ bills: formatBills(bills) })
    })
  }
})
