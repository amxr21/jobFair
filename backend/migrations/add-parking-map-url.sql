-- Adds access_passes.map_url (optional Google Maps link for a parking spot).
-- Idempotent-ish: run once against an existing jobfair database that predates
-- this column. A fresh DB built from schema.sql already has it.
--
-- MySQL/MariaDB has no "ADD COLUMN IF NOT EXISTS" across all versions, so if
-- you re-run this and the column already exists you'll get a harmless
-- "Duplicate column name" error — ignore it.

ALTER TABLE access_passes
    ADD COLUMN map_url VARCHAR(500) NULL AFTER location;
