const { findListedOrderById, getListedOrders } = require("./order-catalog")

function getFunOrders() {
  return getListedOrders()
}

function findFunOrderById(orderId) {
  return findListedOrderById(orderId)
}

module.exports = {
  findFunOrderById,
  getFunOrders
}
