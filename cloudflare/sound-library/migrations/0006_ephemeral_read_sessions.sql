-- Single-use 90-second pairing challenges. Read sessions are signed and stateless.
CREATE TABLE IF NOT EXISTS used_lab_challenges (
 id TEXT PRIMARY KEY,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_lab_challenges_expiry ON used_lab_challenges(expires_at);
