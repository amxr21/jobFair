import { useTranslation } from "react-i18next";

// Compact EN/AR toggle. Direction (<html dir>/lang) is handled centrally by the
// i18n `languageChanged` listener (see i18n/index.js), so this just flips the
// language and everything else follows.
const LanguageToggle = () => {
    const { i18n } = useTranslation();
    const current = i18n.resolvedLanguage || i18n.language || "en";
    const isAr = current.startsWith("ar");

    const toggle = () => i18n.changeLanguage(isAr ? "en" : "ar");

    return (
        <button
            onClick={toggle}
            className="flex items-center justify-center h-9 min-w-9 px-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-100 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800"
            aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
            title={isAr ? "English" : "العربية"}
        >
            {isAr ? "EN" : "ع"}
        </button>
    );
};

export default LanguageToggle;
