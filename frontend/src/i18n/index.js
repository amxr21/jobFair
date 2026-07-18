import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import ar from "./locales/ar.json";

// i18n foundation. English is the default; Arabic is the RTL locale. There is
// NO auto-detection — the app always starts in English unless the user has
// explicitly chosen a language before (persisted in localStorage under
// "app_lang"). The user is the only one who changes it, via the toggle.
// Untranslated strings fall back to English so the app never shows a raw key.

const LANG_KEY = "app_lang";

const getInitialLanguage = () => {
    try {
        const saved = localStorage.getItem(LANG_KEY);
        if (saved === "en" || saved === "ar") return saved;
    } catch { /* ignore */ }
    return "en"; // default, not navigator-detected
};

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            ar: { translation: ar },
        },
        lng: getInitialLanguage(),
        fallbackLng: "en",
        supportedLngs: ["en", "ar"],
        interpolation: { escapeValue: false }, // React already escapes
        // No Suspense: resources are bundled synchronously, and Suspense-based
        // loading throws under React 17 if a component renders before i18n is
        // ready — which was surfacing as page errors.
        react: { useSuspense: false },
    });

export const isRtlLang = (lng) => (lng || "").startsWith("ar");

// Persist the user's explicit choice and keep <html dir>/<html lang> in sync
// with the active language — applied on load and on every change, so a saved
// Arabic preference flips the whole app to RTL from first paint (even on pages
// without the toggle, like login).
const applyLanguage = (lng) => {
    try { localStorage.setItem(LANG_KEY, lng); } catch { /* quota */ }
    if (typeof document !== "undefined") {
        const root = document.documentElement;
        root.setAttribute("lang", lng || "en");
        root.setAttribute("dir", isRtlLang(lng) ? "rtl" : "ltr");
    }
};
applyLanguage(i18n.resolvedLanguage || i18n.language || "en");
i18n.on("languageChanged", applyLanguage);

export default i18n;
