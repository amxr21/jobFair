-- Adds equipment_requests.requested_by: the company name when a company raised
-- the row from their own portal and it's awaiting CASTO approval (NULL means
-- CASTO created it directly). Lets companies request equipment/logistics
-- without a new enum value — an awaiting-approval row is simply
-- requested_by != NULL with status = 'Pending' and qty_fulfilled = 0.
--
-- Idempotent-ish: run once against an existing jobfair database that predates
-- this column. A fresh DB built from schema.sql already has it.
--
-- MySQL/MariaDB has no "ADD COLUMN IF NOT EXISTS" across all versions, so if
-- you re-run this and the column already exists you'll get a harmless
-- "Duplicate column name" error — ignore it.

ALTER TABLE equipment_requests
    ADD COLUMN requested_by VARCHAR(255) NULL AFTER status;
