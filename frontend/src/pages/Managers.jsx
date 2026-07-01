import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { createPortal } from "react-dom";

import { Row, TableHeader, PageContainer, LoadingApplicants, NoApplicants, ScrollToTopButton } from "../components/index";
import { useAuthContext } from "../Hooks/useAuthContext";
import TourGuide, { MANAGERS_TOUR_KEY } from "../components/TourGuide";
import { useToast } from "../components/Toast";

import { CircularProgress } from "@mui/material";


// Company Filter Dropdown Component
const CompanyFilterDropdown = ({ filters, onFilterChange, companies }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});
    const [expandedCategories, setExpandedCategories] = useState({});
    const dropdownRef = useRef(null);

    // Get unique values for each filter category from companies
    const getUniqueValues = (category) => {
        const values = new Set();
        companies?.forEach(company => {
            let value;
            switch(category) {
                case 'status':
                    value = company.status || 'Pending';
                    break;
                case 'sector':
                    value = company.sector;
                    break;
                case 'city':
                    value = company.city;
                    break;
                case 'fields':
                    // Handle array of fields
                    const fields = Array.isArray(company.fields) ? company.fields : company.fields?.split(',');
                    fields?.forEach(field => {
                        const trimmed = typeof field === 'string' ? field.trim() : field;
                        if (trimmed) values.add(trimmed);
                    });
                    return; // Skip the normal add
                case 'hasApplicants':
                    value = (company.numberOfApplicants || 0) > 0 ? 'Has Applicants' : 'No Applicants';
                    break;
                case 'reminderSent':
                    value = company.reminderSentAt ? 'Reminder Sent' : 'Not Sent';
                    break;
                default:
                    value = null;
            }
            if (value) values.add(value);
        });
        return Array.from(values).sort();
    };

    const filterCategories = [
        { id: 'status', label: 'Attendance Status' },
        { id: 'sector', label: 'Sector' },
        { id: 'city', label: 'City' },
        { id: 'fields', label: 'Industry Fields' },
        { id: 'hasApplicants', label: 'Applicants' },
        { id: 'reminderSent', label: 'Reminder Status' },
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleCategory = (categoryId) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    const handleFilterSelect = (category, value) => {
        const newFilters = { ...activeFilters };

        if (!newFilters[category]) {
            newFilters[category] = [];
        }

        const index = newFilters[category].indexOf(value);
        if (index > -1) {
            newFilters[category].splice(index, 1);
            if (newFilters[category].length === 0) {
                delete newFilters[category];
            }
        } else {
            newFilters[category].push(value);
        }

        setActiveFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearAllFilters = () => {
        setActiveFilters({});
        onFilterChange({});
    };

    const activeFilterCount = Object.values(activeFilters).flat().length;

    const getSelectedCount = (categoryId) => {
        return activeFilters[categoryId]?.length || 0;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative border rounded-lg w-7 h-7 md:w-8 md:h-8 flex items-center justify-center transition-all duration-200 ${
                    activeFilterCount > 0
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-[#0E7F41] bg-white opacity-50 hover:opacity-100'
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke={activeFilterCount > 0 ? '#3B82F6' : '#0E7F41'} className="w-3 h-3 md:w-3.5 md:h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                </svg>
                {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-9 right-0 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 w-80 max-h-[450px] overflow-hidden animate-fadeIn">
                    <div className="p-3 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                        <h3 className="font-semibold text-sm">Filter Companies</h3>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="text-xs text-red-500 hover:text-red-700"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto max-h-[390px]">
                        {filterCategories.map(category => {
                            const values = getUniqueValues(category.id);
                            if (values.length === 0) return null;

                            const isExpanded = expandedCategories[category.id];
                            const selectedCount = getSelectedCount(category.id);

                            return (
                                <div key={category.id} className="border-b border-gray-50 last:border-b-0">
                                    <button
                                        onClick={() => toggleCategory(category.id)}
                                        className="w-full px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-xs font-medium text-gray-700 flex items-center justify-between transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{category.label}</span>
                                            <span className="text-gray-400 text-xs">({values.length})</span>
                                            {selectedCount > 0 && (
                                                <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                                                    {selectedCount}
                                                </span>
                                            )}
                                        </div>
                                        <svg
                                            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    <div
                                        className={`overflow-hidden transition-all duration-200 ${
                                            isExpanded ? 'max-h-[250px] opacity-100' : 'max-h-0 opacity-0'
                                        }`}
                                    >
                                        <div className="p-2 flex flex-wrap gap-1 bg-white max-h-[200px] overflow-y-auto">
                                            {values.map(value => {
                                                const isSelected = activeFilters[category.id]?.includes(value);
                                                return (
                                                    <button
                                                        key={value}
                                                        onClick={() => handleFilterSelect(category.id, value)}
                                                        className={`px-2 py-1 text-xs rounded-md transition-all duration-150 ${
                                                            isSelected
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {value}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};


// Reminder Modal Component
const ReminderModal = ({ visible, onClose, companies, link, user }) => {
    const [selectedCompanies, setSelectedCompanies] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState(null);
    const [selectAll, setSelectAll] = useState(false);

    // Filter to only show pending companies (not Confirmed or Canceled)
    const pendingCompanies = companies.filter(c => !c.status || c.status === 'Pending');

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedCompanies([]);
        } else {
            setSelectedCompanies(pendingCompanies.map(c => c._id));
        }
        setSelectAll(!selectAll);
    };

    const handleToggleCompany = (companyId) => {
        setSelectedCompanies(prev =>
            prev.includes(companyId)
                ? prev.filter(id => id !== companyId)
                : [...prev, companyId]
        );
    };

    const handleSendReminders = async () => {
        if (selectedCompanies.length === 0) return;

        setIsSending(true);
        setResult(null);

        try {
            const response = await axios.post(
                `${link}/companies/send-reminders`,
                {
                    companyIds: selectedCompanies,
                    frontendUrl: window.location.origin
                },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            setResult({ type: 'success', data: response.data });
            setSelectedCompanies([]);
            setSelectAll(false);
        } catch (error) {
            setResult({ type: 'error', message: error.response?.data?.error || error.message });
        } finally {
            setIsSending(false);
        }
    };

    if (!visible) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[80vh] max-h-[90vh] overflow-hidden mx-4">
                {/* Header */}
                <div className="bg-[#0E7F41] text-white px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Send Confirmation Reminders</h2>
                        <p className="text-sm text-white/80">Select companies to send attendance confirmation emails</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[50vh]">
                    {/* Select All */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectAll}
                                onChange={handleSelectAll}
                                className="w-5 h-5 rounded border-gray-300 text-[#0E7F41] focus:ring-[#0E7F41]"
                            />
                            <span className="font-semibold text-gray-700">
                                Select All Pending ({pendingCompanies.length})
                            </span>
                        </label>
                        <span className="text-sm text-gray-500">
                            {selectedCompanies.length} selected
                        </span>
                    </div>

                    {/* Company List */}
                    <div className="space-y-2">
                        {pendingCompanies.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">All companies have confirmed their attendance.</p>
                        ) : (
                            pendingCompanies.map(company => (
                                <label
                                    key={company._id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                        selectedCompanies.includes(company._id)
                                            ? 'border-[#0E7F41] bg-[#0E7F41]/5'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedCompanies.includes(company._id)}
                                        onChange={() => handleToggleCompany(company._id)}
                                        className="w-4 h-4 rounded border-gray-300 text-[#0E7F41] focus:ring-[#0E7F41]"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800">{company.companyName}</p>
                                        <p className="text-xs text-gray-500">{company.email}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            company.status === 'Confirmed'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {company.status || 'Pending'}
                                        </span>
                                        {company.reminderSentAt && (
                                            <span className="text-xs text-gray-400" title={`Last sent: ${new Date(company.reminderSentAt).toLocaleString()}`}>
                                                Sent
                                            </span>
                                        )}
                                    </div>
                                </label>
                            ))
                        )}
                    </div>

                    {/* Result Message */}
                    {result && (
                        <div className={`mt-4 p-4 rounded-lg ${
                            result.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                        }`}>
                            {result.type === 'success' ? (
                                <div>
                                    <p className="font-semibold">{result.data.message}</p>
                                    {result.data.results?.length > 0 && (
                                        <ul className="mt-2 text-sm">
                                            {result.data.results.map((r, i) => (
                                                <li key={i}>{r.companyName}: {r.status}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ) : (
                                <p>{result.message}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSendReminders}
                        disabled={selectedCompanies.length === 0 || isSending}
                        className="px-6 py-2 bg-[#0E7F41] hover:bg-[#0a5f31] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSending ? (
                            <>
                                <CircularProgress size={16} sx={{ color: 'white' }} />
                                Sending...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Send Reminders ({selectedCompanies.length})
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};


const Managers = ({link}) => {

    const [companies, setCompanies ] = useState([]);
    const { user } = useAuthContext();
    const toast = useToast();
    const [filterCriteriaa, setFilterCriteria] = useState("")
    const [finalList, setFinalList] = useState([]);
    const [isLoading, setIsLoading] = useState(false)
    const [isAscending, setIsAscending] = useState(true)
    const [filterSelected, setFilterSelected] = useState('')
    const [showReminderModal, setShowReminderModal] = useState(false)
    const [activeFilters, setActiveFilters] = useState({})
    const [searchQuery, setSearchQuery] = useState('')
    const [isAtTop, setIsAtTop] = useState(true)
    const [showTour, setShowTour] = useState(false)
    const scrollableRef = useRef(null)

    const [ applicantsList, setApplicantsList ] = useState([])
    const [ numberOfApplicants, setNumberOfApplicants ] = useState()


    const handleSort = useCallback((columnName) => {
        console.log('handleSort called:', columnName, 'current filterSelected:', filterSelected);
        if(filterSelected === columnName) {
            setIsAscending(prev => !prev);
        } else {
            setFilterCriteria(columnName);
            setFilterSelected(columnName);
            setIsAscending(true);
        }
    }, [filterSelected]) 
 
    

    // Apply dropdown filters to companies
    const applyDropdownFilters = (list, filters) => {
        if (Object.keys(filters).length === 0) return list;

        return list.filter(company => {
            return Object.entries(filters).every(([category, values]) => {
                if (values.length === 0) return true;

                let companyValue;
                switch(category) {
                    case 'status':
                        companyValue = company.status || 'Pending';
                        return values.includes(companyValue);
                    case 'sector':
                        companyValue = company.sector;
                        return values.includes(companyValue);
                    case 'city':
                        companyValue = company.city;
                        return values.includes(companyValue);
                    case 'fields':
                        // Check if any of the company's fields match any selected filter
                        const fields = Array.isArray(company.fields) ? company.fields : company.fields?.split(',');
                        if (!fields) return false;
                        return values.some(v => fields.map(f => typeof f === 'string' ? f.trim() : f).includes(v));
                    case 'hasApplicants':
                        companyValue = (company.numberOfApplicants || 0) > 0 ? 'Has Applicants' : 'No Applicants';
                        return values.includes(companyValue);
                    case 'reminderSent':
                        companyValue = company.reminderSentAt ? 'Reminder Sent' : 'Not Sent';
                        return values.includes(companyValue);
                    default:
                        return true;
                }
            });
        });
    };

    // Search filters by name only — matches applicant list behaviour
    const applySearchFilter = (list, query) => {
        if (!query || query.trim() === '') return list;
        const q = query.toLowerCase().trim();
        return list.filter(company => company.companyName?.toLowerCase().includes(q));
    };

    // Sorting function to arrange companies by specified criteria
    const sortedCompanies = (filterCriteria, ascending) => {
        let sortedArray = [...companies]
        const direction = ascending ? 1 : -1;

        switch (filterCriteria) {
            case "Company Name":
                return sortedArray.sort((a, b) => direction * (a.companyName?.replace(/[^a-zA-Z]/g, '').toLowerCase().localeCompare(b.companyName?.replace(/[^a-zA-Z]/g, '').toLowerCase() || '')));
            case "Company Email":
                return sortedArray.sort((a, b) => direction * (a.email || '').localeCompare(b.email || ''));
            case "Representatives":
                // Note: 'representitives' is the field name in the database (kept for backward compatibility)
                return sortedArray.sort((a, b) => direction * (a.representitives?.replace(/[^a-zA-Z]/g, '').toLowerCase() || '').localeCompare(b.representitives?.replace(/[^a-zA-Z]/g, '').toLowerCase() || ''));
            case "Sector":
                return sortedArray.sort((a, b) => direction * (a.sector?.replace(/[^a-zA-Z]/g, '').toLowerCase() || '').localeCompare(b.sector?.replace(/[^a-zA-Z]/g, '').toLowerCase() || ''));
            case "City":
                return sortedArray.sort((a, b) => direction * (a.city?.replace(/[^a-zA-Z]/g, '').toLowerCase() || '').localeCompare(b.city?.replace(/[^a-zA-Z]/g, '').toLowerCase() || ''));
            case "No of App":
                return sortedArray.sort((a, b) => direction * ((b.numberOfApplicants || 0) - (a.numberOfApplicants || 0)));
            case "Status":
                return sortedArray.sort((a, b) => direction * (a.status || '').localeCompare(b.status || ''));
            default:
                return sortedArray.sort((a, b) => b.createdAt - a.createdAt);
        }
    };

    const handleFilterChange = (filters) => {
        setActiveFilters(filters);
        const count = Object.keys(filters).length;
        if (count > 0) {
            toast(`${count} filter${count > 1 ? 's' : ''} applied`, { type: 'success', duration: 2000 });
        } else {
            toast('Filters cleared', { type: 'info', duration: 1800 });
        }
    };

    useEffect(() => {
        if(companies.length != 0) {
            let result = sortedCompanies(filterCriteriaa, isAscending);
            result = applyDropdownFilters(result, activeFilters);
            result = applySearchFilter(result, searchQuery);
            setFinalList(result);
        }
    }, [filterCriteriaa, companies, isAscending, activeFilters, searchQuery]);

    let counter = 0;



    // useEffect(() => {
    //     const fetchApplicantsNumberForCompanies = async () => {
    //         try {
    //             const response = await axios.get(link + '/applicants')
    //             if(user && user.email == "casto@sharjah.ac.ae") setApplicantsList(response.data)


                
                    
    //         } catch (error) {
    //             console.log(error)
    //         }
    //     }
        
    //     fetchApplicantsNumberForCompanies() 
    // }, [user])



    // useEffect(() => {

    //     const fetchCompanies = async () => {
    //         try {
    //             setIsLoading(true)
    //             const response = await axios.get(`${link}/companies`, {
    //                 headers: user ? { Authorization: `Bearer ${user.token}` } : {},
    //             });



    //             if (user) {
    //                 if(user.email == "casto@sharjah.ac.ae"){

    //                     let numberOfApplicantsPerCompany = {}
    //                     if(response.data){
    //                         const updatedCompanies = response.data.map((company) => {
    //                             numberOfApplicantsPerCompany[company.companyName] = 0
    //                             // console.log(numberOfApplicantsPerCompany);
    //                             applicantsList.forEach((applicant) => {
    //                                 if(applicant.user_id.includes(company.companyName)){
    //                                     numberOfApplicantsPerCompany[company.companyName] =  numberOfApplicantsPerCompany[company.companyName] + 1
    //                                 }
    //                             })
    
    //                             return {
    //                                 ...company,
    //                                 'numberOfApplicants': numberOfApplicantsPerCompany[company.companyName]
    //                             }
                                
    //                         })
    
    
    
    //                         // Filter applicants to only include those associated with the logged-in user
    //                         setCompanies([...updatedCompanies].slice(1));
                            
    //                     }
    //                 }
    //                 else{
    //                     // Filter applicants to only include those associated with the logged-in user
    //                     setCompanies(
    //                         response.data.filter((applicant) =>
    //                         // SOOOOO SIMPLE. SOOOOO SIMPLE. SOOOOO SIMPLE. SOOOOO SIMPLE.
    //                         applicant.user_id.includes(user.email)
    //                         // SOOOOO SIMPLE. SOOOOO SIMPLE. SOOOOO SIMPLE. SOOOOO SIMPLE.
    
    //                     )
    //                     );

    //                 }
    //             }
    //         } catch (err) {
    //             console.log("Error fetching data:", err);
    //         }
    //         finally{
    //             setTimeout(() => {
    //                 setIsLoading(false)

    //             }, 2000)
    //         }
    //     };


    //     fetchCompanies();
    // }, [user, path.pathname, applicantsList]); // Fetch companies again if the user changes

    // console.log(companies); // Logging to debug and verify the companies' list





    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                // 1. Fetch applicants (if casto) - use high limit to get all for counting
                let applicants = [];
                if (user?.email === "casto@sharjah.ac.ae") {
                    const applicantsResponse = await axios.get(`${link}/applicants?limit=10000`, {
                        headers: user ? { Authorization: `Bearer ${user.token}` } : {},
                    });
                    // Handle new paginated response format
                    applicants = applicantsResponse.data.applicants || applicantsResponse.data;
                    setApplicantsList(applicants);
                }

                // 2. Fetch companies
                const companiesResponse = await axios.get(`${link}/companies`, {
                    headers: user ? { Authorization: `Bearer ${user.token}` } : {},
                });

                const companiesData = companiesResponse.data;
    
                if (user) {
                    if (user.email === "casto@sharjah.ac.ae") {
                        // Build a map of applicants per company
                        const updatedCompanies = companiesData.map((company) => {
                            const num = applicants.filter((app) =>
                                app.user_id.includes(company.companyName)
                            ).length;
    
                            return {
                                ...company,
                                numberOfApplicants: num,
                            };
                        });
    
                        setCompanies([...updatedCompanies].slice(1));
                    } else {
                        const filtered = companiesData.filter((applicant) =>
                            applicant.user_id.includes(user.email)
                        );
                        setCompanies(filtered);
                    }
                }
    
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setTimeout(() => setIsLoading(false), 2000);
            }
        };
    
        if (user) {
            fetchData();
            if (!localStorage.getItem(MANAGERS_TOUR_KEY)) {
                setTimeout(() => setShowTour(true), 800);
            }
        }

    }, [user, link]);
    













    return (
        <>
        <PageContainer
            user={user}
            title="Companies & Cooperations"
            titleExtra={user?.email === "casto@sharjah.ac.ae" && (
                <div className="flex flex-wrap gap-1.5 items-center">
                    {/* Search — name-only, filter + highlight */}
                    <div className="relative flex items-center">
                        <input
                            data-tour="tour-search"
                            type="text"
                            placeholder="Search by name…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`pl-7 pr-6 h-7 md:h-8 text-xs border rounded-lg focus:outline-none focus:border-blue-500 w-28 md:w-44 lg:w-56 transition-all duration-200 ${
                                searchQuery ? 'border-blue-500 bg-blue-50' : 'border-[#0E7F41] bg-white opacity-50 hover:opacity-100'
                            }`}
                        />
                        <svg className="absolute left-2 w-3 h-3 pointer-events-none" fill="none" stroke={searchQuery ? '#3B82F6' : '#0E7F41'} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-1.5 text-gray-400 hover:text-gray-600">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                    <span data-tour="tour-filter-btn">
                        <CompanyFilterDropdown filters={activeFilters} onFilterChange={handleFilterChange} companies={companies} />
                    </span>
                    <button data-tour="tour-register-btn" onClick={() => setShowReminderModal(true)}
                        className="flex items-center gap-1.5 px-2.5 h-7 md:h-8 bg-[#0E7F41] hover:bg-[#0a5f31] text-white text-xs font-medium rounded-lg transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden md:inline">Send Reminders</span>
                    </button>
                </div>
            )}
        >
            {/* Reminder Modal */}
            <ReminderModal
                visible={showReminderModal}
                onClose={() => setShowReminderModal(false)}
                companies={companies}
                link={link}
                user={user}
            />

            {/* List — identical structure to MainBanner */}
            <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden rounded-lg text-xs md:text-base">
                <div data-tour="tour-table-header">
                    <TableHeader
                        userType={'manager'}
                        sortColumn={filterSelected}
                        isAscending={isAscending}
                        onSort={handleSort}
                    />
                </div>

                {isLoading ? (
                    <LoadingApplicants />
                ) : finalList.length > 0 ? (
                    <>
                        <div
                            ref={scrollableRef}
                            className="flex-1 overflow-y-auto list"
                            onScroll={(e) => setIsAtTop(e.target.scrollTop === 0)}
                        >
                            {finalList.map((company, index) => {
                                counter += 1;
                                const companyApplicants = applicantsList.filter(app =>
                                    app.user_id?.includes(company.companyName)
                                );
                                return (
                                    <div key={company._id} data-tour={index === 0 ? 'tour-first-row' : undefined} className="relative flex flex-col">
                                        <Row
                                            number={index + 1}
                                            userType={'manager'}
                                            companyId={company._id}
                                            companyName={company.companyName}
                                            companyEmail={company.email}
                                            companyRepresentatives={company.representitives}
                                            companyFields={company.fields}
                                            companyStatus={company?.status}
                                            companySector={company.sector}
                                            companyCity={company.city}
                                            numberOfPositions={company.noOfPositions}
                                            numebrOfApplicants={company.numberOfApplicants}
                                            preferredMajors={company.preferredMajors}
                                            opportunityTypes={company.opportunityTypes}
                                            preferredQualities={company.preferredQualities}
                                            companyApplicants={companyApplicants}
                                            searchQuery={searchQuery}
                                            link={link}
                                            user={user}
                                            onStatusChange={(id, newStatus) => {
                                                setCompanies(prev => prev.map(c =>
                                                    c._id === id ? { ...c, status: newStatus } : c
                                                ));
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        <ScrollToTopButton isAtTop={isAtTop} scrollableRefC={scrollableRef} />
                    </>
                ) : (
                    <NoApplicants />
                )}
            </div>
        </PageContainer>

        <TourGuide
            show={showTour}
            variant="managers"
            onDone={() => {
                setShowTour(false);
                localStorage.setItem(MANAGERS_TOUR_KEY, '1');
            }}
        />
        </>
    );
};

export default Managers;