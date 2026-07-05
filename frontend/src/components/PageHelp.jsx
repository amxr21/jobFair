import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import Modal from "./Modal";

// Per-page help: a "?" button in the page header plus a one-time auto-open the
// first time a user lands on each page in a session. Content is keyed by route
// so every page explains what it's for and links to the pages it relates to.
//
// `role` narrows a couple of entries where CASTO and companies see different
// things on the same route (e.g. the Applicants list).

const HELP = {
    "/": {
        title: "Applicants",
        icon: "👥",
        tagline: "Browse, search, and action everyone who registered.",
        body: [
            "This is the live list of everyone who registered for the Job Fair. Search by name (matches are highlighted), filter, and open any applicant to see their full profile, CV, and QR ticket.",
            "As a company you can shortlist, flag, or reject applicants — each action is confirmed in your notification bell. CASTO sees every applicant across all companies.",
        ],
        related: [
            { to: "/company-status", label: "My Status", who: "company" },
            { to: "/statistics", label: "Statistics", who: "casto" },
            { to: "/managers", label: "Companies", who: "casto" },
        ],
    },
    "/managers": {
        title: "Companies & Cooperations",
        icon: "🏢",
        tagline: "Every registered company, searchable and expandable.",
        body: [
            "Every registered company in one place. Search by name (matches highlight as you type), filter by sector or field, and expand a company to see its profile, representatives, applicants, and admin actions.",
            "Use Send Reminders to nudge companies, and open a company card for full details or to cancel/delete a record.",
        ],
        related: [
            { to: "/", label: "Applicants" },
            { to: "/statistics", label: "Statistics" },
            { to: "/event-admin", label: "Event Admin" },
        ],
    },
    "/statistics": {
        title: "Statistics",
        icon: "📊",
        tagline: "Aggregate insight across applicants and companies.",
        body: [
            "Aggregate insight across all applicants and companies — demographics, majors, GPA spread, attendance, and more. Use the filters to slice the data.",
        ],
        related: [
            { to: "/", label: "Applicants" },
            { to: "/surveyResults", label: "Survey Results" },
        ],
    },
    "/company-status": {
        title: "My Status",
        icon: "✅",
        tagline: "Your booth, passes, schedule, and check-in.",
        body: [
            "Your company's home for the event. The Overview tab shows your profile and applicant count; the Event Day tab shows your booth QR, banners, parking slot, entry passes, the event schedule, and lets you raise special requirements.",
            "When you arrive, check in by scanning your booth QR or tapping “I've arrived” on the Event Day tab.",
        ],
        related: [
            { to: "/", label: "Applicants" },
            { to: "/company-settings", label: "Settings" },
        ],
    },
    "/company-settings": {
        title: "Company Settings",
        icon: "⚙️",
        tagline: "Profile, login access, and display preferences.",
        body: [
            "Edit your company profile, manage login access, confirm your attendance status, and adjust display preferences (font and size).",
        ],
        related: [
            { to: "/company-status", label: "My Status" },
        ],
    },
    "/event-settings": {
        title: "Event Settings (Operations)",
        icon: "🗂️",
        tagline: "The operational hub for event day.",
        body: [
            "The operational hub for event day: booth assignments and floor map, banners, special requirements, equipment & logistics, delegate lists, attendance & check-in, the schedule, and access passes.",
            "Every change is stamped with who made it and shows up in the Activity Log. Companies see the relevant pieces live on their own Status page.",
        ],
        related: [
            { to: "/event-admin", label: "Event Admin" },
            { to: "/view-as", label: "View As (preview)" },
        ],
    },
    "/event-admin": {
        title: "Event Admin",
        icon: "🛠️",
        tagline: "Report, team & roles, imports, and previews.",
        body: [
            "Higher-level event administration: the post-event report, team & roles (who owns which module), importing companies, the activity log, and the View As preview tool.",
            "Reassigning a module owner is gated behind a two-step verification and notifies the team of exactly what changed.",
        ],
        related: [
            { to: "/event-settings", label: "Event Settings" },
            { to: "/view-as", label: "View As (preview)" },
        ],
    },
    "/view-as": {
        title: "View As (Preview)",
        icon: "👁️",
        tagline: "See what companies, staff, and students see.",
        body: [
            "Preview exactly what a company, an attendance staffer, or the public student check-in sees — read-only, without touching your real session or any data.",
        ],
        related: [
            { to: "/event-admin", label: "Event Admin" },
        ],
    },
    "/surveyResults": {
        title: "Survey Results",
        icon: "📝",
        tagline: "Post-event company survey responses.",
        body: [
            "Responses to the post-event company survey, aggregated for review.",
        ],
        related: [
            { to: "/statistics", label: "Statistics" },
        ],
    },
    "/dev": {
        title: "Developer — Email Activity",
        icon: "🔧",
        tagline: "Confirm nothing is emailing real people.",
        body: [
            "Shows whether outbound email is on or off (controlled by EMAIL_ENABLED in the backend), the From address, and a log of recent send attempts — sent vs skipped.",
            "Use this to verify that testing (registering students, sending reminders) isn't emailing anyone while email is off.",
        ],
        related: [
            { to: "/event-admin", label: "Event Admin" },
        ],
    },
};

