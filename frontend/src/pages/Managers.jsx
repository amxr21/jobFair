import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";

import { Row, TableHeader, PageContainer, LoadingApplicants, NoApplicants, ScrollToTopButton } from "../components/index";
import { tCity, tSector, tStatus } from "../i18n/translateEnum";
import { useAuthContext } from "../hooks/useAuthContext";
import TourGuide, { MANAGERS_TOUR_KEY } from "../components/TourGuide";
import { pageHelpSeenKey } from "../components/PageHelp";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import LoadListError from "../components/LoadListError";

import { CircularProgress } from "@mui/material";


// Company Filter Dropdown Component
const CompanyFilterDropdown = ({ filters, onFilterChange, companies }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});
    const [expandedCategories, setExpandedCategories] = useState({});
    const dropdownRef = useRef(null);

    // Display a filter VALUE in the active language while keeping the raw DB
    // value as the underlying key used for filtering. Fixed-option values use
    // the enum helpers; hasApplicants/reminderSent are UI-only sentinels.
    const displayValue = (category, value) => {
        switch (category) {
            case 'status': return tStatus(value);
            case 'sector': return tSector(value);
            case 'city': return tCity(value);
            case 'hasApplicants':
                return value === 'Has Applicants' ? t('managers.filters.hasApplicants') : t('managers.filters.noApplicants');
            case 'reminderSent':
                return value === 'Reminder Sent' ? t('managers.filters.reminderSentValue') : t('managers.filters.notSentValue');
            default: return value;
        }
    };

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
        { id: 'status', label: t('managers.filters.attendanceStatus') },
        { id: 'sector', label: t('managers.filters.sector') },
        { id: 'city', label: t('managers.filters.city') },
        { id: 'fields', label: t('managers.filters.industryFields') },
        { id: 'hasApplicants', label: t('managers.filters.applicants') },
        { id: 'reminderSent', label: t('managers.filters.reminderStatus') },
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
                aria-label={t('managers.filters.title')}
                title={t('managers.filters.title')}
                className={`relative border rounded-lg w-7 h-7 md:w-8 md:h-8 flex items-center justify-center transition-all duration-200 ${
                    activeFilterCount > 0
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/15'
                        : 'border-primary bg-surface-card opacity-50 hover:opacity-100'
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 md:w-3.5 md:h-3.5 ${activeFilterCount > 0 ? 'text-blue-500' : 'text-primary'}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                </svg>
                {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -end-1 bg-blue-500 text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-9 end-0 z-50 bg-surface-card rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-80 max-h-[450px] overflow-hidden animate-fadeIn">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-surface-card z-10">
                        <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-100">{t('managers.filters.title')}</h3>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearAllFilters}
                                className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                                {t('managers.filters.clearAll')}
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
                                <div key={category.id} className="border-b border-gray-50 dark:border-gray-700 last:border-b-0">
                                    <button
                                        onClick={() => toggleCategory(category.id)}
                                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{category.label}</span>
                                            <span className="text-gray-400 dark:text-gray-500 text-xs">({values.length})</span>
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
                                        <div className="p-2 flex flex-wrap gap-1 bg-surface-card max-h-[200px] overflow-y-auto">
                                            {values.map(value => {
                                                const isSelected = activeFilters[category.id]?.includes(value);
                                                return (
                                                    <button
                                                        key={value}
                                                        onClick={() => handleFilterSelect(category.id, value)}
                                                        className={`px-2 py-1 text-xs rounded-md transition-all duration-150 ${
                                                            isSelected
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                        }`}
                                                    >
                                                        {displayValue(category.id, value)}
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
    const { t } = useTranslation();
    const [selectedCompanies, setSelectedCompanies] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [result, setResult] = useState(null);
    const [search, setSearch] = useState("");

    // Filter to only show pending companies (not Confirmed or Canceled)
    const pendingCompanies = useMemo(() => companies.filter(c => !c.status || c.status === 'Pending'), [companies]);
    const neverContacted = useMemo(() => pendingCompanies.filter(c => !c.reminderSentAt), [pendingCompanies]);
    const alreadyReminded = useMemo(() => pendingCompanies.filter(c => c.reminderSentAt), [pendingCompanies]);

    const visibleCompanies = useMemo(() => {
        if (!search.trim()) return pendingCompanies;
        const q = search.trim().toLowerCase();
        return pendingCompanies.filter(c => c.companyName?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q));
    }, [pendingCompanies, search]);

    // Reset transient state each time the modal is opened fresh
    useEffect(() => {
        if (visible) { setSelectedCompanies([]); setResult(null); setSearch(""); }
    }, [visible]);

    const allVisibleSelected = visibleCompanies.length > 0 && visibleCompanies.every(c => selectedCompanies.includes(c.id));

    const toggleSelectAllVisible = () => {
        if (allVisibleSelected) {
            setSelectedCompanies(prev => prev.filter(id => !visibleCompanies.some(c => c.id === id)));
        } else {
            setSelectedCompanies(prev => [...new Set([...prev, ...visibleCompanies.map(c => c.id)])]);
        }
    };

    const selectGroup = (group) => setSelectedCompanies(prev => [...new Set([...prev, ...group.map(c => c.id)])]);

    const handleToggleCompany = (companyId) => {
        setSelectedCompanies(prev =>
            prev.includes(companyId) ? prev.filter(id => id !== companyId) : [...prev, companyId]
        );
    };

    const handleSendReminders = async () => {
        if (selectedCompanies.length === 0) return;
        setIsSending(true);
        setResult(null);
        try {
            const response = await axios.post(
                `${link}/companies/send-reminders`,
                { companyIds: selectedCompanies, frontendUrl: window.location.origin },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            setResult({ type: 'success', data: response.data });
            setSelectedCompanies([]);
        } catch (error) {
            setResult({ type: 'error', message: error.response?.data?.error || error.message });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Modal visible={visible} onClose={onClose} maxWidth="max-w-2xl">
            {/* Header */}
            <div className="bg-primary text-primary-contrast px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                    <h2 className="text-lg font-bold">{t("managers.reminderModal.title")}</h2>
                    <p className="text-xs text-white/80 mt-0.5">{t("managers.reminderModal.subtitle", { count: pendingCompanies.length })}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors" aria-label={t("common.close")}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {pendingCompanies.length === 0 ? (
                <div className="p-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("managers.reminderModal.allConfirmed")}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t("managers.reminderModal.noOneLeft")}</p>
                </div>
            ) : (
                <>
                    {/* Toolbar: search + quick-select */}
                    <div className="px-6 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-2.5 shrink-0">
                        <div className="relative">
                            <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute start-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t("managers.reminderModal.searchPlaceholder")}
                                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg ps-9 pe-3 py-2 text-sm bg-surface-card text-fg focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 cursor-pointer">
                                <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAllVisible}
                                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary" />
                                {search ? t("managers.reminderModal.selectAllShown", { count: visibleCompanies.length }) : t("managers.reminderModal.selectAllPending", { count: visibleCompanies.length })}
                            </label>
                            {neverContacted.length > 0 && (
                                <button onClick={() => selectGroup(neverContacted)} className="text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-full px-2.5 py-1 text-gray-500 dark:text-gray-400 hover:border-green-300 dark:hover:border-green-500/40 hover:text-green-700 dark:hover:text-green-400 transition-colors">
                                    {t("managers.reminderModal.neverContacted", { count: neverContacted.length })}
                                </button>
                            )}
                            <span className="ms-auto text-xs font-semibold text-gray-500 dark:text-gray-400">{t("managers.reminderModal.selectedCount", { count: selectedCompanies.length })}</span>
                        </div>
                    </div>

                    {/* Company list */}
                    <div className="px-6 py-3 overflow-y-auto flex-1 min-h-0 max-h-[42vh]">
                        <div className="flex flex-col gap-1.5">
                            {visibleCompanies.length === 0 && (
                                <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">{t("managers.reminderModal.noMatch", { search })}</p>
                            )}
                            {visibleCompanies.map(company => {
                                const checked = selectedCompanies.includes(company.id);
                                return (
                                    <label
                                        key={company.id}
                                        className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                                            checked ? 'border-primary bg-primary/5' : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => handleToggleCompany(company.id)}
                                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{company.companyName}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate bidi-ltr">{company.email}</p>
                                        </div>
                                        {company.reminderSentAt ? (
                                            <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full px-2 py-0.5 shrink-0" title={t("managers.reminderModal.lastSent", { when: new Date(company.reminderSentAt).toLocaleString() })}>
                                                {t("managers.reminderModal.reminded", { date: new Date(company.reminderSentAt).toLocaleDateString() })}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-full px-2 py-0.5 shrink-0">{t("managers.reminderModal.neverContactedBadge")}</span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>

                        {result && (
                            <div className={`mt-3 p-3 rounded-lg text-sm ${result.type === 'success' ? 'bg-green-50 dark:bg-green-500/15 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-500/15 text-red-800 dark:text-red-300'}`}>
                                {result.type === 'success' ? (
                                    <div>
                                        <p className="font-semibold">{result.data.message}</p>
                                        {result.data.results?.length > 0 && (
                                            <ul className="mt-1.5 text-xs space-y-0.5">
                                                {result.data.results.map((r, i) => <li key={i}>{r.companyName}: {r.status}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                ) : <p>{result.message}</p>}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-end gap-3 shrink-0">
                        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            {result ? t("common.done") : t("common.cancel")}
                        </button>
                        <button
                            onClick={handleSendReminders}
                            disabled={selectedCompanies.length === 0 || isSending}
                            className="px-5 py-2 bg-primary hover:bg-primary-hover text-primary-contrast text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSending ? (
                                <><CircularProgress size={14} sx={{ color: 'white' }} />{t("managers.reminderModal.sending")}</>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {t("managers.reminderModal.sendReminders", { count: selectedCompanies.length })}
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}
        </Modal>
    );
};


const Managers = ({link}) => {
    const { t } = useTranslation();
    const [companies, setCompanies ] = useState([]);
    const { user } = useAuthContext();
    const toast = useToast();
    const [filterCriteriaa, setFilterCriteria] = useState("")
    const [finalList, setFinalList] = useState([]);
    // Starts true whenever a user is already known at mount (e.g. after a
    // page reload) so the loading skeleton shows immediately instead of a
    // brief flash of the empty/table-only state before the fetch effect runs.
    const [isLoading, setIsLoading] = useState(() => !!user)
    const [loadError, setLoadError] = useState(false)
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
                return sortedArray.sort((a, b) => direction * (a.representatives?.replace(/[^a-zA-Z]/g, '').toLowerCase() || '').localeCompare(b.representatives?.replace(/[^a-zA-Z]/g, '').toLowerCase() || ''));
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





    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setLoadError(false);

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
                            app.user_id?.includes(company.companyName)
                        ).length;

                        return {
                            ...company,
                            numberOfApplicants: num,
                        };
                    });

                    // Excludes the CASTO Office's own company row from the managers list
                    setCompanies(updatedCompanies.filter((c) => c.companyName !== "CASTO Office"));
                } else {
                    const filtered = companiesData.filter((applicant) =>
                        applicant.user_id?.includes(user.email)
                    );
                    setCompanies(filtered);
                }
            }

        } catch (error) {
            console.error("Error fetching data:", error);
            setLoadError(true);
        } finally {
            setIsLoading(false);
        }
    }, [user, link]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, link, fetchData]);

    // Start the first-run tour only AFTER the data has loaded and the table has
    // painted — not on a blind 800ms timer. On a cold load the fetch can take
    // longer than 800ms, so the old timer fired while the page was still
    // half-built: the tour measured a mid-render layout and the header looked
    // "out of order" until a refresh (which hit a warm fetch). Gating on
    // !isLoading means the tour's targets (search, filters, first row) are all
    // in place before it appears. The extra frame lets layout settle first.
    useEffect(() => {
        if (!user || isLoading) return;
        if (localStorage.getItem(MANAGERS_TOUR_KEY)) return;
        // The tour is about to explain this whole page, so the separate "?"
        // auto-popup would just stack on top of it a moment later on a true
        // first visit. Pre-mark it seen for this session so only the tour shows.
        try { sessionStorage.setItem(pageHelpSeenKey('/managers'), '1'); } catch { /* ignore */ }
        const id = setTimeout(() => setShowTour(true), 400);
        return () => clearTimeout(id);
    }, [user, isLoading]);
    













    return (
        <>
        <PageContainer
            user={user}
            noHorizontalPadding
            title={t("managers.pageTitle")}
            titleExtra={user?.email === "casto@sharjah.ac.ae" && (
                <div className="flex flex-wrap gap-1.5 items-center">
                    {/* Search — name-only, filter + highlight */}
                    <div data-tour="tour-search" className="relative flex items-center">
                        <input
                            type="text"
                            placeholder={t("managers.searchPlaceholder")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`ps-7 pe-6 h-7 md:h-8 text-xs border rounded-lg bg-surface-card text-fg focus:outline-none focus:border-blue-500 w-28 md:w-44 lg:w-56 transition-all duration-200 ${
                                searchQuery ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/15' : 'border-primary opacity-50 hover:opacity-100'
                            }`}
                        />
                        <svg className={`absolute start-2 w-3 h-3 pointer-events-none ${searchQuery ? 'text-blue-500' : 'text-primary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute end-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                    <span data-tour="tour-filter-btn">
                        <CompanyFilterDropdown filters={activeFilters} onFilterChange={handleFilterChange} companies={companies} />
                    </span>
                    <button data-tour="tour-register-btn" onClick={() => setShowReminderModal(true)}
                        className="flex items-center gap-1.5 px-2.5 h-7 md:h-8 bg-primary hover:bg-primary-hover text-primary-contrast text-xs font-medium rounded-lg transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden md:inline">{t("managers.sendReminders")}</span>
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
                    <LoadingApplicants userType="manager" />
                ) : loadError ? (
                    <LoadListError label="companies" onRetry={fetchData} />
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
                                    <div key={company.id} data-tour={index === 0 ? 'tour-first-row' : undefined} className="relative flex flex-col">
                                        <Row
                                            number={index + 1}
                                            userType={'manager'}
                                            companyId={company.id}
                                            companyName={company.companyName}
                                            companyEmail={company.email}
                                            companyRepresentatives={company.representatives}
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
                                                    c.id === id ? { ...c, status: newStatus } : c
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