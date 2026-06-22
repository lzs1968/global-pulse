<p align="center">
  <strong>🌍 Global Pulse</strong><br/>
  <em>一眼看懂世界如何评价其领导人 —— 匿名、即时、可交互。</em>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/协议-MIT-blue.svg" alt="MIT" /></a>
  <a href="#30-秒本地体验"><img src="https://img.shields.io/badge/技术栈-原生%20JS-646cff" alt="Vanilla JS" /></a>
  <a href="#免费上线"><img src="https://img.shields.io/badge/部署-Cloudflare%20Pages-f38020" alt="Cloudflare" /></a>
  <a href="#隐私设计"><img src="https://img.shields.io/badge/投票-匿名-0f7a66" alt="Anonymous" /></a>
</p>

---

**Global Pulse** 是一个可直接部署的开源 Web 项目：在世界地图上探索领导人、查看实时支持率信号、用**支持 / 不支持**二选一匿名投票 —— **无需注册登录**。

界面是杂志级深色编辑风格；底层却是**纯 HTML + CSS + JavaScript**，无 React 构建链，仓库内**无 API Key**，并附带 **Cloudflare 免费部署**完整方案。

> **非科学民调。** 数据仅反映访问你站点的匿名点击，不代表官方民调或选举预测。

[English](./README.md) · [部署指南](./docs/DEPLOY.zh-CN.md) · [本地预览](./docs/LOCAL_DEV.md)

---

## 为什么值得一看

| 亮点 | 说明 |
| --- | --- |
| **开箱即惊艳** | 编辑风 UI、动态仪表盘、可交互世界地图 |
| **零门槛投票** | 每位领导人一票，随时可改投 |
| **10 秒跑起来** | Windows 双击 `START.bat`，无需安装 Node |
| **本地 = 线上** | 同一套 `/api/vote` 接口，本地 PowerShell / 云端 D1 |
| **无框架负担** | 代码易读易改，适合学习、二次开发、课程演示 |
| **隐私优先** | 不建账号、不出售数据、不做政治画像 |

---

## 30 秒本地体验

1. 克隆仓库  
2. 双击 **`START.bat`**  
3. 用 Chrome / Edge 打开终端里的地址  
4. 进入任意领导人页面，点 **Support** 或 **Oppose**，看仪表盘实时变化  

> 不要直接双击 `index.html`，投票功能需要本地 HTTP 服务。

页面一览：**首页** · **人物探索** · **世界地图** · **排行榜** · **历史时间线** · **方法论说明**

---

## 技术栈（简明版）

| 模块 | 技术 | 特点 |
| --- | --- | --- |
| 页面 | 静态 HTML | 无构建、加载快、SEO 友好 |
| 交互 | 原生 JavaScript | 无 React/Vue，fork 成本低 |
| 样式 | 自研 CSS 设计令牌 | 深色/浅色主题，质感接近商业产品 |
| 地图 | Leaflet（已内置） | 轻量、成熟 |
| 国界 | 仓库内 GeoJSON | 不依赖外部 CDN |
| 投票 | `/api/vote` | JSON REST，本地与云端一致 |
| 本地开发 | PowerShell | 静态站 + JSON 投票存储 |
| 生产环境 | Cloudflare Pages + D1 | 全球 CDN + SQLite，个人额度内免费 |

地图瓦片与字体在联网时从公共 CDN 加载；核心逻辑与数据均在仓库内。

---

## 免费上线

```bash
npm install
npx wrangler login
npm run db:create
# 将 database_id 写入 wrangler.toml
npm run db:init:remote
npm run deploy
```

详细步骤 → [docs/DEPLOY.zh-CN.md](./docs/DEPLOY.zh-CN.md)

---

## 二次开发速查

| 想做什么 | 改哪里 |
| --- | --- |
| 新增领导人 | `assets/js/map-data.js` + `schema.sql` |
| 调整配色 | `assets/css/tokens.css` |
| 冻结某人物投票 | D1 中 `frozen = 1` |
| 了解产品/合规设计 | [docs/DESIGN.zh-CN.md](./docs/DESIGN.zh-CN.md) |

联系表单、捐赠、商业 Data API 等均为**原型界面**，未接入真实支付或第三方服务。

---

## 隐私设计

- 仅按访客 IP 做去重，不收集姓名、邮箱、手机号。  
- 本地运行产生的 `preview-url.txt`、`.gp-data/` 已加入 `.gitignore`，不会进入仓库。  
- 上线前请根据目标地区审阅 `privacy.html` / `terms.html`。

---

## 许可证

MIT — 见 [LICENSE](./LICENSE)。欢迎 Star、Fork、PR。
