# Run Global Pulse locally

Get the full experience — voting, maps, live gauges — in under a minute.

## Fastest path (Windows)

1. **Clone** the repo.
2. **Double-click** `START.bat`.
3. **Open** the green URL in Chrome or Edge.
4. **Vote** on any leader page and watch the gauge update.

Keep the terminal window open while you browse.

## Re-open the browser

Server already running? Double-click **`OPEN.bat`** — it reads the last URL from `preview-url.txt` (auto-generated, not committed).

## Common mistakes

| Symptom | Fix |
| --- | --- |
| Vote button does nothing | You opened `index.html` directly — use the HTTP URL from `START.bat` |
| Old link broken | Restart `START.bat`; port may have changed |
| Permission error | Right-click `START.bat` → Run as administrator |
| Map looks empty | Check internet — map tiles load from CARTO/OSM |

## PowerShell (manual)

```powershell
cd path\to\global-pulse
powershell -ExecutionPolicy Bypass -File start-server.ps1
```

## Cloudflare dev mode (optional)

For testing the production vote function locally:

```bash
npm install
npm run db:init:local
npm run dev
```

Open http://localhost:8788

## Files created on your machine (never commit these)

| Path | Purpose |
| --- | --- |
| `preview-url.txt` | Last preview URL |
| `.gp-data/votes.json` | Local vote ledger |

Both are in `.gitignore`.
