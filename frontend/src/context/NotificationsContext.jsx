import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

// ─── In-app notifications ───────────────────────────────────────────────────────
// Client-side only (localStorage-backed), same resilience model as EventOps.
// Surfaces events the logged-in user cares about: applicant flag/shortlist/reject
// actions, CASTO module reassignments, and the recurring booth check-in reminder.
// A backend table can replace the store later without touching call sites — every
// producer goes through `notify(...)` and every consumer reads `items`.

const NotificationsContext = createContext(null);

// Notifications are scoped per-account so switching users (or logging out) never
// leaks one account's feed into another's. The key folds in a stable identifier.
const storageKey = (who) => `notifications_v1:${who || "anon"}`;

const MAX_ITEMS = 60; // keep the feed bounded — oldest fall off

const load = (who) => {
    try {
        const raw = JSON.parse(localStorage.getItem(storageKey(who)));
        if (Array.isArray(raw)) return raw;
    } catch { /* corrupted — start clean */ }
    return [];
};

let idCounter = 0;
const nextId = () => `${Date.now()}-${++idCounter}`;

export const NotificationsProvider = ({ children }) => {
    // The identity we scope to: company name if present, else email, else anon.
    // Read lazily from localStorage so this provider doesn't need the auth hook
    // (avoids a provider-ordering dependency in App.jsx).
    const whoRef = useRef(null);
    const readWho = () => {
        try {
            const u = JSON.parse(localStorage.getItem("user") || "null");
            return u?.companyName || u?.email || null;
        } catch { return null; }
    };

    const [who, setWho] = useState(() => readWho());
    const [items, setItems] = useState(() => load(readWho()));

    whoRef.current = who;

    // React to login/logout in this or another tab. `storage` covers other tabs;
    // a light poll covers same-tab changes (login writes localStorage directly).
    useEffect(() => {
        const sync = () => {
            const current = readWho();
            if (current !== whoRef.current) {
                setWho(current);
                setItems(load(current));
            }
        };
        window.addEventListener("storage", sync);
        const poll = setInterval(sync, 1500);
        return () => { window.removeEventListener("storage", sync); clearInterval(poll); };
    }, []);

    const write = useCallback((updater) => {
        setItems((prev) => {
            const next = updater(prev).slice(0, MAX_ITEMS);
            try { localStorage.setItem(storageKey(whoRef.current), JSON.stringify(next)); } catch { /* quota */ }
            return next;
        });
    }, []);

    // Core producer. `type` drives the icon/tint; `dedupeKey` (optional) collapses
    // repeated identical events (e.g. the hourly reminder) into one unread entry
    // instead of stacking duplicates.
    const notify = useCallback((message, { type = "info", detail = "", dedupeKey = null, link = null } = {}) => {
        write((prev) => {
            if (dedupeKey) {
                const existing = prev.find((n) => n.dedupeKey === dedupeKey && !n.read);
                if (existing) {
                    // Refresh its timestamp/detail rather than adding a new row
                    return prev.map((n) => n === existing ? { ...n, at: new Date().toISOString(), message, detail } : n);
                }
            }
            return [{ id: nextId(), message, detail, type, link, dedupeKey, at: new Date().toISOString(), read: false }, ...prev];
        });
    }, [write]);

    const markAllRead = useCallback(() => write((prev) => prev.map((n) => ({ ...n, read: true }))), [write]);
    const markRead = useCallback((id) => write((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n))), [write]);
    const remove = useCallback((id) => write((prev) => prev.filter((n) => n.id !== id)), [write]);
    const clearAll = useCallback(() => write(() => []), [write]);

    const unreadCount = items.reduce((a, n) => a + (n.read ? 0 : 1), 0);

    return (
        <NotificationsContext.Provider value={{ items, unreadCount, notify, markAllRead, markRead, remove, clearAll }}>
            {children}
        </NotificationsContext.Provider>
    );
};

export const useNotifications = () => {
    const ctx = useContext(NotificationsContext);
    if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
    return ctx;
};

export const formatNotifTime = (iso) => {
    if (!iso) return "";
    const then = new Date(iso).getTime();
    if (isNaN(then)) return "";
    const diff = Date.now() - then;
    const min = Math.floor(diff / 60000);
    if (min < 1) return "just now";
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};
