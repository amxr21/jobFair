import { useState, useRef, useEffect } from "react";

// Industry Fields and Sectors (70+ options)
const INDUSTRY_FIELDS = [
  // Technology & IT
  "Information Technology",
  "Software Development",
  "Artificial Intelligence",
  "Machine Learning",
  "Data Science",
  "Cybersecurity",
  "Cloud Computing",
  "Blockchain",
  "Internet of Things (IoT)",
  "Robotics",
  "Web Development",
  "Mobile App Development",
  "Game Development",
  "DevOps",
  "IT Consulting",

  // Finance & Banking
  "Banking",
  "Investment Banking",
  "Asset Management",
  "Insurance",
  "FinTech",
  "Accounting",
  "Financial Services",
  "Venture Capital",
  "Private Equity",

  // Healthcare & Life Sciences
  "Healthcare",
  "Pharmaceuticals",
  "Biotechnology",
  "Medical Devices",
  "Clinical Research",
  "Health Tech",
  "Hospitals & Clinics",

  // Energy & Utilities
  "Oil & Gas",
  "Renewable Energy",
  "Solar Energy",
  "Nuclear Energy",
  "Utilities",
  "Energy Management",

  // Manufacturing & Engineering
  "Manufacturing",
  "Automotive",
  "Aerospace",
  "Defense",
  "Electronics",
  "Industrial Engineering",
  "Chemical Engineering",
  "Civil Engineering",

  // Retail & Consumer
  "Retail",
  "E-commerce",
  "Consumer Goods",
  "Fashion & Apparel",
  "Food & Beverage",
  "Hospitality",
  "Tourism & Travel",

  // Media & Entertainment
  "Media",
  "Entertainment",
  "Advertising",
  "Public Relations",
  "Broadcasting",
  "Digital Marketing",
  "Content Creation",

  // Professional Services
  "Consulting",
  "Legal Services",
  "Human Resources",
  "Recruitment",
  "Business Services",
  "Management Consulting",

  // Construction & Real Estate
  "Construction",
  "Real Estate",
  "Architecture",
  "Property Management",
  "Interior Design",

  // Logistics & Supply Chain
  "Logistics",
  "Supply Chain",
  "Transportation",
  "Shipping & Maritime",
  "Warehousing",
  "Freight & Cargo",

  // Education & Research
  "Education",
  "EdTech",
  "Research & Development",
  "Training & Development",
  "Academic Institutions",

  // Government & Public Sector
  "Government",
  "Public Administration",
  "Non-Profit Organizations",
  "NGOs",
  "Social Services",

  // Telecommunications
  "Telecommunications",
  "Networking",
  "5G Technology",
  "Satellite Communications",

  // Agriculture & Environment
  "Agriculture",
  "AgriTech",
  "Environmental Services",
  "Sustainability",
  "Water Management"
];

// University of Sharjah Majors by College
const UOS_MAJORS = [
  // College of Engineering
  "Architectural Engineering",
  "Civil Engineering",
  "Computer Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Industrial Engineering",
  "Nuclear Engineering",
  "Sustainable and Renewable Energy Engineering",

  // College of Computing and Informatics
  "Computer Science",
  "Information Technology",
  "Cybersecurity",
  "Data Science",
  "Artificial Intelligence",

  // College of Business Administration
  "Accounting",
  "Finance",
  "Marketing",
  "Management",
  "Business Administration",
  "Human Resource Management",
  "Economics",
  "Management Information Systems",

  // College of Sciences
  "Biology",
  "Biotechnology",
  "Chemistry",
  "Applied Chemistry",
  "Mathematics",
  "Physics",
  "Applied Physics",
  "Environmental Sciences",

  // College of Health Sciences
  "Clinical Nutrition and Dietetics",
  "Health Services Administration",
  "Medical Laboratory Sciences",
  "Nursing",
  "Physiotherapy",
  "Radiologic Sciences",
  "Optometry",
  "Speech Language Pathology",

  // College of Medicine
  "Medicine (MBBS)",

  // College of Dental Medicine
  "Dental Medicine",

  // College of Pharmacy
  "Pharmacy",
  "Clinical Pharmacy",

  // College of Law
  "Law",
  "Private Law",
  "Public Law",

  // College of Sharia and Islamic Studies
  "Islamic Studies",
  "Sharia (Islamic Law)",

  // College of Arts, Humanities and Social Sciences
  "Arabic Language and Literature",
  "English Language and Literature",
  "Translation Studies",
  "History",
  "Sociology",
  "Psychology",
  "International Relations",
  "Political Science",

  // College of Communication
  "Journalism",
  "Public Relations",
  "Radio and Television",
  "Digital Media",
  "Mass Communication",

  // College of Fine Arts and Design
  "Interior Design",
  "Graphic Design",
  "Multimedia Design",
  "Visual Arts",
  "Fashion Design"
];

