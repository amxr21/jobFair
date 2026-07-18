import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Reusable modal shell — the one true source of the app's modal identity and
// animation. Unlike a plain `if (!visible) return null`, the closing state
// stays mounted for the duration of the exit animation before actually
// unmounting — that's what makes closing feel like a transition instead of a
// hard cut. Every dialog in the app should render through this component.
const Modal = ({
    visible, onClose, children,
    maxWidth = "max-w-lg",
    wrapperClassName = "",
    contentClassName = "",
    contentStyle,
    contentRef,
    zIndex = 200,
    backdropClassName = "bg-black/50",
    closeOnBackdrop = true,
}) => {
    const [mounted, setMounted] = useState(visible);
    const [phase, setPhase] = useState(visible ? "open" : "closed");
    const closeTimer = useRef(null);

    useEffect(() => {
        if (visible) {
            clearTimeout(closeTimer.current);
            // Always mount in the pre-open ("opening") state first — even if the
            // modal was already mounted — so the browser paints the closed
            // transform/opacity, THEN flip to "open" on a later frame so the CSS
            // transition has two distinct states to interpolate between. Two
            // rAFs weren't always enough for a large modal (the first paint can
            // land between them), which made it snap open instantly; a rAF
            // followed by a short timeout guarantees a painted "opening" frame.
            setMounted(true);
            setPhase("opening");
            let t;
            const id = requestAnimationFrame(() => { t = setTimeout(() => setPhase("open"), 20); });
            return () => { cancelAnimationFrame(id); clearTimeout(t); };
        } else if (mounted) {
            setPhase("closing");
            closeTimer.current = setTimeout(() => setMounted(false), 240);
        }
        return () => clearTimeout(closeTimer.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    useEffect(() => () => clearTimeout(closeTimer.current), []);

    if (!mounted) return null;

    const backdropState = phase === "open" ? "backdrop-open" : phase === "closing" ? "backdrop-close" : "";
    const boxState = phase === "open" ? "modal-open" : phase === "closing" ? "modal-close" : "";

    return createPortal(
        <div className={`fixed inset-0 flex items-center justify-center ${wrapperClassName}`} style={{ zIndex }} onMouseDown={(e) => e.stopPropagation()}>
            <div
                className={`expandDetails-backdrop absolute inset-0 ${backdropClassName} ${backdropState}`}
                onClick={closeOnBackdrop ? onClose : undefined}
            />
            <div
                ref={contentRef}
                style={contentStyle}
                className={`expandDetails absolute top-1/2 left-1/2 bg-surface-card text-fg rounded-2xl shadow-2xl w-full ${maxWidth} mx-4 max-h-[90vh] overflow-hidden flex flex-col ${boxState} ${contentClassName}`}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
