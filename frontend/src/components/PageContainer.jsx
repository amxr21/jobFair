import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TopBar, AccessButtons } from "./index";
import PageHelp from "./PageHelp";

const TOP_BAR_HIDDEN_KEY = "topbar_hidden";

// The TopBar is visible by default here (it used to be hover-only, which made
// it easy to lose — the trigger strip was a tiny 16px target). A small
// persistent toggle lets the user collapse it back for extra vertical space;
// the choice is remembered across visits via localStorage.
export const CollapsibleTopBarWrapper = ({ user }) => {
    const { t } = useTranslation();
    const [hidden, setHidden] = useState(() => {
        try { return localStorage.getItem(TOP_BAR_HIDDEN_KEY) === "1"; } catch { return false; }
    });

    const toggle = () => {
        setHidden((prev) => {
            const next = !prev;
            try { localStorage.setItem(TOP_BAR_HIDDEN_KEY, next ? "1" : "0"); } catch { /* ignore */ }
            return next;
        });
    };

    return (
        <div className="relative w-full shrink-0">
            <div className={`overflow-hidden transition-all duration-200 ${hidden ? "max-h-0" : "max-h-24"}`}>
                <TopBar user={user} />
            </div>
            <button
                onClick={toggle}
                title={hidden ? t("topbar.show") : t("topbar.hide")}
                aria-label={hidden ? t("topbar.show") : t("topbar.hide")}
                className="absolute start-1/2 -translate-x-1/2 top-full w-10 h-3.5 rounded-b-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center z-10"
            >
                <svg className={`w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${hidden ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
            </button>
        </div>
    );
};

const PageContainer = ({ user, children, title, titleExtra, headerRight, showAccessButtons = false, collapsibleTopBar = false, noHorizontalPadding = false }) => {
    return (
        <div className="page-container flex flex-col gap-y-2 md:gap-y-2 flex-1 min-w-0 overflow-y-auto p-2 md:p-4 lg:p-0 max-h-[95vh]">
            {showAccessButtons && <AccessButtons otherClasses={'md:hidden'} />}
            {collapsibleTopBar ? <CollapsibleTopBarWrapper user={user} /> : <TopBar user={user} />}
            <div id="Hero" className={`bg-[#F3F6FF] dark:bg-gray-950 flex flex-col grow overflow-hidden rounded-lg py-2 md:py-3 lg:py-4 w-full animate-fadeIn ${noHorizontalPadding ? "" : "px-2 md:px-3 lg:px-4"}`}>

                {/* Header Section */}
                {(title || titleExtra || headerRight) && (
                    <div className={`flex md:flex-row flex-col justify-between items-start md:items-center gap-1.5 md:gap-0 ps-1 border-b border-b-gray-300 dark:border-b-gray-700 pb-2 md:pb-2.5 mb-1.5 md:mb-2 ${noHorizontalPadding ? "px-2 md:px-3 lg:px-4" : ""}`}>
                        <div className="flex flex-col md:flex-row gap-1.5 md:gap-x-3 items-start md:items-center w-full md:w-auto">
                            <div className="flex items-center gap-2">
                                {title && <h2 className="text-sm md:text-base xl:text-lg font-bold dark:text-gray-100">{title}</h2>}
                                <PageHelp user={user} />
                            </div>
                            {titleExtra}
                        </div>
                        <div className="hidden md:block">
                            {headerRight}
                        </div>
                    </div>
                )}

                {/* Main Content */}
                {noHorizontalPadding ? <div className="flex flex-col grow overflow-hidden px-2 md:px-3 lg:px-4">{children}</div> : children}
            </div>
        </div>
    );
};

export default PageContainer;
