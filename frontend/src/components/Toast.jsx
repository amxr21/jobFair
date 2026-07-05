import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef({});

    const dismiss = useCallback((id) => {
        setToasts(ts => ts.map(t => t.id === id ? { ...t, leaving: true } : t));
        setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 300);
    }, []);

    const toast = useCallback((message, { type = 'info', duration = 2800 } = {}) => {
        const id = ++idCounter;
        // Mounts as "entering" so the enter transition below has a from-state to
        // animate away from, instead of appearing at full opacity instantly
        setToasts(ts => [...ts, { id, message, type, leaving: false, entering: true }]);
        requestAnimationFrame(() => requestAnimationFrame(() => {
            setToasts(ts => ts.map(t => t.id === id ? { ...t, entering: false } : t));
        }));
        timers.current[id] = setTimeout(() => dismiss(id), duration);
        return id;
    }, [dismiss]);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {createPortal(
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999999] flex flex-col gap-2 items-center pointer-events-none">
                    {toasts.map(t => (
                        <ToastItem key={t.id} {...t} onDismiss={() => dismiss(t.id)} />
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}

// ─── Individual toast ─────────────────────────────────────────────────────────

const ICONS = {
    success: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
    ),
    error: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ),
    info: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    warning: (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
    ),
};

const STYLES = {
    success: 'bg-[#0E7F41] text-white',
    error:   'bg-red-500 text-white',
    info:    'bg-gray-800 text-white',
    warning: 'bg-amber-500 text-white',
};

function ToastItem({ message, type, leaving, entering, onDismiss }) {
    // entering (pre-animation) and leaving both collapse to the same off-state,
    // so a toast always slides down from above and slides back out the same way
    const settled = !entering && !leaving;
    return (
        <div
            onClick={onDismiss}
            className={`
                flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl shadow-lg text-sm font-medium
                cursor-pointer pointer-events-auto select-none
                transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                ${STYLES[type] ?? STYLES.info}
                ${settled ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'}
            `}
            style={{ minWidth: 180, maxWidth: 340 }}
        >
            {ICONS[type] ?? ICONS.info}
            <span>{message}</span>
        </div>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
}
