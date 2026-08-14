module.exports = {
  brand: {
    name: "桂圆电竞",
    logo: "/assets/guiyuan-logo.jpg",
    tokenName: "猫粮",
    tokenIcon: "/assets/cat-food.jpg"
  },
  games: [
    { id: "delta", name: "三角洲行动", iconUrl: "/assets/game/delta.png", sort: 1, visible: true, showOnHome: true },
    { id: "honor", name: "王者荣耀", iconUrl: "/assets/game/honor.png", sort: 2, visible: true, showOnHome: true },
    { id: "peace", name: "和平精英", iconUrl: "/assets/game/peace.png", sort: 3, visible: true, showOnHome: true },
    { id: "other", name: "其他游戏", iconUrl: "/assets/game/other.png", sort: 99, visible: true, showOnHome: true, isOther: true }
  ],
  packages: [],
  players: [],
  notices: [
    { id: "welcome", title: "欢迎使用", content: "请在总后台配置正式商品、服务人员和公告。", visible: true }
  ],
  orderCategories: [
    { id: "demo", gameId: "delta", name: "演示分类", sort: 1, visible: true }
  ],
  orderItems: [
    {
      id: "demo-order",
      gameId: "delta",
      categoryId: "demo",
      title: "演示订单",
      desc: "用于验证公开版本的下单流程",
      price: 100,
      orderMode: "fixed_tier",
      priceTiers: [{ id: "demo", name: "演示规格", price: 100, desc: "请在总后台替换" }],
      visible: true,
      sort: 1
    }
  ]
};
