import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../config/api";

// ─── CASTO office team ─────────────────────────────────────────────────────────
// One CASTO account, several employees: each gets their own view (focus modules),
// and every change is recorded under the employee who made it.

export const TEAM = [
    { id: "rana",    name: "Rana",    role: "Event Lead",              focus: ["venue", "schedule", "report"] },
    { id: "prithba", name: "Prithba", role: "Logistics & Equipment",   focus: ["equipment", "requirements"] },
    { id: "aseel",   name: "Aseel",   role: "Branding & Media",        focus: ["banners"] },
    { id: "maha",    name: "Maha",    role: "Attendance & Check-in",   focus: ["attendance", "delegates"] },
    { id: "yousef",  name: "Yousef",  role: "Access & Passes",         focus: ["passes"] },
];

// ─── Seed data ─────────────────────────────────────────────────────────────────

const SEED_COMPANIES = ["Emirates NBD", "Etisalat", "Dubai Police", "DP World", "ADNOC"];

const t = (d, h, m) => new Date(2026, 5, d, h, m).toISOString(); // June 2026

const stamp = (by, at) => ({ updatedBy: by, updatedAt: at });

const SEED = {
    booths: [
        { id: 1,  number: "B01", zone: "A", ring: "outer",  company: "Emirates NBD", type: "Premium",  status: "Assigned",  ...stamp("Rana", t(28, 10, 12)) },
        { id: 2,  number: "B02", zone: "A", ring: "outer",  company: "Etisalat",     type: "Standard", status: "Assigned",  ...stamp("Rana", t(28, 10, 20)) },
        { id: 3,  number: "B03", zone: "A", ring: "outer",  company: null,           type: "Standard", status: "Available", ...stamp("Rana", t(25, 9, 0)) },
        { id: 4,  number: "B04", zone: "A", ring: "outer",  company: null,           type: "Corner",   status: "Available", ...stamp("Rana", t(25, 9, 0)) },
        { id: 5,  number: "B05", zone: "B", ring: "outer",  company: "Dubai Police", type: "Premium",  status: "Assigned",  ...stamp("Prithba", t(29, 14, 5)) },
        { id: 6,  number: "B06", zone: "B", ring: "outer",  company: null,           type: "Standard", status: "Reserved",  ...stamp("Rana", t(29, 15, 40)) },
        { id: 7,  number: "B07", zone: "B", ring: "outer",  company: "DP World",     type: "Corner",   status: "Assigned",  ...stamp("Rana", t(29, 16, 22)) },
        { id: 8,  number: "B08", zone: "B", ring: "outer",  company: null,           type: "Standard", status: "Available", ...stamp("Rana", t(25, 9, 0)) },
        { id: 9,  number: "B09", zone: "C", ring: "center", company: null,           type: "Standard", status: "Reserved",  ...stamp("Prithba", t(30, 11, 8)) },
        { id: 10, number: "B10", zone: "C", ring: "center", company: null,           type: "Standard", status: "Available", ...stamp("Rana", t(25, 9, 0)) },
        { id: 11, number: "B11", zone: "C", ring: "center", company: "ADNOC",        type: "Premium",  status: "Assigned",  ...stamp("Rana", t(30, 12, 45)) },
        { id: 12, number: "B12", zone: "C", ring: "center", company: null,           type: "Corner",   status: "Available", ...stamp("Rana", t(25, 9, 0)) },
    ],
    banners: [
        { id: 1, company: "Emirates NBD", material: "Roll-up Banner",         size: "85 × 200 cm", quantity: 2, artwork: "enbd-rollup-v3.pdf",   contact: "Sara Al Mansouri", deadline: "2026-07-05", status: "Placed",        notes: "2 roll-ups, logo updated", ...stamp("Aseel", t(30, 9, 30)) },
        { id: 2, company: "Etisalat",     material: "Backdrop",               size: "300 × 200 cm", quantity: 1, artwork: "etisalat-backdrop.ai", contact: "Aisha Noor",       deadline: "2026-07-05", status: "Printed",       notes: "Awaiting delivery",        ...stamp("Aseel", t(30, 13, 15)) },
        { id: 3, company: "Dubai Police", material: "Table Skirt",            size: "180 × 75 cm",  quantity: 3, artwork: "dxb-police-skirt.pdf", contact: "Lt. Hessa Al Zaabi", deadline: "2026-07-06", status: "Approved",    notes: "Standard green theme",     ...stamp("Aseel", t(29, 16, 40)) },
        { id: 4, company: "DP World",     material: "Digital Screen Graphic", size: "1920 × 1080 px", quantity: 1, artwork: "dpworld-screen.mp4", contact: "HR Director",      deadline: "2026-07-04", status: "Submitted",     notes: "HD resolution required",   ...stamp("Aseel", t(30, 10, 5)) },
        { id: 5, company: "ADNOC",        material: "Roll-up Banner",         size: "85 × 200 cm",  quantity: 2, artwork: null,                   contact: "—",                deadline: "2026-07-05", status: "Not Submitted", notes: "Follow up needed",         ...stamp("Aseel", t(28, 11, 0)) },
    ],
    requirements: [
        { id: 1, company: "Emirates NBD", description: "Extra monitor for presentations",         category: "AV Equipment",  priority: "High",     status: "In Progress", notes: "32\" screen requested",      ...stamp("Prithba", t(30, 9, 10)) },
        { id: 2, company: "Etisalat",     description: "Wheelchair accessible booth positioning", category: "Accessibility", priority: "Critical", status: "Fulfilled",   notes: "Booth B02 repositioned",     ...stamp("Prithba", t(29, 15, 30)) },
        { id: 3, company: "Dubai Police", description: "Uniform mannequin display",               category: "Display",       priority: "Medium",   status: "Open",        notes: "Needs stand and lighting",   ...stamp("Prithba", t(29, 10, 0)) },
        { id: 4, company: "DP World",     description: "VIP lounge seating nearby",               category: "Comfort",       priority: "Low",      status: "Open",        notes: "Pending space review",       ...stamp("Rana", t(28, 14, 20)) },
        { id: 5, company: "ADNOC",        description: "Dedicated power line 30A",                category: "Power",         priority: "Critical", status: "In Progress", notes: "Electrician scheduled",      ...stamp("Prithba", t(30, 16, 55)) },
    ],
    equipment: [
        { id: 1, entity: "Emirates NBD / B01", item: "Folding Table",        qtyReq: 2, qtyFul: 2, status: "Fulfilled", ...stamp("Prithba", t(29, 9, 0)) },
        { id: 2, entity: "Emirates NBD / B01", item: "Chair",                qtyReq: 4, qtyFul: 4, status: "Fulfilled", ...stamp("Prithba", t(29, 9, 5)) },
        { id: 3, entity: "Etisalat / B02",     item: "Power Strip (6-way)",  qtyReq: 2, qtyFul: 1, status: "Partial",   ...stamp("Prithba", t(30, 11, 30)) },
        { id: 4, entity: "Etisalat / B02",     item: "Monitor Stand",        qtyReq: 1, qtyFul: 0, status: "Pending",   ...stamp("Prithba", t(30, 11, 32)) },
        { id: 5, entity: "Dubai Police / B05", item: "Folding Table",        qtyReq: 3, qtyFul: 3, status: "Fulfilled", ...stamp("Prithba", t(29, 13, 45)) },
        { id: 6, entity: "Dubai Police / B05", item: "Display Screen 43\"",  qtyReq: 1, qtyFul: 1, status: "Fulfilled", ...stamp("Prithba", t(29, 13, 50)) },
        { id: 7, entity: "DP World / B07",     item: "Chair",                qtyReq: 6, qtyFul: 4, status: "Partial",   ...stamp("Prithba", t(30, 15, 10)) },
        { id: 8, entity: "DP World / B07",     item: "Extension Cable 10m",  qtyReq: 2, qtyFul: 2, status: "Fulfilled", ...stamp("Prithba", t(30, 15, 12)) },
    ],
    delegates: [
        { company: "Emirates NBD", delegates: [
            { name: "Sara Al Mansouri", role: "HR Manager",          email: "sara.m@enbd.ae",                  phone: "+971 50 111 2233", badge: "Printed" },
            { name: "Khalid Rashid",    role: "Recruiter",           email: "k.rashid@enbd.ae",                phone: "+971 55 444 5566", badge: "Pending" },
        ]},
        { company: "Etisalat", delegates: [
            { name: "Aisha Noor",       role: "Talent Acquisition",  email: "aisha.n@etisalat.ae",             phone: "+971 52 777 8899", badge: "Printed" },
            { name: "Mohammed Al Ali",  role: "Campus Relations",    email: "m.alali@etisalat.ae",             phone: "+971 56 223 3445", badge: "Printed" },
            { name: "Fatima Hamdan",    role: "HR Coordinator",      email: "f.hamdan@etisalat.ae",            phone: "+971 50 998 1122", badge: "Pending" },
        ]},
        { company: "Dubai Police", delegates: [
            { name: "Maj. Ahmed Karimi", role: "Recruitment Officer", email: "a.karimi@dubaipolice.gov.ae",    phone: "+971 4 999 0011", badge: "Printed" },
            { name: "Lt. Hessa Al Zaabi", role: "HR Specialist",      email: "h.alzaabi@dubaipolice.gov.ae",   phone: "+971 4 999 0022", badge: "Pending" },
        ]},
    ],
    attendanceCompanies: [
        { booth: "B01", company: "Emirates NBD", delegateCount: 2, checkedIn: 2, time: "08:45", method: "QR",  status: "Present", ...stamp("Maha", t(30, 8, 45)) },
        { booth: "B02", company: "Etisalat",     delegateCount: 3, checkedIn: 2, time: "09:10", method: "QR",  status: "Partial", ...stamp("Maha", t(30, 9, 10)) },
        { booth: "B05", company: "Dubai Police", delegateCount: 2, checkedIn: 0, time: "—",     method: "—",   status: "Absent",  ...stamp("Maha", t(30, 8, 0)) },
        { booth: "B07", company: "DP World",     delegateCount: 2, checkedIn: 2, time: "08:55", method: "QR",  status: "Present", ...stamp("Maha", t(30, 8, 55)) },
        { booth: "B11", company: "ADNOC",        delegateCount: 2, checkedIn: 0, time: "—",     method: "—",   status: "Absent",  ...stamp("Maha", t(30, 8, 0)) },
    ],
    attendanceStudents: [
        { id: "202110001", name: "Layla Hassan",  time: "09:05", method: "QR",     status: "Checked In" },
        { id: "202110045", name: "Omar Al Farsi", time: "09:12", method: "QR",     status: "Checked In" },
        { id: "202110089", name: "Nour Ibrahim",  time: "09:30", method: "Manual", status: "Checked In" },
        { id: "202110120", name: "Reem Sultan",   time: "09:44", method: "QR",     status: "Checked In" },
        { id: "202110200", name: "Faisal Ahmed",  time: "—",     method: "—",      status: "Pending" },
        { id: "202110234", name: "Amira Khalil",  time: "10:05", method: "QR",     status: "Checked In" },
    ],
    schedule: [
        { id: 1, start: "08:30", end: "09:00", title: "Registration & Venue Setup",            host: "Event Team",           location: "Main Entrance",    capacity: 300,  registered: 280, status: "Ended",    ...stamp("Rana", t(20, 10, 0)) },
        { id: 2, start: "09:00", end: "09:30", title: "Opening Ceremony & Welcome Address",    host: "University President", location: "Main Hall",        capacity: 500,  registered: 420, status: "Ended",    ...stamp("Rana", t(20, 10, 5)) },
        { id: 3, start: "09:30", end: "12:00", title: "Open Networking — Booth Visits",        host: "All Companies",        location: "Exhibition Floor", capacity: 1000, registered: 850, status: "Live",     ...stamp("Rana", t(20, 10, 10)) },
        { id: 4, start: "12:00", end: "13:00", title: "Lunch Break",                           host: "Catering Team",        location: "Cafeteria",        capacity: 400,  registered: 370, status: "Upcoming", ...stamp("Rana", t(20, 10, 15)) },
        { id: 5, start: "13:00", end: "15:30", title: "Resume Drop & Interview Sessions",      host: "All Companies",        location: "Exhibition Floor", capacity: 1000, registered: 760, status: "Upcoming", ...stamp("Rana", t(20, 10, 20)) },
        { id: 6, start: "15:30", end: "16:00", title: "Closing & Prize Distribution",          host: "Event Coordinator",    location: "Main Stage",       capacity: 300,  registered: 210, status: "Upcoming", ...stamp("Rana", t(20, 10, 25)) },
    ],
    passes: [
        { id: 1, company: "Emirates NBD", delegate: "Sara Al Mansouri",  type: "VIP",     code: "VIP-ENB-001", issued: "2026-06-18", status: "Active",  ...stamp("Yousef", t(18, 9, 0)) },
        { id: 2, company: "Emirates NBD", delegate: "Khalid Rashid",     type: "Entry",   code: "ENT-ENB-002", issued: "2026-06-18", status: "Active",  ...stamp("Yousef", t(18, 9, 2)) },
        { id: 3, company: "Etisalat",     delegate: "Aisha Noor",        type: "Entry",   code: "ENT-ETS-001", issued: "2026-06-18", status: "Used",    ...stamp("Yousef", t(18, 9, 4)) },
        { id: 4, company: "Etisalat",     delegate: "Mohammed Al Ali",   type: "Parking", code: "PRK-ETS-002", issued: "2026-06-18", status: "Active",  ...stamp("Yousef", t(18, 9, 6)) },
        { id: 5, company: "Etisalat",     delegate: "Fatima Hamdan",     type: "Entry",   code: "ENT-ETS-003", issued: "2026-06-18", status: "Active",  ...stamp("Yousef", t(18, 9, 8)) },
        { id: 6, company: "Dubai Police", delegate: "Maj. Ahmed Karimi", type: "VIP",     code: "VIP-DXB-001", issued: "2026-06-18", status: "Revoked", ...stamp("Yousef", t(19, 14, 30)) },
        { id: 7, company: "DP World",     delegate: "Logistics Lead",    type: "Parking", code: "PRK-DPW-001", issued: "2026-06-18", status: "Active",  ...stamp("Yousef", t(18, 9, 10)) },
        { id: 8, company: "DP World",     delegate: "HR Director",       type: "VIP",     code: "VIP-DPW-002", issued: "2026-06-18", status: "Active",  ...stamp("Yousef", t(18, 9, 12)) },
    ],
    audit: [
        { id: 1, at: t(30, 12, 45), by: "Rana",    section: "Venue & Booths",   message: "Assigned booth B11 to ADNOC" },
        { id: 2, at: t(30, 13, 15), by: "Aseel",   section: "Banners",          message: "Marked Etisalat backdrop as Printed" },
        { id: 3, at: t(30, 15, 10), by: "Prithba", section: "Equipment",        message: "Updated DP World chair delivery (4 of 6)" },
        { id: 4, at: t(30, 16, 55), by: "Prithba", section: "Requirements",     message: "Started ADNOC dedicated power line request" },
    ],
};

