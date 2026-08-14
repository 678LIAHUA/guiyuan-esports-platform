const LEVEL_STAGES = [
  { id: "zhuji", name: "筑基期", secretPrice: 45, topSecretPrice: 70 },
  { id: "jindan", name: "金丹期", secretPrice: 60, topSecretPrice: 100 },
  { id: "yuanying", name: "元婴期", secretPrice: 75, topSecretPrice: 130 },
  { id: "huashen", name: "化神期", secretPrice: 100, topSecretPrice: 160 }
]

const EXAM_STANDARDS = [
  {
    id: "double",
    title: "双考",
    rows: [
      { level: "筑基期", secret: "三局总计每个人杀6个，累计带考官吃1000w", topSecret: "三局总计每个人杀6个，累计带考官吃1000w" },
      { level: "金丹期", secret: "三局总人头>=20，物资>=1000w", topSecret: "三局总人头>=20，物资>=1000w" },
      { level: "元婴期", secret: "三局总人头>=25，物资>=1200w", topSecret: "三局总人头>=25，物资>=1500w" },
      { level: "化神期", secret: "三局总人头>=30，物资>=1500w", topSecret: "三局总人头>=30，物资>=1800w" }
    ]
  },
  {
    id: "single",
    title: "单考",
    rows: [
      { level: "筑基期", secret: "三局总人头>=12，物资>=600w", topSecret: "三局总人头>=12，物资>=600w" },
      { level: "金丹期", secret: "三局总人头>=16", topSecret: "三局总人头>=16，物资>=800w" },
      { level: "元婴期", secret: "三局总人头>=20", topSecret: "三局总人头>=20，物资>=1000w" },
      { level: "化神期", secret: "三局总人头>=25", topSecret: "三局总人头>=25，物资>=1200w" }
    ]
  },
  {
    id: "fun",
    title: "娱乐",
    rows: [
      { level: "女娱", secret: "绝密航天100w拉闸撤 40/h", topSecret: "绝密航天100w拉闸撤 40/h" }
    ]
  }
]

const LIMIT_RULES = [
  "第一次考免费，后续每人每次10米；周结无押金会费，抽20，进店后特殊困难群体有补贴。",
  "不可养猪，不可吃地图物资。",
  "双考人头差不能超过4个，巴克什监狱加2人头，女生减2人头。",
  "需使用自己设备，禁网吧。电竞酒店查挂自费40，店内可接单升级。",
  "本店注重服务态度，考核过程服务态度不过，其它条件达标也不予通过。"
]

function findStage(stageName) {
  return LEVEL_STAGES.find((item) => item.name === stageName) || LEVEL_STAGES[0]
}

function getPriceTiersByStage(stageName) {
  const stage = findStage(stageName)
  return [
    { id: "secret", name: "机密", price: stage.secretPrice, unit: "小时", desc: stage.name },
    { id: "top_secret", name: "绝密", price: stage.topSecretPrice, unit: "小时", desc: stage.name }
  ]
}

module.exports = {
  EXAM_STANDARDS,
  LEVEL_STAGES,
  LIMIT_RULES,
  getPriceTiersByStage
}
