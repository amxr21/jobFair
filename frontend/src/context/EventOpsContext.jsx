import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../config/api";

// ─── CASTO office team ─────────────────────────────────────────────────────────
// One CASTO account, several employees: each gets their own view (focus modules),
// and every change is recorded under the employee who made it.

// Human names for every module a team member can own — shown in the
// responsibilities panel and the role-reassignment picker
export const MODULE_LABELS = {
    venue: "Venue & Booths",
    banners: "Banners & Branding",
    requirements: "Special Requirements",
    equipment: "Equipment & Logistics",
    delegates: "Delegate List",
    attendance: "Attendance",
    manageStaff: "Manage Staff",
    schedule: "Schedule",
    passes: "Access Passes",
    report: "Post-Event Report",
};

const DEFAULT_TEAM = [
    { id: "rana",    name: "Rana",    role: "Event Lead",              focus: ["venue", "schedule", "report"], responsibilities: "Owns the venue floor plan and booth assignments, builds the event-day schedule, and compiles the post-event report. Final point of contact for anything not covered by another module." },
    { id: "prithba", name: "Prithba", role: "Logistics & Equipment",   focus: ["equipment", "requirements"], responsibilities: "Handles all equipment requests (tables, chairs, power, screens) and special requirements raised by companies (accessibility, AV, custom setups)." },
    { id: "aseel",   name: "Aseel",   role: "Branding & Media",        focus: ["banners"], responsibilities: "Tracks every company's banner and branding assets from submission through printing to placement on-site." },
    { id: "maha",    name: "Maha",    role: "Attendance & Check-in",   focus: ["attendance", "delegates"], responsibilities: "Runs check-in on event day (booth QR scans and student check-in) and manages the company delegate list and badge printing." },
    { id: "yousef",  name: "Yousef",  role: "Access & Passes",         focus: ["passes"], responsibilities: "Issues and manages entry and parking access passes for every company delegate, including parking slot assignments." },
];

const TEAM_STORAGE_KEY = "event_ops_team_v1";

// ─── Empty initial state ────────────────────────────────────────────────────────
// Every section starts EMPTY. Real data is loaded from the backend
// (GET /event-ops) on mount and by the periodic poll; the company dropdowns
// are populated purely from the real registered companies (GET /companies).
// There is intentionally NO demo/sample data here — an unreachable backend
// simply shows empty sections rather than fabricated companies. This shape
// mirrors exactly what loadEventOps() returns in the backend, so components
// that read data.booths / data.passes / etc. never see an undefined section.

// All sections empty. The backend (loadEventOps) is the sole source of real
// data; every key here exists only so components can safely read data.<section>
// before the first fetch resolves. Keep this shape in sync with the object
// returned by loadEventOps() in backend/controllers/applicantsControllers.js.
const SEED = {
    booths: [],
    banners: [],
    requirements: [],
    equipment: [],
    delegates: [],
    attendanceCompanies: [],
    attendanceStudents: [],
    schedule: [],
    passes: [],
    attendanceStaff: [],
    supportStaff: [],
    checkinLog: [],
    audit: [],
};

// Bumped v2 → v3 when the demo seed was removed: browsers that used the app
// before still hold the old fake companies (Emirates NBD, Etisalat, …) in
// localStorage["event_ops_v2"], and the init below reads whatever key this is.
// A new key guarantees those stale seed rows are ignored so everyone starts
// from the real (empty) backend state instead of the cached demo — this also
// fixes the "page looks out of order on first load, fine after a refresh"
// report, which was the cached seed rendering before the real fetch landed.
const STORAGE_KEY = "event_ops_v3";
const ACTING_KEY = "event_ops_acting";

// ─── Context ───────────────────────────────────────────────────────────────────

const EventOpsContext = createContext(null);