const STORAGE_KEY = "event_ops_v2";
const ACTING_KEY = "event_ops_acting";

// ─── Context ───────────────────────────────────────────────────────────────────

const EventOpsContext = createContext(null);

export const EventOpsProvider = ({ children }) => {
    const [data, setData] = useState(() => {
        try {
            const cached = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (cached && cached.booths) return { ...SEED, ...cached };
        } catch { /* corrupted cache — fall back to seed */ }
        return SEED;
    });
    const [actingAs, setActingAsState] = useState(() => localStorage.getItem(ACTING_KEY) || TEAM[0].id);
    const [realCompanies, setRealCompanies] = useState([]);
    const saveTimer = useRef(null);

    const authHeaders = () => {
        const u = JSON.parse(localStorage.getItem("user") || "null");
        return u?.token ? { Authorization: `Bearer ${u.token}` } : {};
    };

    // Hydrate from backend (authoritative when present) + fetch real company names
    useEffect(() => {
        (async () => {
            try {
                const res = await axios.get(`${API_URL}/event-ops`, { headers: authHeaders() });
                if (res?.data?.booths) setData((prev) => ({ ...prev, ...res.data }));
            } catch { /* backend unavailable — localStorage/seed keeps working */ }
            try {
                const res = await axios.get(`${API_URL}/companies`);
                if (Array.isArray(res?.data)) {
                    setRealCompanies(res.data.map((c) => c.companyName).filter(Boolean));
                }
            } catch { /* ignore */ }
        })();
    }, []);

    const persist = useCallback((next) => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* quota */ }
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            axios.put(`${API_URL}/event-ops`, next, { headers: authHeaders() }).catch(() => {});
        }, 800);
    }, []);

    const employee = TEAM.find((e) => e.id === actingAs) || TEAM[0];

    // Central mutation: applies the change, stamps who/when, records an audit entry
    const update = useCallback((section, message, updater) => {
        setData((prev) => {
            const now = new Date().toISOString();
            const next = {
                ...prev,
                [section]: updater(prev[section], { updatedBy: employee.name, updatedAt: now }),
                audit: [
                    { id: Date.now(), at: now, by: employee.name, section, message },
                    ...(prev.audit || []),
                ].slice(0, 120),
            };
            persist(next);
            return next;
        });
    }, [employee.name, persist]);

    const setActingAs = (id) => {
        setActingAsState(id);
        localStorage.setItem(ACTING_KEY, id);
    };

    // All assignable company names: seeds + real registered companies
    const companies = [...new Set([...SEED_COMPANIES, ...realCompanies])];

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

    return (
        <EventOpsContext.Provider value={{ data, update, actingAs, setActingAs, employee, team: TEAM, companies, companyView }}>
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
