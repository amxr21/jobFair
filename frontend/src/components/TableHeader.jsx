const SortArrow = ({ isActive, isAscending }) => (
    <svg
        className={`w-3 h-3 ml-1 transition-transform duration-200 ${isActive ? 'opacity-100' : 'opacity-40'} ${isActive && !isAscending ? 'rotate-180' : 'rotate-0'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
);

const TableHeader = ({userType, sortColumn, isAscending, onSort}) => {
    const headerClass = "flex items-center truncate";
    const baseClickable = "flex items-center truncate cursor-pointer hover:text-blue-600 transition-all duration-200 px-1.5 py-0.5 rounded-md -ml-1.5";
    const activeClass = "bg-blue-100 text-blue-700";
    const getClickableClass = (columnName) => `${baseClickable} ${sortColumn === columnName ? activeClass : ''}`;

    // Responsive visibility classes
    // Hide on tablets (≤1024px): Nationality, CGPA, CV
    // Hide on mobile (≤768px): also UniID
    const hideOnTablet = "hidden lg:flex"; // Show only on lg (1024px+)
    const hideOnMobile = "hidden md:flex"; // Show only on md (768px+)

    return userType != 'manager'
    ?
        <div className="row grid py-2 pl-3 md:pl-7 pr-4 md:pr-8 rounded-xl font-semibold text-xs xl:text-sm items-center">
            <h2 className={headerClass}>#</h2>
            <h2 className={getClickableClass('Name')} onClick={() => onSort?.('Name')}><span>Name</span><SortArrow isActive={sortColumn === 'Name'} isAscending={isAscending} /></h2>
            <h2 className={`${getClickableClass('University ID')} ${hideOnMobile}`} onClick={() => onSort?.('University ID')}><span className="lg:inline hidden">University </span><span>ID</span><SortArrow isActive={sortColumn === 'University ID'} isAscending={isAscending} /></h2>
            <h2 className={`${getClickableClass('Nationality')} ${hideOnTablet}`} onClick={() => onSort?.('Nationality')}><span>Nationality</span><SortArrow isActive={sortColumn === 'Nationality'} isAscending={isAscending} /></h2>
            <h2 className={`${getClickableClass('CGPA')} ${hideOnTablet}`} onClick={() => onSort?.('CGPA')}><span>CGPA</span><SortArrow isActive={sortColumn === 'CGPA'} isAscending={isAscending} /></h2>
            <h2 className={getClickableClass('Major')} onClick={() => onSort?.('Major')}><span>Major</span><SortArrow isActive={sortColumn === 'Major'} isAscending={isAscending} /></h2>
            <h2 className={`${getClickableClass('CV')} ${hideOnTablet}`} onClick={() => onSort?.('CV')}><span>CV</span><SortArrow isActive={sortColumn === 'CV'} isAscending={isAscending} /></h2>
            <h2 className={getClickableClass('Status')} onClick={() => onSort?.('Status')}><span>Status</span><SortArrow isActive={sortColumn === 'Status'} isAscending={isAscending} /></h2>
            <h2 className={`${headerClass} text-[#F3F6FF]`}>.</h2>
        </div>
    :
        <div className="row-manager grid py-2 pl-3 md:pl-7 pr-4 md:pr-8 rounded-xl font-semibold text-xs xl:text-sm items-center">
            <h2 className={headerClass}>#</h2>
            <h2 className={getClickableClass('Company Name')} onClick={() => onSort?.('Company Name')}><span className="md:inline hidden">Company </span><span>Name</span><SortArrow isActive={sortColumn === 'Company Name'} isAscending={isAscending} /></h2>
            <h2 className={`${getClickableClass('Company Email')} ${hideOnMobile}`} onClick={() => onSort?.('Company Email')}><span>Email</span><SortArrow isActive={sortColumn === 'Company Email'} isAscending={isAscending} /></h2>
            <h2 className={`${getClickableClass('Representatives')} ${hideOnTablet}`} onClick={() => onSort?.('Representatives')}><span>Reps</span><SortArrow isActive={sortColumn === 'Representatives'} isAscending={isAscending} /></h2>
            <h2 className={`${getClickableClass('City')} ${hideOnTablet}`} onClick={() => onSort?.('City')}><span>City</span><SortArrow isActive={sortColumn === 'City'} isAscending={isAscending} /></h2>
            <h2 className={`${getClickableClass('Sector')} ${hideOnTablet}`} onClick={() => onSort?.('Sector')}><span>Sector</span><SortArrow isActive={sortColumn === 'Sector'} isAscending={isAscending} /></h2>
            <h2 className={`${getClickableClass('No of App')} ${hideOnTablet}`} onClick={() => onSort?.('No of App')}><span>Apps</span><SortArrow isActive={sortColumn === 'No of App'} isAscending={isAscending} /></h2>
            <h2 className={getClickableClass('Status')} onClick={() => onSort?.('Status')}><span>Status</span><SortArrow isActive={sortColumn === 'Status'} isAscending={isAscending} /></h2>
            <h2 className={`${headerClass} text-[#F3F6FF]`}>.</h2>
        </div>

}

export default TableHeader;