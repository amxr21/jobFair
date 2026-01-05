import axios from "axios";
import { useEffect, useRef, useState, useCallback } from "react";

import { useAuthContext } from "../Hooks/useAuthContext";
import { Row, TableHeader, BarButtons, FlagButton, NoApplicants, LoadingApplicants, ScrollToTopButton, PageContainer, FilterDropdown } from "./index";



const MainBanner = ({link}) => {

    const { user } = useAuthContext(); // Access the authenticated user context


    const flagIcon = useRef()
    const scrollableRef = useRef(null);
    const listContainerRef = useRef(null);

    const [ isFlagged, setIsFlagged ] = useState(false)
    const [ isAscending, setIsAscending ] = useState(true)
    const [ activeFilters, setActiveFilters ] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [applicants, setApplicants] = useState([]); // State to store the list of applicants
    const [otherApplicants, setOtherApplicants] = useState([]); // State to store the list of applicants
    const [filterCriteriaa, setFilterCriteria] = useState("")
    const [finalList, setFinalList] = useState([]);
    const [finalOtherList, setFinalOtherList] = useState([]);
    const [isAtTop, setIsAtTop] = useState(true);

    // Pagination state
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 50,
        hasNextPage: false,
        hasPrevPage: false
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [showAll, setShowAll] = useState(false);
    const [activeTab, setActiveTab] = useState('my'); // 'my' or 'other' - for non-CASTO users

    // Check if any filters are active
    const hasActiveFilters = Object.keys(activeFilters).length > 0;

    // Calculate page offset for numbering
    const pageOffset = (hasActiveFilters || showAll) ? 0 : (pagination.currentPage - 1) * pagination.itemsPerPage;
    

    const filter = (e) => {
        const header = e.target.closest('h2');
        if (!header) return;
        const span = header.querySelector('span');
        const columnName = span?.innerText?.trim();
        if(['Name', 'University ID', 'Major', 'Age', 'CGPA', 'Status' , 'Nationality', 'CV'].includes(columnName)){
            if(filterCriteriaa === columnName) {
                setIsAscending(prev => !prev);
            } else {
                setFilterCriteria(columnName);
                setIsAscending(true);
            }
        }
    }



    // Apply local search filter to applicants - ONLY searches by name and uni ID
    const applyLocalSearch = (list, query) => {
        if (!query || query.trim() === '') return list;

        const searchLower = query.toLowerCase().trim();
        return list.filter(app => {
            const fullName = app.applicantDetails?.fullName?.toLowerCase() || '';
            const uniId = app.applicantDetails?.uniId?.toLowerCase() || '';

            return fullName.includes(searchLower) || uniId.includes(searchLower);
        });
    };

    // Apply dropdown filters to applicants
    const applyDropdownFilters = (list, filters) => {
        if (Object.keys(filters).length === 0) return list;

        return list.filter(app => {
            return Object.entries(filters).every(([category, values]) => {
                if (values.length === 0) return true;

                let appValue;
                switch(category) {
                    case 'major':
                        appValue = app.applicantDetails?.major;
                        return values.includes(appValue);
                    case 'nationality':
                        appValue = app.applicantDetails?.nationality;
                        return values.includes(appValue);
                    case 'studyLevel':
                        appValue = app.applicantDetails?.studyLevel;
                        return values.includes(appValue);
                    case 'city':
                        appValue = app.applicantDetails?.city;
                        return values.includes(appValue);
                    case 'cgpaRange':
                        const cgpa = parseFloat(app.applicantDetails?.cgpa);
                        if (cgpa >= 3.5) appValue = '3.5+';
                        else if (cgpa >= 3.0) appValue = '3.0 - 3.49';
                        else if (cgpa >= 2.5) appValue = '2.5 - 2.99';
                        else if (cgpa >= 2.0) appValue = '2.0 - 2.49';
                        else appValue = 'Below 2.0';
                        return values.includes(appValue);
                    case 'status':
                        appValue = app.attended ? 'Confirmed' : 'Registered';
                        return values.includes(appValue);
                    case 'hasCV':
                        appValue = app.cv ? 'Has CV' : 'No CV';
                        return values.includes(appValue);
                    case 'shortlisted':
                        appValue = app.shortlistedBy?.length > 0 ? 'Shortlisted' : 'Not Shortlisted';
                        return values.includes(appValue);
                    case 'rejected':
                        appValue = app.rejectedBy?.length > 0 ? 'Rejected' : 'Not Rejected';
                        return values.includes(appValue);
                    case 'flagged':
                        appValue = app.flags?.length > 0 ? 'Flagged' : 'Not Flagged';
                        return values.includes(appValue);
                    case 'experience':
                        const exp = app.applicantDetails?.experience;
                        appValue = exp && exp.trim() !== '' ? 'Has Experience' : 'No Experience';
                        return values.includes(appValue);
                    case 'expectedGraduation':
                        appValue = app.applicantDetails?.ExpectedToGraduate;
                        return values.includes(appValue);
                    case 'languages':
                        // Check if any of the applicant's languages match any selected filter
                        const langs = app.applicantDetails?.languages;
                        if (!langs) return false;
                        const applicantLangs = String(langs).split(',').map(l => l.trim());
                        return values.some(v => applicantLangs.includes(v));
                    case 'technicalSkills':
                        const techSkills = app.applicantDetails?.technicalSkills;
                        appValue = techSkills && techSkills.trim() !== '' ? 'Has Skills' : 'No Skills';
                        return values.includes(appValue);
                    default:
                        return true;
                }
            });
        });
    };

    const handleFilterChange = (filters) => {
        setActiveFilters(filters);

        // When filters are applied, fetch all applicants to filter the complete dataset
        const hasActiveFilters = Object.keys(filters).length > 0;
        if (hasActiveFilters && !showAll) {
            // Fetch all applicants when filters are active
            fetchApplicants(1, searchQuery, true);
        }
        // Don't auto-reset to paginated when filters are cleared - let user control via Show All button
    };

    // Get unique applicants by uniId, keeping only the latest submission
    const getUniqueLatestApplicants = (applicantsList) => {
        if (!applicantsList || applicantsList.length === 0) return [];
        // Sort by createdAt descending (newest first)
        const sorted = [...applicantsList].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        // Keep only the first occurrence of each uniId (which is the latest due to sorting)
        const seenIds = new Set();
        return sorted.filter((applicant) => {
            const uniId = applicant.applicantDetails?.uniId;
            if (uniId && !seenIds.has(uniId)) {
                seenIds.add(uniId);
                return true;
            }
            return false;
        });
    };

    // Sort/filter function that works on any list
    const sortAndFilterList = (list) => {
        if (list.length === 0) return [];
        // First, deduplicate by uniId keeping latest submissions
        let deduplicated = getUniqueLatestApplicants(list);
        // Filter out system/admin accounts
        deduplicated = deduplicated.filter(app => app.applicantDetails?.email !== 'casto@sharjah.ac.ae');
        let sorted = sortList(deduplicated, filterCriteriaa, isAscending);
        sorted = applyDropdownFilters(sorted, activeFilters);
        if ((hasActiveFilters || showAll) && searchQuery) {
            sorted = applyLocalSearch(sorted, searchQuery);
        }
        return sorted;
    };

    // Generic sort function
    const sortList = (list, filterCriteria, ascending) => {
        let sortedArray = [...list];
        const direction = ascending ? 1 : -1;

        switch (filterCriteria) {
            case "CGPA":
                return sortedArray.sort((a, b) => direction * (b.applicantDetails.cgpa - a.applicantDetails.cgpa));
            case "University ID":
                return sortedArray.sort((a, b) => direction * a.applicantDetails.uniId.localeCompare(b.applicantDetails.uniId));
            case "Major":
                return sortedArray.sort((a, b) => direction * a.applicantDetails.major.localeCompare(b.applicantDetails.major));
            case "Name":
                return sortedArray.sort((a, b) => direction * a.applicantDetails.fullName.toLowerCase().localeCompare(b.applicantDetails.fullName.toLowerCase()));
            case "Nationality":
                return sortedArray.sort((a, b) => direction * a.applicantDetails.nationality.toLowerCase().localeCompare(b.applicantDetails.nationality.toLowerCase()));
            case "Status":
                return sortedArray.sort((a, b) => direction * String(b.attended).toLowerCase().localeCompare(String(a.attended).toLowerCase()));
            case "CV":
                return sortedArray.sort((a, b) => direction * String(a.cv).localeCompare(String(b.cv)));
            case "Age":
                return sortedArray.sort((a, b) => direction * ((2024 - a.applicantDetails.birthdate.split("-")[0]) - (2024 - b.applicantDetails.birthdate.split("-")[0])));
            default:
                return sortedArray.sort((a, b) => b.createdAt - a.createdAt);
        }
    };

    useEffect(() => {
        // Update main list
        if (applicants.length !== 0) {
            const filtered = sortAndFilterList(applicants);
            setFinalList(filtered);
        }

        // Update other list
        if (otherApplicants.length !== 0) {
            const filteredOther = sortAndFilterList(otherApplicants);
            setFinalOtherList(filteredOther);
        }
    }, [filterCriteriaa, applicants, otherApplicants, isAscending, activeFilters, searchQuery, hasActiveFilters, showAll]);



    const fetchApplicants = async (page = 1, search = '', fetchAll = false) => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                page: fetchAll ? '1' : page.toString(),
                limit: fetchAll ? '10000' : '50',
                ...(search && { search })
            });

            // Don't filter by company on API - we need all applicants to show "other" tab
            // Frontend will separate "my" vs "other" applicants

            const response = await axios.get(`${link}/applicants?${params}`, {
                headers: user ? { Authorization: `Bearer ${user.token}` } : {},
            });

            const { applicants: fetchedApplicants, pagination: paginationData } = response.data;

            if (user) {
                if (user.email === "casto@sharjah.ac.ae") {
                    // CASTO sees all applicants
                    setApplicants(fetchedApplicants);
                } else {
                    // For company users, separate into "my" and "other" applicants
                    const myApplicants = fetchedApplicants.filter((applicant) =>
                        applicant.user_id.includes(user.companyName)
                    );
                    const others = fetchedApplicants.filter(
                        (applicant) => !applicant.user_id.includes(user.companyName)
                    );
                    setApplicants(myApplicants);
                    setOtherApplicants(others);
                }
            } else {
                setApplicants(fetchedApplicants);
            }

            setPagination(paginationData);
            setShowAll(fetchAll);
        } catch (err) {
            // Error fetching applicants
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle show all applicants
    const handleShowAll = () => {
        if (showAll) {
            // Go back to paginated view
            fetchApplicants(1, searchQuery, false);
        } else {
            // Fetch all applicants
            fetchApplicants(1, searchQuery, true);
        }
    };

    useEffect(() => {
        if (user) fetchApplicants(1, searchQuery);
    }, [user]); // Fetch applicants on initial load

    // Pagination handlers
    const handleNextPage = () => {
        if (pagination.hasNextPage) {
            fetchApplicants(pagination.currentPage + 1, searchQuery);
        }
    };

    const handlePrevPage = () => {
        if (pagination.hasPrevPage) {
            fetchApplicants(pagination.currentPage - 1, searchQuery);
        }
    };

    // Debounced search - triggers API call after 300ms of no typing
    // When filters are active, search is applied locally (no API call needed)
    const searchTimeoutRef = useRef(null);

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);

        // If filters are active or showAll is on, search is applied locally via useEffect
        if (Object.keys(activeFilters).length > 0 || showAll) {
            return;
        }

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Set new timeout for debounced search
        searchTimeoutRef.current = setTimeout(() => {
            fetchApplicants(1, query);
        }, 300);
    }, [activeFilters, showAll]);

    // console.log(applicants); // Logging to debug and verify the applicants' list

    const isFlaggedRef = useRef(isFlagged);

    useEffect(() => {
        isFlaggedRef.current = isFlagged;
    }, [isFlagged]);

    // Handle scroll for native scrollable list
    const handleListScroll = (e) => {
        setIsAtTop(e.target.scrollTop === 0);
    };

    const filterFlagged = () => {
        setIsFlagged(prev => {
            const newValue = !prev;

            if (newValue) {
                const a = finalList.filter(applicant => applicant.flags?.includes(user?.companyName));
                flagIcon?.current.classList.replace("opacity-50", "opacity-100");
                setFinalList(a);
            } else {
                flagIcon?.current.classList.replace("opacity-100", "opacity-50");
                setFinalList(sortAndFilterList(applicants));
            }

            return newValue;
        });
    };


    return (
        <PageContainer
            user={user}
            title="Applicants list"
            titleExtra={user && (
                <div className="flex gap-2 items-center">
                    {/* Search Input - searches by Name or University ID only */}
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className={`pl-9 pr-3 h-10 text-sm border rounded-xl focus:outline-none focus:border-blue-500 w-64 transition-all duration-200 ${
                                searchQuery
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-[#0E7F41] bg-white opacity-50 hover:opacity-100'
                            }`}
                        />
                        <svg className="absolute left-3 w-4 h-4 text-gray-400" fill="none" stroke={searchQuery ? '#3B82F6' : '#0E7F41'} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <FlagButton btnRef={flagIcon} handleClick={filterFlagged} />
                    <FilterDropdown filters={activeFilters} onFilterChange={handleFilterChange} applicants={[...applicants, ...otherApplicants]} />

                    {/* Page Navigation Arrows - Hide when filters are active */}
                    {!showAll && !hasActiveFilters && (
                        <div className="flex items-center gap-1 ml-2">
                            <button
                                onClick={handlePrevPage}
                                disabled={!pagination.hasPrevPage}
                                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 ${
                                    !pagination.hasPrevPage
                                        ? 'border-gray-300 bg-gray-100 text-gray-300 cursor-not-allowed'
                                        : 'border-[#0E7F41] bg-white text-[#0E7F41] hover:bg-[#0E7F41] hover:text-white'
                                }`}
                                title="Previous 50 applicants"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                </svg>
                            </button>
                            <span className="text-xs text-gray-500 min-w-[40px] text-center">
                                {pagination.currentPage}/{pagination.totalPages}
                            </span>
                            <button
                                onClick={handleNextPage}
                                disabled={!pagination.hasNextPage}
                                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 ${
                                    !pagination.hasNextPage
                                        ? 'border-gray-300 bg-gray-100 text-gray-300 cursor-not-allowed'
                                        : 'border-[#0E7F41] bg-white text-[#0E7F41] hover:bg-[#0E7F41] hover:text-white'
                                }`}
                                title="Next 50 applicants"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Show All / Show Paginated Toggle - Only show if more than 50 results and no filters active */}
                    {(pagination.uniqueStudentCount || pagination.totalItems) > 50 && !hasActiveFilters && (
                        <button
                            onClick={handleShowAll}
                            className={`h-10 px-3 rounded-xl border text-xs font-medium transition-all duration-200 ml-1 ${
                                showAll
                                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                                    : 'border-[#0E7F41] bg-white text-[#0E7F41] hover:bg-[#0E7F41] hover:text-white'
                            }`}
                            title={showAll ? `Show paginated (${pagination.totalPages} pages)` : `Show all ${pagination.uniqueStudentCount || pagination.totalItems} applicants`}
                        >
                            {showAll ? `Paginate (${pagination.totalPages})` : 'Show All'}
                        </button>
                    )}
                </div>
            )}
            headerRight={user && <BarButtons link={link} />}
            showAccessButtons={true}
        >
            {/* Tabs for non-CASTO users */}
            {user?.email !== 'casto@sharjah.ac.ae' && (
                <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            activeTab === 'my'
                                ? 'bg-white text-[#0E7F41] shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        My Applicants
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                            activeTab === 'my' ? 'bg-[#0E7F41] text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                            {finalList.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('other')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            activeTab === 'other'
                                ? 'bg-white text-[#0E7F41] shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Other Applicants
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                            activeTab === 'other' ? 'bg-[#0E7F41] text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                            {finalOtherList.length}
                        </span>
                    </button>
                </div>
            )}

            {/* Main applicants list - shown for CASTO or when 'my' tab is active */}
            {(user?.email === 'casto@sharjah.ac.ae' || activeTab === 'my') && (
                <div ref={listContainerRef} className="relative flex-1 min-h-0 flex flex-col overflow-hidden rounded-lg text-xs md:text-base">
                    <div onClick={filter}>
                        <TableHeader sortColumn={filterCriteriaa} isAscending={isAscending} />
                    </div>

                    {
                        isLoading
                        ?
                        <LoadingApplicants />
                        :
                        finalList.length > 0
                        ?
                        <>
                            <div
                                ref={scrollableRef}
                                className="flex-1 overflow-y-auto list"
                                onScroll={handleListScroll}
                            >
                                {finalList.map((applicant, index) => (
                                    <div key={applicant?._id} className="relative flex flex-col">
                                        <Row
                                            userType={'casto'}
                                            ticketId={applicant?._id}
                                            number={pageOffset + index + 1}
                                            name={applicant?.applicantDetails?.fullName}
                                            uniId={applicant?.applicantDetails?.uniId}
                                            nationality={applicant?.applicantDetails?.nationality}
                                            email={applicant?.applicantDetails?.email}
                                            phoneNumber={applicant?.applicantDetails?.phoneNumber}
                                            studyLevel={applicant?.applicantDetails?.studyLevel}
                                            major={applicant?.applicantDetails?.major}
                                            gpa={applicant?.applicantDetails?.cgpa}
                                            experience={applicant?.applicantDetails?.experience}
                                            attended={applicant?.attended ? "Confirmed" : "No"}
                                            shortlistedBy={applicant?.shortlistedBy}
                                            rejectedBy={applicant?.rejectedBy}
                                            age={2024 - parseInt(applicant?.applicantDetails?.birthdate?.split("-")[0] || 2006)}
                                            languages={String(applicant?.applicantDetails?.languages)}
                                            portfolio={applicant?.applicantDetails?.linkedIn}
                                            file={applicant?.cv}
                                            qrCode={applicant?._id}
                                            status={applicant?.attended}
                                            city={applicant?.applicantDetails?.city}
                                            skills={{tech: applicant?.applicantDetails?.technicalSkills, nontech: applicant?.applicantDetails?.nonTechnicalSkills}}
                                            expectedToGraduate={applicant?.applicantDetails?.ExpectedToGraduate}
                                            flags={applicant?.flags}
                                            user={user}
                                            cv={applicant?.cv?.fieldname}
                                            link={link}
                                            onDelete={(id) => setApplicants(prev => prev.filter(a => a._id !== id))}
                                        />
                                    </div>
                                ))}
                            </div>
                            <ScrollToTopButton isAtTop={isAtTop} scrollableRefC={scrollableRef} />
                        </>
                        :
                        <NoApplicants />

                    }
                </div>
            )}

            {/* Other applicants list - shown when 'other' tab is active (non-CASTO users only) */}
            {user?.email !== 'casto@sharjah.ac.ae' && activeTab === 'other' && (
                <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden rounded-lg text-xs md:text-base">
                    <div onClick={filter}>
                        <TableHeader sortColumn={filterCriteriaa} isAscending={isAscending} />
                    </div>
                    {
                        isLoading
                        ?
                        <LoadingApplicants />
                        :
                        finalOtherList?.length > 0
                        ?
                        <>
                            <div
                                ref={scrollableRef}
                                className="flex-1 overflow-y-auto list"
                                onScroll={handleListScroll}
                            >
                                {finalOtherList.map((otherApplicant, index) => (
                                    <div key={otherApplicant?._id} className="relative flex flex-col">
                                        <Row
                                            userType={'casto'}
                                            ticketId={otherApplicant?._id}
                                            number={index + 1}
                                            name={otherApplicant?.applicantDetails?.fullName}
                                            uniId={otherApplicant?.applicantDetails?.uniId}
                                            email={otherApplicant?.applicantDetails?.email}
                                            phoneNumber={otherApplicant?.applicantDetails?.phoneNumber}
                                            studyLevel={otherApplicant?.applicantDetails?.studyLevel}
                                            major={otherApplicant?.applicantDetails?.major}
                                            gpa={otherApplicant?.applicantDetails?.cgpa}
                                            nationality={otherApplicant?.applicantDetails?.nationality}
                                            experience={otherApplicant?.applicantDetails?.experience}
                                            attended={otherApplicant?.attended ? "Confirmed" : "No"}
                                            shortlistedBy={otherApplicant?.shortlistedBy}
                                            rejectedBy={otherApplicant?.rejectedBy}
                                            age={2024 - parseInt(String(otherApplicant?.applicantDetails?.birthdate)?.slice(0, 4))}
                                            languages={String(otherApplicant?.applicantDetails?.languages)}
                                            portfolio={otherApplicant?.applicantDetails?.linkedIn}
                                            file={otherApplicant?.cv}
                                            qrCode={otherApplicant?._id}
                                            status={otherApplicant?.attended}
                                            city={otherApplicant?.applicantDetails?.city}
                                            skills={{tech: otherApplicant?.applicantDetails?.technicalSkills, nontech: otherApplicant?.applicantDetails?.nonTechnicalSkills}}
                                            expectedToGraduate={otherApplicant?.applicantDetails?.ExpectedToGraduate}
                                            flags={otherApplicant?.flags}
                                            user={user}
                                            cv={otherApplicant?.cv?.fieldname}
                                            link={link}
                                        />
                                    </div>
                                ))}
                            </div>
                            <ScrollToTopButton isAtTop={isAtTop} scrollableRefC={scrollableRef} />
                        </>
                        :
                        <NoApplicants />
                    }
                </div>
            )}
        </PageContainer>
    );
};





export default MainBanner;