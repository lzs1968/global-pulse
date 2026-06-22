# 免费云部署指南 · Global Pulse

本项目用 **Cloudflare Pages（静态托管）+ Pages Functions（投票后端）+ D1（SQLite 数据库）** 部署，全球 CDN、自带 WAF，个人项目额度内 **完全免费**。

前端 `assets/js/vote-api.js` 调用的是 `/api/vote`，和本地 PowerShell 服务器接口完全一致，所以**前端一行都不用改**。

[English version](./DEPLOY.md)

---

## 一、准备

1. 注册 [Cloudflare](https://dash.cloudflare.com/sign-up)（免费）。
2. 本机装 Node.js 18+。
3. 在项目根目录安装依赖：

```bash
npm install
npx wrangler login
```

---

## 二、创建数据库并写入种子数据

```bash
# 1. 创建 D1 数据库（记下输出里的 database_id）
npm run db:create

# 2. 把上一步的 database_id 填进 wrangler.toml 的 database_id 字段

# 3. 初始化表结构 + 种子票数（远程）
npm run db:init:remote
```

> 想本地调试，用 `npm run db:init:local` 写本地库，再 `npm run dev`，打开 http://localhost:8788 。

---

## 三、部署上线

```bash
npm run deploy
```

首次会让你确认/创建 Pages 项目名（默认 `global-pulse`）。完成后会给你一个
`https://global-pulse.pages.dev` 的网址，全球可访问。

**在 Pages 控制台绑定数据库（一次性）**：
Workers & Pages → 你的项目 → Settings → Functions → D1 database bindings →
变量名填 `DB`，选择 `global-pulse-votes`。绑定后重新部署一次即可。

---

## 四、绑定自己的域名（可选）

Pages → 你的项目 → Custom domains → 添加你的域名，按提示把 DNS 接入 Cloudflare 即可，自动签发 HTTPS。

---

## 五、运维常用命令

```bash
# 查看实时票数
npx wrangler d1 execute global-pulse-votes --remote \
  --command "SELECT id, support, oppose, frozen FROM leaders ORDER BY support DESC;"

# 冻结某人物（出现攻击流量时临时下架排名）
npx wrangler d1 execute global-pulse-votes --remote \
  --command "UPDATE leaders SET frozen = 1 WHERE id = 'example-id';"

# 新增一位人物
npx wrangler d1 execute global-pulse-votes --remote \
  --command "INSERT OR IGNORE INTO leaders (id, support, oppose, frozen) VALUES ('newid', 0, 0, 0);"
```

> 注意：新增人物后，前端 `assets/js/map-data.js` 里也要补上对应的人物资料（姓名、国家、简介等），否则详情页拿不到展示信息。

---

## 六、合规与防刷提醒

- Cloudflare 自带 WAF / Bot 防护，可在控制台为 `/api/vote` 开启速率限制（Rate Limiting），进一步防刷。
- 投票按真实访客 IP 去重（`CF-Connecting-IP`），不存储任何身份信息。
- 上线前请按目标市场让当地律师复核隐私、政治内容、广告合规等事项（详见 [DESIGN.zh-CN.md](./DESIGN.zh-CN.md) 第 3、10 章）。
