import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

// Same visual identity as the login/signup SelectInput (border, green focus
// ring, rotating chevron, checkmarked options) but without the label/required
// chrome — sized for compact, inline contexts like table cells and cards.
// Options may be plain strings or { value, label } objects.
const CompactSelect = ({ value, onChange, options = [], placeholder, className = "", tOption }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [closing, setClosing] = useState(false);
    const wrapRef = useRef(null);
    const closeTimer = useRef(null);

    const { t } = useTranslation();
    const resolvedPlaceholder = placeholder ?? t("common.select");

    // `tOption` lets a caller translate the DISPLAY label of a fixed-option value
    // (e.g. translateEnum("priority", v)) while `value` stays the English/DB form.
    const norm = options.map((o) => {
        const base = typeof o === "object" ? o : { value: o, label: o };
        return tOption ? { ...base, label: tOption(base.value) } : base;
    });
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
                className={`w-full flex items-center justify-between gap-2 border rounded-lg px-3 py-1.5 text-sm bg-surface-card text-start transition-all duration-200 ${
                    isOpen ? "border-primary ring-2 ring-primary/30" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
            >
                <span className={`truncate ${selected ? "text-gray-800 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"}`}>
                    {selected ? selected.label : resolvedPlaceholder}
                </span>
                <svg className={`w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {panelVisible && (
                <div
                    className="absolute z-50 w-full mt-1 bg-surface-card border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-52 overflow-y-auto origin-top"
                    style={{
                        transition: "opacity 0.16s ease, transform 0.16s cubic-bezier(0.16,1,0.3,1)",
                        opacity: isOpen ? 1 : 0,
                        transform: isOpen ? "scaleY(1) translateY(0)" : "scaleY(0.96) translateY(-2px)",
                    }}
                >
                    {norm.length === 0 && <div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">{t("common.noOptions")}</div>}
                    {norm.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleSelect(opt)}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-start text-sm transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg ${
                                opt.value === value ? "bg-primary/10 text-primary font-medium" : "text-gray-700 dark:text-gray-300 hover:bg-primary/10"
                            }`}
                        >
                            <span className="truncate">{opt.label}</span>
                            {opt.value === value && (
                                <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
