// Skeleton placeholder rows shown while a list is loading — reuses the same
// .row/.row-manager grid classes as the real rows (see style.css) so the
// layout doesn't jump once real content arrives, unlike the previous
// spinner-only version which collapsed the whole list body to one small
// centered row.
const Bar = ({ w = "w-full" }) => <div className={`h-3 rounded bg-gray-200 animate-pulse ${w}`} />;

const LoadingApplicants = ({ userType = "applicant", rows = 8 }) => {
    const isManager = userType === "manager";
    const rowClass = isManager ? "row-manager" : "row";
    const columnCount = isManager ? 8 : 9;

    return (
        <div className="flex flex-col gap-1 mt-1" aria-busy="true" aria-label={isManager ? "Loading companies" : "Loading applicants"}>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className={`${rowClass} grid items-center py-2.5 pl-3 md:pl-5 pr-4 md:pr-6 rounded-lg`}>
                    {Array.from({ length: columnCount }).map((_, c) => (
                        <div key={c} className="pr-2">
                            <Bar w={c === 0 ? "w-4" : c === columnCount - 1 ? "w-4" : "w-3/4"} />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default LoadingApplicants;
