-- Instrument-family hierarchy, queryable folder identity and cron-import diagnostics.
-- Existing R2 keys remain valid; new uploads use versioned six-level prefixes.
ALTER TABLE samples ADD COLUMN sample_type TEXT NOT NULL DEFAULT 'one_shot';
ALTER TABLE samples ADD COLUMN collection_id TEXT NOT NULL DEFAULT 'legacy';
CREATE INDEX IF NOT EXISTS idx_samples_folder ON samples(family,instrument,sample_type,collection_id);
CREATE TABLE IF NOT EXISTS import_health (
  id INTEGER PRIMARY KEY CHECK (id=1),
  last_attempt_at TEXT,
  last_finished_at TEXT,
  attempted INTEGER NOT NULL DEFAULT 0,
  imported INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  last_error_code TEXT,
  last_success_at TEXT
);
INSERT OR IGNORE INTO import_health(id) VALUES(1);
