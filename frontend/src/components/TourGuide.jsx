import { useEffect, useState, useRef, useLayoutEffect, useCallback } from 'react';

export const APPLICANTS_TOUR_KEY = 'applicants_tour_v2';
export const MANAGERS_TOUR_KEY = 'managers_tour_v2';

// ─── Step definitions ────────────────────────────────────────────────────────

const APPLICANT_STEPS = [
    {
        target: 'tour-search',
        title: 'Search applicants by name',
        body: 'Type any part of a name to instantly filter the list. Matches update live as you type — no submit needed.',
        placement: 'bottom',
        tip: 'Press Esc to clear the search field.',
    },
    {
        target: 'tour-flag-btn',
        title: 'Flag filter — focus your shortlist',
        body: 'Click the flag icon to show only applicants you have flagged. Click again to return to the full list. Flags persist across sessions.',
        placement: 'bottom',
        tip: 'Flag individual applicants by expanding their row.',
    },
    {
        target: 'tour-filter-btn',
        title: 'Advanced filters',
        body: 'Filter by major, nationality, CGPA range, attendance status, CV presence, shortlist, and more. Active filters show as chips — click × to remove any one, or "Clear all" to reset.',
        placement: 'bottom',
        tip: 'Filters stack — "CS major" + "CGPA 3.5+" shows only both matching.',
    },
    {
        target: 'tour-table-header',
        title: 'Sort by any column',
        body: 'Click any column header (Name, University ID, Nationality, CGPA, Major, Status) to sort. Click again to reverse. An arrow marks the active sort column.',
        placement: 'bottom',
        tip: 'CGPA sorts highest-first by default.',
    },
    {
        target: 'tour-first-row',
        title: 'Expand a row — full applicant profile',
        body: 'Click the ↗ icon on any row to open the full profile. View their QR code, download their CV, and take actions: shortlist, reject, flag, or undo.',
        placement: 'top',
        tip: 'Shortlisted and rejected statuses are visible to all managers — flag is private to you.',
    },
    {
        target: 'tour-register-btn',
        title: 'Register & confirm attendance',
        body: '"Register an Applicant" scans a student\'s QR to link them to your company. "Confirm Attendance" scans their QR to mark them as physically present at the fair.',
        placement: 'bottom',
        tip: 'Allow camera permissions when prompted.',
    },
];

const MANAGER_STEPS = [
    {
        target: 'tour-search',
        title: 'Search companies by name',
        body: 'Type any part of a company name to instantly filter the list. Results update as you type.',
        placement: 'bottom',
        tip: 'Search is case-insensitive.',
    },
    {
        target: 'tour-filter-btn',
        title: 'Filter companies',
        body: 'Filter by attendance status (Pending / Confirmed / Canceled), sector, city, and industry. Combine filters to narrow down your list.',
        placement: 'bottom',
        tip: 'Use "Reminder Status: Not Sent" to find companies not yet contacted.',
    },
    {
        target: 'tour-register-btn',
        title: 'Send confirmation reminders',
        body: 'Opens a modal listing all pending companies. Select one, several, or all with "Select All Pending", then Send — each company receives a confirmation email.',
        placement: 'bottom',
        tip: 'Only companies with Pending status appear in the reminder list.',
    },
    {
        target: 'tour-table-header',
        title: 'Sort companies',
        body: 'Click any column header to sort. Use "No. of Applicants" to see which companies are getting the most interest.',
        placement: 'bottom',
        tip: 'Sorting by Status groups Confirmed, Pending, and Canceled together.',
    },
    {
        target: 'tour-first-row',
        title: 'Expand a company row',
        body: 'Click the ↗ icon to open the full company profile. View their preferred majors, delegate list, and applicants. Change status (Confirm / Cancel / Reset) directly from this panel.',
        placement: 'top',
        tip: 'Status changes take effect immediately and are saved to the database.',
    },
];

// ─── Positioning ──────────────────────────────────────────────────────────────

const BOX_W = 310;
const GAP = 12;
const SCREEN_PAD = 16;

