-- JobFair MySQL schema
-- Generated as part of the MongoDB -> MySQL migration.
-- Mongo ObjectIds are preserved as-is (24-char hex strings) as primary keys,
-- so existing references in application code/logs stay meaningful.

CREATE DATABASE IF NOT EXISTS jobfair CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jobfair;

-- ─── Companies (formerly the "User" Mongoose model) ────────────────────────
CREATE TABLE companies (
    id                          VARCHAR(24) PRIMARY KEY,
    company_name                VARCHAR(255) NOT NULL,
    email                       VARCHAR(255) NOT NULL UNIQUE,
    password                    VARCHAR(255) NOT NULL,
    phone                       VARCHAR(50) NULL,
    representatives             VARCHAR(255),
    -- Source data stores this as a free-text string, not an array, despite
    -- the old Mongoose schema declaring [String]. JSON accepts either shape.
    fields                      JSON,
    -- Confirmed against real data: exactly these 4 values, no others.
    sector                      ENUM('Private', 'Semi', 'Local', 'Federal') NULL,
    city                        VARCHAR(100),
    no_of_positions             VARCHAR(50),
    preferred_majors            JSON,
    opportunity_types           JSON,
    preferred_qualities         TEXT,
    status                      ENUM('Pending', 'Confirmed', 'Canceled') NOT NULL DEFAULT 'Pending',
    confirmation_token          VARCHAR(255) NULL,
    confirmation_token_expiry   DATETIME NULL,
    reminder_sent_at            DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Additional login emails for a company (shared password, mirrors how ──
-- the CASTO office runs one login across several staff members) ───────────
CREATE TABLE company_login_emails (
    id                          INT AUTO_INCREMENT PRIMARY KEY,
    company_id                  VARCHAR(24) NOT NULL,
    email                       VARCHAR(255) NOT NULL UNIQUE,
    added_by                    VARCHAR(255) NULL,
    created_at                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Applicants (formerly "applicants_details.file") ───────────────────────
CREATE TABLE applicants (
    id                    VARCHAR(24) PRIMARY KEY,

    -- applicantDetails.* — nullable as a group: ~37% of source records have
    -- no applicantDetails object at all (incomplete/abandoned submissions).
    uni_id                VARCHAR(50)  NULL,
    full_name             VARCHAR(255) NULL,
    birthdate             DATE         NULL,
    -- Confirmed against real data: only "Male"/"Female"/"" appear; "" maps
    -- to NULL on migration (see generate-seed.js).
    gender                ENUM('Male', 'Female') NULL,
    nationality           VARCHAR(100) NULL,
    -- Confirmed against real data: exactly these 4 values, no others.
    study_level           ENUM('Bachelor', 'Master', 'PhD', 'Diploma') NULL,
    college               VARCHAR(255) NULL,
    major                 VARCHAR(255) NULL,
    email                 VARCHAR(255) NULL,
    phone_number          VARCHAR(50)  NULL,
    -- DECIMAL(3,2): 0.00-9.99, comfortably covers both 4.0 and 5.0 GPA
    -- scales. Source data audited: "" -> NULL, one outlier ("40", almost
    -- certainly a dropped decimal point for a 4.0 scale) corrected to 4.00
    -- per data owner sign-off; all other non-empty values were already
    -- valid decimals in range. See generate-seed.js for the conversion.
    cgpa                  DECIMAL(3,2) NULL,
    city                  VARCHAR(100) NULL,
    linked_in             VARCHAR(500) NULL,
    technical_skills      TEXT         NULL,
    non_technical_skills  TEXT         NULL,
    experience            TEXT         NULL,
    languages             VARCHAR(255) NULL,
    -- Source data audited: every non-empty value parses as a valid date;
    -- "" -> NULL.
    expected_to_graduate  DATE         NULL,

    -- Preferences step (apps/form/frontend Preferences.jsx) — added to the
    -- form UI 2026-01-04 but not wired into the submission payload until
    -- this migration (see Form.jsx keyMap); NULL/empty for every applicant
    -- who submitted before that fix, populated going forward. All optional.
    field_interest        JSON NULL,
    opportunity_type      JSON NULL,
    preferred_work_city   VARCHAR(100) NULL,
    career_goals          TEXT NULL,
    availability          VARCHAR(50)  NULL,

    -- CV file pointer. Two DIFFERENT shapes exist across this app's history:
    --   - Historical records (data/Applicants.json export): GridFS metadata
    --     {fieldname, filename, bucketName, chunkSize, uploadDate, contentType, ...}.
    --     The actual PDF bytes for these live in MongoDB GridFS and are NOT
    --     part of this migration — see MIGRATION_NOTES.md. Left NULL here.
    --   - Current code (backend/config/cloudinary.js + applicantsControllers.js
    --     addApplicant/addApplicantPublic): {url, public_id, originalname}
    --     pointing at Cloudinary, where the actual file lives. New
    --     submissions after this migration will populate this shape.
    -- Kept as one JSON column rather than two, since only one shape is ever
    -- populated per record and the app already treats "cv" as an opaque blob.
    cv_metadata           JSON NULL,

    attended              BOOLEAN NOT NULL DEFAULT FALSE,

    created_at            DATETIME NULL,
    updated_at            DATETIME NULL,

    INDEX idx_applicants_email (email),
    INDEX idx_applicants_uni_id (uni_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Applicant <-> Company relations ────────────────────────────────────────
-- Normalizes what used to be 4 parallel JSON arrays of company-name strings
-- on the applicant document (user_id, flags, rejectedBy, shortlistedBy) into
-- a proper many-to-many join table with real foreign keys.
--
-- A single (applicant, company) pair can legitimately hold more than one
-- relation_type at once (e.g. shortlisted, then later rejected, by the same
-- company) — confirmed against source data (19 such pairs exist) — so the
-- primary key includes relation_type rather than being just the pair.
CREATE TABLE applicant_company_relations (
    applicant_id   VARCHAR(24) NOT NULL,
    company_id     VARCHAR(24) NOT NULL,
    relation_type  ENUM('applied', 'flagged', 'rejected', 'shortlisted') NOT NULL,

    PRIMARY KEY (applicant_id, company_id, relation_type),
    FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id)   REFERENCES companies(id)  ON DELETE CASCADE,

    INDEX idx_acr_company (company_id),
    INDEX idx_acr_applicant (applicant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Company survey responses ───────────────────────────────────────────────
-- Normalizes companies.surveyResult (an array of {id, text, responses}
-- question/answer objects) into one row per question per company, instead of
-- a JSON blob. Source data has a fixed, recurring set of ~22 questions
-- (ids q1..q22), so this is genuinely tabular, not free-form.
CREATE TABLE company_survey_responses (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    company_id      VARCHAR(24) NOT NULL,
    question_id     VARCHAR(20) NOT NULL,
    question_text   TEXT NOT NULL,
    response        TEXT NULL,

    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE KEY uq_company_question (company_id, question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Attendance staff roster ────────────────────────────────────────────────
-- Formerly eventOps.attendanceStaff[] inside the settings JSON blob. A
-- staffer is a non-CASTO helper who checks students in at the door using a
-- short access code instead of a full login (see checkinByStaff). "id" was a
-- client-generated Date.now() timestamp in the source app — not guaranteed
-- unique against concurrent adds, so it's kept as a plain column here and a
-- real AUTO_INCREMENT surrogate key is used instead. "code" is the actual
-- login credential (matched case-insensitively/trimmed by the app), so it
-- gets its own UNIQUE constraint — two staffers sharing a code would be a
-- real auth bug, not just messy data.
CREATE TABLE attendance_staff (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    legacy_id      BIGINT NULL,
    name           VARCHAR(255) NOT NULL,
    email          VARCHAR(255) NOT NULL,
    phone          VARCHAR(50) NULL DEFAULT '',
    code           VARCHAR(20) NOT NULL UNIQUE,
    status         ENUM('invited', 'active') NOT NULL DEFAULT 'invited',
    updated_by     VARCHAR(255) NULL,
    updated_at     DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Check-in log ────────────────────────────────────────────────────────────
-- Formerly eventOps.checkinLog[]. uni_id/full_name are intentionally kept as
-- denormalized snapshots of the applicant at check-in time (matching the
-- source app's behavior) rather than always-live lookups, so this row's
-- historical record doesn't silently change if the applicant's profile is
-- edited afterward. applicant_id is still a real FK for queryability.
CREATE TABLE checkin_log (
    id                 BIGINT PRIMARY KEY,
    applicant_id       VARCHAR(24) NOT NULL,
    uni_id_snapshot    VARCHAR(50) NULL,
    full_name_snapshot VARCHAR(255) NULL,
    checked_in_by_staff_id INT NULL,
    checked_in_by_name VARCHAR(255) NULL,
    checked_in_at      DATETIME NOT NULL,

    FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
    FOREIGN KEY (checked_in_by_staff_id) REFERENCES attendance_staff(id) ON DELETE SET NULL,
    INDEX idx_checkin_staff (checked_in_by_staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Access passes (entry / parking) ────────────────────────────────────────
-- Formerly eventOps.passes[]. slot/location only apply when type='Parking'
-- (enforced in application code, not here, since MySQL CHECK constraints
-- referencing sibling columns conditionally add complexity without much
-- benefit for two nullable fields).
CREATE TABLE access_passes (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    legacy_id      BIGINT NULL,
    company_name   VARCHAR(255) NULL,
    delegate       VARCHAR(255) NULL,
    pass_type      ENUM('Entry', 'Parking') NOT NULL,
    code           VARCHAR(50) NOT NULL UNIQUE,
    issued_date    DATE NULL,
    status         ENUM('Active', 'Used', 'Revoked') NOT NULL DEFAULT 'Active',
    slot           VARCHAR(50) NULL,
    location       VARCHAR(255) NULL,
    updated_by     VARCHAR(255) NULL,
    updated_at     DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Booths ─────────────────────────────────────────────────────────────────
-- Formerly eventOps.booths[]. "company" is kept as free text (matching the
-- source app, which currently references a hardcoded demo company list that
-- doesn't line up with the real companies table) but company_id is a
-- nullable FK, populated when the name matches a real company, so this is
-- ready to become a real link once booths are assigned to real registrants
-- instead of demo data. Same pattern on every other eventOps table below
-- that references a company by name.
CREATE TABLE booths (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    legacy_id      BIGINT NULL,
    number         VARCHAR(20) NOT NULL,
    zone           VARCHAR(10) NULL,
    ring           VARCHAR(20) NULL,
    company_name   VARCHAR(255) NULL,
    company_id     VARCHAR(24) NULL,
    booth_type     VARCHAR(50) NULL,
    status         ENUM('Available', 'Reserved', 'Assigned') NOT NULL DEFAULT 'Available',
    updated_by     VARCHAR(255) NULL,
    updated_at     DATETIME NULL,

    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Banners / branding assets ──────────────────────────────────────────────
-- Formerly eventOps.banners[].
CREATE TABLE banners (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    legacy_id      BIGINT NULL,
    company_name   VARCHAR(255) NULL,
    company_id     VARCHAR(24) NULL,
    material       VARCHAR(100) NULL,
    size           VARCHAR(50) NULL,
    quantity       INT NULL,
    artwork        VARCHAR(255) NULL,
    contact        VARCHAR(255) NULL,
    deadline       DATE NULL,
    status         ENUM('Not Submitted', 'Submitted', 'Approved', 'Printed', 'Placed') NOT NULL DEFAULT 'Not Submitted',
    notes          TEXT NULL,
    updated_by     VARCHAR(255) NULL,
    updated_at     DATETIME NULL,

    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Special requirements ───────────────────────────────────────────────────
-- Formerly eventOps.requirements[].
CREATE TABLE special_requirements (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    legacy_id      BIGINT NULL,
    company_name   VARCHAR(255) NULL,
    company_id     VARCHAR(24) NULL,
    description    TEXT NULL,
    category       VARCHAR(100) NULL,
    priority       ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Low',
    status         ENUM('Open', 'In Progress', 'Fulfilled') NOT NULL DEFAULT 'Open',
    notes          TEXT NULL,
    updated_by     VARCHAR(255) NULL,
    updated_at     DATETIME NULL,

    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Equipment requests ─────────────────────────────────────────────────────
-- Formerly eventOps.equipment[]. "entity" in the source data is a free-text
-- "Company / Booth" label (e.g. "Emirates NBD / B01") rather than a clean
-- reference to either — kept as-is, with a nullable booth_id added since a
-- real booths table now exists and most entries do correspond to one.
CREATE TABLE equipment_requests (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    legacy_id      BIGINT NULL,
    entity_label   VARCHAR(255) NULL,
    booth_id       INT NULL,
    item           VARCHAR(255) NULL,
    qty_requested  INT NULL,
    qty_fulfilled  INT NULL,
    status         ENUM('Pending', 'Partial', 'Fulfilled') NOT NULL DEFAULT 'Pending',
    updated_by     VARCHAR(255) NULL,
    updated_at     DATETIME NULL,

    FOREIGN KEY (booth_id) REFERENCES booths(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Company delegates ───────────────────────────────────────────────────────
-- Formerly eventOps.delegates[], which nested a delegates[] array inside
-- each {company, delegates} entry — genuinely relational (one company, many
-- delegates), so this becomes a real one-to-many table instead of JSON.
CREATE TABLE company_delegates (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    company_name   VARCHAR(255) NOT NULL,
    company_id     VARCHAR(24) NULL,
    name           VARCHAR(255) NOT NULL,
    role           VARCHAR(255) NULL,
    email          VARCHAR(255) NULL,
    phone          VARCHAR(50) NULL,
    badge_status   ENUM('Pending', 'Printed') NOT NULL DEFAULT 'Pending',

    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Event-day company attendance ───────────────────────────────────────────
-- Formerly eventOps.attendanceCompanies[] — per-company/booth check-in
-- summary on event day (distinct from applicants.attended, which is a
-- student's own attendance flag, and distinct from checkin_log, which is
-- per-student check-in events).
CREATE TABLE company_attendance (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    booth_number   VARCHAR(20) NULL,
    company_name   VARCHAR(255) NULL,
    company_id     VARCHAR(24) NULL,
    delegate_count INT NULL,
    checked_in_count INT NULL,
    check_in_time  VARCHAR(20) NULL,
    method         VARCHAR(20) NULL,
    status         ENUM('Present', 'Partial', 'Absent') NOT NULL DEFAULT 'Absent',
    updated_by     VARCHAR(255) NULL,
    updated_at     DATETIME NULL,

    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Event-day student attendance (CASTO-side view) ─────────────────────────
-- Formerly eventOps.attendanceStudents[] — the CASTO team's own event-day
-- roster view, separate from applicants.attended and checkin_log. Links to
-- applicants by university ID where possible (nullable: this view is
-- currently seeded with demo IDs that won't match real applicant records).
CREATE TABLE student_attendance_view (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    uni_id         VARCHAR(50) NULL,
    applicant_id   VARCHAR(24) NULL,
    student_name   VARCHAR(255) NULL,
    check_in_time  VARCHAR(20) NULL,
    method         VARCHAR(20) NULL,
    status         ENUM('Pending', 'Checked In') NOT NULL DEFAULT 'Pending',

    FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Event schedule ──────────────────────────────────────────────────────────
-- Formerly eventOps.schedule[]. Not company-related, so no FK needed.
CREATE TABLE event_schedule (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    legacy_id      BIGINT NULL,
    start_time     VARCHAR(10) NULL,
    end_time       VARCHAR(10) NULL,
    title          VARCHAR(255) NOT NULL,
    host           VARCHAR(255) NULL,
    location       VARCHAR(255) NULL,
    capacity       INT NULL,
    registered     INT NULL,
    status         ENUM('Upcoming', 'Live', 'Ended') NOT NULL DEFAULT 'Upcoming',
    updated_by     VARCHAR(255) NULL,
    updated_at     DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── CASTO team members ──────────────────────────────────────────────────────
-- Formerly the separate DEFAULT_TEAM / TEAM_STORAGE_KEY config (CASTO staff
-- accounts and which eventOps modules each one owns) — a fixed small roster,
-- not applicant/company data, but persisted the same way (localStorage today,
-- would move to a real table for multi-device consistency).
CREATE TABLE casto_team_members (
    id               VARCHAR(50) PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,
    email            VARCHAR(255) NULL UNIQUE,
    role             VARCHAR(255) NULL,
    -- Module keys from MODULE_LABELS (venue, banners, requirements, equipment,
    -- delegates, attendance, manageStaff, schedule, passes, report).
    focus_modules    JSON NULL,
    responsibilities TEXT NULL,
    invited_by       VARCHAR(255) NULL,
    created_at       DATETIME NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Event-ops audit trail ───────────────────────────────────────────────────
-- Formerly eventOps.audit[] — a free-form activity feed spanning every
-- section above ("Rana assigned booth B11 to ADNOC"). Kept as a real table
-- (not JSON) since it's simple and append-only, but "section"/"message" stay
-- as text since the source data is human-authored prose, not structured data.
CREATE TABLE event_ops_audit_log (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    legacy_id      BIGINT NULL,
    occurred_at    DATETIME NOT NULL,
    actor_name     VARCHAR(255) NULL,
    section        VARCHAR(100) NULL,
    message        TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Settings (key/value config store) ──────────────────────────────────────
-- Still used for any ad-hoc settings that aren't part of eventOps at all,
-- e.g. 'surveyPublic'. Every eventOps sub-key now has a dedicated table above
-- and is no longer expected to be read from here once the app is migrated.
CREATE TABLE settings (
    `key`        VARCHAR(100) PRIMARY KEY,
    value        JSON NOT NULL,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by   VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
