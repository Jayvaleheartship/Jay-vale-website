-- Snapshot of private R2 objects against the indexed D1 records, refreshed by Worker cron.
CREATE TABLE IF NOT EXISTS storage_integrity (
  id INTEGER PRIMARY KEY CHECK(id=1),
  checked_at TEXT,
  d1_rows INTEGER NOT NULL DEFAULT 0,
  r2_objects INTEGER NOT NULL DEFAULT 0,
  matched INTEGER NOT NULL DEFAULT 0,
  missing_objects INTEGER NOT NULL DEFAULT 0,
  size_mismatches INTEGER NOT NULL DEFAULT 0,
  unindexed_objects INTEGER NOT NULL DEFAULT 0,
  complete INTEGER NOT NULL DEFAULT 0,
  error TEXT
);
INSERT OR IGNORE INTO storage_integrity(id) VALUES (1);
