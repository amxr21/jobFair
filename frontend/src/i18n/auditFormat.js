import { translateEnum } from "./translateEnum";

// Shared formatting for event-ops audit entries. Used by the Activity panel
// (EventAdmin) and the notification watcher (EventOpsContext) so both render an
// audit entry identically — as an i18n key + raw params translated at display
// time, never a pre-built string. Entries written before messageKey existed
// only carry a plain (already-English) `message`, shown verbatim as a fallback.

// `status`/`material` params carry raw English enum values (e.g. "Fulfilled",
// "Revoked") drawn from whichever enum applies to that section — try each in
// turn since translateEnum() harmlessly falls back to the raw value on a miss.
const STATUS_ENUM_GROUPS = ["requestStatus", "bannerStatus", "passStatus", "attendanceState", "taskStatus"];

export const translateStatusLike = (value) => {
    if (typeof value !== "string") return value;
    for (const group of STATUS_ENUM_GROUPS) {
        const translated = translateEnum(group, value);
        if (translated !== value) return translated;
    }
    return value;
};

// `t` is a react-i18next translate function. `a` is an audit entry:
// { messageKey, messageParams } (new) or { message } (legacy fallback).
export const translateAuditEntry = (t, a) => {
    if (!a.messageKey) return a.message || "";
    const params = { ...(a.messageParams || {}) };
    if ("status" in params) params.status = translateStatusLike(params.status);
    return t(`activityLog.${a.messageKey}`, params);
};

// Audit `section` values don't line up 1:1 with the eventOps.tabs.* module
// names (e.g. "booths" vs "venue", "attendanceStudents" vs "attendance") — map
// each to the closest existing module label rather than adding a duplicate
// translation namespace for the same concept.
const AUDIT_SECTION_TAB = {
    booths: "venue",
    banners: "banners",
    requirements: "requirements",
    equipment: "equipment",
    delegates: "delegates",
    attendanceStudents: "attendance",
    attendanceCompanies: "attendance",
    attendanceStaff: "manageStaff",
    supportStaff: "manageStaff",
    schedule: "schedule",
    passes: "passes",
};

export const translateAuditSection = (t, section) =>
    t(`eventOps.tabs.${AUDIT_SECTION_TAB[section] || section}`, section);

// Maps an audit section to the notification `type` that drives the bell's
// icon/tint (see NotificationBell TYPE_META). Falls back to "info".
export const AUDIT_SECTION_NOTIF_TYPE = {
    booths: "info",
    banners: "info",
    requirements: "info",
    equipment: "info",
    delegates: "info",
    attendanceStudents: "info",
    attendanceCompanies: "info",
    attendanceStaff: "reassign",
    supportStaff: "reassign",
    schedule: "info",
    passes: "info",
};
