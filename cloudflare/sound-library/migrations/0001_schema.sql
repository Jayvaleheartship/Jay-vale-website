CREATE TABLE IF NOT EXISTS samples (
  id TEXT PRIMARY KEY,
  sha256 TEXT NOT NULL UNIQUE,
  r2_key TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  family TEXT NOT NULL,
  instrument TEXT NOT NULL,
  bytes INTEGER NOT NULL CHECK(bytes > 0),
  duration_ms INTEGER NOT NULL CHECK(duration_ms >= 0),
  sample_rate INTEGER NOT NULL CHECK(sample_rate > 0),
  root_midi INTEGER CHECK(root_midi IS NULL OR root_midi BETWEEN 0 AND 127),
  articulation TEXT NOT NULL DEFAULT 'normal',
  velocity_layer INTEGER,
  tags_json TEXT NOT NULL DEFAULT '[]',
  features_json TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  license_spdx TEXT NOT NULL,
  license_url TEXT NOT NULL,
  attribution TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_samples_instrument_duration ON samples(family, instrument, duration_ms);
CREATE INDEX IF NOT EXISTS idx_samples_note ON samples(family, instrument, root_midi);
CREATE INDEX IF NOT EXISTS idx_samples_source ON samples(source_name);
