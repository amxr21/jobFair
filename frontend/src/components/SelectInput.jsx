import { useState } from "react";

const SelectInput = ({ Id, Name, options = [], value, handleChange, required = true }) => {
  const [touched, setTouched] = useState(false);

  const isValid = value && value.trim() !== "";
  const showError = touched && !isValid && required;

  const getBorderClass = () => {
    if (showError) return "border-red-400 focus:ring-red-400";
    if (touched && isValid) return "border-green-400 focus:ring-green-400";
    return "border-gray-300 focus:ring-[#0E7F41] hover:border-gray-400";
  };

  return (
    <div className="w-full transition-all duration-300 ease-in-out">
      <label htmlFor={Id} className="text-xs text-gray-600 ml-1 block mb-0.5 transition-all duration-300 ease-in-out">
        {Name} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative transition-all duration-300 ease-in-out">
        <select
          id={Id}
          value={value}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          className={`w-full px-2.5 py-1.5 pr-8 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ease-in-out bg-white appearance-none cursor-pointer ${getBorderClass()} ${!value ? 'text-gray-400' : ''}`}
        >
          <option value="" disabled className="text-xs text-gray-400">
            {Name}
          </option>
          {options.map((opt, idx) => (
            <option key={idx} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 transition-all duration-300 ease-in-out">
          <svg className="h-4 w-4 text-gray-500 transition-all duration-300 ease-in-out" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {showError && (
        <p className="text-xs text-red-500 mt-0.5 ml-1 transition-all duration-300 ease-in-out animate-fadeIn">
          Please select a {Name.toLowerCase()}
        </p>
      )}
    </div>
  );
};

export default SelectInput;