const MultiSelectInput = ({
  Id,
  Name,
  options = UOS_MAJORS,
  value = [],
  handleChange,
  required = true,
  placeholder = "Search and select majors..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [touched, setTouched] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const isValid = value.length > 0;
  const showError = touched && !isValid && required;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setTouched(true);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchTerm.toLowerCase()) && !value.includes(opt)
  );

  const handleSelect = (option) => {
    const newValue = [...value, option];
    handleChange(newValue);
    setSearchTerm("");
    inputRef.current?.focus();
  };

  const handleRemove = (option) => {
    const newValue = value.filter(v => v !== option);
    handleChange(newValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Backspace" && searchTerm === "" && value.length > 0) {
      handleRemove(value[value.length - 1]);
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      }
    }
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const getBorderClass = () => {
    if (showError) return "border-red-400 focus-within:ring-red-400";
    if (touched && isValid) return "border-green-400 focus-within:ring-green-400";
    return "border-gray-300 focus-within:ring-[#0E7F41] hover:border-gray-400";
  };

  return (
    <div className="w-full transition-all duration-300 ease-in-out" ref={dropdownRef}>
      <label htmlFor={Id} className="text-xs text-gray-600 ml-1 block mb-0.5 transition-all duration-300 ease-in-out">
        {Name} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Input Container */}
      <div
        className={`relative w-full min-h-[38px] px-2 py-1 text-sm border rounded-lg focus-within:outline-none focus-within:ring-2 focus-within:border-transparent transition-all duration-300 ease-in-out bg-white cursor-text ${getBorderClass()}`}
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <div className="flex flex-wrap gap-1 items-center">
          {/* Selected Tags */}
          {value.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0E7F41]/10 text-[#0E7F41] text-xs rounded-md transition-all duration-200 ease-in-out hover:bg-[#0E7F41]/20"
            >
              {item}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(item);
                }}
                className="hover:text-red-500 transition-colors duration-200"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}

          {/* Search Input */}
          <input
            ref={inputRef}
            id={Id}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] outline-none text-sm py-0.5 bg-transparent"
          />
        </div>

        {/* Dropdown Arrow */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg
            className={`h-4 w-4 text-gray-500 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto transition-all duration-300 ease-in-out animate-fadeIn">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-[#0E7F41]/10 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
              >
                {option}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              {searchTerm ? "No matching majors found" : "All majors selected"}
            </div>
          )}
        </div>
      )}

      {/* Selected Count */}
      {value.length > 0 && (
        <p className="text-xs text-gray-500 mt-0.5 ml-1 transition-all duration-300 ease-in-out">
          {value.length} major{value.length !== 1 ? 's' : ''} selected
        </p>
      )}

      {/* Error Message */}
      {showError && (
        <p className="text-xs text-red-500 mt-0.5 ml-1 transition-all duration-300 ease-in-out animate-fadeIn">
          Please select at least one {Name.toLowerCase()}
        </p>
      )}
    </div>
  );
};

export { UOS_MAJORS, INDUSTRY_FIELDS };
export default MultiSelectInput;
