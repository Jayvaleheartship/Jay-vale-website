CREATE TABLE IF NOT EXISTS cc0_seed_imports (
 source_url TEXT PRIMARY KEY,
 sha256 TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('imported','duplicate')),
 sample_id TEXT,
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cc0_import_status ON cc0_seed_imports(status);
