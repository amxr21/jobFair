import { useState, useRef, useEffect } from "react";

// Same visual identity as the login/signup SelectInput (border, green focus
// ring, rotating chevron, checkmarked options) but without the label/required
// chrome — sized for compact, inline contexts like table cells and cards.
// Options may be plain strings or { value, label } objects.
const CompactSelect = ({ value, onChange, options = [], placeholder = "Select…", className = "" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [closing, setClosing] = useState(false);
    const wrapRef = useRef(null);
    const closeTimer = useRef(null);

    const norm = options.map((o) => (typeof o === "object" ? o : { value: o, label: o }));
    const selected = norm.find((o) => o.value === value);

    useEffect(() => {
        const onOutside = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) closeDropdown();
        };
        document.addEventListener("mousedown", onOutside);
        return () => document.removeEventListener("mousedown", onOutside);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => () => clearTimeout(closeTimer.current), []);

    const openDropdown = () => {
        clearTimeout(closeTimer.current);
        setClosing(false);
        setIsOpen(true);
    };

    const closeDropdown = () => {
        setIsOpen((wasOpen) => {
            if (wasOpen) {
                setClosing(true);
                closeTimer.current = setTimeout(() => setClosing(false), 160);
            }
            return false;
        });
    };

    const handleSelect = (opt) => {
        onChange?.({ target: { value: opt.value } });
        closeDropdown();
    };

    const panelVisible = isOpen || closing;

    return (
        <div className={`relative w-full ${className}`} ref={wrapRef}>
            <button
                type="button"
                onClick={() => (isOpen ? closeDropdown() : openDropdown())}
                className={`w-full flex items-center justify-between gap-2 border rounded-lg px-3 py-1.5 text-sm bg-white text-left transition-all duration-200 ${
                    isOpen ? "border-[#0E7F41] ring-2 ring-[#0E7F41]/30" : "border-gray-200 hover:border-gray-300"
                }`}
            >
                <span className={`truncate ${selected ? "text-gray-800" : "text-gray-400"}`}>
                    {selected ? selected.label : placeholder}
                </span>
                <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {panelVisible && (
                <div
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto origin-top"
                    style={{
                        transition: "opacity 0.16s ease, transform 0.16s cubic-bezier(0.16,1,0.3,1)",
                        opacity: isOpen ? 1 : 0,
                        transform: isOpen ? "scaleY(1) translateY(0)" : "scaleY(0.96) translateY(-2px)",
                    }}
                >
                    {norm.length === 0 && <div className="px-3 py-2 text-sm text-gray-400">No options</div>}
                    {norm.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleSelect(opt)}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg ${
                                opt.value === value ? "bg-[#0E7F41]/10 text-[#0E7F41] font-medium" : "text-gray-700 hover:bg-[#0E7F41]/10"
                            }`}
                        >
                            <span className="truncate">{opt.label}</span>
                            {opt.value === value && (
                                <svg className="w-4 h-4 text-[#0E7F41] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CompactSelect;
