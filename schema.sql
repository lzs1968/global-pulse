-- Global Pulse · D1 (SQLite) schema + 种子数据
-- See docs/DEPLOY.md. Safe to re-run (INSERT OR IGNORE keeps existing counts).

CREATE TABLE IF NOT EXISTS leaders (
  id      TEXT PRIMARY KEY,
  support INTEGER NOT NULL DEFAULT 0,
  oppose  INTEGER NOT NULL DEFAULT 0,
  frozen  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ledger (
  ip         TEXT NOT NULL,
  leader_id  TEXT NOT NULL,
  choice     TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, leader_id)
);

CREATE INDEX IF NOT EXISTS idx_ledger_leader ON ledger (leader_id);

-- 种子票数（与 assets/data/votes-seed.json 一致）。
-- INSERT OR IGNORE：已存在的人物不会被重置，方便重复跑迁移。
INSERT OR IGNORE INTO leaders (id, support, oppose, frozen) VALUES
  ('lee',       85034,  43416,  0),
  ('trudeau',   54731,  39470,  0),
  ('merkel',    169894, 142986, 0),
  ('lopez',     32184,  35146,  0),
  ('biden',     420240, 599760, 0),
  ('modi',      519144, 372856, 0),
  ('lula',      216394, 204606, 0),
  ('churchill', 130938, 147062, 0),
  ('macron',    441499, 448621, 0),
  ('kishida',   159488, 196512, 0),
  ('albanese',  103158, 94842,  0),
  ('putin',     171325, 273675, 0),
  ('ramaphosa', 46719,  40281,  0),
  ('xi',        0,      0,      1);
