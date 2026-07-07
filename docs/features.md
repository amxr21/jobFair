# JobFair Dashboard — Feature Overview

Two roles use this app: the **CASTO office** (event organizers, one shared
login) and **companies** (job fair participants, one login per company —
now with support for multiple approved emails per company, see below).

## Authentication & accounts

- **Login / signup** — email + password. Signup collects company name,
  representatives, industry fields, sector, city, number of open positions,
  preferred majors, opportunity types, and ideal candidate qualities.
- **Multiple login emails per company** — a company can approve additional
  emails to log in with the *same* shared password (so more than one person
  at a company can use the dashboard without sharing one login). Managed
  from the company's own Account Settings (see below). Mirrors how the
  CASTO office already runs one shared login across several staff members.
- **Similar-company-name detection** — signup flags likely duplicate
  company names and offers to update the existing record instead of
  creating a new one.
- **Reinitialize company** — a full re-signup path for an existing company
  (resets status to Pending, clears prior survey answers).

## Applicants (CASTO-facing)

- Paginated, searchable, filterable list of every applicant (name, uni ID,
  nationality, CGPA, major, CV, status, and more).
- Advanced filters: major, nationality, CGPA range, attendance, CV presence,
  shortlist/rejection status, languages, skills, expected graduation, etc.
- Flag / shortlist / reject applicants (per-company, private flags vs.
  visible-to-all shortlist/reject status).
- Expandable applicant profile: full details, QR code, CV download.
- Register & confirm attendance via QR scanner (camera-based).
- Bulk "Load all" view alongside standard 50-per-page pagination.

## Companies (CASTO-facing — Managers page)

- List of every registered company with status (Pending / Confirmed /
  Canceled), sector, city, applicants count.
- Filter by attendance status, sector, city, industry fields, whether they
  have applicants, reminder-email status.
- Send confirmation reminder emails (bulk-select companies, tracks
  last-reminded timestamp).
- Change a company's status directly; delete a company.
- **Bulk import companies from Excel** (Event Settings): upload a
  spreadsheet, preview parsed rows with validation, resolve duplicate
  conflicts (update existing vs. keep existing), submit — creates/updates
  companies in one batch with per-row success/failure reporting and a
  downloadable template.

## Survey & Survey Results

- Companies fill out a post-event survey (multiple-choice, numeric, and
  open-ended questions) from their own status page.
- CASTO views aggregated results: response rates, per-question breakdowns,
  sentiment-at-a-glance, per-company detail view, and an "awaiting
  response" list of companies who haven't submitted yet.
- Survey visibility (public/hidden) is toggleable by CASTO.

## Company self-service (CompanyStatus page)

- **Live status view**: attendance confirmation status, applicant count,
  open positions, representatives, industry fields, opportunity types,
  preferred majors, ideal candidate qualities.
- **Confirm attendance** via the emailed confirmation link.
- **Event Day section** — mirrors what CASTO manages for that company in
  real time: assigned booth + QR code, banner/branding status and print
  deadline, logistics/equipment fulfillment, special requirements (with
  internal notes visible), and access passes (including parking
  slot/location for parking passes).
- **Account Settings** (new): edit login email (becomes the new login
  going forward), phone number, city, sector, number of positions,
  industry fields, and ideal candidate qualities — without needing to
  go through the full signup/reinitialize flow.
- **Manage Login Access** (new): add or remove additional emails approved
  to log into the company account with the shared password.
- **Customize** (new): per-account font family and text size preference,
  applied across the whole dashboard.

## Event Settings (CASTO-only)

A tabbed operations console covering everything CASTO manages for the
event:

- **Venue & Booths** — assign companies to booths, track status
  (Available/Reserved/Assigned); interactive floor map (opens in a modal)
  showing every booth, click-to-assign.
- **Banners & Branding** — track each company's banner/signage order
  (item type, width × height, quantity, print deadline, artwork, contact),
  progress stepper (Not Submitted → Submitted → Approved → Printed →
  Placed).
- **Special Requirements** — track accessibility/AV/custom-setup requests
  per company, priority levels, Open → In Progress → Fulfilled status.
- **Equipment & Logistics** — track equipment requests (tables, chairs,
  power, screens) per booth, requested vs. fulfilled quantities.
- **Delegate List** — manage the event-day delegate roster per company
  (name, role, contact) and print physical name badges (opens a real
  printable badge layout and triggers the browser print dialog).
- **Attendance & Check-in** — company check-in (QR scan or manual),
  student check-in, and a "Booth QR Codes" view with per-booth downloadable
  QR codes; a copyable link to the staff/volunteer check-in terminal.
- **Manage Staff** — create code-gated accounts for volunteers/helpers who
  check students in at the door without a full CASTO/company login; each
  account's check-in activity is logged separately.
- **Schedule** — event-day session/slot schedule (time, title, host,
  location, capacity, registrations).
- **Access Passes** — issue and track entry/parking passes per delegate,
  including parking slot and location.
- **Post-Event Report** — summary statistics plus CSV export of companies
  and students data for office records.
- **Customize** — same per-account font/size preference as companies get.
- **View As** — preview exactly what any company sees on their own status
  page, read-only, without touching your own session.
- **Team & Roles** — CASTO staff each have their own "focus" (which
  modules they own), a colored dot marks their assigned tabs, and a
  password + confirmation-code flow gates reassigning responsibilities.
- **Activity Log** — a running audit trail of who changed what, when,
  across every Event Settings module.
- **Collapsible top bar** — the clock/avatar bar is hidden by default on
  this page and reveals on hover via a small handle, without pushing the
  page content down.

## Statistics

- CASTO-only dashboard of aggregate applicant/company/attendance numbers
  and charts.

## Notifications

- Toast notifications (success/error/info/warning) available app-wide to
  both CASTO and company users — centered at the top of the screen.

## Public / unauthenticated pages

- **Confirm Attendance** (`/confirm-attendance/:token`) — the link a
  company clicks from their reminder email to confirm participation.
- **Student Check-in** (`/student-checkin`) — the code-gated terminal
  volunteers/staff use to scan or manually check students in; no CASTO or
  company account required.
