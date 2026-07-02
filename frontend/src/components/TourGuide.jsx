import { useEffect, useState, useRef, useLayoutEffect } from 'react';

export const APPLICANTS_TOUR_KEY = 'applicants_tour_v3';
export const MANAGERS_TOUR_KEY = 'managers_tour_v3';

// ─── Step definitions ─────────────────────────────────────────────────────────

const APPLICANT_STEPS = [
    {
        target: 'tour-search',
        title: 'Search applicants by name or ID',
        body: 'Type any part of a full name or university ID to instantly filter the list. Results update live as you type — no need to press Enter or submit anything.',
        placement: 'bottom',
        tip: 'The search is case-insensitive. Clearing the field restores all applicants immediately.',
    },
    {
        target: 'tour-flag-btn',
        title: 'Flag filter — focus on your shortlist',
        body: 'Click the flag icon to show only the applicants you have personally flagged for follow-up. Click it again to return to the full list. Flags are private to your account and persist across sessions.',
        placement: 'bottom',
        tip: 'You can flag any applicant by expanding their row and clicking the flag icon inside.',
    },
    {
        target: 'tour-filter-btn',
        title: 'Advanced filters — narrow down fast',
        body: 'Open the filter panel to filter by major, nationality, CGPA range, attendance status, CV presence, shortlist/rejection status, languages, skills, expected graduation, and more. Multiple filters stack — only applicants matching ALL selected criteria appear.',
        placement: 'bottom',
        tip: 'Active filters show as blue chips at the top. Click × on any chip to remove it, or "Clear all" to reset everything.',
    },
    {
        target: 'tour-table-header',
        title: 'Sort by any column',
        body: 'Click any column header — Name, University ID, Nationality, CGPA, Major, or Status — to sort the list by that column. Click the same header again to reverse the sort order. An arrow indicator shows which column is active.',
        placement: 'bottom',
        tip: 'CGPA sorts highest-first by default. Sorting is applied on top of any active filters.',
    },
    {
        target: 'tour-first-row',
        title: 'Expand a row — full applicant profile',
        body: 'Click the ↗ expand icon on the right of any row to open that applicant\'s full profile. Inside you can: view their QR code, download their CV, see all personal and academic details, and take actions — shortlist, reject, flag, or undo any of those.',
        placement: 'top',
        tip: 'Shortlisted and rejected statuses are visible to all company managers. Flags are private to you only.',
    },
    {
        target: 'tour-register-btn',
        title: 'Register & confirm attendance',
        body: '"Register an Applicant" opens a QR scanner — scan a student\'s printed QR code to link them to your company\'s applicant list. "Confirm Attendance" scans their QR a second time to mark them as physically present at the fair. Both actions require camera access.',
        placement: 'bottom',
        tip: 'Allow camera permissions when prompted. You can also confirm attendance from inside the expanded applicant row.',
    },
];

const MANAGER_STEPS = [
    {
        target: 'tour-search',
        title: 'Search companies by name',
        body: 'Type any part of a company name to instantly filter the list. Results update live as you type. The search matches against the full registered company name.',
        placement: 'bottom',
        tip: 'Search is case-insensitive and works alongside any active filters.',
    },
    {
        target: 'tour-filter-btn',
        title: 'Filter companies',
        body: 'Open the filter panel to filter by attendance status (Pending / Confirmed / Canceled), sector (Private / Federal / Semi / Local), city, industry fields, whether they have registered applicants, and reminder email status. Combine multiple filters to zero in on a subset.',
        placement: 'bottom',
        tip: 'Use "Reminder Status: Not Sent" to quickly surface companies that haven\'t been contacted yet.',
    },
    {
        target: 'tour-register-btn',
        title: 'Send confirmation reminder emails',
        body: 'Opens a modal listing all pending companies. Select individual companies or use "Select All Pending" to batch-select, then click Send. Each selected company receives a confirmation link by email. Sent timestamps appear next to each company.',
        placement: 'bottom',
        tip: 'Only companies with Pending status appear in the reminder modal. Already-confirmed companies are excluded.',
    },
    {
        target: 'tour-table-header',
        title: 'Sort companies by any column',
        body: 'Click any column header — Company Name, Email, Representatives, Sector, City, No. of Applicants, or Status — to sort. Click again to reverse. Use "No. of Applicants" to see which companies are attracting the most student interest.',
        placement: 'bottom',
        tip: 'Sorting by Status groups Confirmed, Pending, and Canceled companies together for easy batch review.',
    },
    {
        target: 'tour-first-row',
        title: 'Expand a company row — full profile & actions',
        body: 'Click the ↗ expand icon on any row to open the full company profile. View their delegate list, preferred majors, opportunity types, and applicants. You can also directly change their attendance status — Confirm, Cancel, or Reset to Pending — from this panel.',
        placement: 'top',
        tip: 'Status changes take effect immediately. The company receives no automatic notification when you change their status manually here.',
    },
];

