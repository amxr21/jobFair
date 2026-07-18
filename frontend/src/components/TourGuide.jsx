import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

export const APPLICANTS_TOUR_KEY = 'applicants_tour_v3';
export const MANAGERS_TOUR_KEY = 'managers_tour_v3';

// ─── Step definitions ─────────────────────────────────────────────────────────
// Only the STRUCTURE (which element each step points at + preferred placement)
// lives here. The user-facing text (title/body/tip) is translated — looked up by
// index from the `tour.applicants` / `tour.managers` arrays in the locale files.

const APPLICANT_TARGETS = [
    { target: 'tour-search', placement: 'bottom' },
    { target: 'tour-flag-btn', placement: 'bottom' },
    { target: 'tour-filter-btn', placement: 'bottom' },
    { target: 'tour-table-header', placement: 'bottom' },
    { target: 'tour-first-row', placement: 'top' },
    { target: 'tour-register-btn', placement: 'bottom' },
];

const MANAGER_TARGETS = [
    { target: 'tour-search', placement: 'bottom' },
    { target: 'tour-filter-btn', placement: 'bottom' },
    { target: 'tour-register-btn', placement: 'bottom' },
    { target: 'tour-table-header', placement: 'bottom' },
    { target: 'tour-first-row', placement: 'top' },
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
    const { t } = useTranslation();
    const TARGETS = variant === 'managers' ? MANAGER_TARGETS : APPLICANT_TARGETS;
    // Merge the structural targets with the translated text for the active language.
    const texts = t(`tour.${variant === 'managers' ? 'managers' : 'applicants'}`, { returnObjects: true });
    const STEPS = TARGETS.map((tgt, i) => ({ ...tgt, ...(Array.isArray(texts) ? texts[i] : {}) }));
    const [step, setStep] = useState(0);
    const [pos, setPos] = useState(null);
    const [spotRect, setSpotRect] = useState(null);
    const boxRef = useRef(null);
    const { isDark } = useTheme();
    const brand = isDark ? '#34C775' : '#0E7F41'; // two-tier brand green for SVG/inline
    const current = STEPS[step];

    // Continuous tracking loop: re-measures the target every animation frame while the
    // tour is open. This survives scrolling (any container), smooth-scroll animations,
    // layout shifts, late-rendering targets, sidebar transitions, and window resizes —
    // no event wiring can miss a movement because nothing is event-driven.
    useLayoutEffect(() => {
        if (!show) return;
        let raf;
        let scrolled = false;
        // Keep forcing fresh measurements (ignore samePos/sameRect's "no-op" shortcut)
        // until layout has truly settled — a cold-cache webfont swap (FOIT/FOUT) or a
        // still-finishing scroll/transition can land an early rect that LOOKS stable
        // for a frame or two but is actually about to shift, which is exactly the
        // "unaligned, then correct after a refresh" symptom (a warm font cache on
        // reload never hits this window). Also gated on document.fonts.ready so a
        // slow font load can't sneak a stale measurement in as "final".
        let settleFrames = 20;
        let fontsReady = typeof document === 'undefined' || !document.fonts ? true : false;
        if (!fontsReady) {
            document.fonts.ready.then(() => { fontsReady = true; settleFrames = Math.max(settleFrames, 6); });
        }
        const tick = () => {
            const el = document.querySelector(`[data-tour="${current?.target}"]`);
            if (el) {
                // Bring the target into view once per step, instantly — a smooth scroll
                // would keep moving the target after we measured it. The scroll can still
                // take a few frames to actually land (sticky headers, nested scroll
                // containers), so keep re-measuring for a short settle window afterward
                // instead of trusting the very next frame's rect as final — otherwise a
                // mid-scroll rect can get frozen as the spotlight position.
                if (!scrolled) { el.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'nearest' }); scrolled = true; }
                const forceUpdate = settleFrames > 0 || !fontsReady;
                const r = computePosition(el, boxRef.current);
                if (r) setPos(prev => (forceUpdate || !samePos(prev, r) ? r : prev));
                const br = el.getBoundingClientRect();
                const next = { top: br.top, left: br.left, width: br.width, height: br.height };
                setSpotRect(prev => (forceUpdate || !sameRect(prev, next) ? next : prev));
                if (settleFrames > 0) settleFrames--;
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
        if (placement === 'bottom') return { ...base, top: -ARROW, left: Math.max(16, Math.min(arrowX, BOX_W - 16)), transform: 'translateX(-50%)', borderLeft: `${ARROW}px solid transparent`, borderRight: `${ARROW}px solid transparent`, borderBottom: `${ARROW}px solid ${brand}` };
        if (placement === 'top') return { ...base, bottom: -ARROW, left: Math.max(16, Math.min(arrowX, BOX_W - 16)), transform: 'translateX(-50%)', borderLeft: `${ARROW}px solid transparent`, borderRight: `${ARROW}px solid transparent`, borderTop: `${ARROW}px solid ${brand}` };
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
                {hasSpot && <rect x={sr.left - pad} y={sr.top - pad} width={sr.width + pad * 2} height={sr.height + pad * 2} rx="8" fill="none" stroke={brand} strokeWidth="2.5" />}
            </svg>

            <div className="fixed inset-0 z-[99991] cursor-pointer" onClick={onDone} />

            <div
                ref={boxRef}
                onClick={(e) => e.stopPropagation()}
                className="fixed z-[99999] bg-surface-card rounded-2xl shadow-2xl overflow-hidden"
                style={{ width: BOX_W, maxWidth: `calc(100vw - ${SCREEN_PAD * 2}px)`, top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
            >
                {pos?.arrowX != null && <div style={arrowStyle(pos.placement, pos.arrowX)} />}

                <div className="bg-primary px-4 pt-3 pb-2.5">
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
                            <button onClick={onDone} className="text-white/60 hover:text-white transition-colors text-base leading-none" title={t('tour.close')}>✕</button>
                        </div>
                    </div>
                </div>

                <div className="px-4 pt-3 pb-1">
                    <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 mb-1.5 leading-snug">{current.title}</p>
                    <p className="text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed">{current.body}</p>
                    {current.tip && (
                        <div className="mt-2.5 flex items-start gap-2 bg-[#F0FFF7] dark:bg-primary/10 border border-[#C6EDD9] dark:border-primary/25 rounded-xl px-2.5 py-2">
                            <svg className="w-3.5 h-3.5 text-primary mt-px shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-[11px] text-primary leading-relaxed font-medium">{current.tip}</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 mt-1">
                    <button onClick={onDone} className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">{t('tour.skip')}</button>
                    <div className="flex items-center gap-2">
                        {step > 0 && (
                            <button onClick={() => setStep(s => s - 1)} className="text-[12px] px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors font-medium">{t('tour.back')}</button>
                        )}
                        <button onClick={advance} className="text-[12px] px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-contrast transition-colors font-semibold">
                            {step === STEPS.length - 1 ? t('tour.done') : t('tour.next')}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
