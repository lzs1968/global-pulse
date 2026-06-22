# Deployment guide · Global Pulse

Deploy with **Cloudflare Pages** (static hosting) + **Pages Functions** (vote API) + **D1** (SQLite). Free tier is sufficient for personal projects.

The frontend calls `/api/vote` — the same contract as the local PowerShell server — so no frontend changes are needed.

## Prerequisites

1. A free [Cloudflare](https://dash.cloudflare.com/sign-up) account
2. Node.js 18+
3. From the project root:

```bash
npm install
npx wrangler login
```

## Create and seed the database

```bash
# 1. Create D1 — copy the database_id from the output
npm run db:create

# 2. Paste database_id into wrangler.toml

# 3. Apply schema + seed vote counts (remote)
npm run db:init:remote
```

For local Wrangler dev:

```bash
npm run db:init:local
npm run dev
# http://localhost:8788
```

## Deploy

```bash
npm run deploy
```

On first deploy, confirm the Pages project name (default: `global-pulse`). You will get a URL like `https://global-pulse.pages.dev`.

### Bind D1 in the dashboard (one-time)

Workers & Pages → your project → **Settings** → **Functions** → **D1 database bindings**:

- Variable name: `DB`
- Database: `global-pulse-votes`

Redeploy after binding.

## Custom domain (optional)

Pages → Custom domains → add your domain and follow DNS instructions. HTTPS is automatic.

## Operations

```bash
# Live vote counts
npx wrangler d1 execute global-pulse-votes --remote \
  --command "SELECT id, support, oppose, frozen FROM leaders ORDER BY support DESC;"

# Freeze a leader (e.g. under attack)
npx wrangler d1 execute global-pulse-votes --remote \
  --command "UPDATE leaders SET frozen = 1 WHERE id = 'example-id';"

# Add a leader row
npx wrangler d1 execute global-pulse-votes --remote \
  --command "INSERT OR IGNORE INTO leaders (id, support, oppose, frozen) VALUES ('newid', 0, 0, 0);"
```

When adding leaders, also update profiles in `assets/js/map-data.js`.

## Security notes

- Enable rate limiting on `/api/vote` in the Cloudflare dashboard if needed.
- Votes dedupe by visitor IP (`CF-Connecting-IP`); no identity fields are stored.
- Review privacy and content policies for your target regions before going live.

See also [DESIGN.zh-CN.md](./DESIGN.zh-CN.md) for the full product / compliance design (Chinese).
