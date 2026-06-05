import { useEffect, useState, useRef, useLayoutEffect } from 'react';

const TOUR_KEY = 'applicants_tour_v1';

const STEPS = [
    {
        target: 'tour-search',
        title: 'Search by name',
        body: "Type any part of an applicant's name. Matches are highlighted in yellow — all rows stay visible so you can see context.",
        placement: 'bottom',
    },
    {
        target: 'tour-flag-btn',
        title: 'Flagged filter',
        body: "Click to show only applicants you've flagged for follow-up. Click again to show everyone.",
        placement: 'bottom',
    },
    {
        target: 'tour-filter-btn',
        title: 'Advanced filters',
        body: 'Filter by major, nationality, CGPA, attendance status, and more. Active filters appear as chips — click × on any chip to remove it individually.',
        placement: 'bottom',
    },
    {
        target: 'tour-table-header',
        title: 'Sort columns',
        body: 'Click any column header to sort the list. Click again to reverse the order.',
        placement: 'bottom',
    },
    {
        target: 'tour-first-row',
        title: 'Expand a row',
        body: 'Click the ↗ icon on the right of any row to open the full applicant profile — QR code, all details, shortlist / reject / flag actions.',
        placement: 'top',
    },
    {
        target: 'tour-register-btn',
        title: 'Register an applicant',
        body: "Opens a QR scanner. Scan a student's QR code to register them under your company.",
        placement: 'bottom',
    },
];

const BOX_W = 260;
const ARROW_H = 7;
const GAP = 6;
const SCREEN_PAD = 10;

function computePosition(targetEl, boxEl) {
    if (!targetEl || !boxEl) return null;

    const tr = targetEl.getBoundingClientRect();
    const boxH = boxEl.offsetHeight || 120;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Try preferred placements in order: bottom → top → right → left
    const placements = ['bottom', 'top', 'right', 'left'];

    for (const placement of placements) {
        let top, left;

        if (placement === 'bottom') {
            top = tr.bottom + GAP + ARROW_H;
            left = tr.left + tr.width / 2 - BOX_W / 2;
            if (top + boxH <= vh - SCREEN_PAD) {
                left = Math.max(SCREEN_PAD, Math.min(left, vw - BOX_W - SCREEN_PAD));
                const arrowX = tr.left + tr.width / 2 - left;
                return { top, left, placement: 'bottom', arrowX: Math.max(12, Math.min(arrowX, BOX_W - 12)) };
            }
        } else if (placement === 'top') {
            top = tr.top - boxH - GAP - ARROW_H;
            left = tr.left + tr.width / 2 - BOX_W / 2;
            if (top >= SCREEN_PAD) {
                left = Math.max(SCREEN_PAD, Math.min(left, vw - BOX_W - SCREEN_PAD));
                const arrowX = tr.left + tr.width / 2 - left;
                return { top, left, placement: 'top', arrowX: Math.max(12, Math.min(arrowX, BOX_W - 12)) };
            }
        } else if (placement === 'right') {
            left = tr.right + GAP + ARROW_H;
            top = tr.top + tr.height / 2 - boxH / 2;
            if (left + BOX_W <= vw - SCREEN_PAD) {
                top = Math.max(SCREEN_PAD, Math.min(top, vh - boxH - SCREEN_PAD));
                return { top, left, placement: 'right', arrowX: null };
            }
        } else {
            left = tr.left - BOX_W - GAP - ARROW_H;
            top = tr.top + tr.height / 2 - boxH / 2;
            if (left >= SCREEN_PAD) {
                top = Math.max(SCREEN_PAD, Math.min(top, vh - boxH - SCREEN_PAD));
                return { top, left, placement: 'left', arrowX: null };
            }
        }
    }

    // Fallback: center of screen
    return {
        top: Math.max(SCREEN_PAD, vh / 2 - 80),
        left: Math.max(SCREEN_PAD, vw / 2 - BOX_W / 2),
        placement: 'bottom',
        arrowX: BOX_W / 2,
    };
}