// ─── Positioning ──────────────────────────────────────────────────────────────

const BOX_W = 320;
const GAP = 14;
const SCREEN_PAD = 16;

function computePosition(targetEl, boxEl) {
    if (!targetEl || !boxEl) return null;
    const tr = targetEl.getBoundingClientRect();
    // Measure the real rendered box — never assume the hard-coded width fits the viewport
    const boxW = boxEl.offsetWidth || BOX_W;
    const boxH = boxEl.offsetHeight || 200;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const clampX = (x) => Math.max(SCREEN_PAD, Math.min(x, vw - boxW - SCREEN_PAD));
    const clampY = (y) => Math.max(SCREEN_PAD, Math.min(y, vh - boxH - SCREEN_PAD));
    const cx = tr.left + tr.width / 2 - boxW / 2;

    const tries = {
        bottom: () => { const top = tr.bottom + GAP; if (top + boxH <= vh - SCREEN_PAD) { const left = clampX(cx); return { top, left, placement: 'bottom', arrowX: tr.left + tr.width / 2 - left }; } },
        top:    () => { const top = tr.top - boxH - GAP; if (top >= SCREEN_PAD) { const left = clampX(cx); return { top, left, placement: 'top', arrowX: tr.left + tr.width / 2 - left }; } },
        right:  () => { const left = tr.right + GAP; if (left + boxW <= vw - SCREEN_PAD) return { top: clampY(tr.top + tr.height / 2 - boxH / 2), left, placement: 'right', arrowX: null }; },
        left:   () => { const left = tr.left - boxW - GAP; if (left >= SCREEN_PAD) return { top: clampY(tr.top + tr.height / 2 - boxH / 2), left, placement: 'left', arrowX: null }; },
    };
    for (const p of ['bottom', 'top', 'right', 'left']) { const r = tries[p](); if (r) return r; }
    return { top: clampY(vh / 2 - boxH / 2), left: clampX(vw / 2 - boxW / 2), placement: 'bottom', arrowX: boxW / 2 };
}

const samePos = (a, b) => a && b && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && a.placement === b.placement && a.arrowX === b.arrowX;
const sameRect = (a, b) => a && b && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5;

// ─── Component ────────────────────────────────────────────────────────────────

