import { useState } from "react";

const Input = ({
  Id,
  Type,
  Value,
  handleChange,
  onBlur,
  Name,
  placeholder,
  required = true,
  validate,
  errorMessage
}) => {
  const [touched, setTouched] = useState(false);

  // Default validation based on type
  const getDefaultValidation = () => {
    if (!required) return true;
    if (!Value || !Value.toString().trim()) return false;

    if (Type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(Value);
    }

    if (Type === "password") {
      return Value.length >= 6;
    }

    return true;
  };

  const isValid = validate ? validate(Value) : getDefaultValidation();
  const showError = touched && !isValid && required;

  const getErrorMessage = () => {
    if (errorMessage) return errorMessage;
    if (!Value || !Value.toString().trim()) return `${Name} is required`;
    if (Type === "email") return "Please enter a valid email address";
    if (Type === "password") return "Password must be at least 6 characters";
    return `Please enter a valid ${Name.toLowerCase()}`;
  };

  const getBorderClass = () => {
    if (showError) return "border-red-400 focus:ring-red-400";
    if (touched && isValid && Value) return "border-green-400 focus:ring-green-400";
    return "border-gray-300 focus:ring-[#0E7F41] hover:border-gray-400";
  };

  return (
    <div className="w-full transition-all duration-300 ease-in-out">
      <label htmlFor={Id} className="text-xs text-gray-600 ml-1 block mb-0.5 transition-all duration-300 ease-in-out">
        {Name} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={Id}
        type={Type}
        value={Value}
        onChange={handleChange}
        onBlur={() => {
          setTouched(true);
          if (onBlur) onBlur();
        }}
        placeholder={placeholder || Name}
        className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ease-in-out ${getBorderClass()}`}
      />
      {showError && (
        <p className="text-xs text-red-500 mt-0.5 ml-1 transition-all duration-300 ease-in-out animate-fadeIn">
          {getErrorMessage()}
        </p>
      )}
    </div>
  );
};

export default Input;