export default function TourGuide({ show, onDone }) {
    const [step, setStep] = useState(0);
    const [pos, setPos] = useState(null);
    const boxRef = useRef(null);

    const current = STEPS[step];

    const reposition = () => {
        const targetEl = document.querySelector(`[data-tour="${current.target}"]`);
        const result = computePosition(targetEl, boxRef.current);
        if (result) setPos(result);
        targetEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    };

    // Measure after paint so boxRef.current.offsetHeight is accurate
    useLayoutEffect(() => {
        if (!show) return;
        // rAF ensures the box is rendered before we measure
        const id = requestAnimationFrame(() => reposition());
        return () => cancelAnimationFrame(id);
    }, [show, step]);

    useEffect(() => {
        if (!show) return;
        window.addEventListener('resize', reposition);
        return () => window.removeEventListener('resize', reposition);
    }, [show, step]);

    // Keyboard nav
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

    // Outside-click dismiss
    useEffect(() => {
        if (!show) return;
        const onDown = (e) => {
            if (boxRef.current && !boxRef.current.contains(e.target)) onDone();
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [show]);

    const advance = () => {
        if (step < STEPS.length - 1) setStep(s => s + 1);
        else onDone();
    };

    if (!show) return null;

    const arrowStyle = (placement, arrowX) => {
        const base = { position: 'absolute', width: 0, height: 0, transform: 'translateX(-50%)' };
        if (placement === 'bottom') return { ...base, top: -ARROW_H, left: arrowX, borderLeft: `${ARROW_H}px solid transparent`, borderRight: `${ARROW_H}px solid transparent`, borderBottom: `${ARROW_H}px solid white` };
        if (placement === 'top') return { ...base, bottom: -ARROW_H, left: arrowX, borderLeft: `${ARROW_H}px solid transparent`, borderRight: `${ARROW_H}px solid transparent`, borderTop: `${ARROW_H}px solid white` };
        return {};
    };

    return (
        <>
            {/* Spotlight — pointer-events: none so table stays interactive */}
            <TargetSpotlight targetId={current.target} />

            {/* Tooltip */}
            <div
                ref={boxRef}
                onMouseDown={(e) => e.stopPropagation()}
                className="fixed z-[99999] bg-white rounded-lg shadow-2xl border border-gray-200 p-3"
                style={{
                    width: BOX_W,
                    maxWidth: `calc(100vw - ${SCREEN_PAD * 2}px)`,
                    top: pos?.top ?? -9999,
                    left: pos?.left ?? -9999,
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                }}
            >
                {pos && pos.arrowX != null && (
                    <div style={arrowStyle(pos.placement, pos.arrowX)} />
                )}

                {/* Progress dots */}
                <div className="flex items-center gap-1 mb-2">
                    {STEPS.map((_, i) => (
                        <span key={i} className={`rounded-full transition-all duration-200 ${i === step ? 'w-4 h-1.5 bg-[#0E7F41]' : 'w-1.5 h-1.5 bg-gray-300'}`} />
                    ))}
                    <span className="ml-auto text-[10px] text-gray-400">{step + 1}/{STEPS.length}</span>
                </div>

                <p className="text-xs font-bold text-gray-800 mb-1">{current.title}</p>
                <p className="text-[11px] text-gray-600 leading-relaxed">{current.body}</p>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <button onClick={onDone} className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
                        Skip tour
                    </button>
                    <div className="flex items-center gap-2">
                        {step > 0 && (
                            <button onClick={() => setStep(s => s - 1)} className="text-[11px] px-2.5 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                                Back
                            </button>
                        )}
                        <button onClick={advance} className="text-[11px] px-3 py-1 rounded bg-[#0E7F41] text-white hover:bg-[#0a5f31] transition-colors font-medium">
                            {step === STEPS.length - 1 ? 'Done' : 'Next →'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

function TargetSpotlight({ targetId }) {
    const [rect, setRect] = useState(null);

    useLayoutEffect(() => {
        const el = document.querySelector(`[data-tour="${targetId}"]`);
        if (!el) { setRect(null); return; }
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }, [targetId]);

    if (!rect) return null;

    const pad = 4;
    return (
        <div
            className="fixed z-[99991] pointer-events-none"
            style={{
                top: rect.top - pad,
                left: rect.left - pad,
                width: rect.width + pad * 2,
                height: rect.height + pad * 2,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.25)',
                borderRadius: 6,
            }}
        />
    );
}