export default function TourGuide({ show, onDone, variant = 'applicants' }) {
    const STEPS = variant === 'managers' ? MANAGER_STEPS : APPLICANT_STEPS;
    const [step, setStep] = useState(0);
    const [pos, setPos] = useState(null);
    const [spotRect, setSpotRect] = useState(null);
    const boxRef = useRef(null);
    const current = STEPS[step];

    // Continuous tracking loop: re-measures the target every animation frame while the
    // tour is open. This survives scrolling (any container), smooth-scroll animations,
    // layout shifts, late-rendering targets, sidebar transitions, and window resizes —
    // no event wiring can miss a movement because nothing is event-driven.
    useLayoutEffect(() => {
        if (!show) return;
        let raf;
        let scrolled = false;
        const tick = () => {
            const el = document.querySelector(`[data-tour="${current?.target}"]`);
            if (el) {
                // Bring the target into view once per step, instantly — a smooth scroll
                // would keep moving the target after we measured it
                if (!scrolled) { el.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' }); scrolled = true; }
                const r = computePosition(el, boxRef.current);
                if (r) setPos(prev => (samePos(prev, r) ? prev : r));
                const br = el.getBoundingClientRect();
                const next = { top: br.top, left: br.left, width: br.width, height: br.height };
                setSpotRect(prev => (sameRect(prev, next) ? prev : next));
            } else {
                // Target not in the DOM (data still loading / element hidden): center the
                // box and drop the spotlight; keep polling — it snaps on as soon as it mounts
                setSpotRect(prev => (prev === null ? prev : null));
                const boxW = boxRef.current?.offsetWidth || BOX_W;
                const boxH = boxRef.current?.offsetHeight || 200;
                const r = { top: Math.max(SCREEN_PAD, window.innerHeight / 2 - boxH / 2), left: Math.max(SCREEN_PAD, window.innerWidth / 2 - boxW / 2), placement: 'bottom', arrowX: null };
                setPos(prev => (samePos(prev, r) ? prev : r));
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [show, step, current?.target]);
    useEffect(() => {
        if (!show) return;
        const onKey = (e) => { if (e.key === 'Escape') onDone(); if (e.key === 'ArrowRight') advance(); if (e.key === 'ArrowLeft' && step > 0) setStep(s => s - 1); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [show, step]);
    useEffect(() => { if (show) setStep(0); }, [show]);

    const advance = () => { if (step < STEPS.length - 1) setStep(s => s + 1); else onDone(); };

    if (!show) return null;

    const pad = 6;
    const sr = spotRect;
    const hasSpot = sr && sr.width > 0;
    const ARROW = 8;
    const arrowStyle = (placement, arrowX) => {
        const base = { position: 'absolute', width: 0, height: 0 };
        if (placement === 'bottom') return { ...base, top: -ARROW, left: Math.max(16, Math.min(arrowX, BOX_W - 16)), transform: 'translateX(-50%)', borderLeft: `${ARROW}px solid transparent`, borderRight: `${ARROW}px solid transparent`, borderBottom: `${ARROW}px solid #0E7F41` };
        if (placement === 'top') return { ...base, bottom: -ARROW, left: Math.max(16, Math.min(arrowX, BOX_W - 16)), transform: 'translateX(-50%)', borderLeft: `${ARROW}px solid transparent`, borderRight: `${ARROW}px solid transparent`, borderTop: `${ARROW}px solid #0E7F41` };
        return {};
    };

    return (
        <>
            <svg className="fixed inset-0 w-full h-full z-[99990] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <mask id="tour-spotlight-mask">
                        <rect width="100%" height="100%" fill="white" />
                        {hasSpot && <rect x={sr.left - pad} y={sr.top - pad} width={sr.width + pad * 2} height={sr.height + pad * 2} rx="8" fill="black" />}
                    </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#tour-spotlight-mask)" />
                {hasSpot && <rect x={sr.left - pad} y={sr.top - pad} width={sr.width + pad * 2} height={sr.height + pad * 2} rx="8" fill="none" stroke="#0E7F41" strokeWidth="2.5" />}
            </svg>

            <div className="fixed inset-0 z-[99991] cursor-pointer" onClick={onDone} />

            <div
                ref={boxRef}
                onClick={(e) => e.stopPropagation()}
                className="fixed z-[99999] bg-white rounded-2xl shadow-2xl overflow-hidden"
                style={{ width: BOX_W, maxWidth: `calc(100vw - ${SCREEN_PAD * 2}px)`, top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
            >
                {pos?.arrowX != null && <div style={arrowStyle(pos.placement, pos.arrowX)} />}

                <div className="bg-[#0E7F41] px-4 pt-3 pb-2.5">
                    <div className="w-full h-1 bg-white/25 rounded-full mb-2.5">
                        <div className="h-full bg-white rounded-full transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            {STEPS.map((_, i) => (
                                <button key={i} onClick={() => setStep(i)} className={`rounded-full transition-all duration-200 ${i === step ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/40 hover:bg-white/70'}`} />
                            ))}
                        </div>
                        <div className="flex items-center gap-2.5">
                            <span className="text-[11px] text-white/70 font-medium tabular-nums">{step + 1} / {STEPS.length}</span>
                            <button onClick={onDone} className="text-white/60 hover:text-white transition-colors text-base leading-none" title="Close">✕</button>
                        </div>
                    </div>
                </div>

                <div className="px-4 pt-3 pb-1">
                    <p className="text-[13px] font-semibold text-gray-900 mb-1.5 leading-snug">{current.title}</p>
                    <p className="text-[12px] text-gray-600 leading-relaxed">{current.body}</p>
                    {current.tip && (
                        <div className="mt-2.5 flex items-start gap-2 bg-[#F0FFF7] border border-[#C6EDD9] rounded-xl px-2.5 py-2">
                            <svg className="w-3.5 h-3.5 text-[#0E7F41] mt-px shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-[11px] text-[#0E7F41] leading-relaxed font-medium">{current.tip}</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 mt-1">
                    <button onClick={onDone} className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">Skip tour</button>
                    <div className="flex items-center gap-2">
                        {step > 0 && (
                            <button onClick={() => setStep(s => s - 1)} className="text-[12px] px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium">← Back</button>
                        )}
                        <button onClick={advance} className="text-[12px] px-4 py-1.5 rounded-lg bg-[#0E7F41] text-white hover:bg-[#0a6535] transition-colors font-semibold">
                            {step === STEPS.length - 1 ? '✓ Done' : 'Next →'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
