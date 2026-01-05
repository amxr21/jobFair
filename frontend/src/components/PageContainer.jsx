import { TopBar, AccessButtons } from "./index";

const PageContainer = ({ user, children, title, titleExtra, headerRight, showAccessButtons = false }) => {
    return (
        <div className="page-container flex flex-col gap-y-3 md:gap-y-4 xl:gap-y-6 flex-1 min-w-0 overflow-y-auto p-3 md:p-6 lg:p-0 max-h-[95vh]">
            {showAccessButtons && <AccessButtons otherClasses={'md:hidden'} />}
            <TopBar user={user} />
            <div id="Hero" className="bg-[#F3F6FF] flex flex-col grow overflow-hidden rounded-xl p-3 md:p-4 lg:p-6 w-full animate-fadeIn">

                {/* Header Section */}
                {(title || titleExtra || headerRight) && (
                    <div className="flex md:flex-row flex-col justify-between items-start md:items-center gap-2 md:gap-0 pl-1 md:pl-2 border-b border-b-gray-400 pb-3 md:pb-4 mb-2 md:mb-3">
                        <div className="flex flex-col md:flex-row gap-2 md:gap-x-4 items-start md:items-center w-full md:w-auto">
                            {title && <h2 className="text-base md:text-xl xl:text-2xl font-bold">{title}</h2>}
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
