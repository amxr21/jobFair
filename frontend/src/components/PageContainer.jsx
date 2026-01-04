import { TopBar, AccessButtons } from "./index";

const PageContainer = ({ user, children, title, titleExtra, headerRight, showAccessButtons = false }) => {
    return (
        <div className="page-container flex flex-col gap-y-4 xl:gap-y-6 flex-1 min-w-0 overflow-y-auto p-6 md:p-0 max-h-[95vh]">
            {showAccessButtons && <AccessButtons otherClasses={'md:hidden'} />}
            <TopBar user={user} />
            <div id="Hero" className="bg-[#F3F6FF] flex flex-col grow overflow-hidden rounded-xl p-6 w-full animate-fadeIn">

                {/* Header Section */}
                {(title || titleExtra || headerRight) && (
                    <div className="flex md:flex-row flex-col justify-between items-center pl-2 border-b border-b-gray-400 pb-4 mb-3">
                        <div className="flex gap-x-4 items-center">
                            {title && <h2 className="text-center text-xl xl:text-2xl font-bold md:my-0 md:mb-0 mb-4">{title}</h2>}
                            {titleExtra}
                        </div>
                        {headerRight}
                    </div>
                )}

                {/* Main Content */}
                {children}
            </div>
        </div>
    );
};

export default PageContainer;
