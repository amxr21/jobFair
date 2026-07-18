import { useTranslation } from "react-i18next";

// Shared "failed to load" state for list pages — distinguishes a genuine
// fetch failure from an empty list (which uses NoApplicants instead), so the
// user sees a clear retry action rather than a misleading "nothing here".
const LoadListError = ({ onRetry, label }) => {
    const { t } = useTranslation();
    // Callers pass an English noun ("companies", "applicants"). Look it up in the
    // `common.loadLabels` map so it localizes; fall back to a generic noun.
    const what = label
        ? t(`common.loadLabels.${label}`, t("common.itemsFallback"))
        : t("common.itemsFallback");
    return (
    <div className="flex flex-col gap-2 items-center justify-center mt-4 border border-line w-full p-3 rounded-xl text-gray-500 dark:text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 text-red-500 dark:text-red-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <p className="text-sm">{t("common.couldntLoad", { what })}</p>
        <button
            onClick={onRetry}
            className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-contrast hover:bg-primary-hover transition-colors font-medium"
        >
            {t("common.tryAgain")}
        </button>
    </div>
    );
};

export default LoadListError;