// Per-user font/text-size preference — applied app-wide via CSS custom
// properties (see :root defaults in style.css). Shared between App.jsx (which
// re-applies the saved preference on load/login) and the Customize tab in
// EventSettings.jsx (which lets the user change it).

export const FONT_OPTIONS = [
    { id: "default", label: "Default", stack: "'29LTBukra', 'Inter', sans-serif" },
    { id: "inter", label: "Inter", stack: "'Inter', sans-serif" },
    { id: "system", label: "System", stack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
];

export const SIZE_OPTIONS = [
    { id: "small", label: "Small", px: "14px" },
    { id: "medium", label: "Medium", px: "16px" },
    { id: "large", label: "Large", px: "18px" },
];

const DEFAULT_FONT_ID = "default";
const DEFAULT_SIZE_ID = "medium";

// Namespaced per logged-in account so different users of the same browser
// keep independent preferences, matching the app's existing "user" object
// shape from useAuthContext()/localStorage.
export function customizeKey(user, suffix) {
    const who = user?.email || user?.user_id || "anon";
    return `event_ops_customize_${suffix}_${who}`;
}

export function getSavedCustomization(user) {
    const fontId = localStorage.getItem(customizeKey(user, "font")) || DEFAULT_FONT_ID;
    const sizeId = localStorage.getItem(customizeKey(user, "size")) || DEFAULT_SIZE_ID;
    return { fontId, sizeId };
}

export function applyCustomization(fontId, sizeId) {
    const font = FONT_OPTIONS.find((f) => f.id === fontId) || FONT_OPTIONS[0];
    const size = SIZE_OPTIONS.find((s) => s.id === sizeId) || SIZE_OPTIONS[1];
    document.documentElement.style.setProperty("--user-font-family", font.stack);
    document.documentElement.style.setProperty("--user-font-size", size.px);
}

export function saveCustomization(user, fontId, sizeId) {
    localStorage.setItem(customizeKey(user, "font"), fontId);
    localStorage.setItem(customizeKey(user, "size"), sizeId);
}
