// Maps a caught error to a specific, actionable message instead of a generic
// "Something went wrong". Each case names what actually broke, what the user
// can do about it, and whether retrying in place is worth offering.
//
// Ordered most-specific first — classify() returns the first match, so a
// narrow signature must come before any broader one that would also match.
//
// Adding a case: match on something stable (an API path, a thrown message
// substring), not on wording that changes with copy edits.

const CASES = [
    {
        id: "api-unreachable",
        // axios sets this exact code for DNS failure, refused connection and
        // CORS rejection alike — from the browser they are indistinguishable.
        test: (e) => e?.code === "ERR_NETWORK" || /Network Error/i.test(e?.message || ""),
        title: "Can't reach the server",
        body: "The dashboard loaded but the backend isn't responding. This is usually a connection drop, or the API being restarted.",
        hint: "Your unsaved edits are still in this tab — don't refresh until it reconnects.",
        retry: "retry",
    },
    {
        id: "session-expired",
        test: (e) => e?.response?.status === 401 || /jwt (expired|malformed)|invalid token/i.test(e?.message || ""),
        title: "Your session expired",
        body: "You've been signed out, usually after a long idle period or a password change.",
        hint: "Sign in again to continue. Anything you saved before now is safe.",
        retry: "login",
    },
    {
        id: "forbidden",
        test: (e) => e?.response?.status === 403,
        title: "You don't have access to this",
        body: "This screen is limited to CASTO organiser accounts. A company login can't open it.",
        hint: "If you should have access, ask the event lead to check your account role.",
        retry: "home",
    },
    {
        id: "event-ops-shape",
        // The event-ops document drives booths/banners/passes. A section
        // arriving null (or as a non-array) crashes whichever tab maps over it.
        test: (e) => /Cannot read propert(y|ies) of (null|undefined)|\.map is not a function/i.test(e?.message || ""),
        title: "Event data didn't load correctly",
        body: "A section of the event operations data came back empty or in an unexpected shape, so this tab couldn't render.",
        hint: "Reloading usually fixes it. If it keeps happening, the event-ops record may need repairing.",
        retry: "reload",
    },
    {
        id: "chunk-stale",
        // Vite content-hashes chunks; after a deploy the old index references
        // filenames that no longer exist until the tab reloads.
        test: (e) => /Failed to fetch dynamically imported module|Loading chunk|dynamically imported module/i.test(e?.message || ""),
        title: "A new version was deployed",
        body: "This tab is running an older build whose files are no longer on the server.",
        hint: "Reload to pick up the new version — this only happens once per deploy.",
        retry: "reload",
    },
    {
        id: "storage-blocked",
        test: (e) => /QuotaExceeded|localStorage|SecurityError.*storage/i.test(e?.message || ""),
        title: "Browser storage is unavailable",
        body: "The dashboard caches your session and draft edits locally, and the browser refused access — typical in private windows or with site data blocked.",
        hint: "Leave private browsing, or allow site data for this domain.",
        retry: "reload",
    },
];

const FALLBACK = {
    id: "unknown",
    title: "Something went wrong",
    body: "An unexpected error stopped this screen from rendering.",
    hint: "Reload to try again. If it keeps happening, send the details below to support.",
    retry: "reload",
};

export function classify(error) {
    for (const c of CASES) {
        try {
            if (c.test(error)) return c;
        } catch {
            // A malformed error object must not break the error screen itself.
        }
    }
    return FALLBACK;
}

export { CASES, FALLBACK };
