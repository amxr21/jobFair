import { useTranslation } from "react-i18next";

const Success = ({result}) => {
    const { t } = useTranslation();
    return (
        <div className="flex items-center gap-3 px-4 py-3 border-s-4 border-green-500 bg-green-50 text-green-800 dark:bg-green-500/15 dark:text-green-300 rounded-lg shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div className="text-sm font-medium">
                <span className="font-semibold">{t("common.success")}:</span> <span className="bidi-ltr">{result}</span>
            </div>
        </div>
    )
}

export default Success