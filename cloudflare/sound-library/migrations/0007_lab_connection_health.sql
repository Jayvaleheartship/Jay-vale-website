CREATE TABLE IF NOT EXISTS lab_connection_health (
 id INTEGER PRIMARY KEY CHECK(id=1),
 checked_at TEXT,
 session_verified INTEGER NOT NULL DEFAULT 0,
 d1_sample_verified INTEGER NOT NULL DEFAULT 0,
 r2_sample_verified INTEGER NOT NULL DEFAULT 0,
 status TEXT NOT NULL DEFAULT 'not_checked'
);
INSERT OR IGNORE INTO lab_connection_health(id) VALUES(1);
