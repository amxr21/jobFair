import { useState, useRef, useEffect } from 'react';

const FilterDropdown = ({ filters, onFilterChange, applicants }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});
    const [expandedCategories, setExpandedCategories] = useState({});
    const dropdownRef = useRef(null);

    // Get unique values for each filter category from applicants
    const getUniqueValues = (category) => {
        const values = new Set();
        applicants?.forEach(app => {
            let value;
            switch(category) {
                case 'major':
                    value = app.applicantDetails?.major;
                    break;
                case 'nationality':
                    value = app.applicantDetails?.nationality;
                    break;
                case 'studyLevel':
                    value = app.applicantDetails?.studyLevel;
                    break;
                case 'city':
                    value = app.applicantDetails?.city;
                    break;
                case 'cgpaRange':
                    const cgpa = parseFloat(app.applicantDetails?.cgpa);
                    if (cgpa >= 3.5) value = '3.5+';
                    else if (cgpa >= 3.0) value = '3.0 - 3.49';
                    else if (cgpa >= 2.5) value = '2.5 - 2.99';
                    else if (cgpa >= 2.0) value = '2.0 - 2.49';
                    else value = 'Below 2.0';
                    break;
                case 'status':
                    value = app.attended ? 'Confirmed' : 'Registered';
                    break;
                case 'hasCV':
                    value = app.cv ? 'Has CV' : 'No CV';
                    break;
                case 'shortlisted':
                    value = app.shortlistedBy?.length > 0 ? 'Shortlisted' : 'Not Shortlisted';
                    break;
                case 'rejected':
                    value = app.rejectedBy?.length > 0 ? 'Rejected' : 'Not Rejected';
                    break;
                case 'experience':
                    const exp = app.applicantDetails?.experience;
                    value = exp && exp.trim() !== '' ? 'Has Experience' : 'No Experience';
                    break;
                case 'expectedGraduation':
                    value = app.applicantDetails?.ExpectedToGraduate;
                    break;
                case 'languages':
                    // Split languages and add each one
                    const langs = app.applicantDetails?.languages;
                    if (langs) {
                        String(langs).split(',').forEach(lang => {
                            const trimmed = lang.trim();
                            if (trimmed) values.add(trimmed);
                        });
                    }
                    return; // Skip the normal add since we handled it
                case 'technicalSkills':
                    const techSkills = app.applicantDetails?.technicalSkills;
                    value = techSkills && techSkills.trim() !== '' ? 'Has Skills' : 'No Skills';
                    break;
                case 'flagged':
                    value = app.flags?.length > 0 ? 'Flagged' : 'Not Flagged';
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
        { id: 'major', label: 'Major' },
        { id: 'nationality', label: 'Nationality' },
        { id: 'city', label: 'City' },
        { id: 'studyLevel', label: 'Study Level' },
        { id: 'cgpaRange', label: 'CGPA Range' },
        { id: 'expectedGraduation', label: 'Expected Graduation' },
        { id: 'experience', label: 'Experience' },
        { id: 'languages', label: 'Languages' },
        { id: 'technicalSkills', label: 'Technical Skills' },
        { id: 'hasCV', label: 'CV Status' },
        { id: 'shortlisted', label: 'Shortlisted' },
        { id: 'rejected', label: 'Rejected' },
        { id: 'flagged', label: 'Flagged' },
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
                className={`border rounded-xl w-10 h-10 flex items-center justify-center transition-all duration-200 ${
                    activeFilterCount > 0
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-[#0E7F41] bg-white opacity-50 hover:opacity-100'
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke={activeFilterCount > 0 ? '#3B82F6' : '#0E7F41'} className="size-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
                </svg>
                {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-12 left-0 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 w-80 max-h-[450px] overflow-hidden animate-fadeIn">
                    <div className="p-3 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                        <h3 className="font-semibold text-sm">Filter Applicants</h3>
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

export default FilterDropdown;
