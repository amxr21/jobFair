import axios from "axios";
import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { useAuthContext } from "../hooks/useAuthContext";
import { Row, TableHeader, BarButtons, FlagButton, NoApplicants, LoadingApplicants, ScrollToTopButton, PageContainer, FilterDropdown } from "./index";
import TourGuide, { APPLICANTS_TOUR_KEY } from "./TourGuide";
import { pageHelpSeenKey } from "./PageHelp";
import { useToast } from "./Toast";
import LoadListError from "./LoadListError";

const MainBanner = ({link}) => {

    const { t } = useTranslation();
    const { user } = useAuthContext();
    const toast = useToast();

    const flagIcon = useRef()
    const scrollableRef = useRef(null);
    const listContainerRef = useRef(null);

    const [ isFlagged, setIsFlagged ] = useState(false)
    const [ isAscending, setIsAscending ] = useState(true)
    const [ activeFilters, setActiveFilters ] = useState({})
    // Starts true whenever a user is already known at mount (e.g. after a
    // page reload, since the auth context reads localStorage synchronously)
    // so the loading skeleton shows immediately instead of a brief flash of
    // the empty/table-only state before the fetch effect below has run.
    const [isLoading, setIsLoading] = useState(() => !!user)
    const [loadError, setLoadError] = useState(false)
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
    const [showTour, setShowTour] = useState(false);

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

        const hasActiveFilters = Object.keys(filters).length > 0;
        if (hasActiveFilters) {
            const count = Object.keys(filters).length;
            toast(`${count} filter${count > 1 ? 's' : ''} applied`, { type: 'success', duration: 2000 });
            if (!showAll) fetchApplicants(1, searchQuery, true);
        } else {
            toast('Filters cleared', { type: 'info', duration: 1800 });
        }
    };

    // Get unique applicants by uniId, keeping only the latest submission
    const getUniqueLatestApplicants = (applicantsList) => {
        if (!applicantsList || applicantsList.length === 0) return [];
        // Sort by createdAt descending (newest first)
        const sorted = [...applicantsList].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        // Keep only the first occurrence of each uniId (which is the latest due to sorting).
        // Applicants with no uniId at all aren't duplicates of anything — always keep them.
        const seenIds = new Set();
        return sorted.filter((applicant) => {
            const uniId = applicant.applicantDetails?.uniId;
            if (!uniId) return true;
            if (seenIds.has(uniId)) return false;
            seenIds.add(uniId);
            return true;
        });
    };

    // Sort/filter function that works on any list
    const sortAndFilterList = (list) => {
        if (list.length === 0) return [];
        let deduplicated = getUniqueLatestApplicants(list);
        deduplicated = deduplicated.filter(app => app.applicantDetails?.email !== 'casto@sharjah.ac.ae');
        let sorted = sortList(deduplicated, filterCriteriaa, isAscending);
        sorted = applyDropdownFilters(sorted, activeFilters);
        // Search filters by name — highlight is applied in Row separately
        if (searchQuery?.trim()) {
            const q = searchQuery.toLowerCase().trim();
            sorted = sorted.filter(app =>
                app.applicantDetails?.fullName?.toLowerCase().includes(q)
            );
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
            setLoadError(false);
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
            setLoadError(true);
            toast(err.response?.data?.error || 'Failed to load applicants', { type: 'error' });
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
        if (user) {
            fetchApplicants(1, searchQuery);
        }
    }, [user]); // Fetch applicants on initial load

    // Gated on !isLoading (not a blind timer) so the tour's targets (search,
    // table header, first row) are actually in the DOM before it measures them —
    // a cold fetch taking longer than the old fixed delay left the tour
    // reading a still-loading layout, which looked "unaligned until refresh"
    // (see the same fix already applied to Managers.jsx's tour trigger).
    useEffect(() => {
        if (!user || isLoading) return;
        if (localStorage.getItem(APPLICANTS_TOUR_KEY)) return;
        // The tour is about to explain this whole page, so the separate "?"
        // auto-popup would just stack on top of it a moment later on a true
        // first visit. Pre-mark it seen for this session so only the tour shows.
        try { sessionStorage.setItem(pageHelpSeenKey('/'), '1'); } catch { /* ignore */ }
        const id = setTimeout(() => setShowTour(true), 400);
        return () => clearTimeout(id);
    }, [user, isLoading]);

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

    // Search is purely local — filters + highlights matching names without API calls
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
    }, []);

    const _unused = useCallback((query) => {
        // legacy debounce — kept for reference only, not used
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
                toast('Showing flagged applicants only', { type: 'info' });
            } else {
                flagIcon?.current.classList.replace("opacity-100", "opacity-50");
                setFinalList(sortAndFilterList(applicants));
                toast('Showing all applicants', { type: 'info' });
            }

            return newValue;
        });
    };


    return (
        <>
        <PageContainer
            user={user}
            noHorizontalPadding
            title={t("applicants.title")}
            titleExtra={user && (
                <div className="flex flex-wrap gap-1.5 items-center">
                    {/* Search — local filter + highlight, no API call */}
                    <div data-tour="tour-search" className="relative flex items-center">
                        <input
                            type="text"
                            placeholder={t("applicants.searchPlaceholder")}
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className={`ps-7 pe-6 h-7 md:h-8 text-xs border rounded-lg focus:outline-none focus:border-blue-500 w-28 md:w-44 lg:w-56 transition-all duration-200 ${
                                searchQuery
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-[#0E7F41] bg-white opacity-50 hover:opacity-100'
                            }`}
                        />
                        <svg className="absolute start-2 w-3 h-3 pointer-events-none" fill="none" stroke={searchQuery ? '#3B82F6' : '#0E7F41'} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchQuery && (
                            <button onClick={() => handleSearch('')} className="absolute end-1.5 text-gray-400 hover:text-gray-600">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                    <span data-tour="tour-flag-btn">
                        <FlagButton btnRef={flagIcon} handleClick={filterFlagged} />
                    </span>
                    <span data-tour="tour-filter-btn">
                        <FilterDropdown filters={activeFilters} onFilterChange={handleFilterChange} applicants={[...applicants, ...otherApplicants]} />
                    </span>

                    {/* Page Navigation Arrows */}
                    {!showAll && !hasActiveFilters && (
                        <div className="flex items-center gap-1">
                            <button onClick={handlePrevPage} disabled={!pagination.hasPrevPage}
                                className={`w-7 h-7 md:w-8 md:h-8 rounded-lg border flex items-center justify-center transition-all duration-200 ${!pagination.hasPrevPage ? 'border-gray-300 bg-gray-100 text-gray-300 cursor-not-allowed' : 'border-[#0E7F41] bg-white text-[#0E7F41] hover:bg-[#0E7F41] hover:text-white'}`}
                                title={t("applicants.prevPage")}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 icon-directional"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                            </button>
                            <span className="text-[10px] text-gray-500 min-w-[28px] text-center">{pagination.currentPage}/{pagination.totalPages}</span>
                            <button onClick={handleNextPage} disabled={!pagination.hasNextPage}
                                className={`w-7 h-7 md:w-8 md:h-8 rounded-lg border flex items-center justify-center transition-all duration-200 ${!pagination.hasNextPage ? 'border-gray-300 bg-gray-100 text-gray-300 cursor-not-allowed' : 'border-[#0E7F41] bg-white text-[#0E7F41] hover:bg-[#0E7F41] hover:text-white'}`}
                                title={t("applicants.nextPage")}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3 icon-directional"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                            </button>
                        </div>
                    )}

                    {(pagination.uniqueStudentCount || pagination.totalItems) > 50 && !hasActiveFilters && (
                        <button onClick={handleShowAll}
                            className={`hidden md:flex h-7 md:h-8 px-2 rounded-lg border text-[10px] font-medium transition-all duration-200 items-center ${showAll ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-[#0E7F41] bg-white text-[#0E7F41] hover:bg-[#0E7F41] hover:text-white'}`}
                            title={showAll ? `${t("applicants.backToPages")} (${pagination.totalPages})` : `${t("applicants.loadAll")} (${pagination.uniqueStudentCount || pagination.totalItems})`}>
                            {showAll ? t("applicants.backToPages") : t("applicants.loadAll")}
                        </button>
                    )}
                </div>
            )}
            headerRight={user && (
                <div className="flex items-center gap-x-2">
                    <button
                        onClick={() => { localStorage.removeItem(APPLICANTS_TOUR_KEY); setShowTour(true); }}
                        className="w-7 h-7 md:w-8 md:h-8 rounded-lg border border-gray-300 bg-white text-gray-400 hover:text-[#0E7F41] hover:border-[#0E7F41] flex items-center justify-center transition-all duration-200 text-xs font-bold"
                        title={t("applicants.startTour")}
                    >?</button>
                    <span data-tour="tour-register-btn"><BarButtons link={link} /></span>
                </div>
            )}
            showAccessButtons={true}
        >
            {/* Tabs for non-CASTO users — sliding pill */}
            {user?.email !== 'casto@sharjah.ac.ae' && (
                <div className="relative flex mb-3 md:mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                    {/* Sliding pill */}
                    <div
                        className="absolute top-1 bottom-1 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
                        style={{
                            width: 'calc(50% - 4px)',
                            insetInlineStart: activeTab === 'my' ? '4px' : 'calc(50%)',
                            transition: 'inset-inline-start 0.22s cubic-bezier(0.4,0,0.2,1)',
                        }}
                    />
                    <button
                        onClick={() => { setActiveTab('my'); toast(t('applicants.viewingMine'), { type: 'info', duration: 1800 }); }}
                        className={`relative z-10 px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 md:gap-2 ${
                            activeTab === 'my' ? 'text-[#0E7F41] dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <span className="hidden md:inline">{t('applicants.myApplicants')}</span>
                        <span className="md:hidden">{t('applicants.mine')}</span>
                        <span className={`px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs transition-colors duration-200 ${
                            activeTab === 'my' ? 'bg-[#0E7F41] text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}>
                            {finalList.length}
                        </span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('other'); toast(t('applicants.viewingOther'), { type: 'info', duration: 1800 }); }}
                        className={`relative z-10 px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors duration-200 flex items-center gap-1.5 md:gap-2 ${
                            activeTab === 'other' ? 'text-[#0E7F41] dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <span className="hidden md:inline">{t('applicants.otherApplicants')}</span>
                        <span className="md:hidden">{t('applicants.others')}</span>
                        <span className={`px-1.5 md:px-2 py-0.5 rounded-full text-[10px] md:text-xs transition-colors duration-200 ${
                            activeTab === 'other' ? 'bg-[#0E7F41] text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}>
                            {finalOtherList.length}
                        </span>
                    </button>
                </div>
            )}

            {/* Main applicants list - shown for CASTO or when 'my' tab is active */}
            {(user?.email === 'casto@sharjah.ac.ae' || activeTab === 'my') && (
                <div ref={listContainerRef} className="relative flex-1 min-h-0 flex flex-col overflow-hidden rounded-lg text-xs md:text-base">
                    <div data-tour="tour-table-header">
                        <TableHeader
                            sortColumn={filterCriteriaa}
                            isAscending={isAscending}
                            onSort={(col) => {
                                if (filterCriteriaa === col) setIsAscending(p => !p);
                                else { setFilterCriteria(col); setIsAscending(true); }
                            }}
                        />
                    </div>

                    {
                        isLoading
                        ?
                        <LoadingApplicants />
                        :
                        loadError
                        ?
                        <LoadListError label="applicants" onRetry={() => fetchApplicants(pagination.currentPage, searchQuery, showAll)} />
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
                                    <div key={applicant?._id} data-tour={index === 0 ? 'tour-first-row' : undefined} className="relative flex flex-col">
                                        <Row
                                            userType={'casto'}
                                            ticketId={applicant?._id}
                                            number={pageOffset + index + 1}
                                            searchQuery={searchQuery}
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
                    <div data-tour="tour-table-header">
                        <TableHeader
                            sortColumn={filterCriteriaa}
                            isAscending={isAscending}
                            onSort={(col) => {
                                if (filterCriteriaa === col) setIsAscending(p => !p);
                                else { setFilterCriteria(col); setIsAscending(true); }
                            }}
                        />
                    </div>
                    {
                        isLoading
                        ?
                        <LoadingApplicants />
                        :
                        loadError
                        ?
                        <LoadListError label="applicants" onRetry={() => fetchApplicants(pagination.currentPage, searchQuery, showAll)} />
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
                                            searchQuery={searchQuery}
                                            isOtherTab={true}
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
                                            onTake={(id) => {
                                                const taken = otherApplicants.find(a => a._id === id);
                                                if (taken) {
                                                    setApplicants(prev => [...prev, { ...taken, user_id: [...(taken.user_id || []), user?.companyName] }]);
                                                    setOtherApplicants(prev => prev.filter(a => a._id !== id));
                                                }
                                            }}
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

        <TourGuide
            show={showTour}
            onDone={() => {
                setShowTour(false);
                localStorage.setItem(APPLICANTS_TOUR_KEY, '1');
            }}
        />
        </>
    );
};





export default MainBanner;