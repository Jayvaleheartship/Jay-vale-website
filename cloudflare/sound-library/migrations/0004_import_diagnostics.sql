-- Temporary sanitized source-import diagnostic to identify why scheduled R2 ingestion fails.
ALTER TABLE import_health ADD COLUMN last_error_detail TEXT;
