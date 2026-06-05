import { useEffect, useState, useRef } from 'react';

const TOUR_KEY = 'applicants_tour_v1';

const STEPS = [
    {
        target: 'tour-search',
        title: 'Search by name',
        body: 'Type any part of an applicant\'s name. Matches are highlighted in yellow — all rows stay visible so you can see context.',
        placement: 'bottom',
    },
    {
        target: 'tour-flag-btn',
        title: 'Flagged filter',
        body: 'Click to show only applicants you\'ve flagged for follow-up. Click again to show everyone.',
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
        body: 'Click any column header to sort the list. Click again to reverse the order. The active sort column is highlighted.',
        placement: 'bottom',
    },
    {
        target: 'tour-first-row',
        title: 'Expand a row',
        body: 'Click the ↗ icon on the right of any row to open the full applicant profile — including QR code, all details, and shortlist / reject / flag actions.',
        placement: 'top',
    },
    {
        target: 'tour-register-btn',
        title: 'Register an applicant',
        body: 'Opens a QR scanner. Scan a student\'s QR code to register them under your company.',
        placement: 'bottom',
    },
];

const ARROW_SIZE = 7;

function getTargetRect(targetId) {
    const el = document.querySelector(`[data-tour="${targetId}"]`);
    if (!el) return null;
    return el.getBoundingClientRect();
}

export default function TourGuide({ show, onDone }) {
    const [step, setStep] = useState(0);
    const [pos, setPos] = useState({ top: 0, left: 0, arrowLeft: '50%', arrowTop: null, flip: false });
    const boxRef = useRef(null);

    const current = STEPS[step];

    useEffect(() => {
        if (!show) return;
        position();
    }, [show, step]);

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

    const position = () => {
        const rect = getTargetRect(current.target);
        if (!rect || !boxRef.current) {
            // fallback to centre
            setPos({ top: window.innerHeight / 2 - 80, left: window.innerWidth / 2 - 140, arrowLeft: '50%', arrowTop: null, flip: false });
            return;
        }
        const boxW = boxRef.current.offsetWidth || 280;
        const boxH = boxRef.current.offsetHeight || 120;
        const vp = window.innerHeight;
        const scrollY = window.scrollY;

        const placement = current.placement;
        let top, left;
        let arrowLeft = '50%';
        let arrowTop = null;
        let flip = false;

        if (placement === 'bottom') {
            top = rect.bottom + scrollY + ARROW_SIZE + 6;
            if (top + boxH > vp + scrollY - 16) {
                top = rect.top + scrollY - boxH - ARROW_SIZE - 6;
                flip = true;
            }
        } else {
            top = rect.top + scrollY - boxH - ARROW_SIZE - 6;
            if (top < scrollY + 8) {
                top = rect.bottom + scrollY + ARROW_SIZE + 6;
                flip = true;
            }
        }

        left = rect.left + rect.width / 2 - boxW / 2;
        left = Math.max(8, Math.min(left, window.innerWidth - boxW - 8));

        const arrowX = rect.left + rect.width / 2 - left;
        arrowLeft = `${Math.max(12, Math.min(arrowX, boxW - 12))}px`;

        setPos({ top, left, arrowLeft, arrowTop, flip });

        // Scroll target into view smoothly
        const el = document.querySelector(`[data-tour="${current.target}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    };

    const advance = () => {
        if (step < STEPS.length - 1) setStep(s => s + 1);
        else onDone();
    };

    const skip = () => onDone();

    if (!show) return null;

    return (
        <>
            {/* Dim backdrop — no pointer-events so user can still interact */}
            <div className="fixed inset-0 z-[99990] pointer-events-none" style={{ background: 'rgba(0,0,0,0.35)' }} />

            {/* Spotlight cutout around target */}
            <TargetSpotlight targetId={current.target} />

            {/* Tooltip box */}
            <div
                ref={boxRef}
                className="fixed z-[99999] w-[280px] bg-white rounded-lg shadow-2xl border border-gray-200 p-3"
                style={{ top: pos.top, left: pos.left }}
            >
                {/* Arrow */}
                <div
                    className="absolute w-0 h-0"
                    style={{
                        left: pos.arrowLeft,
                        transform: 'translateX(-50%)',
                        ...(pos.flip
                            ? { bottom: -ARROW_SIZE, borderLeft: `${ARROW_SIZE}px solid transparent`, borderRight: `${ARROW_SIZE}px solid transparent`, borderTop: `${ARROW_SIZE}px solid white` }
                            : { top: -ARROW_SIZE, borderLeft: `${ARROW_SIZE}px solid transparent`, borderRight: `${ARROW_SIZE}px solid transparent`, borderBottom: `${ARROW_SIZE}px solid white` }
                        ),
                    }}
                />

                {/* Progress dots */}
                <div className="flex items-center gap-1 mb-2">
                    {STEPS.map((_, i) => (
                        <span
                            key={i}
                            className={`rounded-full transition-all duration-200 ${i === step ? 'w-4 h-1.5 bg-[#0E7F41]' : 'w-1.5 h-1.5 bg-gray-300'}`}
                        />
                    ))}
                    <span className="ml-auto text-[10px] text-gray-400">{step + 1}/{STEPS.length}</span>
                </div>

                <p className="text-xs font-bold text-gray-800 mb-1">{current.title}</p>
                <p className="text-[11px] text-gray-600 leading-relaxed">{current.body}</p>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <button onClick={skip} className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
                        Skip tour
                    </button>
                    <div className="flex items-center gap-2">
                        {step > 0 && (
                            <button
                                onClick={() => setStep(s => s - 1)}
                                className="text-[11px] px-2.5 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={advance}
                            className="text-[11px] px-3 py-1 rounded bg-[#0E7F41] text-white hover:bg-[#0a5f31] transition-colors font-medium"
                        >
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

    useEffect(() => {
        const el = document.querySelector(`[data-tour="${targetId}"]`);
        if (!el) { setRect(null); return; }
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }, [targetId]);

    if (!rect) return null;

    const pad = 4;
    return (
        <div
            className="fixed z-[99991] rounded pointer-events-none"
            style={{
                top: rect.top - pad,
                left: rect.left - pad,
                width: rect.width + pad * 2,
                height: rect.height + pad * 2,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
                borderRadius: 6,
            }}
        />
    );
}
