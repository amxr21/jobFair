-- ============================================================================
-- Drops every table in schema.sql, so schema.sql can be re-applied cleanly.
--
-- Exists because schema.sql uses bare CREATE TABLE (no IF NOT EXISTS), so it
-- aborts on the first table that already exists and leaves the rest of the
-- schema uncreated. A database left in that half-built state then fails the
-- seed with errors like "Unknown column 'updated_by'", because the tables that
-- did get created came from an older schema version.
--
-- Usage (from backend/, inside the app container):
--   node migrations/run-sql.js migrations/drop-all.sql --yes
--   node migrations/run-sql.js migrations/schema.sql   --yes
--   node migrations/run-sql.js migrations/demo-data.sql --yes
--
-- DESTRUCTIVE: every row in every listed table is lost. Intended for demo and
-- staging databases that hold only generated data.
--
-- FK checks are disabled for the duration so drop order does not matter; they
-- are restored at the end.
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS event_ops_audit_log;
DROP TABLE IF EXISTS casto_team_members;
DROP TABLE IF EXISTS event_schedule;
DROP TABLE IF EXISTS student_attendance_view;
DROP TABLE IF EXISTS company_attendance;
DROP TABLE IF EXISTS company_delegates;
DROP TABLE IF EXISTS equipment_requests;
DROP TABLE IF EXISTS special_requirements;
DROP TABLE IF EXISTS banners;
DROP TABLE IF EXISTS booths;
DROP TABLE IF EXISTS access_passes;
DROP TABLE IF EXISTS checkin_log;
DROP TABLE IF EXISTS attendance_staff;
DROP TABLE IF EXISTS company_survey_responses;
DROP TABLE IF EXISTS applicant_company_relations;
DROP TABLE IF EXISTS applicants;
DROP TABLE IF EXISTS company_login_emails;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS settings;

SET FOREIGN_KEY_CHECKS = 1;
