import { useState } from "react";
import { TopBar, AccessButtons } from "./index";
import PageHelp from "./PageHelp";

// Keeps the global TopBar hidden by default, revealed on hover via a small
// trigger tab. The trigger reserves a fixed-height slot so nothing below it
// ever reflows; the revealed TopBar is absolutely positioned to overlay on
// top of the page content instead of pushing it down. Hover handlers live on
// both the trigger and the revealed bar itself so moving the mouse from one
// to the other doesn't collapse it prematurely.
const CollapsibleTopBarWrapper = ({ user }) => {
    const [hovered, setHovered] = useState(false);
    const enter = () => setHovered(true);
    const leave = () => setHovered(false);

    return (
        <div className="relative w-full h-2 shrink-0">
            <div
                onMouseEnter={enter}
                onMouseLeave={leave}
                className="absolute left-1/2 -translate-x-1/2 top-0 w-16 h-2 rounded-b-md bg-gray-200 hover:bg-gray-300 transition-colors cursor-pointer z-10"
                title="Show top bar"
            />
            <div
                onMouseEnter={enter}
                onMouseLeave={leave}
                className={`absolute left-0 right-0 top-2 z-20 transition-all duration-150 bg-white dark:bg-gray-900 rounded-md shadow-lg ${
                    hovered ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
                }`}
            >
                <TopBar user={user} />
            </div>
        </div>
    );
};

const PageContainer = ({ user, children, title, titleExtra, headerRight, showAccessButtons = false, collapsibleTopBar = false }) => {
    return (
        <div className="page-container flex flex-col gap-y-2 md:gap-y-2 flex-1 min-w-0 overflow-y-auto p-2 md:p-4 lg:p-0 max-h-[95vh]">
            {showAccessButtons && <AccessButtons otherClasses={'md:hidden'} />}
            {collapsibleTopBar ? <CollapsibleTopBarWrapper user={user} /> : <TopBar user={user} />}
            <div id="Hero" className="bg-[#F3F6FF] dark:bg-gray-950 flex flex-col grow overflow-hidden rounded-lg p-2 md:p-3 lg:p-4 w-full animate-fadeIn">

                {/* Header Section */}
                {(title || titleExtra || headerRight) && (
                    <div className="flex md:flex-row flex-col justify-between items-start md:items-center gap-1.5 md:gap-0 pl-1 border-b border-b-gray-300 dark:border-b-gray-700 pb-2 md:pb-2.5 mb-1.5 md:mb-2">
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
                {children}
            </div>
        </div>
    );
};

export default PageContainer;
