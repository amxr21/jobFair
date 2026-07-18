import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Modal from "./Modal";

// Per-page help: a "?" button in the page header plus a one-time auto-open the
// first time a user lands on each page in a session. Only the STRUCTURE (icon +
// related-link routing/audience) lives here; the title/tagline/body text is
// translated — looked up by route from `help.pages.<route>` in the locale files,
// and related-link labels from `help.relatedLabels.*`.

const HELP_META = {
    "/":                 { icon: "👥", related: [{ to: "/company-status", labelKey: "myStatus", who: "company" }, { to: "/statistics", labelKey: "statistics", who: "casto" }, { to: "/managers", labelKey: "companies", who: "casto" }] },
    "/managers":         { icon: "🏢", related: [{ to: "/", labelKey: "applicants" }, { to: "/statistics", labelKey: "statistics" }, { to: "/event-admin", labelKey: "eventAdmin" }] },
    "/statistics":       { icon: "📊", related: [{ to: "/", labelKey: "applicants" }, { to: "/surveyResults", labelKey: "surveyResults" }] },
    "/company-status":   { icon: "✅", related: [{ to: "/", labelKey: "applicants" }, { to: "/company-settings", labelKey: "settings" }] },
    "/company-settings": { icon: "⚙️", related: [{ to: "/company-status", labelKey: "myStatus" }] },
    "/event-settings":   { icon: "🗂️", related: [{ to: "/event-admin", labelKey: "eventAdmin" }, { to: "/view-as", labelKey: "viewAs" }] },
    "/event-admin":      { icon: "🛠️", related: [{ to: "/event-settings", labelKey: "eventSettings" }, { to: "/view-as", labelKey: "viewAs" }] },
    "/view-as":          { icon: "👁️", related: [{ to: "/event-admin", labelKey: "eventAdmin" }] },
    "/surveyResults":    { icon: "📝", related: [{ to: "/statistics", labelKey: "statistics" }] },
    "/dev":              { icon: "🔧", related: [{ to: "/event-admin", labelKey: "eventAdmin" }] },
};

const seenKey = (path) => `pagehelp_seen_v1:${path}`;

const PageHelp = ({ user }) => {
    const { t } = useTranslation();
    const location = useLocation();
    const path = location.pathname;
    const meta = HELP_META[path];
    // Translated content for this route (returnObjects so body is an array).
    const content = meta ? t(`help.pages.${path}`, { returnObjects: true }) : null;
    const entry = meta && content && typeof content === "object"
        ? { ...meta, title: content.title, tagline: content.tagline, body: Array.isArray(content.body) ? content.body : [] }
        : null;
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
                title={t("help.whatIsThisPage")}
                aria-label={t("help.whatIsThisPage")}
                className="flex items-center justify-center w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 text-gray-400 hover:border-primary hover:text-primary transition-colors text-xs font-bold shrink-0"
            >
                ?
            </button>

            <Modal visible={open} onClose={() => setOpen(false)} maxWidth="max-w-md">
                <div className="bg-primary text-primary-contrast px-5 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-xl shrink-0" aria-hidden>{entry.icon || "ℹ️"}</span>
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">{t("help.aboutThisPage")}</p>
                            <h2 className="text-lg font-bold truncate">{entry.title}</h2>
                        </div>
                    </div>
                    <button onClick={() => setOpen(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors shrink-0" aria-label={t("common.close")}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-5 flex flex-col gap-3 bg-surface-card">
                    {entry.tagline && (
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{entry.tagline}</p>
                    )}
                    {entry.body.map((p, i) => (
                        <div key={i} className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-primary mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{p}</p>
                        </div>
                    ))}
                    {related.length > 0 && (
                        <div className="pt-1">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{t("help.relatedPages")}</p>
                            <div className="flex flex-wrap gap-2">
                                {related.map((r) => (
                                    <Link
                                        key={r.to}
                                        to={r.to}
                                        onClick={() => setOpen(false)}
                                        className="text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors"
                                    >
                                        {t(`help.relatedLabels.${r.labelKey}`)} →
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end pt-1">
                        <button onClick={() => setOpen(false)} className="text-xs font-semibold text-primary-contrast rounded-lg px-4 py-2 bg-primary hover:bg-primary-hover transition-colors">
                            {t("common.gotIt")}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default PageHelp;
