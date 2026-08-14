# 配置与部署

## 服务端环境变量

复制 `server/.env.example` 为 `server/.env`，再填写本地值。`.env` 不会进入 Git。

| 变量 | 用途 |
|---|---|
| `PORT` | HTTP 服务端口 |
| `PAY_BASE_URL` | 对外访问地址，用于回调和支付页面 |
| `BOOTSTRAP_ADMIN_USERNAME` | 首次启动时创建的管理员账号 |
| `BOOTSTRAP_ADMIN_PASSWORD` | 首次启动管理员密码 |
| `BOOTSTRAP_STAFF_USERNAME` | 首次启动时创建的客服账号 |
| `BOOTSTRAP_STAFF_PASSWORD` | 首次启动客服密码 |
| `GLOBAL_PLAYER_WORKBENCH_SECRET` | 可选的服务人员工作台通用口令 |
| `WECHAT_MINI_APPID` | 微信小程序 AppID |
| `WECHAT_MINI_SECRET` | 微信小程序密钥 |
| `WECHAT_MESSAGE_TOKEN` | 微信消息回调校验令牌 |
| `WECHAT_SERVICE_APPID` | 微信服务号 AppID |
| `WECHAT_SERVICE_SECRET` | 微信服务号密钥 |
| `WECHAT_PAY_MCH_ID` | 微信支付商户号 |
| `WECHAT_PAY_API_V3_KEY` | 微信支付 API v3 密钥 |
| `WECHAT_PAY_CERT_SERIAL_NO` | 商户证书序列号 |
| `WECHAT_PAY_PRIVATE_KEY_PATH` | 商户私钥文件路径 |
| `WECHAT_PAY_NOTIFY_URL` | 微信支付回调地址 |
| `WECHAT_VIRTUAL_PAY_OFFER_ID` | 微信虚拟支付 OfferId |
| `WECHAT_VIRTUAL_PAY_APP_KEY` | 微信虚拟支付 AppKey |

## 微信小程序

公开仓库使用 `touristappid`。正式项目应通过微信开发者工具的私有项目配置填写 AppID，并将代码中的 `https://api.example.com` 替换为自己的 HTTPS API 地址。

## 生产数据

`server/data/store.json` 会在首次启动时生成，包含账号、订单、客户、聊天和财务数据。部署升级时应单独备份该文件，不要覆盖或提交到仓库。

`server/public/uploads/` 用于运行时上传文件，公开仓库只保留空目录占位文件。
