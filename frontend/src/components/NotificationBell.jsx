import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications, formatNotifTime } from "../context/NotificationsContext";

// Per-type accent + glyph. Kept small and inline so the bell has no external
// icon dependency (matches how Toast.jsx ships its own icon set).
const TYPE_META = {
    flag:      { tint: "#0E7F41", bg: "#EAF3DE", icon: "M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5" },
    shortlist: { tint: "#185FA5", bg: "#E6F1FB", icon: "M11.48 3.5a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" },
    reject:    { tint: "#A32D2D", bg: "#FCEBEB", icon: "M6 18L18 6M6 6l12 12" },
    reassign:  { tint: "#8b5cf6", bg: "#F3EEFF", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    reminder:  { tint: "#f59e0b", bg: "#FEF3C7", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    info:      { tint: "#4A5568", bg: "#EDF2F7", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
};

const NotificationBell = () => {
    const { items, unreadCount, markAllRead, markRead, remove, clearAll } = useNotifications();
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);
    const navigate = useNavigate();

    // Clicking a notification marks it read and, if it carries a link, navigates
    // there (e.g. the check-in reminder → the company Status page).
    const openNotif = (n) => {
        markRead(n.id);
        if (n.link) { setOpen(false); navigate(n.link); }
    };

    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("mousedown", onDoc);
        document.addEventListener("keydown", onKey);
        return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
    }, [open]);

    const toggle = () => {
        const willOpen = !open;
        setOpen(willOpen);
        if (willOpen && unreadCount > 0) {
            // Give the user a beat to see which were unread, then clear the badge
            setTimeout(markAllRead, 1200);
        }
    };

    return (
        <div ref={wrapRef} className="relative">
            <button
                onClick={toggle}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                aria-label="Notifications"
                title="Notifications"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-[320px] max-w-[86vw] bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden animate-[fadeIn_0.12s_ease]">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-800">Notifications</p>
                        {items.length > 0 && (
                            <button onClick={clearAll} className="text-[11px] font-medium text-gray-400 hover:text-red-500 transition-colors">
                                Clear all
                            </button>
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {items.length === 0 ? (
                            <div className="px-4 py-10 text-center">
                                <p className="text-sm text-gray-400">You're all caught up</p>
                                <p className="text-[11px] text-gray-300 mt-1">New activity will show up here.</p>
                            </div>
                        ) : (
                            items.map((n) => {
                                const meta = TYPE_META[n.type] || TYPE_META.info;
                                return (
                                    <div
                                        key={n.id}
                                        onClick={() => openNotif(n)}
                                        className={`group flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 transition-colors ${n.link ? "cursor-pointer" : "cursor-default"} ${n.read ? "bg-white" : "bg-blue-50/40"} hover:bg-gray-50`}
                                    >
                                        <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: meta.bg, color: meta.tint }}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={meta.icon} />
                                            </svg>
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] text-gray-800 leading-snug">{n.message}</p>
                                            {n.detail && <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{n.detail}</p>}
                                            <p className="text-[10px] text-gray-400 mt-1">{formatNotifTime(n.at)}</p>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500 transition-opacity shrink-0"
                                            aria-label="Dismiss"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
