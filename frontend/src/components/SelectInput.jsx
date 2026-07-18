import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

// `tOption` (optional) translates the DISPLAY of a fixed-option value while the
// stored value stays the English/DB canonical form. Pass tCity / tSector etc.
const SelectInput = ({ Id, Name, options = [], value, handleChange, required = true, placeholder, tOption }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const isValid = value && value.trim() !== "";
  const showError = touched && !isValid && required;

  const label = (opt) => (tOption ? tOption(opt) : opt);
  const fallbackPlaceholder = placeholder || t("auth.select.selectField", { field: Name.toLowerCase() });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setTouched(true);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search matches against the translated label so it works in Arabic too.
  const filteredOptions = options.filter(opt =>
    label(opt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    // Create a synthetic event to match the expected handleChange signature
    const syntheticEvent = {
      target: { value: option }
    };
    handleChange(syntheticEvent);
    setIsOpen(false);
    setTouched(true);
    setSearchTerm("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      }
    }
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
    }
    if (e.key === "ArrowDown" && !isOpen) {
      setIsOpen(true);
    }
  };

  const getBorderClass = () => {
    if (showError) return "border-red-400 focus-within:ring-red-400";
    if (touched && isValid) return "border-green-400 focus-within:ring-green-400";
    return "border-line focus-within:ring-primary hover:border-gray-400 dark:hover:border-gray-500";
  };

  return (
    <div className="w-full transition-all duration-300 ease-in-out" ref={dropdownRef}>
      <label htmlFor={Id} className="text-xs text-gray-600 dark:text-gray-300 ms-1 block mb-0.5 transition-all duration-300 ease-in-out">
        {Name} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Input Container */}
      <div
        className={`relative w-full min-h-[38px] px-2.5 py-1.5 text-sm border rounded-lg focus-within:outline-none focus-within:ring-2 focus-within:border-transparent transition-all duration-300 ease-in-out bg-surface-card cursor-pointer ${getBorderClass()}`}
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <div className="flex items-center justify-between">
          {/* Selected Value or Search Input */}
          {isOpen ? (
            <input
              ref={inputRef}
              id={Id}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={value ? label(value) : fallbackPlaceholder}
              className="flex-1 outline-none text-sm bg-transparent text-fg"
              autoFocus
            />
          ) : (
            <span className={`flex-1 text-sm ${!value ? 'text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-100'}`}>
              {value ? label(value) : fallbackPlaceholder}
            </span>
          )}

          {/* Dropdown Arrow */}
          <div className="pointer-events-none ms-2">
            <svg
              className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-surface-card border border-line rounded-lg shadow-lg max-h-48 overflow-y-auto transition-all duration-300 ease-in-out animate-fadeIn">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full px-3 py-2 text-start text-sm transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg ${
                  option === value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-fg hover:bg-primary/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{label(option)}</span>
                  {option === value && (
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              {t("auth.select.noMatch")}
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {showError && (
        <p className="text-xs text-red-500 mt-0.5 ms-1 transition-all duration-300 ease-in-out animate-fadeIn">
          {t("auth.select.pleaseSelect", { field: Name.toLowerCase() })}
        </p>
      )}
    </div>
  );
};

export default SelectInput;