function computePosition(targetEl, boxEl) {
    if (!targetEl || !boxEl) return null;

    const tr = targetEl.getBoundingClientRect();
    const boxH = boxEl.offsetHeight || 160;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const clampX = (x) => Math.max(SCREEN_PAD, Math.min(x, vw - BOX_W - SCREEN_PAD));
    const clampY = (y) => Math.max(SCREEN_PAD, Math.min(y, vh - boxH - SCREEN_PAD));

    const centerX = tr.left + tr.width / 2 - BOX_W / 2;

    const placements = {
        bottom: () => {
            const top = tr.bottom + GAP;
            if (top + boxH <= vh - SCREEN_PAD) {
                const left = clampX(centerX);
                return { top, left, placement: 'bottom', arrowX: tr.left + tr.width / 2 - left };
            }
        },
        top: () => {
            const top = tr.top - boxH - GAP;
            if (top >= SCREEN_PAD) {
                const left = clampX(centerX);
                return { top, left, placement: 'top', arrowX: tr.left + tr.width / 2 - left };
            }
        },
        right: () => {
            const left = tr.right + GAP;
            if (left + BOX_W <= vw - SCREEN_PAD) {
                return { top: clampY(tr.top + tr.height / 2 - boxH / 2), left, placement: 'right', arrowX: null };
            }
        },
        left: () => {
            const left = tr.left - BOX_W - GAP;
            if (left >= SCREEN_PAD) {
                return { top: clampY(tr.top + tr.height / 2 - boxH / 2), left, placement: 'left', arrowX: null };
            }
        },
    };

    const preferred = ['bottom', 'top', 'right', 'left'];
    for (const p of preferred) {
        const result = placements[p]?.();
        if (result) return result;
    }

    return {
        top: clampY(vh / 2 - boxH / 2),
        left: clampX(vw / 2 - BOX_W / 2),
        placement: 'bottom',
        arrowX: BOX_W / 2,
    };
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TourGuide({ show, onDone, variant = 'applicants' }) {
    const STEPS = variant === 'managers' ? MANAGER_STEPS : APPLICANT_STEPS;

    const [step, setStep] = useState(0);
    const [pos, setPos] = useState(null);
    const [spotRect, setSpotRect] = useState(null);
    const boxRef = useRef(null);

    const current = STEPS[step];

    const reposition = useCallback(() => {
        const targetEl = document.querySelector(`[data-tour="${current.target}"]`);
        if (!targetEl) return;

        const result = computePosition(targetEl, boxRef.current);
        if (result) setPos(result);

        const r = targetEl.getBoundingClientRect();
        setSpotRect({ top: r.top, left: r.left, width: r.width, height: r.height });

        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }, [current?.target]);

    useLayoutEffect(() => {
        if (!show) return;
        const id = requestAnimationFrame(() => reposition());
        return () => cancelAnimationFrame(id);
    }, [show, step, reposition]);

    useEffect(() => {
        if (!show) return;
        window.addEventListener('resize', reposition);
        return () => window.removeEventListener('resize', reposition);
    }, [show, reposition]);

    useEffect(() => {
        if (!show) return;
        const onKey = (e) => {
            if (e.key === 'Escape') onDone();
            if (e.key === 'ArrowRight') advance();
            if (e.key === 'ArrowLeft' && step > 0) setStep(s => s - 1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [show, step]);

    useEffect(() => {
        if (show) setStep(0);
    }, [show]);

    const advance = () => {
        if (step < STEPS.length - 1) setStep(s => s + 1);
        else onDone();
    };

    if (!show) return null;

    const pad = 6;
    const sr = spotRect;

    // Build SVG clip path for the spotlight cutout
    const hasSpot = sr && sr.width > 0;
    const sx = sr ? sr.left - pad : 0;
    const sy = sr ? sr.top - pad : 0;
    const sw = sr ? sr.width + pad * 2 : 0;
    const sh = sr ? sr.height + pad * 2 : 0;
    const r = 8; // corner radius

    const arrowStyle = (placement, arrowX) => {
        const ARROW = 7;
        const base = { position: 'absolute', width: 0, height: 0 };
        if (placement === 'bottom') return {
            ...base, top: -ARROW, left: Math.max(14, Math.min(arrowX, BOX_W - 14)),
            transform: 'translateX(-50%)',
            borderLeft: `${ARROW}px solid transparent`,
            borderRight: `${ARROW}px solid transparent`,
            borderBottom: `${ARROW}px solid #0E7F41`,
        };
        if (placement === 'top') return {
            ...base, bottom: -ARROW, left: Math.max(14, Math.min(arrowX, BOX_W - 14)),
            transform: 'translateX(-50%)',
            borderLeft: `${ARROW}px solid transparent`,
            borderRight: `${ARROW}px solid transparent`,
            borderTop: `${ARROW}px solid #0E7F41`,
        };
        return {};
    };

    const progress = ((step + 1) / STEPS.length) * 100;

    return (
        <>
            {/* Full-screen backdrop with SVG cutout */}
            <svg
                className="fixed inset-0 w-full h-full z-[99990]"
                style={{ pointerEvents: 'none' }}
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <mask id="tour-mask">
                        <rect width="100%" height="100%" fill="white" />
                        {hasSpot && (
                            <rect
                                x={sx} y={sy} width={sw} height={sh}
                                rx={r} ry={r}
                                fill="black"
                            />
                        )}
                    </mask>
                </defs>
                <rect
                    width="100%" height="100%"
                    fill="rgba(0,0,0,0.5)"
                    mask="url(#tour-mask)"
                />
                {/* Spotlight border ring */}
                {hasSpot && (
                    <rect
                        x={sx} y={sy} width={sw} height={sh}
                        rx={r} ry={r}
                        fill="none"
                        stroke="#0E7F41"
                        strokeWidth="2"
                    />
                )}
            </svg>

            {/* Clickable dismiss layer (behind tooltip) */}
            <div
                className="fixed inset-0 z-[99991]"
                onClick={onDone}
                style={{ cursor: 'pointer' }}
            />

            {/* Tooltip box */}
            <div
                ref={boxRef}
                onClick={(e) => e.stopPropagation()}
                className="fixed z-[99999] bg-white rounded-xl shadow-2xl overflow-hidden"
                style={{
                    width: BOX_W,
                    maxWidth: `calc(100vw - ${SCREEN_PAD * 2}px)`,
                    top: pos?.top ?? -9999,
                    left: pos?.left ?? -9999,
                }}
            >
                {/* Arrow */}
                {pos?.arrowX != null && <div style={arrowStyle(pos.placement, pos.arrowX)} />}

                {/* Green header */}
                <div className="bg-[#0E7F41] px-3 pt-2.5 pb-2">
                    {/* Progress bar */}
                    <div className="w-full h-1 bg-white/25 rounded-full mb-2">
                        <div
                            className="h-full bg-white rounded-full transition-all duration-400"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        {/* Dot indicators */}
                        <div className="flex items-center gap-1.5">
                            {STEPS.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setStep(i)}
                                    className={`rounded-full transition-all duration-200 ${i === step ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'}`}
                                />
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/70 font-medium">{step + 1} / {STEPS.length}</span>
                            <button onClick={onDone} className="text-white/60 hover:text-white transition-colors text-sm leading-none" title="Close tour">✕</button>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="px-3 pt-2.5 pb-1">
                    <p className="text-xs font-bold text-gray-900 mb-1 leading-snug">{current.title}</p>
                    <p className="text-[11px] text-gray-600 leading-relaxed">{current.body}</p>

                    {current.tip && (
                        <div className="mt-2 flex items-start gap-1.5 bg-[#F0FFF7] border border-[#C6EDD9] rounded-lg px-2 py-1.5">
                            <svg className="w-3 h-3 text-[#0E7F41] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-[10px] text-[#0E7F41] leading-relaxed font-medium">{current.tip}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
                    <button onClick={onDone} className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
                        Skip tour
                    </button>
                    <div className="flex items-center gap-1.5">
                        {step > 0 && (
                            <button
                                onClick={() => setStep(s => s - 1)}
                                className="text-[11px] px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                ← Back
                            </button>
                        )}
                        <button
                            onClick={advance}
                            className="text-[11px] px-3 py-1 rounded-lg bg-[#0E7F41] text-white hover:bg-[#0a5f31] transition-colors font-medium"
                        >
                            {step === STEPS.length - 1 ? '✓ Done' : 'Next →'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
