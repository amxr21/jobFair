import { useEffect, useRef, useState } from "react";
import i18n from "../i18n";

// Full-screen backdrop shown while the app re-renders for a language switch.
// A language change flips `dir` (LTR<->RTL) on <html>, which cascades into
// logical-property repositioning, mirrored flex/grid order, and font-metric
// changes across the whole tree — that can take a few extra frames to fully
// settle (nested containers, chart libraries, deferred/lazy content). Without
// this, users can briefly see a half-flipped, misaligned frame. No text is
// shown here (by design) since any label would itself be mid-switch.
const SETTLE_FRAMES = 8;
const MAX_WAIT_MS = 1200;
const MIN_VISIBLE_MS = 220;

const LanguageTransitionOverlay = () => {
    const [visible, setVisible] = useState(false);
    const [fadingOut, setFadingOut] = useState(false);
    const shownAtRef = useRef(0);
    const rafRef = useRef(null);
    const timeoutRef = useRef(null);
    const hideTimeoutRef = useRef(null);

    useEffect(() => {
        const clearPending = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        };

        const settle = () => {
            shownAtRef.current = Date.now();
            setFadingOut(false);
            setVisible(true);

            const finish = () => {
                const elapsed = Date.now() - shownAtRef.current;
                const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
                hideTimeoutRef.current = setTimeout(() => {
                    setFadingOut(true);
                    hideTimeoutRef.current = setTimeout(() => setVisible(false), 180);
                }, remaining);
            };

            // Wait for webfont metrics (Arabic/Latin swap) plus a handful of animation
            // frames so layout has actually painted in the new direction before lifting
            // the backdrop — a fixed timer alone can't tell "settled" from "still mid-flip".
            const fontsReady = typeof document !== "undefined" && document.fonts
                ? document.fonts.ready
                : Promise.resolve();

            let frames = 0;
            const tick = () => {
                frames++;
                if (frames >= SETTLE_FRAMES) {
                    fontsReady.then(finish).catch(finish);
                } else {
                    rafRef.current = requestAnimationFrame(tick);
                }
            };
            rafRef.current = requestAnimationFrame(tick);

            // Absolute safety net — never block the UI indefinitely if something
            // about the settle detection goes wrong.
            timeoutRef.current = setTimeout(finish, MAX_WAIT_MS);
        };

        i18n.on("languageChanged", settle);
        return () => {
            i18n.off("languageChanged", settle);
            clearPending();
        };
    }, []);

    if (!visible) return null;

    return (
        <div
            className={`fixed inset-0 z-[999999] flex items-center justify-center bg-white dark:bg-gray-950 transition-opacity duration-150 ${
                fadingOut ? "opacity-0" : "opacity-100"
            }`}
            aria-hidden="true"
        >
            <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
            </div>
        </div>
    );
};

export default LanguageTransitionOverlay;
