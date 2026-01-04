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

    return userType != 'manager'
    ?
        <div className="row grid py-2 pl-7 pr-8 rounded-xl font-semibold text-xs xl:text-sm items-center">
            <h2 className={headerClass}>#</h2>
            <h2 className={getClickableClass('Name')} onClick={() => onSort?.('Name')}><span>Name</span><SortArrow isActive={sortColumn === 'Name'} isAscending={isAscending} /></h2>
            <h2 className={getClickableClass('University ID')} onClick={() => onSort?.('University ID')}><span>University ID</span><SortArrow isActive={sortColumn === 'University ID'} isAscending={isAscending} /></h2>
            <h2 className={getClickableClass('Nationality')} onClick={() => onSort?.('Nationality')}><span>Nationality</span><SortArrow isActive={sortColumn === 'Nationality'} isAscending={isAscending} /></h2>
            <h2 className={getClickableClass('CGPA')} onClick={() => onSort?.('CGPA')}><span>CGPA</span><SortArrow isActive={sortColumn === 'CGPA'} isAscending={isAscending} /></h2>
            <h2 className={getClickableClass('Major')} onClick={() => onSort?.('Major')}><span>Major</span><SortArrow isActive={sortColumn === 'Major'} isAscending={isAscending} /></h2>
            <h2 className={getClickableClass('CV')} onClick={() => onSort?.('CV')}><span>CV</span><SortArrow isActive={sortColumn === 'CV'} isAscending={isAscending} /></h2>
            <h2 className={getClickableClass('Status')} onClick={() => onSort?.('Status')}><span>Status</span><SortArrow isActive={sortColumn === 'Status'} isAscending={isAscending} /></h2>
            <h2 className={`${headerClass} text-[#F3F6FF]`}>.</h2>
        </div>
    :
        <div className="row-manager grid py-2 pl-7 pr-8 rounded-xl font-semibold text-xs xl:text-sm items-center">
            <h2 className={headerClass}>#</h2>
            <h2 className={getClickableClass('Company Name')} onClick={() => onSort?.('Company Name')}><span>Company Name</span><SortArrow isActive={sortColumn === 'Company Name'} isAscending={isAscending} /></h2>
            <h2 className={getClickableClass('Company Email')} onClick={() => onSort?.('Company Email')}><span>Company Email</span><SortArrow isActive={sortColumn === 'Company Email'} isAscending={isAscending} /></h2>
            <h2 className={getClickableClass('Representatives')} onClick={() => onSort?.('Representatives')}><span>Representatives</span><SortArrow isActive={sortColumn === 'Representatives'} isAscending={isAscending} /></h2>
            <h2 className={getClickableClass('City')} onClick={() => onSort?.('City')}><span>City</span><SortArrow isActive={sortColumn === 'City'} isAscending={isAscending} /></h2>
            <h2 className={getClickableClass('Sector')} onClick={() => onSort?.('Sector')}><span>Sector</span><SortArrow isActive={sortColumn === 'Sector'} isAscending={isAscending} /></h2>
            <h2 className={getClickableClass('No of App')} onClick={() => onSort?.('No of App')}><span>No of App</span><SortArrow isActive={sortColumn === 'No of App'} isAscending={isAscending} /></h2>
            <h2 className={getClickableClass('Status')} onClick={() => onSort?.('Status')}><span>Status</span><SortArrow isActive={sortColumn === 'Status'} isAscending={isAscending} /></h2>
            <h2 className={`${headerClass} text-[#F3F6FF]`}>.</h2>
        </div>

}

export default TableHeader;