<p align="center">
  <strong>🌍 Global Pulse</strong><br/>
  <em>See how the world feels about its leaders — one anonymous click at a time.</em>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="#quick-start"><img src="https://img.shields.io/badge/stack-vanilla%20JS-646cff" alt="Vanilla JS" /></a>
  <a href="#deploy-for-free"><img src="https://img.shields.io/badge/deploy-Cloudflare%20Pages-f38020" alt="Cloudflare Pages" /></a>
  <a href="#privacy-by-design"><img src="https://img.shields.io/badge/votes-anonymous-0f7a66" alt="Anonymous votes" /></a>
</p>

---

**Global Pulse** is a polished, open-source web experience where anyone can explore public leaders on a world map, compare live approval signals, and cast a single anonymous vote — support or oppose — without signing up.

It looks like a premium news product. Under the hood it is **plain HTML, CSS, and JavaScript** — no React build step, no API keys in the repo, and a **free Cloudflare** deployment path when you are ready to go live.

> **Not a scientific poll.** Numbers reflect anonymous clicks on *your* deployment, not official ratings or election forecasts.

[中文说明](./README.zh-CN.md) · [Deploy](./docs/DEPLOY.md) · [Run locally](./docs/LOCAL_DEV.md)

---

## Why people star this repo

| Hook | What you get |
| --- | --- |
| **Instant wow** | Dark editorial UI, animated gauges, interactive world map |
| **Zero signup voting** | One vote per visitor per leader — change your mind anytime |
| **Clone & run in 10 seconds** | Double-click `START.bat` on Windows — no Node required for preview |
| **Production-ready backend** | Same `/api/vote` contract locally (PowerShell) and in the cloud (D1) |
| **Framework-free** | Easy to read, fork, and customize — no webpack rabbit hole |
| **Privacy-first design** | No accounts, no sold data, no political profiling |

---

## See it in action

```text
Home          → Editorial hero + trending leaders + live sentiment bars
Explore       → Searchable directory of current & historical figures
World Map     → Leaflet map with country shading + leader pins
Rankings      → Top approval, most opposed, trending, most divided
Leader page   → Biography, sources, binary vote, real-time gauge
Timeline      → Historical context across eras
```

**Try it locally:** run `START.bat`, open the URL in Chrome or Edge, pick a leader, click **Support** or **Oppose**, watch the gauge move.

---

## Quick start

### Local preview (Windows, no Node)

1. Clone this repository.
2. Double-click **`START.bat`** (or run `start-server.ps1`).
3. Open the URL printed in the terminal.

> Do **not** open `index.html` from the filesystem — voting needs a local HTTP server.

Troubleshooting → [docs/LOCAL_DEV.md](./docs/LOCAL_DEV.md)

### Cloudflare production (free tier)

```bash
npm install
npx wrangler login
npm run db:create          # paste database_id into wrangler.toml
npm run db:init:remote
npm run deploy
```

Full guide → [docs/DEPLOY.md](./docs/DEPLOY.md)

---

## Tech stack

Built for developers who want **clarity over complexity**:

| Layer | Choice | Why |
| --- | --- | --- |
| **Pages** | Static HTML | Fast, SEO-friendly, no build pipeline |
| **Logic** | Vanilla JavaScript | One codebase, easy to fork |
| **Style** | Custom CSS + design tokens | Premium look without a UI framework |
| **Maps** | Leaflet 1.9.4 (bundled) | Lightweight, battle-tested |
| **Borders** | Local GeoJSON in repo | No CDN dependency for country shapes |
| **Vote API** | `/api/vote` REST JSON | Same contract everywhere |
| **Local dev** | PowerShell + JSON store | Preview votes without installing Node |
| **Production** | Cloudflare Pages Functions + D1 | Global CDN, SQLite, generous free tier |

Map **tiles** and **fonts** load from public CDNs when online (CARTO/OSM, Google Fonts). Everything else runs from your repo.

---

## Project layout

```text
global-pulse/
├── *.html                  # Multi-page site (home, map, rankings, …)
├── assets/
│   ├── css/                # tokens.css + layered themes
│   ├── js/                 # vote, map, i18n, theme, pages
│   ├── data/               # leaders seed + world-countries.geo.json
│   └── vendor/leaflet/     # Map library (vendored)
├── functions/api/vote.js   # Cloudflare Pages Function
├── vote-server.ps1         # Local vote API (mirrors production)
├── schema.sql              # D1 tables + seed counts
├── START.bat               # One-click local server
└── docs/                   # Deploy, design notes, local dev
```

---

## Customize it

| Goal | Edit |
| --- | --- |
| Add a leader | `assets/js/map-data.js` + row in `schema.sql` |
| Seed vote counts | `schema.sql` or `assets/data/votes-seed.json` |
| Freeze a leader | `frozen = 1` in D1 (see deploy docs) |
| Brand / colors | `assets/css/tokens.css` |
| Go live | `wrangler.toml` → create D1 → `npm run deploy` |

No third-party API keys are required for the core demo. Payment, ads, and contact forms are **UI prototypes only**.

---

## Privacy by design

- Voting dedupes by visitor IP hash path only — no accounts, no profiles.
- Donation / Data API / contact sections are demo placeholders, not wired to real services.
- Read `privacy.html`, `terms.html`, and `methodology.html` before launching in your region.

Deep product & compliance notes (Chinese) → [docs/DESIGN.zh-CN.md](./docs/DESIGN.zh-CN.md)

---

## Contributing

Pull requests welcome — especially new leader profiles, translations, accessibility fixes, and map polish.

When adding a leader, update **`assets/js/map-data.js`** and **`schema.sql`** (or run a D1 `INSERT`).

---

## License

MIT — see [LICENSE](./LICENSE). Fork it, ship it, make it yours.