const seenKey = (path) => `pagehelp_seen_v1:${path}`;

const PageHelp = ({ user }) => {
    const location = useLocation();
    const path = location.pathname;
    const entry = HELP[path];
    const [open, setOpen] = useState(false);

    const isCASTO = user?.companyName === "CASTO Office" || user?.email === "casto@sharjah.ac.ae";

    // Auto-open once per page per session (sessionStorage, so it resets on a
    // fresh session but never nags on repeat visits within one).
    useEffect(() => {
        if (!entry || !user) return;
        let seen = false;
        try { seen = sessionStorage.getItem(seenKey(path)) === "1"; } catch { /* ignore */ }
        if (!seen) {
            const t = setTimeout(() => {
                setOpen(true);
                try { sessionStorage.setItem(seenKey(path), "1"); } catch { /* ignore */ }
            }, 600);
            return () => clearTimeout(t);
        }
    }, [path, entry, user]);

    if (!entry || !user) return null;

    // Related links filtered by audience (some are CASTO- or company-only)
    const related = (entry.related || []).filter((r) =>
        !r.who || (r.who === "casto" ? isCASTO : !isCASTO)
    );

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                title="What is this page?"
                aria-label="Page help"
                className="flex items-center justify-center w-6 h-6 rounded-full border border-gray-300 text-gray-400 hover:border-green-400 hover:text-green-600 transition-colors text-xs font-bold shrink-0"
            >
                ?
            </button>

            <Modal visible={open} onClose={() => setOpen(false)} maxWidth="max-w-md">
                <div className="bg-[#0E7F41] text-white px-5 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-xl shrink-0" aria-hidden>{entry.icon || "ℹ️"}</span>
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">About this page</p>
                            <h2 className="text-lg font-bold truncate">{entry.title}</h2>
                        </div>
                    </div>
                    <button onClick={() => setOpen(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors shrink-0" aria-label="Close">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-5 flex flex-col gap-3">
                    {entry.tagline && (
                        <p className="text-sm font-semibold text-gray-800">{entry.tagline}</p>
                    )}
                    {entry.body.map((p, i) => (
                        <div key={i} className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-green-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                            <p className="text-sm text-gray-600 leading-relaxed">{p}</p>
                        </div>
                    ))}
                    {related.length > 0 && (
                        <div className="pt-1">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Related pages</p>
                            <div className="flex flex-wrap gap-2">
                                {related.map((r) => (
                                    <Link
                                        key={r.to}
                                        to={r.to}
                                        onClick={() => setOpen(false)}
                                        className="text-xs font-medium border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:border-green-400 hover:text-green-700 transition-colors"
                                    >
                                        {r.label} →
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end pt-1">
                        <button onClick={() => setOpen(false)} className="text-xs font-semibold text-white rounded-lg px-4 py-2" style={{ background: "#0E7F41" }}>
                            Got it
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default PageHelp;
