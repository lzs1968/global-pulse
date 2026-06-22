/**
 * Cloudflare Pages Function — /api/vote
 * 复刻本地 vote-server.ps1 的接口契约，改用 D1（SQLite）持久化。
 * 前端 assets/js/vote-api.js 无需任何改动。
 *
 * 绑定：env.DB  -> D1 数据库（在 wrangler.toml / Pages 设置里配置）
 * 去重：按 Cloudflare 提供的真实客户端 IP（CF-Connecting-IP）每位领导人限一票，可改投。
 */

const VALID_CHOICES = ["support", "oppose"];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function clientIp(request) {
  // Cloudflare 注入真实访客 IP；本地 wrangler dev 时回退到占位值。
  const ip =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "0.0.0.0";
  return ip.split(",")[0].trim();
}

async function getLeader(db, leaderId) {
  return db
    .prepare("SELECT id, support, oppose, frozen FROM leaders WHERE id = ?")
    .bind(leaderId)
    .first();
}

function tally(leader) {
  const support = Number(leader.support) || 0;
  const oppose = Number(leader.oppose) || 0;
  const total = support + oppose;
  const rate = total > 0 ? Math.round((1000 * support) / total) / 10 : null;
  return { support, oppose, total, rate, frozen: !!leader.frozen };
}

export async function onRequestGet({ request, env }) {
  const db = env.DB;
  if (!db) return json({ ok: false, error: "DB not bound" }, 500);

  const url = new URL(request.url);
  const leaderId = url.searchParams.get("leaderId");
  if (!leaderId) return json({ ok: false, error: "missing leaderId" }, 400);

  const leader = await getLeader(db, leaderId);
  if (!leader) return json({ ok: false, error: "unknown leader" }, 404);

  const ip = clientIp(request);
  const row = await db
    .prepare("SELECT choice FROM ledger WHERE ip = ? AND leader_id = ?")
    .bind(ip, leaderId)
    .first();

  const t = tally(leader);
  return json({
    ok: true,
    choice: row ? row.choice : null,
    leaderId,
    rate: t.rate,
    support: t.support,
    oppose: t.oppose,
    total: t.total,
    frozen: t.frozen,
  });
}

export async function onRequestPost({ request, env }) {
  const db = env.DB;
  if (!db) return json({ ok: false, error: "DB not bound" }, 500);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "invalid json" }, 400);
  }

  const leaderId = String(payload.leaderId || "");
  const choice = String(payload.choice || "");
  if (!leaderId || !VALID_CHOICES.includes(choice)) {
    return json({ ok: false, error: "invalid vote payload" }, 400);
  }

  const leader = await getLeader(db, leaderId);
  if (!leader) return json({ ok: false, error: "unknown leader" }, 404);
  if (leader.frozen) return json({ ok: false, error: "voting frozen" }, 403);

  const ip = clientIp(request);
  const prevRow = await db
    .prepare("SELECT choice FROM ledger WHERE ip = ? AND leader_id = ?")
    .bind(ip, leaderId)
    .first();
  const prev = prevRow ? prevRow.choice : null;

  let changed = false;
  let isNew = false;

  if (prev === choice) {
    changed = false;
  } else if (prev) {
    // 改投：旧选择 -1，新选择 +1
    const decCol = prev === "support" ? "support" : "oppose";
    const incCol = choice === "support" ? "support" : "oppose";
    await db.batch([
      db.prepare(`UPDATE leaders SET ${decCol} = ${decCol} - 1 WHERE id = ?`).bind(leaderId),
      db.prepare(`UPDATE leaders SET ${incCol} = ${incCol} + 1 WHERE id = ?`).bind(leaderId),
      db
        .prepare("UPDATE ledger SET choice = ?, updated_at = ? WHERE ip = ? AND leader_id = ?")
        .bind(choice, Date.now(), ip, leaderId),
    ]);
    changed = true;
  } else {
    // 新票
    const incCol = choice === "support" ? "support" : "oppose";
    await db.batch([
      db.prepare(`UPDATE leaders SET ${incCol} = ${incCol} + 1 WHERE id = ?`).bind(leaderId),
      db
        .prepare(
          "INSERT INTO ledger (ip, leader_id, choice, updated_at) VALUES (?, ?, ?, ?)"
        )
        .bind(ip, leaderId, choice, Date.now()),
    ]);
    changed = true;
    isNew = true;
  }

  const fresh = await getLeader(db, leaderId);
  const t = tally(fresh);
  return json({
    ok: true,
    choice,
    previous: prev,
    changed,
    isNew,
    leaderId,
    rate: t.rate,
    support: t.support,
    oppose: t.oppose,
    total: t.total,
  });
}