export const EventOpsProvider = ({ children }) => {
    const [data, setData] = useState(() => {
        try {
            const cached = JSON.parse(localStorage.getItem(STORAGE_KEY));
            // Layer any cached sections over the empty shape so a section the
            // cache is missing still reads as [] rather than undefined. The
            // backend refetch on mount immediately overwrites non-dirty
            // sections with the real server copy.
            if (cached && typeof cached === "object") return { ...SEED, ...cached };
        } catch { /* corrupted cache — fall back to empty */ }
        return SEED;
    });
    const [team, setTeam] = useState(() => {
        try {
            const cached = JSON.parse(localStorage.getItem(TEAM_STORAGE_KEY));
            if (Array.isArray(cached) && cached.length === DEFAULT_TEAM.length) {
                // Merge saved focus assignments onto the current default shape, so
                // adding/renaming a responsibilities blurb later doesn't get lost
                return DEFAULT_TEAM.map((m) => {
                    const saved = cached.find((c) => c.id === m.id);
                    return saved ? { ...m, focus: saved.focus } : m;
                });
            }
        } catch { /* corrupted cache — fall back to default */ }
        return DEFAULT_TEAM;
    });
    const [actingAs, setActingAsState] = useState(() => localStorage.getItem(ACTING_KEY) || DEFAULT_TEAM[0].id);
    const [realCompanies, setRealCompanies] = useState([]);
    const [companyIds, setCompanyIds] = useState({}); // companyName -> id, for View As previews
    const saveTimer = useRef(null);
    // True once this tab has confirmed what the server actually has. Any
    // array-shaped section (attendanceStaff, booths, passes, ...) is only
    // safe to read-modify-write locally after this — see the comment on
    // `update` for the bug this was closing.
    const hydratedRef = useRef(false);
    // Sections this tab has edited locally. The initial GET /event-ops can
    // resolve *after* the user's first edit — merging it blindly would
    // overwrite that edit with the server's pre-edit copy (booth assignments
    // visibly "snapping back"), so hydration skips any section listed here.
    const dirtySectionsRef = useRef(new Set());

    const authHeaders = () => {
        const u = JSON.parse(localStorage.getItem("user") || "null");
        return u?.token ? { Authorization: `Bearer ${u.token}` } : {};
    };

    // Fetches /event-ops and merges every non-dirty section into local state.
    // Shared by the initial hydration below, the periodic poll, and an
    // on-demand refetch a page can call (e.g. the company's Event Day tab, so
    // switching into it always shows what CASTO has entered instead of
    // waiting for the next poll tick or a hard reload).
    const refetchEventOps = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/event-ops`, { headers: authHeaders() });
            if (res?.data) setData((prev) => {
                const merged = { ...prev };
                for (const [key, value] of Object.entries(res.data)) {
                    if (!dirtySectionsRef.current.has(key)) merged[key] = value;
                }
                return merged;
            });
        } catch { /* backend unavailable — localStorage/seed keeps working */ }
    }, []);

    // Hydrate from backend (authoritative when present) + fetch real company names
    useEffect(() => {
        (async () => {
            await refetchEventOps();
            hydratedRef.current = true;
            try {
                const res = await axios.get(`${API_URL}/companies`);
                if (Array.isArray(res?.data)) {
                    setRealCompanies(res.data.map((c) => c.companyName).filter(Boolean));
                    const idMap = {};
                    res.data.forEach((c) => { if (c.companyName && c.id) idMap[c.companyName] = c.id; });
                    setCompanyIds(idMap);
                }
            } catch { /* ignore */ }
            // Real DB is now the source of truth for team membership — falls back
            // to whatever was already in state (localStorage cache or DEFAULT_TEAM)
            // if the backend is unreachable, same resilience as the event-ops fetch above.
            try {
                const res = await axios.get(`${API_URL}/casto-team`, { headers: authHeaders() });
                if (Array.isArray(res?.data) && res.data.length > 0) {
                    setTeam(res.data);
                    try { localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(res.data)); } catch { /* quota */ }
                }
            } catch { /* backend unavailable — localStorage/DEFAULT_TEAM keeps working */ }
        })();
    }, []);

    // `next` is cached locally in full (so this tab's own UI stays consistent),
    // but only `patch` — the section(s) that actually changed — goes to the
    // server. Sending the whole document here was the root cause of a real
    // bug: a tab that opens fresh and fires an update before its own GET
    // /event-ops hydration lands would PUT its stale/empty local state,
    // silently wiping out sections (e.g. attendance-staff codes) that a
    // different tab had just written. The backend also merges rather than
    // replaces, so this is defense in depth, not the only fix.
    // Debounced patches accumulate across edits: resetting the timer used to
    // throw away the previous patch too, so two quick edits to *different*
    // sections (booth assigned, then anything else within 800ms) silently
    // dropped the first section's PUT — the booth looked assigned locally but
    // the server never heard about it, and the next refresh reverted it.
    // Surfaces a PUT failure to whichever page is mounted, so a rejected save
    // (e.g. a 403 from a stale/wrong session) shows up as a visible error
    // instead of silently staying queued forever — see persist() below.
    const persistErrorRef = useRef(null);
    const onPersistError = useCallback((fn) => { persistErrorRef.current = fn; }, []);

    const pendingPatchRef = useRef({});
    const flushPatch = useCallback(() => {
        const body = pendingPatchRef.current;
        if (Object.keys(body).length === 0) return;
        pendingPatchRef.current = {};
        axios.put(`${API_URL}/event-ops`, body, { headers: authHeaders() })
            .then(() => {
                // Once this tab's own edit has actually reached the server,
                // it's safe to accept server copies of these sections again —
                // otherwise the periodic poll above would skip them forever,
                // and this tab would never see anyone else's later changes to
                // a section it once touched.
                for (const key of Object.keys(body)) dirtySectionsRef.current.delete(key);
            })
            .catch((err) => {
                // Put the patch back so it isn't lost, and re-arm a retry —
                // previously the patch just sat in pendingPatchRef until some
                // unrelated edit happened to call persist() again, so a failed
                // save (e.g. a dropped connection or a 403) could go unretried
                // indefinitely: the edit looked successful locally (setData
                // already applied it optimistically) but silently never reached
                // the server, and reloading or the next poll from another tab
                // would revert it.
                pendingPatchRef.current = { ...body, ...pendingPatchRef.current };
                clearTimeout(saveTimer.current);
                saveTimer.current = setTimeout(flushPatch, 4000);
                persistErrorRef.current?.(err, Object.keys(body));
            });
    }, []);
    const persist = useCallback((next, patch) => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* quota */ }
        pendingPatchRef.current = { ...pendingPatchRef.current, ...patch };
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(flushPatch, 800);
    }, [flushPatch]);

    const employee = team.find((e) => e.id === actingAs) || team[0];

    // Reassign which modules a team member owns. Gated behind verification in
    // the UI (Rana only) — this just applies the change once approved.
    const updateTeamFocus = useCallback((memberId, newFocus) => {
        setTeam((prev) => {
            const next = prev.map((m) => (m.id === memberId ? { ...m, focus: newFocus } : m));
            try { localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(next)); } catch { /* quota */ }
            return next;
        });
        axios.patch(`${API_URL}/casto-team/${memberId}`, { focus: newFocus }, { headers: authHeaders() }).catch(() => { /* local state still applied */ });
    }, []);

    // Adds a new team member via the real backend (also sends them a
    // notification email server-side) and merges the result into local state
    // once created, so the caller doesn't need a second round-trip.
    const inviteTeamMember = useCallback(async (name, email, role, focus, responsibilities) => {
        const res = await axios.post(`${API_URL}/casto-team`, { name, email, role, focus, responsibilities }, { headers: authHeaders() });
        setTeam((prev) => {
            const next = [...prev, res.data];
            try { localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(next)); } catch { /* quota */ }
            return next;
        });
        return res.data;
    }, []);

    const removeTeamMember = useCallback(async (memberId) => {
        await axios.delete(`${API_URL}/casto-team/${memberId}`, { headers: authHeaders() });
        setTeam((prev) => {
            const next = prev.filter((m) => m.id !== memberId);
            try { localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(next)); } catch { /* quota */ }
            return next;
        });
    }, []);

    // Central mutation: applies the change, stamps who/when, records an audit entry.
    //
    // If this tab hasn't confirmed the server's current state yet, re-fetch it
    // and run `updater` against the *server's* copy of the section instead of
    // this tab's local (possibly stale-empty) one, before ever writing back.
    // Without this, a freshly-opened tab creating e.g. a staff account would
    // read-modify-write from its own empty `attendanceStaff: []`, silently
    // dropping every staffer another tab had already created.
    //
    // Once hydrated, the baseline MUST be `prev[section]` from inside the
    // setData updater — never `data[section]` from this callback's closure.
    // `update` is memoized on [employee.name, persist], so its captured `data`
    // freezes at creation time: reading it meant every edit was applied to the
    // page-load snapshot, silently undoing all earlier edits in the same
    // section (assign booth A, then booth B → A reverts to Available).
    const update = useCallback(async (section, message, updater) => {
        let serverBaseline; // only used on this tab's very first pre-hydration edit
        if (!hydratedRef.current) {
            try {
                const res = await axios.get(`${API_URL}/event-ops`, { headers: authHeaders() });
                if (res?.data && Object.prototype.hasOwnProperty.call(res.data, section)) {
                    serverBaseline = res.data[section];
                }
            } catch { /* server unreachable — fall back to local state, same as before */ }
            hydratedRef.current = true;
        }

        dirtySectionsRef.current.add(section);
        dirtySectionsRef.current.add("audit");
        setData((prev) => {
            const now = new Date().toISOString();
            const baseline = serverBaseline !== undefined ? serverBaseline : prev[section];
            const updatedSection = updater(baseline, { updatedBy: employee.name, updatedAt: now });
            const updatedAudit = [
                { id: Date.now(), at: now, by: employee.name, section, message },
                ...(prev.audit || []),
            ].slice(0, 120);
            const next = { ...prev, [section]: updatedSection, audit: updatedAudit };
            // Only the touched section + audit go to the server — never the
            // rest of this tab's possibly-stale local copy
            persist(next, { [section]: updatedSection, audit: updatedAudit });
            return next;
        });
    }, [employee.name, persist]);

    const setActingAs = (id) => {
        setActingAsState(id);
        localStorage.setItem(ACTING_KEY, id);
    };

    // Rana creates the account with just name + email; everything else
    // (phone, notes) the staffer fills in themselves from their check-in
    // session the first time they log in with the code
    const addStaffer = useCallback((name, email) => {
        const code = Math.random().toString(36).slice(2, 7).toUpperCase();
        update("attendanceStaff", `Created a staff account for ${name} (${email})`, (rows, who) =>
            [...(rows || []), { id: Date.now(), name, email, code, status: "invited", phone: "", ...who }]);
        return code;
    }, [update]);

    const removeStaffer = useCallback((id) => {
        update("attendanceStaff", "Revoked a check-in access code", (rows) => (rows || []).filter((s) => s.id !== id));
    }, [update]);

    // A staffer fills in their own remaining details after their first login
    const updateStafferProfile = useCallback((id, patch) => {
        update("attendanceStaff", `${patch.name || "A staffer"} updated their profile`, (rows) =>
            (rows || []).map((s) => (s.id === id ? { ...s, ...patch, status: "active" } : s)));
    }, [update]);

    // ─── Support / services staff (printing, supplies, setup, runners …) ───────
    // Distinct from attendanceStaff (code-gated door volunteers): these are
    // known helpers CASTO manages directly, each carrying a role and a task
    // list. Tasks can optionally reference an Equipment or Requirement row
    // (linkedTo), so "bring 6 chairs to B07" traces back to the actual request.
    const addSupportStaff = useCallback((name, role, phone = "", email = "") => {
        update("supportStaff", `Added support staff ${name}${role ? ` (${role})` : ""}`, (rows, who) =>
            [...(rows || []), { id: Date.now(), name, role, phone, email, tasks: [], ...who }]);
    }, [update]);

    const updateSupportStaff = useCallback((id, patch) => {
        update("supportStaff", `Updated support staff details`, (rows) =>
            (rows || []).map((s) => (s.id === id ? { ...s, ...patch } : s)));
    }, [update]);

    const removeSupportStaff = useCallback((id) => {
        update("supportStaff", "Removed a support staff member", (rows) => (rows || []).filter((s) => s.id !== id));
    }, [update]);

    const addSupportTask = useCallback((staffId, title, linkedTo = null) => {
        update("supportStaff", `Assigned task "${title}"`, (rows, who) =>
            (rows || []).map((s) => (s.id === staffId
                ? { ...s, tasks: [...(s.tasks || []), { id: Date.now(), title, status: "Pending", linkedTo }], ...who }
                : s)));
    }, [update]);

    const setSupportTaskStatus = useCallback((staffId, taskId, status) => {
        update("supportStaff", `Set a task to ${status}`, (rows, who) =>
            (rows || []).map((s) => (s.id === staffId
                ? { ...s, tasks: (s.tasks || []).map((t) => (t.id === taskId ? { ...t, status } : t)), ...who }
                : s)));
    }, [update]);

    const removeSupportTask = useCallback((staffId, taskId) => {
        update("supportStaff", "Removed a task", (rows) =>
            (rows || []).map((s) => (s.id === staffId
                ? { ...s, tasks: (s.tasks || []).filter((t) => t.id !== taskId) }
                : s)));
    }, [update]);

    // Refresh the whole document periodically. This is the only re-fetch
    // after the initial mount — EventOpsProvider lives above the router, so
    // navigating to /company-status never remounts it and never re-runs the
    // hydration effect above. Without this poll, a company whose session
    // started before CASTO assigned a booth / fulfilled a requirement /
    // issued a pass would never see it without a hard page reload, since
    // companyView() only ever reads from this same `data` state.
    useEffect(() => {
        const poll = setInterval(refetchEventOps, 15000);
        return () => clearInterval(poll);
    }, [refetchEventOps]);

    // Company self-service request (equipment / special requirement / parking
    // note). Hits the dedicated insert-only backend endpoint — NOT the bulk
    // event-ops PUT — so a company can only ever append its own rows and never
    // touch another company's data (the bulk writers delete-and-recreate whole
    // sections). Refetches afterward so the company sees their request appear
    // immediately in their own "current requests" list. Throws on failure so
    // the caller can show an error toast.
    const submitCompanyRequest = useCallback(async (payload) => {
        await axios.post(`${API_URL}/event-ops/company-request`, payload, { headers: authHeaders() });
        await refetchEventOps();
    }, [refetchEventOps]);

    // A company checks itself in by scanning its own booth QR on arrival —
    // flips its attendance row to Present. UPSERTS: if the company has a booth
    // but no attendance row yet, one is created so the check-in always sticks
    // (previously this was a no-op when no row existed, so the "I've arrived"
    // button appeared to do nothing). Keyed by company name.
    const companySelfCheckIn = useCallback((companyName) => {
        if (!companyName) return;
        const eq = (a, b) => a?.trim().toLowerCase() === b?.trim().toLowerCase();
        const time = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        const booth = data.booths.find((b) => eq(b.company, companyName));
        const delegateCount = data.delegates.find((d) => eq(d.company, companyName))?.delegates.length || 0;
        update("attendanceCompanies", `${companyName} self-checked in via booth QR`, (prev, who) => {
            const rows = prev || [];
            const present = { checkedIn: delegateCount, delegateCount, time, method: "QR", status: "Present", ...who };
            if (rows.some((c) => eq(c.company, companyName))) {
                return rows.map((c) => eq(c.company, companyName)
                    ? { ...c, ...present, checkedIn: c.delegateCount ?? delegateCount }
                    : c);
            }
            return [...rows, { booth: booth?.number || "—", company: companyName, ...present }];
        });
    }, [update, data.booths, data.delegates]);

    // Whether a given company is already marked present — powers the company-side
    // "you're checked in" state and silences the hourly reminder once done.
    const isCompanyCheckedIn = useCallback((companyName) => {
        if (!companyName) return false;
        const eq = (a, b) => a?.trim().toLowerCase() === b?.trim().toLowerCase();
        const row = (data.attendanceCompanies || []).find((c) => eq(c.company, companyName));
        return row?.status === "Present";
    }, [data.attendanceCompanies]);

    // All assignable company names come purely from the real registered
    // companies (GET /companies). No demo names are injected.
    const companies = [...new Set(realCompanies)];

    // Everything the event holds for one company — powers the company-side view
    const companyView = useCallback((name) => {
        if (!name) return null;
        const eq = (a, b) => a?.trim().toLowerCase() === b?.trim().toLowerCase();
        return {
            booth: data.booths.find((b) => eq(b.company, name)) || null,
            banners: data.banners.filter((b) => eq(b.company, name)),
            requirements: data.requirements.filter((r) => eq(r.company, name)),
            equipment: data.equipment.filter((r) => eq(r.entity.split("/")[0], name)),
            delegates: data.delegates.find((d) => eq(d.company, name))?.delegates || [],
            attendance: data.attendanceCompanies.find((a) => eq(a.company, name)) || null,
            passes: data.passes.filter((p) => eq(p.company, name)),
        };
    }, [data]);

    // Rana (the Event Lead / final point of contact) is always shown first in
    // the team — in the "Viewing as" switcher and anywhere else team is
    // consumed — regardless of DB insertion order. Match by her stable id, with
    // an Event Lead role fallback in case the id ever differs.
    const orderedTeam = [...team].sort((a, b) => {
        const rank = (m) => (m.id === "rana" || m.role === "Event Lead" ? 0 : 1);
        return rank(a) - rank(b);
    });

    return (
        <EventOpsContext.Provider value={{ data, update, actingAs, setActingAs, employee, team: orderedTeam, updateTeamFocus, inviteTeamMember, removeTeamMember, companies, companyIds, companyView, addStaffer, removeStaffer, updateStafferProfile, addSupportStaff, updateSupportStaff, removeSupportStaff, addSupportTask, setSupportTaskStatus, removeSupportTask, companySelfCheckIn, isCompanyCheckedIn, refetchEventOps, onPersistError, submitCompanyRequest }}>
            {children}
        </EventOpsContext.Provider>
    );
};

export const useEventOps = () => {
    const ctx = useContext(EventOpsContext);
    if (!ctx) throw new Error("useEventOps must be used inside EventOpsProvider");
    return ctx;
};

export const formatWhen = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};
